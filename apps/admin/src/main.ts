import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  const adminPort: number = Number(process.env.ADMIN_PORT); // PORT CONNECTED WITH ENV
  await app.listen(adminPort);
}
bootstrap();
