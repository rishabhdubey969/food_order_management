import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  const authPort: number = Number(process.env.AUTH_PORT); // PORT CONNECTED WITH ENV
  await app.listen(authPort);
}
bootstrap();
