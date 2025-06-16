// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from '../src/api/config/global-exception.filter';
import { ConfigModule } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable validation globally
    app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not defined in the DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties are present
      transform: true, // Transform payloads to DTO instances
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
  SwaggerModule.setup('api', app, document); // Serve Swagger UI at /api
  app.useGlobalFilters(new GlobalExceptionFilter());
  // app.use("trust proxy" ,true)
  await app.listen(4000);
}
bootstrap();