import { Test, TestingModule } from '@nestjs/testing';
import { RidePassengersController } from './ride-passengers.controller';

describe('RidePassengersController', () => {
  let controller: RidePassengersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RidePassengersController],
    }).compile();

    controller = module.get<RidePassengersController>(RidePassengersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
