// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const cartPort = configService.get<number>('CART_PORT') as number;

  const config = new DocumentBuilder()
    .setTitle('Cart API')
    .setDescription('Cart module APIs for food ordering app')
    .setVersion('1.0')
    .addTag('Cart')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: ['localhost:29092'], 
      },
      consumer: {
        groupId: 'delivery-consumer-group', 
      },
    },
  });

  await app.startAllMicroservices();

  await app.listen(cartPort);
  console.log(`Cart service is running on port ${cartPort}`);
}
bootstrap();
