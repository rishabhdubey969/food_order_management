import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Complaint, ComplaintSchema } from 'src/manager/schema/complain.schema';
import { ComplaintService } from './complainservice';
import { ComplaintController } from './complaincontroller';
import { TokenModule } from '../token/token.module';
import { JwtAuthGuard } from '../guard/authguard';
import { MailerService } from '../common/mailer.service';
import { Order, OrderSchema } from '../schema/order.schema';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema },
      { name: Complaint.name, schema: ComplaintSchema }]),
    TokenModule,
    MailerModule,
  ],
  providers: [ComplaintService, JwtAuthGuard,MailerService],
  controllers: [ComplaintController],
})
export class ComplaintModule {}
