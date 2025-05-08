import { Test, TestingModule } from '@nestjs/testing';
import { DeliveryPartnerController } from './delivery-partner.controller';
import { DeliveryPartnerService } from './delivery-partner.service';

describe('DeliveryPartnerController', () => {
  let deliveryPartnerController: DeliveryPartnerController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [DeliveryPartnerController],
      providers: [DeliveryPartnerService],
    }).compile();

    deliveryPartnerController = app.get<DeliveryPartnerController>(DeliveryPartnerController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(deliveryPartnerController.getHello()).toBe('Hello World!');
    });
  });
});
