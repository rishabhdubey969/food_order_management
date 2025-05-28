import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth, AuthenticationSchema } from './entities/auth.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthClient } from 'src/grpc/authentication/auth.client';
import { RedisModule } from 'src/redis/redis.module';
import { TokenService } from './token.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthenticationSchema },
    ]),
      ClientsModule.register([
      {
        name: 'NOTIFICATION_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'notification_queue',
          queueOptions: { durable: false },
        },
      },
    ]),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, AuthClient],
  exports: [MongooseModule],
})
export class AuthModule {}
