import { Body, Controller, Get, Param, Post, Query, UseGuards,Res } from '@nestjs/common';
import { OrderService } from './order.service';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {ObjectId} from 'mongodb';
import { OrderStatus, PaymentMethod, PaymentStatus } from 'src/schema/order.schema';
import { KafkaService } from 'src/kafka/kafka.service';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { jwtGuard } from 'src/guards/jwt-guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrePlaceOrderDto } from 'src/dto/prePlaceOrder.dto';
import { PlaceOrderDto } from 'src/dto/placeOrder.dto';
import { OrderDto } from 'src/dto/order.dto';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { Response } from 'express'



@ApiBearerAuth()
@ApiTags('Order')
@UseGuards(jwtGuard)
@Controller('order')
export class OrderController {

    constructor(private readonly orderService: OrderService,
        private authClient:AuthClient,
        private paymentClient:PaymentClient,
        private readonly kafkaService: KafkaService
      ) {}
      

      @Get('/status')
      @ApiOperation({ summary: 'Get service status' })
      @ApiResponse({ status: 200, description: 'Service is running' })
     async getHello(){
        return this.orderService.getHello();
      }
     

      @Post('/prePlaceOrder')
      @ApiOperation({ summary: 'Prepare order from cart' })
      @ApiBody({ type: PrePlaceOrderDto })
      @ApiResponse({ 
        status: 201, 
        description: 'Order prepared successfully',
        type: OrderDto
      })
      @ApiResponse({ status: 400, description: 'Bad Request' })
      @ApiResponse({ status: 401, description: 'Unauthorized' })
      async prePlaceOrder(@Body('cartId',ParseObjectIdPipe) cartId: ObjectId){
          console.log(cartId);
          return await this.orderService.createOrder(cartId);   
      }   



 
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
      async placeOrder(@Body('modeOfPayment') modeOfPayment:string,@Body('orderId',ParseObjectIdPipe) orderId: ObjectId){
        if(modeOfPayment=="cashOnDelivery"){
            this.handleCart({orderId:orderId});
            this.handleDelivery({orderId: orderId});
            return await this.orderService.updateOrder(orderId,"NILL",PaymentStatus.PENDING,PaymentMethod.CASH_ON_DELIVERY,OrderStatus.PREPARING);
        }
        else if(modeOfPayment=="online"){
              const paymentData= await this.paymentClient.getPayStatus(orderId.toString());
              if(paymentData.paymentStatus=="Failed"){
                const orderCancelled=this.orderService.updateOrder(orderId,paymentData.paymentID,PaymentStatus.FAILED,PaymentMethod.UPI,OrderStatus.CANCELLED);
                return orderCancelled;
              }
              else if(paymentData.paymentStatus=="completed"){
                this.handleCart({orderId:orderId});
                this.handleDelivery({orderId: orderId});
                const orderConfirmed=this.orderService.updateOrder(orderId,paymentData.paymentID,PaymentStatus.COMPLETED,PaymentMethod.UPI,OrderStatus.CONFIRMED);
                return orderConfirmed;
              }
        
        }
      }
   

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
      async cancelOrder(@Param('orderId') orderId:string){
           return await this.orderService.cancelOrder(orderId);
      }
      
      
      @Get('/:orderId')
      @ApiOperation({ summary: 'Get order details by ID' })
      @ApiParam({ name: 'orderId', description: 'ID of the order to retrieve' })
      @ApiResponse({ 
        status: 200, 
        description: 'Order details',
        type: OrderDto
      })
      @ApiResponse({ status: 401, description: 'Unauthorized' })
      @ApiResponse({ status: 404, description: 'Order not found' })
      async getOrderById(@Param('orderId') orderId:any){
         return await this.orderService.getOrder(orderId);
      }

   
      @Get('/allOrder/:userId')
      @ApiOperation({ summary: 'Get all orders for a user' })
      @ApiParam({ name: 'userId', description: 'ID of the user' })
      @ApiQuery({ 
        name: 'limit', 
        required: false, 
        description: 'Limit number of results' 
      })
      @ApiQuery({ 
        name: 'offset', 
        required: false, 
        description: 'Offset for pagination' 
      })
      @ApiResponse({ 
        status: 200, 
        description: 'List of user orders',
        type: [OrderDto]
      })
     @ApiResponse({ status: 401, description: 'Unauthorized' })
      async getAllOrder(@Query() query:Record<string,any>){
        return await this.orderService.getAllOrder(query.userId,query);
      }

      

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
      async generateInvoice(@Param('orderId') orderId:string,@Res() res: Response){
        try {
          const pdfBuffer = await this.orderService.generateInvoice(orderId, { debug: true });
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice_${orderId}.pdf`,
            'Content-Length': pdfBuffer.length,
          });
    
          return res.send(pdfBuffer);
        } catch (err) {
          console.error('Download failed:', err);
          return res.status(500).json({ message: 'Failed to download invoice' });
        }  
      }


      async handleDelivery(payload: {orderId:ObjectId})
      {
        await this.kafkaService.handleEvent('newOrder', payload);
      }
      async handleCart(payload:{orderId:ObjectId}){
        const userId=await this.orderService.getUserId(payload.orderId);
        await this.kafkaService.handleEvent('orderCreated',userId);
      }
}
