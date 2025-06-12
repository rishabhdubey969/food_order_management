// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const cartPort = configService.get<number>('CART_PORT') || 3002;

  const config = new DocumentBuilder()
    .setTitle('Cart API')
    .setDescription('Cart module APIs for food ordering app')
    .setVersion('1.0')
    .addTag('Cart')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(cartPort);
}
bootstrap();
