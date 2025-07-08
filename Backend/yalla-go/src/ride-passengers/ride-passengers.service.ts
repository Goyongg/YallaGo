import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class RidePassengersService {

    constructor(private readonly firebase: FirebaseService) {}

    async createBooking(createRidePassengerDto: CreateRidePassengerDto, firebaseUid: string) {
        // Check if booked seats are less than or equal to available seats
        await this.validateSeats(createRidePassengerDto.rideId, createRidePassengerDto.seatsBooked)
        // Destructure to pull out startpoint and endpoint
        const { startPoint, endPoint, ...rest} = createRidePassengerDto
        
        // Convert coordinates into GeoPoint
        const startGeoPoint = new this.firebase.GeoPoint(
            startPoint.lat, 
            startPoint.lng
        );
        const endGeoPoint = new this.firebase.GeoPoint(
            endPoint.lat, 
            endPoint.lng
        );
        
        const bookRef = this.firebase.firestore.collection('bookings').doc();
        // Construct the booking data object
        const bookingData = {
            bookingId: bookRef.id,
            passengerId: firebaseUid,
            startGeo: startGeoPoint,
            endGeo: endGeoPoint,
            // Spread the fields from the DTO
            ...rest,
            status: BookingStatus.PENDING
        }

        // Reduce available seats for the ride being booked based on the number of seats booked
        await this.reduceRideSeats(createRidePassengerDto.rideId, createRidePassengerDto.seatsBooked)

        // Store the booking data in Firestore
        await bookRef.set(bookingData);
        return { message: "Booking created successfully", bookingId: bookRef.id }
    };

    private async reduceRideSeats(rideId: string, seatsBooked: number){
        const rideRef = this.firebase.firestore.collection('rides').doc(rideId);

        // Get the ride document snapshot
        const rideSnap = await rideRef.get();

        if(!rideSnap.exists) {
            throw new NotFoundException('Use profile not found');
        }

        // Extract ride data from the snapshot (non-null assertion used since existence was already checked)
        const rideData = rideSnap.data()!;

        // Compute the new number of available seats
        const currentAvailableSeats = rideData.availableseats;
        const newAvailableSeats = currentAvailableSeats - seatsBooked;

        // Update the ride document with the new seat count
        await rideRef.update({
            availableSeats: newAvailableSeats
        })
    }

    async getBookings(firebaseUid: string) {
        // Query the 'bookings' collection for documents where passengerId matches the Firebase UID
        const bookingSnapshot = await this.firebase.firestore.collection('bookings').where('passengerId', '==', firebaseUid).get();

        const bookings: any [] = [];

        // Iterate over each booking document
        for (const doc of bookingSnapshot.docs) {
            const data = doc.data();
            // Fetch the ride document associated with this booking
            const rideDoc = await this.firebase.firestore.collection('rides').doc(data.rideId).get();

            if(!rideDoc.exists) {
                throw new NotFoundException('Ride doesnt exist');
            }

            // Get the ride data
            const rideData = rideDoc.data()!;

            // Push details of each booking into the array
            bookings.push({
                pickupPoint: data.pickupPoint,
                dropOffPoint: data.dropOffPoint,
                startGeo: data.startGeo,
                endGeo: data.endGeo,
                status: data.status,
                date: rideData.departureTime,
            });
        }

        // Return the compiled list of bookings
        return bookings;
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
}
