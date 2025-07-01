import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class RidePassengersService {

    constructor(private readonly firebase: FirebaseService) {}

    //create a booking for a passenger
    async createBooking(createRidePassengerDto: CreateRidePassengerDto, firebaseUid: string) {
        const bookRef = this.firebase.firestore.collection('bookings').doc();
        const bookingData = {
            bookingId: bookRef.id,
            passsengerId: firebaseUid,
            //spread out the fields of the booking
            ...createRidePassengerDto,
            status: BookingStatus.PENDING
        }

        await bookRef.set(bookingData); // set data to booking
        return { message: "Booking created successfully", bookingId: bookRef.id }
    };

    async getBookingsForPassenger(firebaseUid: string) {
        // Query bookings for this passenger
        const bookingSnapshot = await this.firebase.firestore.collection('bookings').where('passsengerId', '==', firebaseUid).get();

        const bookings: any [] = [];

        for (const doc of bookingSnapshot.docs) {
            const data = doc.data();
            // Get the ride info
            const rideDoc = await this.firebase.firestore.collection('rides').doc(data.rideId).get();
            // Check if the ride doc exists and extract data to rideData
            const rideData = rideDoc.exists ? rideDoc.data() : {};
            // Push details of each booking into the array
            bookings.push({
                pickupPoint: data.pickupPoint,
                dropOffPoint: data.dropOffPoint,
                date: rideData?.departureTime || null,
            });
        }

        return bookings;
    }

}
