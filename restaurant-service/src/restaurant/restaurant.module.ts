import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantSchema } from './schema/restaurant.schema';
import { MenuItemSchema } from './schema/menuItem.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CouponSchema } from './schema/copon.schema';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Restaurant', schema: RestaurantSchema },
    { name: 'MenuItem', schema: MenuItemSchema },
    { name: 'Coupon', schema: CouponSchema },
  ]), RedisModule,
  // ClientsModule.register([
  //   {
  //     name: 'MEDIA_SERVICE',
  //     transport: Transport.GRPC,
  //     options: {
  //       package: 'media', 
  //       protoPath:  '../proto/media.proto',
  //       url: 'localhost:50051', 
  //     },
  //   },
  // ]),

  ],
  providers: [RestaurantService],
  controllers: [RestaurantController],
  exports: []
})
export class RestaurantModule { }
