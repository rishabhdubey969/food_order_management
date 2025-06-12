import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

import { AuthService } from '../auth/auth.service';
import { console } from 'inspector';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly authService: AuthService,
  ) {}

  async getTotalOrders(
    adminId: string,
    period: 'month' | 'year' | 'week',
    status?: string,
    paymentStatus?: string,
  ) {
    this.logger.log(`Admin ${adminId} fetching total orders for ${period}`);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;
    
      endDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23, 59,59, 999,
      );

      switch (period) {
        case 'month':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,0,0,0,0,
          );
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
          break;
        case 'week':
          const dayOfWeek = now.getDay();
          startDate = new Date(now);
          
          const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek + 6; 
          startDate.setDate(now.getDate() - daysToSubtract);
          startDate.setHours(0, 0, 0, 0);
          break;
        default:
          throw new HttpException('Invalid period', HttpStatus.BAD_REQUEST);
      }

      const query: any = {
        createdAt: { $gte: startDate, $lte: endDate },
      };

      if (status) {
        query.status = status;
      }

      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      this.logger.log(`Query: ${JSON.stringify(query)}`); 

   
      const totalOrders = await this.connection
        .collection('orders')
        .countDocuments(query);
      const totalAmountResultCursor = await this.connection
        .collection('orders')
        .aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]);
      const totalAmountResult = await totalAmountResultCursor.toArray();
      const totalAmount =
        totalAmountResult.length > 0 ? totalAmountResult[0].total : 0;

    
      const paymentMethodBreakdownCursor = await this.connection
        .collection('orders')
        .aggregate([
          { $match: query },
          {
            $group: {
              _id: '$paymentMethod',
              count: { $sum: 1 },
              totalAmount: { $sum: '$total' },
            },
          },
        ]);
      const paymentMethodBreakdownRaw =
        await paymentMethodBreakdownCursor.toArray();
      const paymentMethodBreakdown = paymentMethodBreakdownRaw.map((item) => ({
        paymentMethod: item._id || 'unknown', 
        count: item.count,
        totalAmount: item.totalAmount,
      }));

 
      const avgOrderValue = totalOrders > 0 ? totalAmount / totalOrders : 0;

      this.logger.log(
        `Admin ${adminId} fetched ${totalOrders} orders for ${period}`,
      );
      return {
        period,
        totalOrders,
        totalAmount,
        avgOrderValue,
        paymentMethodBreakdown,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        filters: { status, paymentStatus },
      };
    } catch (error) {
      this.logger.error(
        `Admin ${adminId} failed to fetch total orders for ${period}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || `Failed to fetch total orders for ${period}`,
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async getUserOrders(
    adminId: string,
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    this.logger.log(`Admin ${adminId} fetching orders for user ${userId}`);
    try {
      const userData = await this.connection
        .collection('orders')
        .find({ userId: new ObjectId(userId) });
      console.log(userData);
      const skip = (page - 1) * limit;
      const query = { userId };
      console.log(userId);
      const orders = await this.connection
        .collection('orders')
        .find({ userId: userId })
        .project({
          restaurantId: 1,
          items: 1,
          subtotal: 1,
          tax: 1,
          deliveryFee: 1,
          platformFee: 1,
          discount: 1,
          total: 1,
          status: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          deliveryAddress: 1,
          createdAt: 1,
          updatedAt: 1,
          _id: 1,
        })
        .skip(skip)
        .limit(limit)
        .toArray(); 

      const transformedOrders = orders.map((order) => ({
        _id: order._id.toString(),
        restaurantId: order.restaurantId,
        items: order.items,
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.deliveryFee,
        platformFee: order.platformFee,
        discount: order.discount,
        total: order.total,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        deliveryAddress: order.deliveryAddress,
        createdAt: order.createdAt.toISOString(), 
        updatedAt: order.updatedAt.toISOString(), 
      }));
     
      const total = await this.connection
        .collection('orders')
        .countDocuments(query);
      console.log(total);
      this.logger.log(
        `Admin ${adminId} fetched ${orders.length} orders for user ${userId}`,
      );
      return {
        data: transformedOrders, 
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(
        `Admin ${adminId} failed to fetch orders for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Failed to fetch user orders',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
