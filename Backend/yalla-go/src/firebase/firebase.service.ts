import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import serviceAccount from '../config/yallago-app-e3745-firebase-adminsdk-fbsvc-66667a44a9.json';
import { GeoFirestore } from 'geofirestore';

@Injectable()
export class FirebaseService implements OnModuleInit{
    
    private firestoreInstance: admin.firestore.Firestore;
    private authInstance: admin.auth.Auth;
    private messagingInstance: admin.messaging.Messaging;
    private geoFirestoreInstance: GeoFirestore;
    
    // Expose Timestamp
    public readonly Timestamp = admin.firestore.Timestamp;

    // Expose GeoPoint
    public readonly GeoPoint = admin.firestore.GeoPoint;

    onModuleInit() {
        const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });

        this.firestoreInstance = app.firestore();
        this.authInstance = app.auth();
        this.messagingInstance = app.messaging();
        this.geoFirestoreInstance = new GeoFirestore(this.firestoreInstance);
    }
    
    get firestore() {
        return this.firestoreInstance;
    }

    get auth() {
        return this.authInstance;
    }

    get messaging() {
        return this.messagingInstance;
    }

    get geoFirestore() {
        return this.geoFirestoreInstance;
    }
}
