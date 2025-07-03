import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreateRideDto } from './dto/create-ride.dto';
import { RidesService } from './rides.service';

@Controller('rides')
export class RidesController {
    constructor(private readonly rideService: RidesService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async createRide(@Body(ValidationPipe) createRideDto: CreateRideDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.rideService.createRide(createRideDto, firebaseUid);
    }
}
