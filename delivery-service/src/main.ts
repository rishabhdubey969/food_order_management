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
  try {
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
  } catch (err) {
    throw new MongooseError(err.Message);
  }

  // Set global validation pipes
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  logger.log('Global validation pipes set');

  // Configure Kafka microservice
  const kafkaBrokers = ['localhost:29092'];
  logger.log(`Connecting Kafka Microservice with brokers: ${kafkaBrokers}`);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: kafkaBrokers,
      },
      consumer: {
        groupId: 'groupDelivery',
      },
    },
  });

  // Start microservices with error handling
  try {
    await app.startAllMicroservices();
    logger.log('Microservice started');
  } catch (err) {
    logger.error('Error starting microservice:', err);
    throw new MongooseError(err.Message);
  }

  // Start the application
  const port = process.env.DELIVERY_APP_PORT ?? 3003;
  try {
    await app.listen(port);
    logger.log(`Application is running on port ${port}`);
  } catch (err) {
    throw new MongooseError(err.Message);
  }
}

bootstrap();