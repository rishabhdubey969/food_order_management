import { forwardRef, Module } from '@nestjs/common';
import { MidModuleService } from './mid-module.service';
import { MidModuleController } from './mid-module.controller';
import { DeliveryModule } from '../delivery/delivery.module';
import { DeliveryPartnerModule } from '../deliveryPartner/deliveryPartnerModule';

@Module({
  imports: [
    forwardRef(() => DeliveryModule),
    forwardRef(() => DeliveryPartnerModule)
  ],
  controllers: [MidModuleController],
  providers: [MidModuleService],
  exports: [MidModuleService]
})
export class MidModuleModule {}
