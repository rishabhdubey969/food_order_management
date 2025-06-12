import { Controller, Get, Query, UseGuards, Request, Param } from '@nestjs/common';
import { OrderService } from './order.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AdminGuard)
  @Get('total')
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
  async getUserOrders(
   
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Request() req,
    @Param('userId') userId: string, 
  ) {
    // console.log(userId);
    // if (!userId) {
    //   throw new Error('userId is required');
    // }
    const adminId = req.user.sub;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    return this.orderService.getUserOrders(adminId, userId, pageNum, limitNum);
  }
}