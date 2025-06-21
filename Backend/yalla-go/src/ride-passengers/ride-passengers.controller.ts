import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { RidePassengersService } from './ride-passengers.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreateRidePassengerDto } from './dto/create-ridepassenger.dto';

@Controller('ride-passengers')
export class RidePassengersController {

    constructor(private readonly ridePassengerService: RidePassengersService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('createbooking')
    async createBooking(@Body(ValidationPipe) createRidePassengerDto: CreateRidePassengerDto, @Req() req) {
        
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.ridePassengerService.createBooking(createRidePassengerDto, firebaseUid)
    }
}
