import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CartSchema } from './schema/cart.schema';
import { CouponSchema } from './schema/coupon.schema';
import { AddressSchema, Address } from './schema/address.schema';
import { RestaurantSchema } from './schema/restaurant.schema';
import { MenuItemSchema } from './schema/menu-item.schema';
import { RedisModule } from 'src/redis/redis.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WinstonLogger } from '../logger/winston-logger.service';


@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Cart', schema: CartSchema }]),
    MongooseModule.forFeature([{ name: 'Coupons', schema: CouponSchema }]),
    MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }]),
    MongooseModule.forFeature([{ name: 'Restaurant', schema: RestaurantSchema }]),
    MongooseModule.forFeature([{ name: 'MenuItem', schema: MenuItemSchema }]),
    RedisModule,

    // gRPC Auth Client Setup
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'auth', 
          protoPath: "src/cart/grpc/proto/auth.proto", // adjust path to your actual proto
          url: 'localhost:50051', // adjust to your auth service host/port
        },
      },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, WinstonLogger],
})
export class CartModule {}
