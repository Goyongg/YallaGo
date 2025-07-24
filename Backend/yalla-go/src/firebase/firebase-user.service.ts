import { Injectable, NotFoundException } from "@nestjs/common";
import { FirebaseService } from "./firebase.service";

@Injectable()
export class FirebaseUserService {
    constructor (private readonly firebase: FirebaseService) {}

    async getUserRef(userId: string){
        const userRef = this.firebase.firestore.collection('users').doc(userId);

        return userRef;
    }

    async getUserSnapshot(userId: string) {
        const userRef = await this.getUserRef(userId);

        // Retieve user doc
        const userSnap = await userRef.get();
        if (!userSnap.exists) {
            throw new NotFoundException('User profile not found');
        }

        return userSnap;
    }

    async fetchUserData(userId: string) {
        const userSnap = await this.getUserSnapshot(userId);

        const userData = userSnap.data();
        if (!userData) {
            throw new NotFoundException('User data is undefined');
        }

        return userData;
    }

    async getBookingRef(bookingId: string){
        const bookingRef = this.firebase.firestore.collection('bookings').doc(bookingId);

        return bookingRef;
    }

    async getBookingSnap(bookingId: string){
        const bookingRef = await this.getBookingRef(bookingId);

        const bookingSnap = await bookingRef.get();

        if(!bookingSnap.exists){
            throw new NotFoundException('Booking not found');
        }
        return bookingSnap;
    }

    async fetchBookingData(bookingId: string){
        const bookingSnap = await this.getBookingSnap(bookingId);

        const bookingData = bookingSnap.data()
        if(!bookingData){
            throw new NotFoundException('Booking data is undefined');
        }
        return bookingData;
    }
}