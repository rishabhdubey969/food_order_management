import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  const paymentPort: number = Number(process.env.PAYMENT_PORT); // PORT CONNECTED WITH ENV
  await app.listen(paymentPort);
}
bootstrap();
