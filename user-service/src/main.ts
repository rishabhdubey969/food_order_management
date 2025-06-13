import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filters/exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port: number = Number(process.env.PORT);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Food Order (User Service)')
    .setDescription('All User API is here')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // Apply global error filter
  app.useGlobalFilters(new HttpExceptionFilter());

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.enableCors({ origin: '*'});
  await app.listen(port);
}
bootstrap();
