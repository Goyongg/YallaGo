import { Injectable } from '@nestjs/common';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class FirebaseNotificationsService {
    constructor(private readonly firebase: FirebaseService) {}

    async sendToDevice(token: string, title: string, body: string, data: Record<string, string> = {}) {
        const payload = {
            token,
            notification: {
                title,
                body,
            },
            data,
        };

        return this.firebase.messaging.send(payload);
    }
    
}
