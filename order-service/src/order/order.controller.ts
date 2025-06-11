import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { PaymentClient } from 'src/grpc/payment/payment.client';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import {ObjectId} from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from 'src/schema/order.schema';
import { KafkaService } from 'src/kafka/kafka.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { jwtGuard } from 'src/guards/jwt-guard';


@UseGuards(jwtGuard)
@Controller('order')
export class OrderController {

    constructor(private readonly orderService: OrderService,
        private paymentClient:PaymentClient,
        private readonly kafkaService: KafkaService
      ) {}
      
      @Get()
      getHello(): string {
        return this.orderService.getHello();
      }
     
      @Post('/prePlaceOrder')
      async prePlaceOrder(@Body('cartId',ParseObjectIdPipe) cartId: ObjectId){
            return await this.orderService.createOrder(cartId);   
      }

 
      @Post('/postPlaceOrder')
      async postPlaceOrder(@Body('modeOfPayment') modeOfPayment:string,@Body('orderId',ParseObjectIdPipe) orderId: ObjectId){
        
        if(modeOfPayment=="cashOnDelivery"){
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
                this.handleDelivery({orderId: orderId});
                const orderConfirmed=this.orderService.updateOrder(orderId,paymentData.paymentID,PaymentStatus.COMPLETED,PaymentMethod.UPI,OrderStatus.CONFIRMED);
                return orderConfirmed;
              }
        
        }
      }

  
      @Get('/cancelOrder/:orderId')
      async cancelOrder(@Param('orderId') orderId:string){
           return await this.orderService.cancelOrder(orderId);
      }
      
      
      @Get('/:orderId')
      async getOrderById(@Param('orderId') orderId:string){
         return await this.orderService.getOrder(orderId);
      }

   
      @Get('/allOrder/:userId')
      async getAllOrder(@Query() query:Record<string,any>){
        return await this.orderService.getAllOrder(query.userId,query);
      }

  
      @Get('/generateInvoice/:orderId')
      async generateInvoice(@Param('orderId') orderId:string){
        return await this.orderService.getInvoice(orderId);
      }


      @EventPattern('partnerAssigned')
      async handlePartnerAssigned(@Payload() data: any){
        console.log('kafka working');
         console.log(data);
      }

      async handleDelivery(payload: {orderId: ObjectId})
      {
        await this.kafkaService.handleEvent('newOrder', payload);
      }
      
}
