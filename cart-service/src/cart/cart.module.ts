import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { RedisModule } from 'src/redis/redis.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WinstonLogger } from '../logger/winston-logger.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),
    RedisModule,

    // gRPC Auth Client Setup
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth', 
          protoPath: "src/cart/grpc/proto/auth.proto", 
          url: 'localhost:50051', 
        },
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, WinstonLogger],
})
export class CartModule {}
