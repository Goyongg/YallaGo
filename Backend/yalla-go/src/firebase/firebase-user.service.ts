import { Injectable, NotFoundException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class FirebaseUserService {
    constructor (private readonly firebase: FirebaseService) {}

    async getUserSnapshot(firebaseUid: string) {
        // Get the location of the user's document in Firestore
        const userRef = this.firebase.firestore.collection('users').doc(firebaseUid);

        // Retieve user doc
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        return { userRef, userSnap };
    }

    async fetchUserData(firebaseUid: string) {
        const { userSnap } = await this.getUserSnapshot(firebaseUid);

        const userData = userSnap.data();
        if (!userData) {
            throw new NotFoundException('User data is undefined');
        }

        return userData;
    }
}