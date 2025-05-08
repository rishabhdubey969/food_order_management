import { NestFactory } from '@nestjs/core';
import { RestaurantModule } from './restaurant.module';

async function bootstrap() {
  const app = await NestFactory.create(RestaurantModule);
  const restaurantPort: number = Number(process.env.RESTAURANT_PORT); // PORT CONNECTED WITH ENV
  await app.listen(restaurantPort);
}
bootstrap();
