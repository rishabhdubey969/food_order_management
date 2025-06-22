import { Controller, Get, Query, UseGuards, Request, Param, HttpException, HttpStatus } from '@nestjs/common';
import { OrderService } from './order.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GetOrdersSwagger, GetTotalOrdersSwagger, GetUserOrdersSwagger } from '../swagger/order.swagger';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AdminGuard)
  @Get('total')
  @GetTotalOrdersSwagger()
  async getTotalOrders(
    @Query('period') period: 'month' | 'year' | 'week',
    @Query('status') status: string,
    @Query('paymentStatus') paymentStatus: string,
    @Request() req,
  ) {
    if (!period || !['month', 'year', 'week'].includes(period)) {
      throw new Error('Valid period (month, year, week) is required');
    }
    const adminId = req.user.sub;
    return this.orderService.getTotalOrders(adminId, period, status, paymentStatus);
  }

  @UseGuards(AdminGuard)
  @Get('user/:userId')
  @GetUserOrdersSwagger()
  async getUserOrders(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
    @Param('userId') userId: string,
  ) {
    const adminId = req.user.sub;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.orderService.getUserOrders(adminId, userId, pageNum, limitNum);
  }
  @Get('orders')
  @GetOrdersSwagger()
  async getOrders(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
   
    return this.orderService.getOrders(req.orderId, {
      startDate,
      endDate,
      status,
      paymentStatus,
      search,
      sortBy,
      sortOrder,
      page,
      limit,
    });
  }

}