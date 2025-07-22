import { Body, Controller, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { SosAlertsService } from './sos-alerts.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';

@Controller('sos-alerts')
export class SosAlertsController {
    constructor(private readonly sosAlertService: SosAlertsService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async createSOSAlert(@Query('rideId') rideId: string, @Req() req) {
        const firebaseUid = req.user.uid;

        return this.sosAlertService.createSOSAlert(rideId, firebaseUid)
    }
}
