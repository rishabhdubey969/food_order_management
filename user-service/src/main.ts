import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/exception.filter';
import { SwaggerModule } from '@nestjs/swagger';
import { getSwaggerConfig, setupSwaggerUI } from './swagger_doc/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use environment variables or a config service for configuration
  const port: number = Number(process.env.PORT) || 3000;
  const swaggerConfig = getSwaggerConfig();

  // Swagger document generation
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  setupSwaggerUI(app, document);

  // Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Enable CORS for all origins (be careful in production)
  app.enableCors({ origin: '*' });

  // Start the application
  await app.listen(port);
}

bootstrap();
