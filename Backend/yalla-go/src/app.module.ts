import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FirebaseModule } from './firebase/firebase.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { RidesModule } from './rides/rides.module';
import { RidePassengersModule } from './ride-passengers/ride-passengers.module';
import { PaymentsModule } from './payments/payments.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SosAlertsModule } from './sos-alerts/sos-alerts.module';
import { ConfigModule } from '@nestjs/config';
import { GoogleModule } from './google/google.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true, // makes it available everywhere
    }),FirebaseModule, UsersModule, VehiclesModule, RidesModule, RidePassengersModule, PaymentsModule, ReviewsModule, SosAlertsModule, GoogleModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
