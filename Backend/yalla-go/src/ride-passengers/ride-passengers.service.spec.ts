import { Test, TestingModule } from '@nestjs/testing';
import { RidePassengersService } from './ride-passengers.service';

describe('RidePassengersService', () => {
  let service: RidePassengersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RidePassengersService],
    }).compile();

    service = module.get<RidePassengersService>(RidePassengersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
