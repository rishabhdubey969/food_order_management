import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Complaint, ComplaintSchema } from 'src/manager/schema/complain.schema';
import { ComplaintService } from './complainservice';
import { ComplaintController } from './complaincontroller';
import { TokenModule } from '../token/token.module';
import { JwtAuthGuard } from '../auth/guards/jwtauthguard';
import { Order, OrderSchema } from '../../schema/order.schema';
import { MailerModule } from '@nestjs-modules/mailer';
import { LoggerModule } from 'src/logger/logger.module';
import { RabbitMQModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema },
      { name: Complaint.name, schema: ComplaintSchema }]),
    TokenModule,
    MailerModule,
    LoggerModule,
    RabbitMQModule,
  ],
  providers: [ComplaintService, JwtAuthGuard],
  controllers: [ComplaintController],
})
export class ComplaintModule {}
