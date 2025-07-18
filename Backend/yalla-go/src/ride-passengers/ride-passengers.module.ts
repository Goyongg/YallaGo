import { Module } from '@nestjs/common';
import { RidePassengersController } from './ride-passengers.controller';
import { RidePassengersService } from './ride-passengers.service';

@Module({
  controllers: [RidePassengersController],
  providers: [RidePassengersService],
})
export class RidePassengersModule {}
