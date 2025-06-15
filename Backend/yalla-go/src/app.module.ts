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

@Module({
  imports: [FirebaseModule, UsersModule, VehiclesModule, RidesModule, RidePassengersModule, PaymentsModule, ReviewsModule, SosAlertsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
