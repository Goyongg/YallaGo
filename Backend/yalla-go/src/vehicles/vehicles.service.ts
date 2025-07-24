import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { instanceToPlain } from 'class-transformer';
import { UpdateVehicleColorDto } from './dto/update-vehicle-color.dto';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';
import { omitFields } from 'src/common/helpers/object.helpers';

@Injectable()
export class VehiclesService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserSerivce: FirebaseUserService,
        private readonly firebaseDriverService: FirebaseDriverService
    ) {}

    async getVehicle(firebaseUid: string) {
        // Fetch vehicle data of driver
        const vehData = await this.firebaseDriverService.getVehicleByDriver(firebaseUid);

        return omitFields(vehData, ['driverId']);
    }

    async createVehicle(createVehicleDto: CreateVehicleDto, firebaseUid: string) {
        const vehRef = this.firebase.firestore.collection('vehicles').doc();

        // Prepare vehicle data object
        const vehicleData = {
            vehicleId: vehRef.id,
            driverId: firebaseUid,
            // Spread the fields from the DTO
            ...createVehicleDto
        }

        // Link this vehicle ID to the user (driver)
        await this.linkDriver(firebaseUid, vehicleData.vehicleId);

        await vehRef.set(vehicleData); // set data to the vehicle
        return { message: "Vehicle added succsessfully", vehicleId: vehRef.id}
    };

    private async linkDriver(driverId: string, newVehicleId: string) {
        const userRef = await this.firebaseUserSerivce.getUserRef(driverId);

        // Update user's document to store the associated vehicleId
        await userRef.update({
            vehicleId: newVehicleId
        })
    }

    async getSeats(firebaseUid: string) {
        const userData = await this.firebaseUserSerivce.fetchUserData(firebaseUid);

        // Get the vehicle ID linked to this user
        const vehicleId = userData.vehicleId;

        const vehData = await this.firebaseDriverService.fetchVehicleData(vehicleId);

        return { maxSeats: vehData.seats }
    }

    async deleteVehicle(firebaseUid: string) {
        const userRef = await this.firebaseUserSerivce.getUserRef(firebaseUid);

        // Extract user data
        const userData = await this.firebaseUserSerivce.fetchUserData(firebaseUid);

        const vehicleId = userData.vehicleId;

        if (!vehicleId) {
            throw new NotFoundException('User has no linked vehicle');
        }

        const vehRef = await this.firebaseDriverService.getVehicleRef(vehicleId);

        const ridesRef = this.firebase.firestore.collection('rides');

        // Query for any active or ongoing rides by this driver
        const ridesQuery = await ridesRef
            .where('driverId', '==', firebaseUid)
            .where('status', 'in', ["in-progress", "departed"]) // only block deletion if rides are currently running
            .limit(1) // limit to one match — we only care if *any* exist
            .get();

        // If there are ongoing rides, do not allow vehicle deletion
        if (!ridesQuery.empty) {
            throw new ForbiddenException('Cannot delete vehicle while rides are in progress or departed');
        }

        await vehRef.delete();

        // Unlink the vehicle from the user's profile
        await userRef.update({
            vehicleId: null
        })

        return { message: 'Vehicle deleted successfully' }
    }

    async updateVehicleColor(firebaseUid: string, updateVehicleColorDto: UpdateVehicleColorDto) {
        const userData = await this.firebaseUserSerivce.fetchUserData(firebaseUid);

        const vehicleId = userData.vehicleId;

        if (!vehicleId) {
            throw new NotFoundException('User has no linked vehicle');
        }

        const vehRef = await this.firebaseDriverService.getVehicleRef(vehicleId);

        // Convert DTO to plain object
        const plainData = instanceToPlain(updateVehicleColorDto);

        // Remove undefined fields
        const filteredData = Object.fromEntries(
            Object.entries(plainData).filter(([_, v]) => v !== undefined)
        );

        if (Object.keys(filteredData).length === 0) {
            throw new Error('No valid fields provided for update.');
        }

        await vehRef.update(filteredData);

        return { message: 'Vehicle color updated successfully'}      
    }
}
