import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreateRideDto } from './dto/create-ride.dto';
import { RidesService } from './rides.service';
import { RidePlanDto } from './dto/ride-plan.dto';
import { SearchRidesDto } from './dto/search-rides.dto';

@Controller('rides')
export class RidesController {
    constructor(private readonly rideService: RidesService) {}

    @UseGuards(FirebaseAuthGuard)
    @Get()
    async fetchDriverRides(@Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.rideService.fetchDriverRides(firebaseUid);
    }
    
    @UseGuards(FirebaseAuthGuard)
    @Get('check-conflict')
    async checkRideConflict(@Query('date') date:string, @Query('time') time: string, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request
        
        return this.rideService.checkRideConflict(date, time, firebaseUid);
    }

    async
    @UseGuards(FirebaseAuthGuard)
    @Post('search')
    async searchRides(@Body(ValidationPipe) searchRideDto: SearchRidesDto) {
        return this.rideService.searchRides(searchRideDto);
    }

    @UseGuards(FirebaseAuthGuard)
    @Post('recommend-price')
    async recommendPrice(@Body(ValidationPipe) ridePlantDto: RidePlanDto) {
        return this.rideService.recommendPrice(ridePlantDto);
    }

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async createRide(@Body(ValidationPipe) createRideDto: CreateRideDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.rideService.createRide(createRideDto, firebaseUid);
    }

    @UseGuards(FirebaseAuthGuard)
    @Patch('start-ride')
    async startRide(@Query('rideId') rideId: string) {
        return this.rideService.startRide(rideId);
    }

    @UseGuards(FirebaseAuthGuard)
    @Patch('end-ride')
    async endRide(@Query('rideId') rideId: string) {
        return this.rideService.endRide(rideId);
    }

    @UseGuards(FirebaseAuthGuard)
    @Delete()
    async deleteRide(@Query('rideId') rideId: string) {
        return this.rideService.deleteRide(rideId);
    }
}
