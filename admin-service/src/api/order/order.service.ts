import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
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
        23,
        59,
        59,
        999,
      );

      switch (period) {
        case 'month':
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
            0,
            0,
            0,
            0,
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

      this.logger.log(`Query: ${JSON.stringify(query)}`); // Log the query for debugging

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
  async getOrders(
    adminId: string,
    filters: {
      startDate?: string;
      endDate?: string;
      status?: string;
      paymentStatus?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    const logger = { log: console.log, error: console.error }; // Replace with actual logger
    logger.log(`Admin ${adminId} fetching orders with filters: ${JSON.stringify(filters)}`);
    try {
      const {
        startDate,
        endDate,
        status,
        paymentStatus,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = filters;

      const query: any = {};

      // Date range filter
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
        if (endDate) query.createdAt.$lte = new Date(`${endDate}T00:00:00.000Z`);
      }

      // status filter
      if (status) {
        query.status = status;
      }

      // paymentStatus filter
      if (paymentStatus) {
        query.paymentStatus = paymentStatus;
      }

      // Search filter (userId, restaurantId, or paymentMethod)
      if (search) {
        query.$or = [
          { userId: { $regex: search, $options: 'i' } },
          { restaurantId: { $regex: search, $options: 'i' } },
          { paymentMethod: { $regex: search, $options: 'i' } },
        ];
      }

      // Define allowable sort fields
      const sortableFields = ['createdAt', 'updatedAt', 'subtotal', 'tax', 'total', 'timestamp', 'status'];
      if (!sortableFields.includes(sortBy)) {
        throw new HttpException(`Invalid sortBy field. Allowed fields are: ${sortableFields.join(', ')}`, HttpStatus.BAD_REQUEST);
      }

      // Sorting
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const skip = (page - 1) * limit;

      const [orders, totalOrders] = await Promise.all([
        this.connection
          .collection('orders')
          .find(query, { projection: { password: 0, paymentId: 0, cartId: 0 } }) // Exclude sensitive or redundant fields
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        this.connection.collection('orders').countDocuments(query),
      ]);

      const totalPages = Math.ceil(totalOrders / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      logger.log(`Admin ${adminId} fetched ${orders.length} orders (page ${page})`);
      return {
        orders,
        totalOrders,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        filters: { startDate, endDate, status, paymentStatus, search, sortBy, sortOrder },
      };
    } catch (error) {
      logger.error(`Admin ${adminId} failed to fetch orders: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Failed to fetch orders',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
