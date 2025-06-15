import { Module } from '@nestjs/common';
import { SosAlertsController } from './sos-alerts.controller';
import { SosAlertsService } from './sos-alerts.service';

@Module({
  controllers: [SosAlertsController],
  providers: [SosAlertsService]
})
export class SosAlertsModule {}
