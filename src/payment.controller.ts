import { Controller, Get } from '@nestjs/common';
// import { PaymentService } from './payment.service';
import { GrpcMethod } from '@nestjs/microservices';
import { paymentService } from './payment.service';


@Controller()
export class PaymentController {
  constructor(private readonly paymentService: paymentService) {}

  @Get()
  getHello(): string {
    return this.paymentService.getHello();
  }

  @GrpcMethod('PaymentService', 'GetPayStatus')
  async GetPayStatus( data:{orderId: string }) {
    console.log(data)
    // return this.productService.getProduct(data.id);
    return { paymentID:"1",paymentStatus:"Success",paymentmessage:"Successful",paymentmode:"UPI"};
    // return hello
  }

}
