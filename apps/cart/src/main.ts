import { NestFactory } from '@nestjs/core';
import { CartModule } from './cart.module';

async function bootstrap() {
  const app = await NestFactory.create(CartModule);
  const cartPort: number = Number(process.env.CART_PORT); // PORT CONNECTED WITH ENV
  await app.listen(cartPort);
}
bootstrap();
