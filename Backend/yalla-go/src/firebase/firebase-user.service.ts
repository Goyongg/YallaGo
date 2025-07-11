import { Injectable, NotFoundException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class FirebaseUserService {
    constructor (private readonly firebase: FirebaseService) {}

    async fetchUserData(firebaseUid: string) {
        const userDoc = await this.firebase.firestore.collection('users').doc(firebaseUid).get();
        if (!userDoc.exists) {
            throw new NotFoundException('User not found');
        };

        const userData = userDoc.data();
        if (!userData) {
            throw new NotFoundException('User data is undefined');
        }

        return userData;
    }
}