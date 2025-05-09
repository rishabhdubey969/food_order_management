import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT || 3000); // PORT CONNECTED WITH ENV
  await app.listen(restaurantPort);
}
bootstrap();
