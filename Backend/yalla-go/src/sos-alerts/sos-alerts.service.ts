import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { CreateSOSAlertDto } from './dto/create-sosalert.dto';
import { Timestamp } from 'firebase-admin/firestore'
import { AlertStatus } from './enums/alert-status.enum';

@Injectable()
export class SosAlertsService {
    constructor(private readonly firebase: FirebaseService) {}

    // create alert record in firestore
    async createSOSAlert(createSOSAlertDto: CreateSOSAlertDto, firebaseUid: string) {
        const alertRef = this.firebase.firestore.collection('sos-alerts').doc();

        const alertData = {
            alertId: alertRef.id, // create alertId
            userId: firebaseUid, // link userId
            // rideId
            ...createSOSAlertDto,
            triggeredAt: Timestamp.now().toDate(),
            status: AlertStatus.ACTIVE
        };

        await alertRef.set(alertData); // set alert data in firestore
        return { message: "Alert record created succesfully", alertId: alertData.alertId }
    }
}
