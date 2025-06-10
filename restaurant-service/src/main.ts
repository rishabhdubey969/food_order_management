import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ManagerModule } from './manager/manager.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
   const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Manager & Restaurant API')
    .setDescription('API for Manager signup, login, and management')
    .setVersion('1.0')
    .addTag('Manager')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT||3000);
  
  const grpcMicroservice = app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.GRPC,
  //   options: {
  //     package: 'order', // name defined in your .proto file
  //     protoPath: join(__dirname, './manager/grpc/proto/order.proto'), // path to your proto
  //     url: '0.0.0.0:50051', // gRPC server address
  //   },
  // });
  // app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath:  'src/manager/grpc/proto/auth.proto',
    },
  });

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {

      client:{
        brokers:["localhost:29092"]
      },

      consumer:{
        groupId: 'group-email'
      }
      
    }});

  await app.startAllMicroservices(); // start microservices
  await app.listen(3000);
}
bootstrap();
