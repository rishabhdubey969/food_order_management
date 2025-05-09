import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);


    const swaggerConfig = new DocumentBuilder()
    .setTitle('OREDER SERVICE')
    .setDescription('API developed throughout the API with NestJS course')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      'JWT',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
  // console.log(process.env.ORDER_PORT)
  const orderPort: number = Number(process.env.ORDER_PORT); // PORT CONNECTED WITH ENV
  await app.listen(orderPort);
}
bootstrap();
