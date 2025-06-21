import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';

@Controller('vehicles')
export class VehiclesController {

    constructor(private readonly vehiclesService: VehiclesService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('addvehicle')
    async addVehicle(@Body(ValidationPipe) createVehicleDto: CreateVehicleDto, @Req() req) {
        
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.vehiclesService.createVehicle(createVehicleDto, firebaseUid)
    }

    
}
