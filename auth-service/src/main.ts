// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import * as path from 'path';

// async function bootstrap() {
//   const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
//     transport: Transport.GRPC,
//     options: {
//       package: 'auth',
//       protoPath: path.resolve(process.cwd(), 'src/auth/proto/auth.proto'),
//       url: '127.0.0.1:5009',
//     },
//   });

//   await app.listen(process.env.Port);
// }
// bootstrap();
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port: number = Number(process.env.PORT);
 const configService = app.get(ConfigService);
  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Food Order (auth Service)')
    .setDescription('All User API is here')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(port);
   console.log(`Application is running on port ${port}`);
}

bootstrap();