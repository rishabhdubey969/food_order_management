import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { RedisModule } from 'src/redis/redis.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WinstonLogger } from '../logger/winston-logger.service';
import { ConfigModule, ConfigService } from '@nestjs/config';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),
    RedisModule,

    // gRPC Auth Client Setup
    ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: 'auth',
            protoPath: 'src/cart/grpc/proto/auth.proto',
            url: configService.get<string>('AUTH_GRPC_URL', 'localhost:50051'), 
          },
        }),
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, WinstonLogger],
})
export class CartModule {}
