import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);
  const orderPort: number = Number(process.env.ORDER_PORT); // PORT CONNECTED WITH ENV
  await app.listen(orderPort);
}
bootstrap();
