import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly firebase: FirebaseService) {}

    //create a vehicle in firestore
    async createVehicle(createVehicleDto: CreateVehicleDto, firebaseUid: string) {
        const vehRef = this.firebase.firestore.collection('vehicle').doc();
        const vehicleData = {
            vehicleId: vehRef.id,
            driverId: firebaseUid,
            // spread out fields of the new user
            ...createVehicleDto
        }

        await vehRef.set(vehicleData); // set data to the vehicle
        return { message: "Vehicle added succsessfully", vehicleId: vehRef.id}
    };

}
