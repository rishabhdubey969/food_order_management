// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '../src/api/config/global-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './api/logger/winston.config'
async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger: WinstonModule.createLogger(winstonConfig), 
  });
  
    app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      forbidNonWhitelisted: true,
      transform: true, 
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('Admin Auth API')
    .setDescription('API documentation for Admin Authentication endpoints')
    .setVersion('1.0')
    .addBearerAuth({
      scheme: 'bearer',
      bearerFormat: 'JWT',
      type: 'http'
    }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); 
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  await app.listen(process.env.port as string );
}
bootstrap();