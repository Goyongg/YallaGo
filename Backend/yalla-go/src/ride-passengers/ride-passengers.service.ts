import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';
import { BookingStatus } from './enums/booking-status.enum';

@Injectable()
export class RidePassengersService {

    constructor(private readonly firebase: FirebaseService) {}

    //create a booking for a passenger
    async createBooking(createRidePassengerDto: CreateRidePassengerDto, firebaseUid: string) {
        const bookRef = this.firebase.firestore.collection('booking').doc();
        const bookingData = {
            bookingId: bookRef.id,
            passsengerId: firebaseUid,
            //rideId:,
            //spread out the fields of the booking
            ...createRidePassengerDto,
            status: BookingStatus.PENDING
        }

        await bookRef.set(bookingData); // set data to booking
        return { message: "Booking created successfully", bookingId: bookRef.id }
    };

}
