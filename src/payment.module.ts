import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
// import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './Database/database.module';
import { paymentService } from './payment.service';
import { PayModule } from './api/pay/pay.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [configuration],
    }),DatabaseModule,PayModule
  ],
  controllers: [PaymentController],
  providers: [paymentService],
})
export class PaymentModule {}
