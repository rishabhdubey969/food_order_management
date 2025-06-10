import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { PAYMENT_PACKAGE_NAME, PAYMENT_SERVICE_NAME, PaymentService } from './payment.interface';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import * as path from 'path';

@Injectable()
export class PaymentClient implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: PAYMENT_PACKAGE_NAME,
      protoPath: join(path.resolve(), 'src/grpc/proto/payment.proto'),
      url: '172.50.5.108:5000',
    },
  })
  private client: ClientGrpc;
//   private pService: any;
  private paymentService: PaymentService;
  
  onModuleInit() {
    this.paymentService = this.client.getService(PAYMENT_SERVICE_NAME);
    console.log("grpc started payment");
  }

  async getPayStatus(orderId: string) {
    console.log({orderId});
    const response  = await lastValueFrom(this.paymentService.GetPayStatus({ orderId }));
    console.log(response);
    return response;
  }
  
  }


  