import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentsService) {}

    @Post('create-intent')
    @UseGuards(FirebaseAuthGuard)
    async createIntent(@Req() req, @Body() createPaymentDto: CreatePaymentDto) {

    const uid = req.user.uid;
    return this.paymentService.createPaymentIntent(uid, createPaymentDto);
    }
}
