import { Body, Controller, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentService: PaymentsService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post('create-intent')
    async createIntent(@Query('rideId') rideId: string ,@Req() req) {
        const firebaseUid = req.user.uid;

        return
    }
}
