import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
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
        ]),
    AuthModule, // Import AuthModule for session and JWT verification
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}