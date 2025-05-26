import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const cartPort: number = Number(process.env.CART_PORT || 3000); // PORT CONNECTED WITH ENV
  const config = new DocumentBuilder()
  .setTitle('Cart API')
  .setDescription('Cart module APIs for food ordering app')
  .setVersion('1.0')
  .addTag('Cart') // You can repeat for other tags if you have more controllers
  .addBearerAuth() // optional: if you're using JWT
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api', app, document);

  await app.listen(cartPort);
}
bootstrap();
