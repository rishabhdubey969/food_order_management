
import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { OrderService } from './order.service';

import { AuthService } from '../auth/auth.service';

import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
   
    EmailModule,
    JwtModule.register({
          secret: process.env.JWT_SECRET || 'yourSecretKey',
          signOptions: { expiresIn: '24h' },
        }),
  
  
  ClientsModule.register([
            {
              name: 'NOTIFICATION_SERVICE',
              transport: Transport.RMQ,
              options: {
                urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
                queue: 'notification_queue',
                queueOptions: {
                  durable: false,
                },
              },
            },
          ]),],

  controllers: [OrderController],
  providers: [OrderService, AuthService], 
})
export class OrderModule {}