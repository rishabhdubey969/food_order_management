import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger = new Logger('Main');

  const app = await NestFactory.create(AppModule);
  logger.log('Nest application created');

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
  logger.log('Global validation pipes set');

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

  try {
    await app.startAllMicroservices();
    logger.log('Microservice started');
  } catch (error) {
    logger.error('Error starting microservice:', error);
  }

  const port = process.env.DELIVERY_APP_PORT ?? 3003;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}

bootstrap();
