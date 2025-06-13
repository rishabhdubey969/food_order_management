import { NestFactory } from '@nestjs/core';

import { json } from 'express';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, {
    bodyParser: false,
  });

  app.use((req, res, next) => {
    if (req.originalUrl === '/webhook/stripe') {
      next();
    } else {
      json()(req, res, next);
    }
  });

  app.use(
    '/webhook/stripe',
    json({
      verify: (req: any, res, buf) => {
        req.rawBody = buf;
      },
    }),
  );
  app.enableCors({
    origin: '*', 
    methods: 'GET,POST,PUT,DELETE', 
    credentials: true, 
    allowedHeaders: 'Content-Type, Authorization', 
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API with NestJS')
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
  const port = process.env.PORT || 3007;
  await app.listen(port);
  const microserviceApp =
    await NestFactory.createMicroservice<MicroserviceOptions>(PaymentModule, {
      transport: Transport.GRPC,
      options: {
        package: 'payment',
        protoPath: 'src/grpc/proto/payment.proto',
        url: '0.0.0.0:7001',
      },
    });
  await microserviceApp.listen();
  
  console.log('Product Service (gRPC) is listening on port 7001');
  console.log(`Application is running on: ${port}`);
}
bootstrap();


//172.50.1.20:5000