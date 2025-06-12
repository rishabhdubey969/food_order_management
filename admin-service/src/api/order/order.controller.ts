import {Controller,Get,Query,UseGuards,Request,Param,} from '@nestjs/common';
import { OrderService } from './order.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AdminGuard)
  @Get('total')
  @ApiOperation({ summary: 'Get total orders for a specified period' })
  @ApiBearerAuth('JWT') 
  @ApiQuery({
    name: 'period',
    type: String,
    required: true,
    description: 'Time period for orders (month, year, week)',
    example: 'month',
    enum: ['month', 'year', 'week'],
  })
  @ApiQuery({
    name: 'status',
    type: String,
    required: false,
    description: 'Filter orders by status',
    example: 'completed',
  })
  @ApiQuery({
    name: 'paymentStatus',
    type: String,
    required: false,
    description: 'Filter orders by payment status',
    example: 'paid',
  })
  @ApiResponse({
    status: 200,
    description: 'Total orders successfully retrieved',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing period',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token, or non-admin role',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
    return this.orderService.getTotalOrders(
      adminId,
      period,
      status,
      paymentStatus,
    );
  }

  @UseGuards(AdminGuard)
  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders for a specific user with pagination' })
  @ApiBearerAuth('JWT') 
  @ApiParam({
    name: 'userId',
    type: String,
    required: true,
    description: 'ID of the user whose orders are to be retrieved',
    example: '12345',
  })
  @ApiQuery({
    name: 'page',
    type: String,
    required: false,
    description: 'Page number for pagination',
    example: '1',
  })
  @ApiQuery({
    name: 'limit',
    type: String,
    required: false,
    description: 'Number of orders per page',
    example: '10',
  })
  @ApiResponse({
    status: 200,
    description: 'User orders successfully retrieved',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid or missing userId, page, or limit',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token, or non-admin role',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
}
