import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';

import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailModule } from 'src/email/email.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
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
        ]),
    AuthModule, 
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}