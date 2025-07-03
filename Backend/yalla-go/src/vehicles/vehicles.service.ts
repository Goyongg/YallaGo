import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

@Injectable()
export class VehiclesService {
    constructor(private readonly firebase: FirebaseService) {}

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
        const { userRef } = await this.getUserSnapshot(driverId);

        // Update user's document to store the associated vehicleId
        await userRef.update({
            vehicleId: newVehicleId
        })
    }

    async getSeats(firebaseUid: string) {
        const { userSnap } = await this.getUserSnapshot(firebaseUid);

        // Extract user data
        const userData = userSnap.data()!;

        // Get the vehicle ID linked to this user
        const vehicleId = userData.vehicleId;

        const { vehSnap } = await this.getVehicleSnapshot(vehicleId);
        const vehData = vehSnap.data()!;

        return { maxSeats: vehData.seats }
    }

    async deleteVehicle(firebaseUid: string) {
        const { userRef, userSnap } = await this.getUserSnapshot(firebaseUid);

        // Extract user data
        const userData = userSnap.data()!;

        const vehicleId = userData.vehicleId;

        if (!vehicleId) {
            throw new NotFoundException('User has no linked vehicle');
        }

        const { vehRef, vehSnap } = await this.getVehicleSnapshot(vehicleId);
        const vehData = vehSnap.data()!;

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

    // Private helper to get a user document snapshot
    private async getUserSnapshot(firebaseUid: string) {
        const userRef = this.firebase.firestore.collection('users').doc(firebaseUid);

        // Retrieve user document
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        return { userRef, userSnap };
    }

    // Private helper to get vehicleRef and vehicleSnap for a given vehicleId
    private async getVehicleSnapshot(vehicleId: string) {
        const vehRef = this.firebase.firestore.collection('vehicles').doc(vehicleId);
        const vehSnap = await vehRef.get();

        if (!vehSnap.exists) {
            throw new NotFoundException('Vehicle not found');
        }

        return { vehRef, vehSnap };
    }
}
