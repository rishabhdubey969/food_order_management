import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryRiderController } from './delivery-rider.controller';

describe('DeliveryRiderController', () => {
  let controller: DeliveryRiderController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryRiderController],
    }).compile();

    controller = module.get<DeliveryRiderController>(DeliveryRiderController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
