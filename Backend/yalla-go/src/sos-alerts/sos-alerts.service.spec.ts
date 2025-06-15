import { Test, TestingModule } from '@nestjs/testing';
import { SosAlertsService } from './sos-alerts.service';

describe('SosAlertsService', () => {
  let service: SosAlertsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SosAlertsService],
    }).compile();

    service = module.get<SosAlertsService>(SosAlertsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
