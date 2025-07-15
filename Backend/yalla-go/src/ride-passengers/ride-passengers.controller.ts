import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { RidePassengersService } from './ride-passengers.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';

@Controller('bookings')
export class RidePassengersController {

    constructor(private readonly ridePassengerService: RidePassengersService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async createBooking(@Body(ValidationPipe) createRidePassengerDto: CreateRidePassengerDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.ridePassengerService.createBooking(createRidePassengerDto, firebaseUid)
    }

    @UseGuards(FirebaseAuthGuard)
    @Get()
    async getBookings(@Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.ridePassengerService.getBookings(firebaseUid);
    }

    @UseGuards(FirebaseAuthGuard)
    @Delete()
    async deleteBooking(@Query('bookingId') bookingId: string) {
        return this.ridePassengerService.deleteBooking(bookingId)
    }
}
