import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Delivery, DeliveryDocument } from './modles/deliveryModel';
import { Connection, Model, MongooseError } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CompleteDelivery, DriverLocationResult, PaginatedDeliveries } from './interfaces/deliveryInterfaces';
import { RedisService } from '../redis/redisService';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { Logger } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { DELIVERY_CONSTANTS } from './deliveryConstants';
import { DeliveryStatus, PaymentMethod } from './enums/deliveryEnums';


@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @Inject(forwardRef(() => TrackingGateway))
    private readonly trackingGateway: TrackingGateway,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    @InjectModel(Delivery.name)
    private readonly DeliveryModel: Model<DeliveryDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async createDelivery(orderId: Types.ObjectId) {
    try {
      const currentOrder = await this.connection.collection('orders').findOne({ _id: new Types.ObjectId(orderId) });
      if (!currentOrder) {
        this.logger.warn(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID_SERVICE} - ${orderId}`);
        await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE, { 
          message: DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID_SERVICE,
          success: false,
          orderId: orderId
         });
        throw new BadRequestException(DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_ORDER_ID_SERVICE);
      }

      const restaurantLongitude = currentOrder.restaurantAddress.longitude;
      const restaurantLatitude = currentOrder.restaurantAddress.latitude;
      const deliveryLongitude = currentOrder.deliveryAddress.latitude;
      const deliveryLatitude = currentOrder.deliveryAddress.longitude;

      if (!restaurantLongitude || !restaurantLatitude || !deliveryLongitude || !deliveryLatitude) {
        this.logger.log(DELIVERY_CONSTANTS.MESSAGES.ERROR.COORDINATES_MISSING);
        await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE, { 
          message: DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_COORDINATES,
          success: false,
          orderId: orderId
         });
        throw new BadRequestException(DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_COORDINATES);
      }

      const currentDelivery: CompleteDelivery = {
        orderId: orderId,
        restaurantId: currentOrder.restaurantId,
        userId: currentOrder.userId,
        pickupLocation: {
          address: currentOrder.restaurantAddress.address,
          mobileNumber: currentOrder.restaurantAddress.contactNumber,
          coordinates: [parseFloat(currentOrder.restaurantAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)],
        },
        deliveryLocation: {
          address: currentOrder.deliveryAddress.address,
          mobileNumber: currentOrder.deliveryAddress.contactNumber,
          coordinates: [parseFloat(currentOrder.deliveryAddress.longitude), parseFloat(currentOrder.deliveryAddress.latitude)],
        },
        totalOrderAmount: currentOrder.total,
        deliveryFee: currentOrder.deliveryFee,
        paymentMethod: currentOrder.PaymentMethod === 'cashOnDelivery' ? PaymentMethod.CASH_ON_DELIVERY : PaymentMethod.PAID,
      };

      await this.DeliveryModel.create(currentDelivery);
      this.logger.log(DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED_SUCCESS);
      
      await this.assignDeliveryPartner(currentDelivery);
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED} ${orderId}`);
    } catch (err) {
      if (err instanceof BadRequestException || err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error creating delivery for order: ${orderId}`, err);
      throw new MongooseError(err.message);
    }
  }

  async assignDeliveryPartner(currentDelivery: CompleteDelivery) {
    this.logger.log(`Assigning delivery partner for order: ${currentDelivery.orderId}`);
    try {
      const { coordinates } = currentDelivery.pickupLocation;
      const deliveryPartnersList: DriverLocationResult = await this.redisService.findNearestDriver(
        coordinates[0],
        coordinates[1],
        DELIVERY_CONSTANTS.REDIS.NEAREST_DRIVER_RADIUS,
        DELIVERY_CONSTANTS.REDIS.NEAREST_DRIVER_LIMIT
      );
      if (!deliveryPartnersList?.length) {
        this.logger.warn(DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_DELIVERY_PARTNERS);
        await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE, { 
          message: DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_DELIVERY_PARTNERS,
          success: false,
          orderId: currentDelivery.orderId
        });
        throw new NotFoundException(DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_DELIVERY_PARTNERS);
      }
      await this.trackingGateway.broadcastRequest(deliveryPartnersList, currentDelivery);
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED} ${currentDelivery.orderId}`);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error assigning delivery partner for order: ${currentDelivery.orderId}`, err);
      throw new MongooseError(err.message);
    }
  }

  async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId) {
    this.logger.log(`Assigning partner ${partnerId} to order: ${orderId}`);
    try {
      const delivery = await this.DeliveryModel.findOneAndUpdate(
        { orderId: orderId },
        { partnerId: partnerId, status: DeliveryStatus.ASSIGNED},
        { new: true }
      );
      if (!delivery) {
        this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId ${orderId}`);
        throw new NotFoundException(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId: ${orderId}`);
      }
      await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE,
        {
          success: true,
          orderId: orderId,
          partnerId: partnerId, 
          message: `${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED_SUCCESS} ${orderId}`
        })
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED_SUCCESS} ${orderId}`);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error assigning partner ${partnerId} to order: ${orderId}`, err);
      throw new MongooseError('Updating Partner Error');
    }
  }

  async checkAssignedPartner(partnerId: Types.ObjectId) {
    this.logger.log(`Checking assigned delivery for partner: ${partnerId}`);
    try {
      const delivery = await this.DeliveryModel.findById(partnerId);
      if (!delivery) {
        this.logger.log(DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND);
        throw new NotFoundException(DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND);
      }
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_FETCHED}: ${partnerId}`);
      return delivery;
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error fetching delivery for partner: ${partnerId}`, err);
      throw new MongooseError('Error While Fetching Delivery assigned to Particular partner');
    }
  }

  async getEarningsByPeriod(partnerId: Types.ObjectId, period: string): Promise<number> {
    this.logger.log(`Calculating earnings for partner ${partnerId} for period: ${period}`);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (period) {
        case DELIVERY_CONSTANTS.PERIODS.DAILY:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case DELIVERY_CONSTANTS.PERIODS.WEEKLY:
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case DELIVERY_CONSTANTS.PERIODS.MONTHLY:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case DELIVERY_CONSTANTS.PERIODS.LIFETIME:
          startDate = new Date(0);
          break;
        default:
          this.logger.warn(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD} for partner ${partnerId}: ${period}`);
          throw new Error(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD}: ${period}. Must be '${DELIVERY_CONSTANTS.PERIODS.DAILY}', '${DELIVERY_CONSTANTS.PERIODS.WEEKLY}', '${DELIVERY_CONSTANTS.PERIODS.MONTHLY}', or '${DELIVERY_CONSTANTS.PERIODS.LIFETIME}'.`);
      }

      const pipeline: any[] = [
        {
          $match: {
            partnerId: new Types.ObjectId(partnerId),
            status: DeliveryStatus.DELIVERED,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$deliveryFee' },
          },
        },
      ];

      const result = await this.DeliveryModel.aggregate(pipeline).exec();
      const totalEarnings = result.length > 0 ? result[0].totalEarnings : 0;
      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED}: ${totalEarnings} for ${period}`);
      return totalEarnings;
    } catch (err) {
      this.logger.error(`Error calculating earnings for partner ${partnerId} (${period})`, err);
      throw new MongooseError(err.message);
    }
  }

  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number = 1, limit: number = 10): Promise<PaginatedDeliveries> {
    this.logger.log(`Fetching paginated deliveries for partner: ${partnerId}, page: ${page}, limit: ${limit}`);
    try {
      const skip = (page - 1) * limit;
      const partnerObjectId = new Types.ObjectId(partnerId);

      const deliveries = await this.DeliveryModel.find({ partnerId: partnerObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.DeliveryModel.countDocuments({ partnerId: partnerObjectId }).exec();

      this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_FETCHED}: ${deliveries.length} deliveries for partner: ${partnerId}`);
      return {
        data: deliveries,
        total,
        page,
        limit,
      };
    } catch (err) {
      this.logger.error(`Error fetching paginated deliveries for partner ${partnerId}`, err);
      throw new MongooseError(err.message);
    }
  }

  async updateDeliveryStatus(orderId: Types.ObjectId, status: string) {
    this.logger.log(`Updating delivery status for order: ${orderId} to ${status}`);
    try {
      const delivery = await this.DeliveryModel.findOneAndUpdate(
        { orderId: orderId },
        { status: status },
        { new: true }
      );
      if (!delivery) {
        this.logger.log(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId ${orderId}`);
        throw new NotFoundException(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId: ${orderId}`);
      }
      this.logger.log(`Delivery status updated to ${status} for order: ${orderId}`);
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      this.logger.error(`Error updating delivery status for order: ${orderId}`, err);
      throw new MongooseError(err.message);
    }
  }
}