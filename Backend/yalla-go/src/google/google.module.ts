import { Module } from '@nestjs/common';
import { GoogleMapsService } from './google-maps/google-maps.service';

@Module({
  providers: [GoogleMapsService],
  exports: [GoogleMapsService], // Make available to other modules
})
export class GoogleModule {}
