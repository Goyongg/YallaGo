import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';
import { BookingStatus } from './enums/booking-status.enum';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';
import { FirebaseNotificationsService } from 'src/firebase/firebase-notifications.service';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { omitFields, pickFields } from 'src/common/helpers/object.helpers';
import { PaymentsService } from 'src/payments/payments.service';

@Injectable()
export class RidePassengersService {

    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseDriverService: FirebaseDriverService,
        private readonly firebaseNotificationsService: FirebaseNotificationsService,
        private readonly firebaseUserService: FirebaseUserService,
        private readonly paymentsService: PaymentsService
    ) {}

    private async reduceRideSeats(rideId: string, seatsBooked: number){
        const rideRef = await this.firebaseDriverService.getRideRef(rideId);

        const rideData = await this.firebaseDriverService.fetchRideData(rideId)

        // Compute the new number of available seats
        const currentAvailableSeats = rideData.availableSeats;
        const newAvailableSeats = currentAvailableSeats - seatsBooked;

        // Update the ride document with the new seat count
        await rideRef.update({
            availableSeats: newAvailableSeats
        })
    }

    private async validateSeats(rideId: string, seatsBooked: number){
        const rideSnap = await this.firebase.firestore.collection('rides').doc(rideId).get()

        if(!rideSnap.exists) {
            throw new NotFoundException('Ride does not exist')
        }

        const rideData = rideSnap.data()!;

        if(seatsBooked > rideData.availableSeats) {
            throw new ForbiddenException('Booked seats cannot be more than available seats')
        }
    }

    async createBooking(createRidePassengerDto: CreateRidePassengerDto, firebaseUid: string) {
        // Check if booked seats are less than or equal to available seats
        await this.validateSeats(createRidePassengerDto.rideId, createRidePassengerDto.seatsBooked);
        
        const bookRef = this.firebase.firestore.collection('bookings').doc();
        // Construct the booking data object
        const bookingData = {
            bookingId: bookRef.id,
            passengerId: firebaseUid,
            // Spread the fields from the DTO
            ...createRidePassengerDto,
            status: BookingStatus.PENDING
        }

        // Reduce available seats for the ride being booked based on the number of seats booked
        await this.reduceRideSeats(createRidePassengerDto.rideId, createRidePassengerDto.seatsBooked);

        // Notify driver that a new booking has been made
        await this.notifyDriver(bookingData);

        // then store paymentIntent ID with the booking
        await bookRef.set({...bookingData,});

        return {
            message: "Booking created successfully",
            bookingId: bookingData.bookingId,

        };
    };

    async getBookings(firebaseUid: string) {
        // Query the 'bookings' collection for documents where passengerId matches the Firebase UID
        const bookingSnapshot = await this.firebase.firestore.collection('bookings').where('passengerId', '==', firebaseUid).get();

        const bookings: any [] = [];

        // Iterate over each booking document
        for (const booking of bookingSnapshot.docs) {
            const bookingData = booking.data();
            const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);
            const driverData = await this.firebaseUserService.fetchUserData(rideData.driverId);

            if(bookingData.status === BookingStatus.PENDING || bookingData.status === BookingStatus.CONFIRMED || bookingData.status === BookingStatus.ONGOING) {
                const redactedRideData = omitFields(rideData, ['distance', 'driverId', 'g', 'vehicleId', 'availableSeats', 'bookedSeats']);
                
                const redactedDriverData = pickFields(driverData, ['name', 'phoneNumber', 'averageRating']);

                const vehicleData = await this.firebaseDriverService.fetchVehicleData(driverData.vehicleId);
                const redactedVehicleData = omitFields(vehicleData, ['driverId', 'seats', 'vehicleId'])

                // Push details of each booking into the array
                bookings.push({
                    ...redactedRideData,
                    bookingId: bookingData.bookingId,
                    seatsBooked: bookingData.seatsBooked,
                    bookingPrice: bookingData.bookingPrice,
                    status: bookingData.status,
                    ...redactedDriverData,
                    ...redactedVehicleData
                });
            }

            if(bookingData.status === BookingStatus.COMPLETED || bookingData.status === BookingStatus.NO_SHOW || bookingData.status === BookingStatus.CANCELLED) {
                const redactedRideData = pickFields(rideData, ['rideId', 'departureTime', 'durationSeconds', 'startLocation', 'endLocation', 'pricePerSeat']);

                const redactedDriverData = pickFields(driverData, ['name', 'averageRating']);

                bookings.push({
                    ...redactedRideData,
                    bookingId: bookingData.bookingId,
                    seatsBooked: bookingData.seatsBooked,
                    bookingPrice: bookingData.bookingPrice,
                    status: bookingData.status,
                    ...redactedDriverData
                })
            }
        }

        // Return the compiled list of bookings
        return bookings;
    }

    async deleteBooking(bookingId: string) {
        // Get a reference to the booking document in the "bookings" collection
        const bookingRef = await this.firebaseUserService.getBookingRef(bookingId);

        // Extract the booking data
        const bookingData = await this.firebaseUserService.fetchBookingData(bookingId);

        // If the booking is not in PENDING state, deny deletion
        // This protects confirmed or ongoing bookings from being removed
        if(bookingData.status !== BookingStatus.PENDING){
            throw new ForbiddenException('Only pending bookings can be deleted')
        }

        // Fetch the current ride data using a service method
        const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);

        // Recalculate the available seats by adding back the seats from the cancelled booking
        const newSeats = bookingData.seatsBooked + rideData.availableSeats

        // Get a reference to the ride associated with this booking
        const rideRef = await this.firebaseDriverService.getRideRef(bookingData.rideId)
        
        // Update the ride document with the new available seat count
        rideRef.update({ availableSeats: newSeats })

        // Proceed to delete the booking document from Firestore
        await bookingRef.delete();

        return { message: 'Booking deleted successfully'}
    }

    async notifyDriver(bookingData: any) {
        // Retrieve the ride details using the rideId from bookingData
        const rideData = await this.firebaseDriverService.fetchRideData(bookingData.rideId);

        // Query Firestore to find all device tokens registered for the driver
        const tokenSnapshot = await this.firebase.firestore.collection('device-tokens')
            .where('userId', '==', rideData.driverId)
            .get();

        // Handle case when no device tokens are found
        if (tokenSnapshot.empty) {
            console.warn('⚠️ No FCM tokens found for driver:', rideData.driverId);
            return;
        }

        // Extract all device tokens from the snapshot documents
        const tokens: string[] = tokenSnapshot.docs.map(doc => doc.data().token);

        // Loop through each token and send a notification
        for (const token of tokens) {
            try {
                // Attempt to send a push notification using Firebase Cloud Messaging
                await this.firebaseNotificationsService.sendToDevice(
                    token, // Target device token
                    '🚗 New Ride Booking', // Notification title
                    `Pickup: ${rideData.startLocation} → Dropoff: ${rideData.endLocation}\nSeats Booked: ${bookingData.seatsBooked}` // Notification body
                );
                console.log(`✅ Sent to ${bookingData.passengerId}`);
            } catch (error) {
                // Catch and log any error during notification sending
                console.error(`❌ Error sending notification`);
            }
        }
    }
}
