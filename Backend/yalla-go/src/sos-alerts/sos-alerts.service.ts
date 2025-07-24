import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';
import { Timestamp } from 'firebase-admin/firestore'
import { AlertStatus } from './enums/alert-status.enum';
import { FirebaseDriverService } from 'src/firebase/firebase-driver.service';
import { FirebaseUserService } from 'src/firebase/firebase-user.service';

@Injectable()
export class SosAlertsService {
    private readonly twilioClient;
    
    constructor(
        private readonly firebase: FirebaseService,
        private readonly firebaseDriverService: FirebaseDriverService,
        private readonly firebaseUserService: FirebaseUserService
    ) {}

    // create alert record in firestore
    async createSOSAlert(rideId: string, firebaseUid: string) {

        // Create a new SOS alert document reference
        const alertRef = this.firebase.firestore.collection('sos-alerts').doc();

        // Fetch user details
        const userData = await this.firebaseUserService.fetchUserData(firebaseUid);

        // Prepare alert data
        const alertData = {
            alertId: alertRef.id,
            userId: firebaseUid,
            rideId: rideId,
            triggeredAt: Timestamp.now().toDate(),
            status: AlertStatus.ACTIVE
        };

        const rideData = await this.firebaseDriverService.fetchRideData(rideId);
        
        // Store the SOS alert in Firestore
        await alertRef.set(alertData);

        // Prepare the email body(unindented for email body alignment)
        const emailText = `A user has triggered an alert. Details of alert follow.
        
Triggered by: ${userData.name}
User phone number: ${userData.phoneNumber}
        
Ride ID: ${rideId}
Start location: ${rideData.startLocation}
End location: ${rideData.endLocation}
        
Triggered At: ${alertData.triggeredAt}
`;

        // Send email via Firestore 'mails' collection
        await this.firebase.firestore.collection('mails').add({
            to: ['alertsyallago@gmail.com'],  // custom email made to recieve alerts only
            message: {
                subject: '🚨 SOS Alert Triggered',
                text: emailText
            }
        });

        // Return response
        return { message: "Alert created and email sent.", alertId: alertData.alertId }
    }
}
