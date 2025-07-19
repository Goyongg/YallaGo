import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseUserService } from './firebase-user.service';
import { FirebaseDriverService } from './firebase-driver.service';
import { FirebaseNotificationsService } from './firebase-notifications.service';

@Global()
@Module({
  providers: [FirebaseService, FirebaseAuthGuard, FirebaseUserService, FirebaseDriverService, FirebaseNotificationsService],
  exports: [FirebaseService, FirebaseAuthGuard, FirebaseUserService, FirebaseDriverService, FirebaseNotificationsService], // allow global access
})
export class FirebaseModule {}
