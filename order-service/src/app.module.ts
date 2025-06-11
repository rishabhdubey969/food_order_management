import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderService } from './order/order.service';
import { OrderModule } from './order/order.module';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './databaseConnection/database.module';
// import { InvoiceModule } from './invoice/invoice.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
    envFilePath:'.env', 
    load:[configuration]
  }),DatabaseModule,OrderModule, KafkaModule, ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
