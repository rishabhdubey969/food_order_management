// import { PaymentMethod, DeliveryStatus } from './enums/deliveryEnums';
// import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
// import { Delivery, DeliveryDocument } from './modles/deliveryModel';
// import { Connection, Model, MongooseError } from 'mongoose';
// import { InjectConnection, InjectModel } from '@nestjs/mongoose';
// import { Types } from 'mongoose';
// import { CompleteDelivery, DriverLocationResult, PaginatedDeliveries } from './interfaces/deliveryInterfaces';
// import { RedisService } from '../redis/redisService';
// import { TrackingGateway } from '../tracking/tracking.gateway';


// @Injectable()
// export class DeliveryService {

//     constructor(

//         @Inject(forwardRef(() => TrackingGateway))
//         private readonly trackingGateway: TrackingGateway,
//         private readonly redisService: RedisService,
//         @InjectModel(Delivery.name)
//         private readonly DeliveryModel: Model<DeliveryDocument>,
//         @InjectConnection() 
//         private readonly connection: Connection
//     ){};

//     async createDelivery(orderId: Types.ObjectId){

//         let currentOrder;
//         try{
//             currentOrder = await this.connection.collection('orders').findOne(
//                 { _id: new Types.ObjectId(orderId) }
//             )
//         }catch(err){
//             throw new MongooseError("Fetching Error!1")
//         }

//         if(!currentOrder){
//             throw new BadRequestException("Invalid Order Id!!")
//         }
        
//         const currentDelivery: CompleteDelivery = {
//             orderId: orderId,
//             restaurantId: currentOrder.restaurantId,
//             userId: currentOrder.userId,
//             pickupLocation: {
//                 address: currentOrder.restaurantAddress.address,
//                 mobileNumber: currentOrder.restaurantAddress.contactNumber,
//                 coordinates: [parseFloat(currentOrder.restaurantAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)]
//             },
//             deliveryLocation: {
//                 address: currentOrder.deliveryAddress.address,
//                 mobileNumber: currentOrder.deliveryAddress.contactNumber,
//                 coordinates: [parseFloat(currentOrder.deliveryAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)]
//             },
//             totalOrderAmount: currentOrder.total,
//             deliveryFee: currentOrder.deliveryFee,
//             paymentMethod: currentOrder.PaymentMethod == 'cashOnDelivery' ? PaymentMethod.CASH_ON_DELIVERY : PaymentMethod.PAID
//         }

//         const deliveryData = await this.DeliveryModel.create(currentDelivery);

//         await this.assignDeliveryPartner(currentDelivery);
//     }

//     async assignDeliveryPartner(currentDelivery: CompleteDelivery){

//         const { coordinates } = currentDelivery.pickupLocation;
//         const deliveryPartnersList: DriverLocationResult = await this.redisService.findNearestDriver(coordinates[0], coordinates[1], 5, 10);

//         await this.trackingGateway.broadcastRequest(deliveryPartnersList, currentDelivery);
//     }


//     async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId){
//         try{
//             await this.DeliveryModel.findOneAndUpdate(
//                 {  orderId: orderId },
//                 {   partnerId: partnerId, status: DeliveryStatus.ASSIGNED },
//                 {   new: true }).exec();
//         }catch(err){
//             throw new MongooseError("Updating Partner Error")
//         }
//     }


//     async checkAssignedPartner(partnerId: Types.ObjectId){
//         try{
//             return await this.DeliveryModel.findById(partnerId).exec();
//         }catch(err){
//             throw new MongooseError('Error While Fetching Delivery assigned to Particular partner');
//         }
//     }

//     async getEarningsByPeriod(partnerId: Types.ObjectId, period: string): Promise<number> {
//         try {
//             const now = new Date();
//             let startDate: Date;
//             let endDate: Date = now;

//             switch (period) {
//                 case 'daily':
//                     startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//                     break;
//                 case 'weekly':
//                     startDate = new Date(now.setDate(now.getDate() - 7));
//                     break;
//                 case 'monthly':
//                     startDate = new Date(now.getFullYear(), now.getMonth(), 1);
//                     break;
//                 case 'lifetime':
//                     startDate = new Date(0);
//                     break;
//                 default:
//                     throw new Error(`Invalid period specified: ${period}. Must be 'daily', 'weekly', 'monthly', or 'lifetime'.`);
//             }

//             const pipeline: any[] = [
//                 {
//                     $match: {
//                         partnerId: new Types.ObjectId(partnerId),
//                         status: DeliveryStatus.DELIVERED,
//                         createdAt: { $gte: startDate, $lte: endDate },
//                     },
//                 },
//                 {
//                     $group: {
//                         _id: null,
//                         totalEarnings: { $sum: '$deliveryFee' },
//                     },
//                 },
//             ];

//             const result = await this.DeliveryModel.aggregate(pipeline).exec();

//             if (result.length > 0) {
//                 return result[0].totalEarnings;
//             } else {
//                 return 0;
//             }
//         } catch (err: any) {
//             console.error(`Error calculating earnings for partner ${partnerId} (${period}):`, err);
//             throw new MongooseError(err.message);
//         }
//     }


//     async getPartnerDeliveries(
//     partnerId: Types.ObjectId,
//     page: number = 1,
//     limit: number = 10,
//   ): Promise<PaginatedDeliveries> {
//     try {
//       const skip = (page - 1) * limit;

//       const partnerObjectId = new Types.ObjectId(partnerId);

//       const deliveries = await this.DeliveryModel
//         .find({ partnerId: partnerObjectId })
//         .sort({ createdAt: -1 })
//         .skip(skip)
//         .limit(limit)
//         .lean()
//         .exec();

