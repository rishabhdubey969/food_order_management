

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Admin, AdminSchema } from './entities/admin.entity';
import { Session, SessionSchema } from './entities/session.entity';
import { EmailModule } from 'src/email/email.module';
import { LoggerModule } from '../logger/logger.module';


@Module({
  imports: [
    LoggerModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Session.name, schema: SessionSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET|| 'yourSecretKey',
      signOptions: { expiresIn: '10m' },
    }),
    // ClientsModule.register([
    //   {
    //     name: 'NOTIFICATION_SERVICE',
    //     transport: Transport.RMQ,
    //     options: {
    //       urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
    //       queue: 'notification_queue',
    //       queueOptions: {
    //         durable: false,
    //       },
    //     },
    //   },
    // ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
   exports: [AuthService],
})
export class AuthModule {}