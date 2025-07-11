import { Global, Module } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseUserService } from './firebase-user.service';
import { FirebaseDriverService } from './firebase-driver.service';

@Global()
@Module({
  providers: [FirebaseService, FirebaseAuthGuard, FirebaseUserService, FirebaseDriverService],
  exports: [FirebaseService, FirebaseAuthGuard, FirebaseUserService, FirebaseDriverService], // allow global access
})
export class FirebaseModule {}