//       const total = await this.DeliveryModel.countDocuments({ partnerId: partnerObjectId }).exec();

//       return {
//         data: deliveries,
//         total,
//         page,
//         limit,
//       };
//     } catch (err: any) {
//       console.error(`Error fetching paginated deliveries for partner ${partnerId}:`, err);
//       throw new MongooseError(err.message);
//     }
//   }


//   async updateDeliveryStatus(orderId: Types.ObjectId, status: DeliveryStatus){
//     try{
//         await this.DeliveryModel.findOneAndUpdate({orderId: orderId}, {status: status}, {new: true}).exec();
//     }catch(err){
//         throw new MongooseError(err.Message);
//     }
//   }
// }


import { PaymentMethod, DeliveryStatus } from './enums/deliveryEnums';
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { Delivery, DeliveryDocument } from './modles/deliveryModel';
import { Connection, Model, MongooseError } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CompleteDelivery, DriverLocationResult, PaginatedDeliveries } from './interfaces/deliveryInterfaces';
import { RedisService } from '../redis/redisService';
import { TrackingGateway } from '../tracking/tracking.gateway';
import { Logger } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @Inject(forwardRef(() => TrackingGateway))
    private readonly trackingGateway: TrackingGateway,
    private readonly redisService: RedisService,
    @InjectModel(Delivery.name)
    private readonly DeliveryModel: Model<DeliveryDocument>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}


  async createDelivery(orderId: Types.ObjectId) {
    this.logger.log(`Creating delivery for order: ${orderId}`);
    try {
      const currentOrder = await this.connection.collection('orders').findOne({ _id: new Types.ObjectId(orderId) });
      if (!currentOrder) {
        this.logger.warn(`Delivery creation failed: Invalid order ID - ${orderId}`);
        throw new BadRequestException('Invalid Order Id!!');
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
          coordinates: [parseFloat(currentOrder.deliveryAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)],
        },
        totalOrderAmount: currentOrder.total,
        deliveryFee: currentOrder.deliveryFee,
        paymentMethod: currentOrder.PaymentMethod === 'cashOnDelivery' ? PaymentMethod.CASH_ON_DELIVERY : PaymentMethod.PAID,
      };

      await this.DeliveryModel.create(currentDelivery);
      await this.assignDeliveryPartner(currentDelivery);
      this.logger.log(`Delivery created successfully for order: ${orderId}`);
    } catch (err) {
      this.logger.error(`Error creating delivery for order: ${orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }

  async assignDeliveryPartner(currentDelivery: CompleteDelivery) {
    this.logger.log(`Assigning delivery partner for order: ${currentDelivery.orderId}`);
    try {
      const { coordinates } = currentDelivery.pickupLocation;
      const deliveryPartnersList: DriverLocationResult = await this.redisService.findNearestDriver(coordinates[0], coordinates[1], 5, 10);
      await this.trackingGateway.broadcastRequest(deliveryPartnersList, currentDelivery);
      this.logger.log(`Delivery partner assigned successfully for order: ${currentDelivery.orderId}`);
    } catch (err) {
      this.logger.error(`Error assigning delivery partner for order: ${currentDelivery.orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }


  async assignedPartner(partnerId: Types.ObjectId, orderId: Types.ObjectId) {
    this.logger.log(`Assigning partner ${partnerId} to order: ${orderId}`);
    try {
      await this.DeliveryModel.findOneAndUpdate(
        { orderId: orderId },
        { partnerId: partnerId, status: DeliveryStatus.ASSIGNED },
        { new: true }
      );
      this.logger.log(`Partner ${partnerId} assigned successfully to order: ${orderId}`);
    } catch (err) {
      this.logger.error(`Error assigning partner ${partnerId} to order: ${orderId}`, err);
      throw new MongooseError('Updating Partner Error');
    }
  }

 
  async checkAssignedPartner(partnerId: Types.ObjectId) {
    this.logger.log(`Checking assigned delivery for partner: ${partnerId}`);
    try {
      const delivery = await this.DeliveryModel.findById(partnerId);
      this.logger.log(`Fetched delivery for partner: ${partnerId}`);
      return delivery;
    } catch (err) {
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
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lifetime':
          startDate = new Date(0);
          break;
        default:
          this.logger.warn(`Invalid period specified for partner ${partnerId}: ${period}`);
          throw new Error(`Invalid period specified: ${period}. Must be 'daily', 'weekly', 'monthly', or 'lifetime'.`);
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
      this.logger.log(`Earnings calculated for partner ${partnerId}: ${totalEarnings} for ${period}`);
      return totalEarnings;
    } catch (err) {
      this.logger.error(`Error calculating earnings for partner ${partnerId} (${period})`, err);
      throw new MongooseError(err.Message);
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

      this.logger.log(`Fetched ${deliveries.length} deliveries for partner: ${partnerId}`);
      return {
        data: deliveries,
        total,
        page,
        limit,
      };
    } catch (err) {
      this.logger.error(`Error fetching paginated deliveries for partner ${partnerId}`, err);
      throw new MongooseError(err.Message);
    }
  }


  async updateDeliveryStatus(orderId: Types.ObjectId, status: DeliveryStatus) {
    this.logger.log(`Updating delivery status for order: ${orderId} to ${status}`);
    try {
      await this.DeliveryModel.findOneAndUpdate({ orderId: orderId }, { status: status }, { new: true });
      this.logger.log(`Delivery status updated to ${status} for order: ${orderId}`);
    } catch (err) {
      this.logger.error(`Error updating delivery status for order: ${orderId}`, err);
      throw new MongooseError(err.Message);
    }
  }
}