import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // HTTP Configuration
  const port = configService.get<number>('PORT') || 3000;

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Food Order Auth Service')
    .setDescription('Authentication Service API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // gRPC Configuration
  const grpcOptions: MicroserviceOptions = {
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'auth/proto/auth.proto'),
      url: `0.0.0.0:${configService.get<number>('GRPC_PORT') || 5009}`,
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [join(__dirname, 'auth/proto')],
      },
    },
  };

  app.connectMicroservice(grpcOptions);

  await app.startAllMicroservices();
  await app.listen(port);

  console.log(`HTTP server running on port ${port}`);
  console.log(
    `gRPC server running on port ${configService.get<number>('GRPC_PORT') || 5009}`,
  );
}

bootstrap();
