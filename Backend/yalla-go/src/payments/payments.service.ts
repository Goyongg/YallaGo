import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';
import { FirebaseService } from 'src/firebase/firebase.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseDriverService: FirebaseDriverService
    ) {}

    async createIntent(rideId: string, firebaseUid: string) {
        // Get the ride doc
        const rideData = await this.firebaseDriverService.getRideById(rideId);

        // Get the price per seat from the doc
        const amount = Math.round(rideData.pricePerSeat * 100); // in cents

        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('Missing Stripe Secret Key');
        }

        const stripe = new Stripe(apiKey);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: "aed",
            metadata: {
                rideId: rideId,
                passengerId: firebaseUid
            }
        });

        await this.firebase.firestore
        .collection('payments')
        .doc(paymentIntent.id)
        .set({
            paymentId: paymentIntent.id,
            rideId,
            passengerId: firebaseUid,
            amount: amount,
            status: 'pending',
            createdAt: this.firebase.Timestamp.now()
        });

        return {
            clientSecret: paymentIntent.client_secret
        };
    }
}

