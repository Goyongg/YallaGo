import { Injectable, NotFoundException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class FirebaseDriverService {
    constructor (private readonly firebase: FirebaseService) {}

    // fetch vehicle data of driver
    async fetchVehicleData(driverId: string) {
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
            ...doc.data()
        }));
    }

    // fetch ride by ride id
    async getRideById(rideId: string) {
        const rideDoc = await this.firebase.firestore.collection('rides').doc(rideId).get();
        if (!rideDoc.exists) {
            throw new NotFoundException('Ride does not exist');
        }

        const rideData = rideDoc.data();
        if (!rideData) {
            throw new NotFoundException('Ride data is undefined');
        }

        return rideData;
    }
}