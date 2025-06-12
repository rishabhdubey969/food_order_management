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
    whitelist: true,      
    forbidNonWhitelisted: true, 
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
 
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API with NestJS')
    .setDescription('API developed throughout the API with NestJS course')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT||3005);
  
  const grpcMicroservice = app.connectMicroservice<MicroserviceOptions>({
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

  await app.startAllMicroservices(); 
  await app.listen(port);
}
bootstrap();
