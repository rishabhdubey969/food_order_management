// import { Injectable, OnModuleInit } from '@nestjs/common';
// import { ClientGrpc, Client, Transport } from '@nestjs/microservices';
// import { join } from 'path';
// import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthService} from './auth.interface';
// import { firstValueFrom, lastValueFrom } from 'rxjs';
// import * as path from 'path';

// @Injectable()
// export class authClient implements OnModuleInit {
//   @Client({
//     transport: Transport.GRPC,
//     options: {
//       package: AUTH_PACKAGE_NAME,
//       protoPath: join(path.resolve(), 'src/grpc/proto/auth.proto'),
//       url: '172.50.5.108:5000',
//     },
//   })
//   private client: ClientGrpc;
// //   private pService: any;
//   private paymentService: AuthService;
  
//   onModuleInit() {
//     this.paymentService = this.client.getService(AUTH_SERVICE_NAME);
//     console.log("grpc started payment");
//   }

//   async getPayStatus(orderId: string) {
//     console.log({orderId});
//     const response  = await lastValueFrom(this.paymentService.GenerateToken());
//     console.log(response);
//     return response;
//   }
  
//   }


  