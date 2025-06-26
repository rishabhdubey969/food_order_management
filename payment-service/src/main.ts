import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';

import { json } from 'express';
import { PaymentModule } from './payment.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from 'src/middleware/filter/exception.filter';
import { ErrorInterceptor } from 'src/middleware/interceptor/error.interceptor';
import { SimpleResponseInterceptor } from 'src/middleware/interceptor/response.interceptor';
import { WinstonModule } from 'nest-winston';
import { format, transports } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule, {
    bodyParser: false,
    logger: WinstonModule.createLogger({
      transports: [
        new transports.File({
          filename: `logs/error.log`,
          level: 'error',
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.File({
          filename: `logs/combined.log`,
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.Console({
          format: format.combine(
            format.cli(),
            format.splat(),
            format.timestamp(),
            format.printf((info) => {
              return `${info.timestamp} ${info.level}: ${info.message}`;
            }),
          ),
        }),
      ],
    }),
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

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  app.useGlobalInterceptors(
    new ErrorInterceptor(),
    new SimpleResponseInterceptor(app.get(Reflector)),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API with NestJS')
    .setDescription('API developed throughout the API with NestJS course')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
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
