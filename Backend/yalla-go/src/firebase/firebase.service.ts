import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
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
        // If there is already a Firebase Admin app initialized re-use it
        const app = admin.apps.length
        ? admin.app()
        // Otherwise, if GOOGLE_APPLICATION_CREDENTIALS is set (for local dev), initialize using the service account JSON key
        : process.env.GOOGLE_APPLICATION_CREDENTIALS
        ? admin.initializeApp({
            credential: admin.credential.cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)),
            })
        // Otherwise, initialize with default credentials (Firebase Cloud Functions)
        : admin.initializeApp();

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
