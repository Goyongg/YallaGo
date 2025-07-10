import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class RidePassengersService {

    constructor(private readonly firebase: FirebaseService) {}

    async createBooking(createRidePassengerDto: CreateRidePassengerDto, firebaseUid: string) {
        const bookRef = this.firebase.firestore.collection('bookings').doc();
        // Construct the booking data object
        const bookingData = {
            bookingId: bookRef.id,
            passsengerId: firebaseUid,
            // Spread the fields from the DTO
            ...createRidePassengerDto,
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
            availableseats: newAvailableSeats
        })
    }

    async getBookings(firebaseUid: string) {
        // Query the 'bookings' collection for documents where passengerId matches the Firebase UID
        const bookingSnapshot = await this.firebase.firestore.collection('bookings').where('passsengerId', '==', firebaseUid).get();

        const bookings: any [] = [];

        // Iterate over each booking document
        for (const doc of bookingSnapshot.docs) {
            const data = doc.data();
            // Fetch the ride document associated with this booking
            const rideDoc = await this.firebase.firestore.collection('rides').doc(data.rideId).get();

            // If the ride exists, get its data; otherwise, use an empty object
            const rideData = rideDoc.exists ? rideDoc.data() : {};

            // Push details of each booking into the array
            bookings.push({
                pickupPoint: data.pickupPoint,
                dropOffPoint: data.dropOffPoint,
                date: rideData?.departureTime || null,
            });
        }

        // Return the compiled list of bookings
        return bookings;
    }

}
