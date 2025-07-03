import { Body, Controller, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { SosAlertsService } from './sos-alerts.service';
import { FirebaseAuthGuard } from 'src/firebase/firebase-auth.guard';
import { CreateSOSAlertDto } from './dto/create-sosalert.dto';

@Controller('sos-alerts')
export class SosAlertsController {
    constructor(private readonly sosAlertService: SosAlertsService) {}

    @UseGuards(FirebaseAuthGuard)
    @Post()
    async createSOSAlert(@Body(ValidationPipe) createSOSALertDto: CreateSOSAlertDto, @Req() req) {
        const firebaseUid = req.user.uid;

        return this.sosAlertService.createSOSAlert(createSOSALertDto, firebaseUid)
    }
}
