import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cartPort: number = Number(process.env.CART_PORT || 3000); // PORT CONNECTED WITH ENV
  await app.listen(cartPort);
}
bootstrap();
