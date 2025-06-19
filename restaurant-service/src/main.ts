import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { GlobalExceptionFilter } from './manager/filters/global-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config'; 

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(winstonConfig), 
  });

  const configService = app.get(ConfigService);

  const kafkaBrokers = configService.get<string>('KAFKA_BROKERS')!;
  const kafkaClientId = configService.get<string>('KAFKA_CLIENT_ID', 'managerConsumer'); 
  const kafkaGroupId = configService.get<string>('KAFKA_GROUP_ID', 'managergroup'); 

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaBrokers],
        clientId: kafkaClientId,
        retry:{
          retries:5
        },
      },
      consumer: {
        groupId: kafkaGroupId,
        allowAutoTopicCreation:true
      },
      producer:{
        allowAutoTopicCreation:true
      }
    },
  });

  // CORS
  app.enableCors();

  // Swagger
  const port = configService.get<number>('PORT') || 3005;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Manager and Restaurant API')
    .setDescription('API with NestJS')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();
