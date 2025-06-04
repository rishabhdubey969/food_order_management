import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
=======
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import path, { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  const paymentPort: number = Number(process.env.PORT); // PORT CONNECTED WITH ENV
  await app.listen(paymentPort);
  
app.use('/webhook', express.raw({ type: 'application/json' }));


  // const microserviceApp = await NestFactory.createMicroservice<MicroserviceOptions>(PaymentModule,
  //   {
  //     transport:Transport.GRPC,
  //     options:{
  //       package:'payment',
  //       protoPath: 'src/proto/payment.proto',
  //       url:'172.50.5.108:5000',
  //     }
    
  //   }
  // )

  // await microserviceApp.listen()
  // console.log('Payment Service (gRPC) is listening on port 5000');
>>>>>>> be2d0ab40ab8d9dd869af73d0d984144e1f8cc47
}
bootstrap();
