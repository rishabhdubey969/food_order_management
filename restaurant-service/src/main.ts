import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { ManagerModule } from './manager/manager.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

// import order from './manager/proto/'
// import { logger } from './manager/constant/logger';

// async function bootstrap() {
//   const app = await NestFactory.create(ManagerModule, {
//     logger: logger, // Attach Winston Logger
//   });

async function bootstrap() {
   const app = await NestFactory.create(AppModule);

   app.enableCors({
    origin: ['http://localhost:5173', 'http://172.50.5.110'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000; 
  const config = new DocumentBuilder()
    .setTitle('Manager & Restaurant API')
    .setDescription('API for Manager signup, login, and management')
    .setVersion('1.0')
    .addTag('Manager')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
