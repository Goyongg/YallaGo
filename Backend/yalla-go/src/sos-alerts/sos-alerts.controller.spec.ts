import { Test, TestingModule } from '@nestjs/testing';
import { SosAlertsController } from './sos-alerts.controller';

describe('SosAlertsController', () => {
  let controller: SosAlertsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SosAlertsController],
    }).compile();

    controller = module.get<SosAlertsController>(SosAlertsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
