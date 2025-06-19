import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentsService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('payment')
    async createPayment(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto, @Req() req) {
        const firebaseUid = req.user.uid; // extract user id from the request

        return this.paymentService.createPayment(createPaymentDto, firebaseUid);
    }
}
