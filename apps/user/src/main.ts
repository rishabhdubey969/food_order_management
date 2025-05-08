import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';

async function bootstrap() {
  const app = await NestFactory.create(UserModule);
  const userPort: number = Number(process.env.USER_PORT); // PORT CONNECTED WITH ENV
  await app.listen(userPort);
}
bootstrap();
