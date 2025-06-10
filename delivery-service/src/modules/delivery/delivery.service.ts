import { Message } from './../../../node_modules/@nestjs/microservices/external/kafka.interface.d';

import { PaymentMethod, DeliveryStatus } from './enums/deliveryEnums';
import { BadRequestException, Injectable } from '@nestjs/common';
import { DeliveryDocument } from './modles/deliveryModel';
import { Connection, Model, MongooseError } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { CompleteDelivery, DriverLocationResult, PaginatedDeliveries } from './interfaces/deliveryInterfaces';
import { RedisService } from '../redis/redisService';
import { TrackingGateway } from '../tracking/tracking.gateway';

@Injectable()
export class DeliveryService {

    constructor(
        private readonly trackingGateway: TrackingGateway,
        private readonly redisService: RedisService,
        private readonly DeliveryModel: Model<DeliveryDocument>,
        @InjectConnection() private readonly connection: Connection
    ){};

    async createDelivery(orderId: Types.ObjectId){

        let currentOrder;
        try{
            currentOrder = await this.connection.collection('orders').findOne(
                { _id: new Types.ObjectId(orderId) }
            )
        }catch(err){
            throw new MongooseError("Fetching Error!1")
        }

        if(!currentOrder){
            throw new BadRequestException("Invalid Order Id!!")
        }
        
        const currentDelivery: CompleteDelivery = {
            orderId: orderId,
            restaurantId: currentOrder.restaurantId,
            userId: currentOrder.userId,
            pickupLocation: {
                address: currentOrder.restaurantAddress.address,
                mobileNumber: currentOrder.restaurantAddress.contactNumber,
                coordinates: [parseFloat(currentOrder.restaurantAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)]
            },
            deliveryLocation: {
                address: currentOrder.deliveryAddress.address,
                mobileNumber: currentOrder.deliveryAddress.contactNumber,
                coordinates: [parseFloat(currentOrder.deliveryAddress.longitude), parseFloat(currentOrder.restaurantAddress.latitude)]
            },
            totalOrderAmount: currentOrder.total,
            deliveryFee: currentOrder.deliveryFee,
            paymentMethod: currentOrder.PaymentMethod == 'cashOnDelivery' ? PaymentMethod.CASH_ON_DELIVERY : PaymentMethod.PAID
        }

        const deliveryData = await this.DeliveryModel.create(currentDelivery);

        await this.assignDeliveryPartner(currentDelivery);
    }

    async assignDeliveryPartner(currentDelivery: CompleteDelivery){

        const { coordinates } = currentDelivery.pickupLocation;
        const deliveryPartnersList: DriverLocationResult = await this.redisService.findNearestDriver(coordinates[0], coordinates[1], 5, 10);

        await this.trackingGateway.broadcastRequest(deliveryPartnersList, currentDelivery);
    }


    async assignedPartner(partnerId: string, orderId: string){
        try{
            await this.DeliveryModel.findOneAndUpdate(
                {  orderId: orderId },
                {   partnerId: partnerId, status: DeliveryStatus.ASSIGNED },
                {   new: true }).exec();
        }catch(err){
            throw new MongooseError("Updating Partner Error")
        }
    }


    async checkAssignedPartner(partnerId: string){
        try{
            return await this.DeliveryModel.findById(partnerId).exec();
        }catch(err){
            throw new MongooseError('Error While Fetching Delivery assigned to Particular partner');
        }
    }

    async getEarningsByPeriod(partnerId: string, period: string): Promise<number> {
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

            if (result.length > 0) {
                return result[0].totalEarnings;
            } else {
                return 0;
            }
        } catch (err: any) {
            console.error(`Error calculating earnings for partner ${partnerId} (${period}):`, err);
            throw new MongooseError(err.message);
        }
    }


    async getPartnerDeliveries(
    partnerId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedDeliveries> {
    try {
      const skip = (page - 1) * limit;

      const partnerObjectId = new Types.ObjectId(partnerId);

      const deliveries = await this.DeliveryModel
        .find({ partnerId: partnerObjectId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      const total = await this.DeliveryModel.countDocuments({ partnerId: partnerObjectId }).exec();

      return {
        data: deliveries,
        total,
        page,
        limit,
      };
    } catch (err: any) {
      console.error(`Error fetching paginated deliveries for partner ${partnerId}:`, err);
      throw new MongooseError(err.message);
    }
  }


  async updateDeliveryStatus(orderId: Types.ObjectId, status: DeliveryStatus){
    try{
        await this.DeliveryModel.findOneAndUpdate({orderId: orderId}, {status: status}, {new: true}).exec();
    }catch(err){
        throw new MongooseError(err.Message);
    }
  }
}
