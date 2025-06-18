import { Body, Controller, Put, UseGuards, Inject, Get, ParseIntPipe, Query } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { AuthGuard } from '../auth/guards/authGuard';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Types } from 'mongoose';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { DELIVERY_CONSTANTS } from './deliveryConstants';
import { DeliveryStatus } from './enums/deliveryEnums';
import { DeliveredSwagger, DeliverySwagger, HandOverSwagger, NewOrderSwagger } from './deliverySwagger';
import { GetPartnerDeliveriesSwagger } from '../deliveryPartner/deliveryPartnerSwagger';
import { DELIVERY_PARTNER_CONSTANTS } from '../deliveryPartner/deliveryPartnerConstants';
import { CurrentPartner } from 'src/common/decorators';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { DeliveryDto } from '../deliveryPartner/DTOS/deliveryDto';

@DeliverySwagger()
@Controller(DELIVERY_CONSTANTS.ENDPOINTS.DELIVERY_BASE)
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  @EventPattern(DELIVERY_CONSTANTS.EVENTS.HAND_OVERED)
  @HandOverSwagger()
  async handleOrderPickup(
    @Payload('orderId') orderId: Types.ObjectId, 
    @Ctx() context: KafkaContext
  ) {
    this.logger.info('Processing order pickup event', {
      service: 'DeliveryController',
      method: 'handleOrderPickup',
      orderId: orderId.toString(),
    });

      const consumer = context.getConsumer();
      const topic = context.getTopic();
      const partition = context.getPartition();
      const offset = context.getMessage().offset;

      this.logger.debug('Committing Kafka offset', {
        topic,
        partition,
        offset,
      });

      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(offset) + 1).toString(),
      }]);

      this.logger.debug('Kafka offset committed successfully');

      await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.PICKED_UP);
      this.logger.info('Order status updated to PICKED_UP', {
        orderId: orderId.toString(),
      });

      setTimeout(async () => {
        
          await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.IN_TRANSIT);
          this.logger.info('Order status automatically updated to IN_TRANSIT', {
            orderId: orderId.toString(),
            afterDelay: DELIVERY_CONSTANTS.TIMEOUTS.IN_TRANSIT_DELAY,
          });
      }, DELIVERY_CONSTANTS.TIMEOUTS.IN_TRANSIT_DELAY);
  }

  @EventPattern(DELIVERY_CONSTANTS.EVENTS.NEW_ORDER)
  @NewOrderSwagger()
  async createDelivery(
    @Payload() data: {orderId: Types.ObjectId}, 
    @Ctx() context: KafkaContext
  ) {
    const { orderId } = data;
    this.logger.info('Processing new order event', {
      service: 'DeliveryController',
      method: 'createDelivery',
      orderId: orderId.toString(),
    });

      const consumer = context.getConsumer();
      const topic = context.getTopic();
      const partition = context.getPartition();
      const offset = context.getMessage().offset;

      this.logger.debug('Committing Kafka offset', {
        topic,
        partition,
        offset,
      });

      await consumer.commitOffsets([{
        topic,
        partition,
        offset: (parseInt(offset) + 1).toString(),
      }]);

      this.logger.debug('Kafka offset committed successfully');

      await this.deliveryService.createDelivery(orderId);
      this.logger.info('Delivery created successfully', {
        orderId: orderId.toString(),
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED,
      });
  }

  @DeliveredSwagger()
  @UseGuards(AuthGuard)
  @Put(DELIVERY_CONSTANTS.ENDPOINTS.DELIVERED)
  async handleOrderDelivered(@Body('orderId') orderId: Types.ObjectId) {
    this.logger.info('Processing order delivered request', {
      service: 'DeliveryController',
      method: 'handleOrderDelivered',
      orderId: orderId.toString(),
    });

      const result = await this.deliveryService.updateDeliveryStatus(orderId, DeliveryStatus.DELIVERED);
      
      this.logger.info('Order marked as delivered', {
        orderId: orderId.toString(),
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED,
      });

      return {
        success: true,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.ORDER_DELIVERED,
        data: {
          orderId,
          status: DeliveryStatus.DELIVERED,
          deliveredAt: new Date().toISOString()
        }
      };
  }


  @GetPartnerDeliveriesSwagger()
  @UseGuards(AuthGuard)
  @Get(DELIVERY_PARTNER_CONSTANTS.ENDPOINTS.DELIVERIES_HISTORY)
  async getPartnerDeliveries(
    @CurrentPartner('sub', ParseObjectIdPipe) partnerId: Types.ObjectId,
    @Query() query: DeliveryDto
  ) {

    const { page, limit } = query;
    this.logger.info('Fetching partner deliveries', {
      service: 'DeliveryPartnerController',
      method: 'getPartnerDeliveries',
      partnerId: partnerId.toString(),
      page: page,
      limit: limit
    });
    
    const deliveries = await this.deliveryService.getPartnerDeliveries(partnerId, page, limit);
    
    this.logger.info('Deliveries retrieved successfully', {
      partnerId: partnerId.toString(),
      count: deliveries.data.length,
      total: deliveries.total,
      message: DELIVERY_PARTNER_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_RETRIEVED
    });
    
    return deliveries;
  }
}