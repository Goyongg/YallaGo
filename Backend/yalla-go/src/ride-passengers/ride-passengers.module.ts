import { Module } from '@nestjs/common';
import { RidePassengersController } from './ride-passengers.controller';
import { RidePassengersService } from './ride-passengers.service';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  controllers: [RidePassengersController],
  providers: [RidePassengersService],
  imports: [PaymentsModule],
})
export class RidePassengersModule {}
