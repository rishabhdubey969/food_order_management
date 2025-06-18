import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MongooseError } from 'mongoose';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule);
  logger.log('Nest application created');

  // Configure Swagger with JWT authentication
 
    const config = new DocumentBuilder()
      .setTitle('Delivery Service API')
      .setDescription('API documentation for the Delivery Service')
      .setVersion('1.0')
      .addTag('delivery')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    logger.log('Swagger documentation configured at /api with JWT authentication');
  

  // Set global validation pipes
  // app.useGlobalPipes(
  //   new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  // );
  logger.log('Global validation pipes set');

  // Configure Kafka microservice
  const kafkaBrokers = ['localhost:29092'];
  logger.log(`Connecting Kafka Microservice with brokers: ${kafkaBrokers}`);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
      options: {
        client: {
          brokers: ['localhost:29092'],
          clientId: 'deliveryConsumer',
          retry:{
            retries: 5
          },
        },
        consumer: {
          groupId: 'deliveryGroup',
          allowAutoTopicCreation: true
        },
        producer:{
          allowAutoTopicCreation: true
        }
      }
  })

  // Start microservices with error handling
 
  await app.startAllMicroservices();
  logger.log('Microservice started');

  // Start the application
  app.enableCors();
  const port = process.env.DELIVERY_APP_PORT ?? 3003;
  
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
 
}

bootstrap();