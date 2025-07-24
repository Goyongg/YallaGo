import { Injectable, NotFoundException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class FirebaseDriverService {
    constructor (private readonly firebase: FirebaseService) {}

    async getVehicleRef(vehicleId: string){
        const vehRef = this.firebase.firestore.collection('vehicles').doc(vehicleId);

        return vehRef;
    }
    
    // Private helper to get vehicleRef and vehicleSnap for a given vehicleId
    async getVehicleSnap(vehicleId: string) {
        const vehRef = await this.getVehicleRef(vehicleId);
        const vehSnap = await vehRef.get();

        if (!vehSnap.exists) {
            throw new NotFoundException('Vehicle not found');
        }

        return  vehSnap;
    }

    async fetchVehicleData(vehicleId: string) {
        const vehSnap = await this.getVehicleSnap(vehicleId);

        const vehData = vehSnap.data();
        if (!vehData) {
            throw new NotFoundException('Vehicle data is undefined')
        }

        return vehData;
    }

    // fetch vehicle data of driver
    async getVehicleByDriver(driverId: string) {
        const vehicleSnapShot = await this.firebase.firestore
        .collection('vehicles')
        .where("driverId", "==", driverId)
        .get();

        if (vehicleSnapShot.empty) {
            throw new NotFoundException('Vehicle not found for this driver');
        }

        const vehicleData = vehicleSnapShot.docs[0].data();
        return vehicleData;
    }

    // fetch ride documents of driver
    async getRideByDriver(driverId: string) {
        const rideSnapShot = await this.firebase.firestore
        .collection('rides')
        .where("driverId", "==", driverId)
        .get();

        if (rideSnapShot.empty) {
            throw new NotFoundException('Rides not found for this driver');
        }

        return rideSnapShot.docs.map(doc => ({
            rideId: doc.id,
            ...(doc.data() as { 
                status: string;
                departureTime: FirebaseFirestore.Timestamp; 
            })
        }));
    }

    async getRideRef(rideId: string){
        const rideRef = this.firebase.firestore.collection('rides').doc(rideId);

        return rideRef;
    }

    async getRideSnap(rideId: string){
        const rideRef = await this.getRideRef(rideId)

        const rideSnap = await rideRef.get();

        if(!rideSnap.exists){
            throw new NotFoundException('Ride does not exist')
        }

        return rideSnap;
    }

    // fetch ride by ride id
    async fetchRideData(rideId: string) {
        const rideSnap = await this.getRideSnap(rideId)

        const rideData = rideSnap.data();
        if (!rideData) {
            throw new NotFoundException('Ride data is undefined');
        }

        return rideData;
    }
}