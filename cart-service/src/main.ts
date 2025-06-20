import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AllExceptionsFilter } from './cart/common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const cartPort = configService.get<number>('CART_PORT') ?? 3002;
  const kafkaBroker = configService.get<string>('KAFKA_BROKER') ?? 'localhost:29092';
  const kafkaGroupId = configService.get<string>('KAFKA_GROUP_ID') ?? 'delivery-consumer-group';

  app.enableCors();
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Cart API')
    .setDescription('Cart module APIs for food ordering app')
    .setVersion('1.0')
    .addTag('Cart')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // Kafka microservice connection
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: [kafkaBroker],
      },
      consumer: {
        groupId: kafkaGroupId,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(cartPort);
  console.log(`Cart service is running on port ${cartPort}`);
}

bootstrap();
