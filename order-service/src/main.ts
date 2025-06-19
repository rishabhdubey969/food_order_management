import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston'; 
import { format, transports } from 'winston';
import { AllExceptionsFilter } from './middleware/filters/exception.filter';
import { ErrorInterceptor } from './middleware/intercepter/error.intercepter';
import { SimpleResponseInterceptor } from './middleware/intercepter/response.intercepter';


const { combine, timestamp, printf } = winston.format;

async function bootstrap() {

  const app = await NestFactory.create(AppModule
    ,{
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.File({
          filename:" logs/error.log",
          level: 'error',
          format: format.combine(format.timestamp(), format.json()),
        }),
        new transports.File({
          filename: "logs/combined.log",
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

  // enabling cors
  app.enableCors({
    origin: '*', 
    methods: 'GET,POST,PUT,DELETE', 
    credentials: true, 
    allowedHeaders: 'Content-Type, Authorization', 
  });
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  // connecting kafka
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {

      client:{
        brokers:["localhost:29092"],
        clientId:"orderConsumer",
      },

      consumer:{
        groupId: 'groupOrder',
        allowAutoTopicCreation:true
      },
      producer:{
         allowAutoTopicCreation:true
      }
      
    }});
    const httpAdapterHost = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
    app.useGlobalInterceptors(
      new ErrorInterceptor(),
      new SimpleResponseInterceptor(app.get(Reflector))
    );

    // connecting swagger
    const swaggerConfig = new DocumentBuilder()
    .setTitle('API with NestJS')
    .setDescription('API developed throughout the API with NestJS course')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JWT')
    .build();
   await app.startAllMicroservices();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);
 
  await app.listen(process.env.PORT ?? 3006);

}
bootstrap();
