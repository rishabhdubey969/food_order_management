import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { ConfigModule } from '@nestjs/config';
import { Payment, PaymentSchema } from './Schema/pay.schema';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  controllers: [PayController],
  providers: [PayService],
})
export class PayModule {}
