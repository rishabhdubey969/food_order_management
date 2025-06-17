import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { NotificationHelperService } from 'src/utils/helper';

@Module({
  controllers: [OrderController],
  providers: [OrderService, NotificationHelperService],
})
export class OrderModule {}
