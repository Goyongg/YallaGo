import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { Timestamp } from 'firebase-admin/firestore'

@Injectable()
export class PaymentsService {
    constructor(private readonly firebase: FirebaseService) {}

    // create payment record in firestore
    async createPayment(createPaymentDto: CreatePaymentDto, firebaseUid: string) {
        const paymentRef = this.firebase.firestore.collection('payments').doc();
        const paymentData = {
            paymentId: paymentRef.id, // create paymentid
            // rideId...
            passengerId: firebaseUid, // link to passenger
            ...createPaymentDto,
            status: PaymentStatus.PENDING,
            timestamp: Timestamp.now().toDate(),
            //stripe trans id...
        };

        await paymentRef.set(paymentData);
        return { message: "Payment record created successfully", userId: firebaseUid }
    };
}
