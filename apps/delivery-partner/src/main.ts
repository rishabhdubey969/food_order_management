import { NestFactory } from '@nestjs/core';
import { DeliveryPartnerModule } from './delivery-partner.module';

async function bootstrap() {
  const app = await NestFactory.create(DeliveryPartnerModule);
  const deliveryPort: number = Number(process.env.DELIVERY_PARTNER_PORT); // PORT CONNECTED WITH ENV
  await app.listen(deliveryPort);
}
bootstrap();
