import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ManagerModule } from './manager/manager.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './manager/common/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
   const app = await NestFactory.create(AppModule);
   app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Add validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,       // Remove non-whitelisted properties
    forbidNonWhitelisted: true, // Throw errors for non-whitelisted properties
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

   app.enableCors({
    origin: ['http://localhost:5173', 'http://172.50.5.110'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3005; 
  const config = new DocumentBuilder()
    .setTitle('Manager & Restaurant API')
    .setDescription('API for Manager signup, login, and management')
    .setVersion('1.0')
    .addTag('Manager')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT||3005);
  
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
      package: 'manager',
      protoPath:  'src/manager/grpc/proto/auth.proto',
      url:'0.0.0.0:5001',
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
  await app.listen(3005);
}
bootstrap();
