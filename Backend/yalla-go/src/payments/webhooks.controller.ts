import { Controller, Post, Req, Res } from '@nestjs/common';
import Stripe from 'stripe';
import { FirebaseService } from '../firebase/firebase.service';
import { PaymentStatus } from './enums/payment-status.enum';

@Controller('webhooks')
export class WebhooksController {
  private stripe: Stripe;

  constructor(private readonly firebase: FirebaseService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('🚨 STRIPE_SECRET_KEY is not defined in environment variables.');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }

  @Post('stripe')
  async handleStripeWebhook(@Req() req, @Res() res) {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = this.stripe.webhooks.constructEvent(
        (req as any).rawBody,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

    } catch (err) {
      console.error('❌ Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentId = paymentIntent.id;

      await this.firebase.firestore.collection('payments').doc(paymentId).update({
        status: PaymentStatus.PAID,
        completedAt: this.firebase.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Payment ${paymentId} marked as succeeded.`);
    }
    
    if (event.type === 'payment_intent.canceled') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentId = paymentIntent.id;

    await this.firebase.firestore.collection('payments').doc(paymentId).update({
        status: PaymentStatus.CANCELLED,
        cancelledAt: this.firebase.FieldValue.serverTimestamp(),
    });

    console.log(`❌ Payment ${paymentId} was cancelled.`);
    }

    if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentId = paymentIntent.id;

    await this.firebase.firestore.collection('payments').doc(paymentId).update({
        status: PaymentStatus.FAILED,
        failedAt: this.firebase.FieldValue.serverTimestamp(),
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown',
    });

    console.log(`❌ Payment ${paymentId} failed to complete.`);
    }

    return res.json({ received: true });
  }
}
