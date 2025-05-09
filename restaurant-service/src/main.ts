import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips properties that are not in the DTO
      forbidNonWhitelisted: true, // throws error if unknown props are sent
      transform: true, // auto-transform payloads to DTO classes
    }),
  );
  const restaurantPort = process.env.RESTAURANT_PORT || 4000; // PORT CONNECTED WITH ENV
  await app.listen(restaurantPort);
}
bootstrap();
