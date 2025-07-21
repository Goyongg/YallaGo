import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class FirebaseNotificationsService {
    constructor(private readonly firebase: FirebaseService) {}

    async sendToDevice(token: string, title: string, body: string) {
        const payload = {
            token,
            notification: {
                title,
                body,
            },
        };

        try {
            const response = await this.firebase.messaging.send(payload);
            return response;
        } catch (error: any) {
            console.error(`❌ Error sending to token`);

            if (
                error.code === 'messaging/registration-token-not-registered' ||
                error.code === 'messaging/invalid-argument' ||
                error.code === 'messaging/invalid-registration-token'
            ) {
                console.warn(`🧹 Deleting invalid token: ${token}`);
                await this.deleteTokenFromFirestore(token);
            }

            throw error; // Re-throw if needed for higher-level handling
        }
    }

    async deleteTokenFromFirestore(token: string) {
        try {
            await this.firebase.firestore.collection('device-tokens').doc(token).delete();
            console.log(`✅ Deleted token ${token} from Firestore`);
        } catch (err) {
            console.error(`❌ Failed to delete token ${token}:`, err);
        }
    }
}
