import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(process.cwd(), 'apps', 'auth', 'src', 'auth', 'proto', 'auth.proto'),
    },
  });

  await app.listen();
  console.log('Auth microservice is running...');
}
bootstrap();
