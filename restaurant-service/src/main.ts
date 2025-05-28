import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ManagerModule } from './manager/manager.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// import order from './manager/proto/'
// import { logger } from './manager/constant/logger';

// async function bootstrap() {
//   const app = await NestFactory.create(ManagerModule, {
//     logger: logger, // Attach Winston Logger
//   });

async function bootstrap() {
   const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Manager API')
    .setDescription('API for Manager signup, login, and management')
    .setVersion('1.0')
    .addTag('Manager')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT||3000);
  
  const grpcMicroservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'order', // name defined in your .proto file
      protoPath: join(__dirname, './manager/proto/order.proto'), // path to your proto
      url: '0.0.0.0:50051', // gRPC server address
    },
  });
  await app.startAllMicroservices(); // start microservices
  await app.listen(restaurantPort);
}
bootstrap();
