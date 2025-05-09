import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './databaseConnection/database.module';
import { PaymentClient } from './grpc/payment/payment.client';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:'.env', // This makes the config globally available
      load:[configuration]
    }),DatabaseModule
  ],
  controllers: [OrderController],
  providers: [OrderService,PaymentClient],
})
export class OrderModule {}
