import { Module } from '@nestjs/common';
import { RidesController } from './rides.controller';
import { RidesService } from './rides.service';
import { GoogleModule } from 'src/google/google.module';

@Module({
  imports: [GoogleModule],
  controllers: [RidesController],
  providers: [RidesService]
})
export class RidesModule {}
