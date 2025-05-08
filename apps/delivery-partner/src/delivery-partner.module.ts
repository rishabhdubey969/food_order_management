import { Module } from '@nestjs/common';
import { DeliveryPartnerController } from './delivery-partner.controller';
import { DeliveryPartnerService } from './delivery-partner.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally available
    })
  ],
  controllers: [DeliveryPartnerController],
  providers: [DeliveryPartnerService],
})
export class DeliveryPartnerModule {}
