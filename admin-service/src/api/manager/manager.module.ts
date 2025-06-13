import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { Manager, ManagerSchema } from './entities/manager.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { Restaurant, RestaurantSchema } from './entities/restaurant.entity';
import path, { join } from 'path';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema },
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'yourSecretKey',
      signOptions: { expiresIn: '24h' },
    }),
    AuthModule,

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
      {
        name: 'MANAGER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'manager', // This should match your proto package name
          protoPath: join("src/proto/manager.proto"), // Path to your proto file
          url: 'restaurant-service:50001', // URL to your restaurant service
        },
      },
    ]),
  ],
  controllers: [ManagerController],
  providers: [ManagerService],
})
export class ManagerModule {}
