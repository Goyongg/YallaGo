import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { Timestamp } from 'firebase-admin/firestore'
import Stripe from 'stripe';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';

@Injectable()
export class PaymentsService {
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseUserService: FirebaseUserService
    ) {}

    async createPaymentIntent(firebaseUid: string, createPaymentDto: CreatePaymentDto) {
        const { rideId, amount } = createPaymentDto;

        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
        throw new Error('🚨 STRIPE_SECRET_KEY is not defined in environment variables.');
        }

        // Fetch user info from Firestore
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);
        const passengerName = userData.name;

        const stripe = new Stripe(secretKey, {
            apiVersion: '2025-06-30.basil',
        });

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // convert to cents
            currency: 'aed',
            capture_method: 'manual', // 👈 Important!
            metadata: {
            rideId,
            passengerId: firebaseUid,
            passengerName
            },
        });

        const paymentRef = this.firebase.firestore.collection('payments').doc(paymentIntent.id);

        await paymentRef.set({
            paymentId: paymentIntent.id,
            rideId,
            passengerId: firebaseUid,
            passengerName,
            amount,
            currency: paymentIntent.currency,
            status: PaymentStatus.PENDING,
            createdAt: this.firebase.FieldValue.serverTimestamp(),
            stripeTransactionId: paymentIntent.id,
        });

        return {
            clientSecret: paymentIntent.client_secret,
            paymentId: paymentIntent.id,
        };
    }

}
