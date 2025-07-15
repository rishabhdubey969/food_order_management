
import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Delivery, DeliveryDocument } from './modles/deliveryModel';
import { Connection, Model, MongooseError } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CompleteDelivery, DriverLocationResult, PaginatedDeliveries } from './interfaces/deliveryInterfaces';
import { RedisService } from '../redis/redisService';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { KafkaService } from '../kafka/kafka.service';
import { DELIVERY_CONSTANTS } from './deliveryConstants';
import { DeliveryStatus, PaymentMethod } from './enums/deliveryEnums';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(forwardRef(() => TrackingGateway))
    private readonly trackingGateway: TrackingGateway,
    private readonly kafkaService: KafkaService,
    private readonly redisService: RedisService,
    @InjectModel(Delivery.name)
    private readonly DeliveryModel: Model<DeliveryDocument>,
    @InjectConnection()
    private readonly connection: Connection,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async createDelivery(orderId: Types.ObjectId) {
    /**
     * Creates a new delivery record for a given order and assigns a delivery partner.
     *
     * Args:
     *   orderId (Types.ObjectId): The unique identifier of the order.
     *
     * Returns:
     *   Promise<{ success: boolean, message: string, orderId: string }>: A success response with the order ID and confirmation message.
     *
     * Throws:
     *   BadRequestException: If the order is invalid or missing coordinates.
     *   MongooseError: If a database error occurs during delivery creation.
     */
    this.logger.info('Creating delivery', {
      service: 'DeliveryService',
      method: 'createDelivery',
      orderId: orderId.toString(),
    });

    try {
      const currentOrder = await this.connection.collection('orders').findOne({ _id: new Types.ObjectId(orderId) });
      
      if (!currentOrder) {
        this.logger.warn('Order not found', { orderId: orderId.toString() });
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

        this.logger.warn('Missing coordinates in order', { orderId: orderId.toString() });

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
        partnerId: '',
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
      this.logger.info('Delivery created successfully', {
        orderId: orderId.toString(),
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED_SUCCESS,
      });
      
      await this.assignDeliveryPartner(currentDelivery);
      return {
        success: true,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERY_CREATED_SUCCESS,
        orderId: orderId.toString()
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error
      }
      this.logger.error('Failed to create delivery', {
        error: error.message,
        stack: error.stack,
        orderId: orderId.toString(),
      });
      throw new MongooseError(error.message);
    }
  }

  async assignDeliveryPartner(currentDelivery: CompleteDelivery) {
    /**
     * Assigns a delivery partner to a delivery by finding the nearest available drivers.
     *
     * Args:
     *   currentDelivery (CompleteDelivery): The delivery object containing order and location details.
     *
     * Returns:
     *   Promise<void>: No return value; broadcasts a request to assign a delivery partner.
     *
     * Throws:
     *   NotFoundException: If no delivery partners are available.
     *   MongooseError: If a database or processing error occurs.
     */
    this.logger.info('Assigning delivery partner', {
      service: 'DeliveryService',
      method: 'assignDeliveryPartner',
      orderId: currentDelivery.orderId.toString(),
    });

    try {
      const { coordinates } = currentDelivery.pickupLocation;
      const deliveryPartnersList: DriverLocationResult = await this.redisService.findNearestDriver(
        coordinates[0],
        coordinates[1],
        DELIVERY_CONSTANTS.REDIS.NEAREST_DRIVER_RADIUS,
        DELIVERY_CONSTANTS.REDIS.NEAREST_DRIVER_LIMIT
      );

      if (!deliveryPartnersList?.length || deliveryPartnersList.every(partner => partner === null)) {
        this.logger.warn('No delivery partners available', {
          orderId: currentDelivery.orderId.toString(),
          coordinates: coordinates
        });
        await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE, { 
          message: DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_DELIVERY_PARTNERS,
          success: false,
          orderId: currentDelivery.orderId
        });
        throw new NotFoundException(DELIVERY_CONSTANTS.MESSAGES.ERROR.NO_DELIVERY_PARTNERS);
      }

      await this.trackingGateway.broadcastRequest(deliveryPartnersList, currentDelivery);
      this.logger.info('Delivery partner assigned successfully', {
        orderId: currentDelivery.orderId.toString(),
        partnersFound: deliveryPartnersList.length,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to assign delivery partner', {
        error: error.message,
        stack: error.stack,
        orderId: currentDelivery.orderId.toString(),
      });
      throw new MongooseError(error.message);
    }
  }

  async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId) {
    /**
     * Confirms the assignment of a delivery partner to a specific order.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   orderId (Types.ObjectId): The unique identifier of the order.
     *
     * Returns:
     *   Promise<DeliveryDocument>: The updated delivery document with the assigned partner.
     *
     * Throws:
     *   NotFoundException: If the delivery is not found.
     *   MongooseError: If a database error occurs during the update.
     */
    this.logger.info('Confirming partner assignment', {
      service: 'DeliveryService',
      method: 'assignedPartner',
      partnerId: partnerId.toString(),
      orderId: orderId.toString(),
    });

    try {
      const delivery = await this.DeliveryModel.findOneAndUpdate(
        { orderId: orderId },
        { partnerId: partnerId, status: DeliveryStatus.ASSIGNED },
        { new: true }
      );

      if (!delivery) {
        this.logger.warn('Delivery not found for assignment', {
          orderId: orderId.toString(),
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId: ${orderId}`);
      }

      await this.kafkaService.handleEvent(DELIVERY_CONSTANTS.EVENTS.DELIVERY_PARTNER_RESPONSE,
        {
          success: true,
          orderId: orderId,
          partnerId: partnerId, 
          message: `${DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED_SUCCESS} ${orderId}`
        });

      this.logger.info('Partner assignment confirmed', {
        orderId: orderId.toString(),
        partnerId: partnerId.toString(),
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.PARTNER_ASSIGNED_SUCCESS
      });

      return delivery;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to confirm partner assignment', {
        error: error.message,
        stack: error.stack,
        orderId: orderId.toString(),
        partnerId: partnerId.toString()
      });
      throw new MongooseError('Updating Partner Error');
    }
  }

  async checkAssignedPartner(partnerId: Types.ObjectId) {
    /**
     * Checks if a delivery partner has any assigned deliveries.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *
     * Returns:
     *   Promise<DeliveryDocument>: The delivery document assigned to the partner.
     *
     * Throws:
     *   NotFoundException: If no deliveries are found for the partner.
     *   MongooseError: If a database error occurs during the query.
     */
    this.logger.info('Checking assigned deliveries', {
      service: 'DeliveryService',
      method: 'checkAssignedPartner',
      partnerId: partnerId.toString(),
    });

    try {
      const delivery = await this.DeliveryModel.findOne({ partnerId: partnerId });
      
      if (!delivery) {
        this.logger.warn('No deliveries found for partner', {
          partnerId: partnerId.toString()
        });
        throw new NotFoundException(DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND);
      }

      this.logger.info('Deliveries fetched successfully', {
        partnerId: partnerId.toString(),
        deliveryId: delivery._id,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_FETCHED
      });

      return delivery;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to check assigned deliveries', {
        error: error.message,
        stack: error.stack,
        partnerId: partnerId.toString()
      });
      throw new MongooseError('Error While Fetching Delivery assigned to Particular partner');
    }
  }

  async getEarningsByPeriod(partnerId: Types.ObjectId, period: string) {
    /**
     * Calculates the total earnings for a delivery partner over a specified period.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   period (string): The time period for earnings calculation ('daily', 'weekly', 'monthly', or 'yearly').
     *
     * Returns:
     *   Promise<number>: The total earnings for the specified period.
     *
     * Throws:
     *   Error: If an invalid period is specified.
     *   MongooseError: If a database error occurs during the aggregation.
     */
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (period) {
        case DELIVERY_CONSTANTS.PERIODS.DAILY:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case DELIVERY_CONSTANTS.PERIODS.WEEKLY:
          startDate = new Date(now);
          startDate.setDate(startDate.getDate() - 7);
          break;
        case DELIVERY_CONSTANTS.PERIODS.MONTHLY:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case DELIVERY_CONSTANTS.PERIODS.YEARLY:
          startDate = new Date(now.getFullYear(), 0, 1); 
          break;
        default:
          this.logger.warn('Invalid period specified', {
            partnerId: partnerId.toString(),
            period: period
          });
          throw new Error(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.INVALID_PERIOD}: ${period}. Must be '${DELIVERY_CONSTANTS.PERIODS.DAILY}', '${DELIVERY_CONSTANTS.PERIODS.WEEKLY}', '${DELIVERY_CONSTANTS.PERIODS.MONTHLY}', or '${DELIVERY_CONSTANTS.PERIODS.YEARLY}'.`);
      }

      const pipeline: any[] = [
        {
          $match: {
            partnerId: partnerId.toString(),
            // status: DeliveryStatus.DELIVERED,
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: '$deliveryFee' },
            deliveryCount:  { $sum: 1}
          },
        },
      ];

      const result = await this.DeliveryModel.aggregate(pipeline).exec();
      const earningsResult = {
      totalEarnings: result.length > 0 ? result[0].totalEarnings : 0,
      deliveryCount: result.length > 0 ? result[0].deliveryCount : 0,
    };

      this.logger.info('Earnings calculated successfully', {
        partnerId: partnerId.toString(),
        period: period,
        totalEarnings: earningsResult.totalEarnings,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.EARNINGS_CALCULATED
      });
      return earningsResult;
    } catch (error) {
      this.logger.error('Failed to calculate earnings', {
        error: error.message,
        stack: error.stack,
        partnerId: partnerId.toString(),
        period: period
      });
      throw new MongooseError(error.message);
    }
  }

  async getPartnerDeliveries(partnerId: Types.ObjectId, page: number = 1, limit: number = 10): Promise<PaginatedDeliveries> {
    /**
     * Retrieves a paginated list of deliveries for a specific delivery partner.
     *
     * Args:
     *   partnerId (Types.ObjectId): The unique identifier of the delivery partner.
     *   page (number, optional): The page number for pagination (default: 1).
     *   limit (number, optional): The number of deliveries per page (default: 10).
     *
     * Returns:
     *   Promise<PaginatedDeliveries>: A paginated response containing delivery data, total count, page, and limit.
     *
     * Throws:
     *   MongooseError: If a database error occurs during the query.
     */
    this.logger.info('Fetching partner deliveries', {
      service: 'DeliveryService',
      method: 'getPartnerDeliveries',
      partnerId: partnerId.toString(),
      page: page,
      limit: limit
    });

    try {
      const skip = (page - 1) * limit;
      // const partnerObjectId = new Types.ObjectId(partnerId);

      const deliveries = await this.DeliveryModel.find({ partnerId: partnerId.toString() }, {_id: 0, })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.DeliveryModel.countDocuments({ partnerId: partnerId.toString() }).exec();

      this.logger.info('Deliveries fetched successfully', {
        partnerId: partnerId.toString(),
        count: deliveries.length,
        total: total,
        page: page,
        message: DELIVERY_CONSTANTS.MESSAGES.SUCCESS.DELIVERIES_FETCHED
      });

      return {
        data: deliveries,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Failed to fetch partner deliveries', {
        error: error.message,
        stack: error.stack,
        partnerId: partnerId.toString(),
        page: page,
        limit: limit
      });
      throw new MongooseError(error.message);
    }
  }

  async updateDeliveryStatus(orderId: Types.ObjectId, status: string) {
    /**
     * Updates the status of a delivery for a given order.
     *
     * Args:
     *   orderId (Types.ObjectId): The unique identifier of the order.
     *   status (string): The new delivery status to set.
     *
     * Returns:
     *   Promise<DeliveryDocument>: The updated delivery document.
     *
     * Throws:
     *   NotFoundException: If the delivery is not found.
     *   MongooseError: If a database error occurs during the update.
     */
    this.logger.info('Updating delivery status', {
      service: 'DeliveryService',
      method: 'updateDeliveryStatus',
      orderId: orderId.toString(),
      status: status
    });

    try {
      const delivery = await this.DeliveryModel.findOneAndUpdate(
        { orderId: orderId },
        { status: status },
        { new: true }
      );

      if (!delivery) {
        this.logger.warn('Delivery not found for status update', {
          orderId: orderId.toString()
        });
        throw new NotFoundException(`${DELIVERY_CONSTANTS.MESSAGES.ERROR.DELIVERY_NOT_FOUND} with orderId: ${orderId}`);
      }

      this.logger.info('Delivery status updated successfully', {
        orderId: orderId.toString(),
        status: status,
        message: `Delivery status updated to ${status}`
      });

      return delivery;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to update delivery status', {
        error: error.message,
        stack: error.stack,
        orderId: orderId.toString(),
        status: status
      });
      throw new MongooseError(error.message);
    }
  }
}