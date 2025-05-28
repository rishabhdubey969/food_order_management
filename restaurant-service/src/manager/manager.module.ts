import { Module } from '@nestjs/common';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Manager, ManagerSchema } from './schema/manager.schema';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
    imports: [MongooseModule.forFeature([
      { name: Manager.name, schema: ManagerSchema }
        ]),
        JwtModule.register({ // Add JWT configuration
      secret: process.env.JWT_SECRET, // Use an environment variable
      signOptions: { expiresIn: '1d' },
    }),
     ClientsModule.register([
      {
        name: 'RESTAURANT_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'restaurant', // This should match your proto package name
          protoPath: 'src/manager/proto/restaurant.proto', // Path to your proto file
          url: 'restaurant-service:50051', // URL to your restaurant service
        },
      },
    ]),
    ],
    providers: [ManagerService],
    controllers: [ManagerController],
    exports: [ManagerService]
})
export class ManagerModule {}
