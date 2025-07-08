import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { UpdateVehicleColorDto } from './dto/update-vehicle-color.dto';

@Controller('vehicles')
export class VehiclesController {

    constructor(private readonly vehiclesService: VehiclesService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('addvehicle')
    async addVehicle(@Body(ValidationPipe) createVehicleDto: CreateVehicleDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.vehiclesService.createVehicle(createVehicleDto, firebaseUid)
    }

    @UseGuards(FirebaseAuthGuard)
    @Get('maxseats')
    async getSeats(@Req() req) {
        const firebaseUid = req.user.uid;

        return this.vehiclesService.getSeats(firebaseUid)
    }

    @UseGuards(FirebaseAuthGuard)
    @Delete()
    async deleteVehicle(@Req() req) {
        const firebaseUid = req.user.uid;
        
        return this.vehiclesService.deleteVehicle(firebaseUid)
    }

    @UseGuards(FirebaseAuthGuard)
    @Patch()
    async updateVehicleColor(@Body(ValidationPipe) updateVehicleColorDto: UpdateVehicleColorDto, @Req() req) {
        const firebaseUid = req.user.uid;

        return this.vehiclesService.updateVehicleColor(firebaseUid, updateVehicleColorDto)
    }

    
}
