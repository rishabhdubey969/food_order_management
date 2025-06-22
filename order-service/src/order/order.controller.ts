import { Body, Controller, Get, Param, Post, Query, UseGuards, Res, BadRequestException, Inject, InternalServerErrorException, Req, HttpException } from '@nestjs/common';
import { OrderService } from './order.service';
import { jwtGuard } from 'src/guards/jwt-guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrePlaceOrderDto } from 'src/dto/prePlaceOrder.dto';
import { PlaceOrderDto } from 'src/dto/placeOrder.dto';
import { OrderDto } from 'src/dto/order.dto';
import { Response } from 'express'
import { ERROR } from './constant/message.constant';



@ApiTags('Order')
@Controller('order')
export class OrderController {

  constructor(private readonly orderService: OrderService,
  ) { }


  @Get('/status')
  @ApiOperation({ summary: 'Get service status' })
  @ApiResponse({ status: 200, description: 'Service is running' })
  async getHello() {
    return this.orderService.getHello();
  }


  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Post('/prePlaceOrder')
  @ApiOperation({ summary: 'Prepare order from cart' })
  @ApiBody({ type: PrePlaceOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order prepared successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async prePlaceOrder(@Body()data :PrePlaceOrderDto) {
    return await this.orderService.createOrder(data.cartId,data.addressId);
  }



  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Post('/placeOrder')
  @ApiOperation({ summary: 'Finalize order placement with payment method' })
  @ApiBody({ type: PlaceOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order placed successfully',
    type: OrderDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 402, description: 'Payment Failed' })
  async placeOrder(@Body() data: PlaceOrderDto, @Req() request: any) {
    return await this.orderService.placeOrder(data, request.user.payload);
  }


  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Get('/cancelOrder/:orderId')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'orderId', description: 'ID of the order to cancel' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully',
    type: OrderDto
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @Get('/cancelOrder/:orderId')
  async cancelOrder(@Param('orderId') orderId: string) {
    return await this.orderService.cancelOrder(orderId);
  }

   
  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Get('orderById/:orderId')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiParam({ name: 'orderId', description: 'ID of the order to retrieve' })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('orderId') orderId: any) {
    return await this.orderService.getOrder(orderId);
  }


  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Get('/userAllOrder')
  @ApiOperation({
    summary: 'Get all orders for the authenticated user',
    description: 'Retrieves a list of all orders belonging to the currently authenticated user.'
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
    type: Number
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user orders'
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT'
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error'
  })
  async getAllOrder(@Query() data: Record<string, any>, @Req() request: any) {
    const userId = request.user.payload.sub;
    return await this.orderService.getAllOrder(userId, data);
  }


  @Get('/getManagerId/:restId')
  async getManagerId(@Param('restId') restId:string,@Req() request:any){
    return await this.orderService.getManagerId(restId);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(jwtGuard)
  @Get('/generateInvoice/:orderId')
  @ApiOperation({ summary: 'Generate invoice for an order' })
  @ApiParam({ name: 'orderId', description: 'ID of the order' })
  @ApiResponse({
    status: 200,
    description: 'Invoice generated successfully',
    type: String
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async generateInvoice(@Param('orderId') orderId: string, @Res() res: Response,@Req() request:any) {
    try {
      const pdfBuffer = await this.orderService.generateInvoice(orderId, { debug: true },request.user.payload);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=invoice_${orderId}.pdf`,
        'Content-Length': pdfBuffer.length,
      });

      return res.send(pdfBuffer);
    } catch (err) {
      throw new InternalServerErrorException(ERROR.FAILED_DOWNLOAD);
    }
  }

}