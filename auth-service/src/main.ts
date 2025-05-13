import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: path.resolve(process.cwd(), 'src/auth/proto/auth.proto'),
      url: '127.0.0.1:5003',
    },
  });

  await app.listen();
}
bootstrap();
