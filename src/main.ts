import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import path, { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  const paymentPort: number = Number(process.env.PORT); // PORT CONNECTED WITH ENV
  await app.listen(paymentPort);


  const microserviceApp = await NestFactory.createMicroservice<MicroserviceOptions>(PaymentModule,
    {
      transport:Transport.GRPC,
      options:{
        package:'payment',
        protoPath: 'src/proto/payment.proto',
        url:'172.50.5.108:5000',
      }
    
    }
  )

  await microserviceApp.listen()
  console.log('Payment Service (gRPC) is listening on port 5000');
}
bootstrap();
