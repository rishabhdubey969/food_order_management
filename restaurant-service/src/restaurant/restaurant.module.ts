import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantSchema } from './schema/restaurant.schema';
import { MenuItemSchema } from './schema/menuItem.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CouponSchema } from './schema/copon.schema';
import { RedisModule } from './redis/redis.module';
import { LoggerModule } from 'src/logger/logger.module';
import { ManagerSchema } from 'src/manager/schema/manager.schema';
import { Manager } from './schema/manager.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Restaurant', schema: RestaurantSchema },
    { name: 'MenuItem', schema: MenuItemSchema },
    { name: 'Coupon', schema: CouponSchema },
    {  name: Manager.name, schema: ManagerSchema},
  ]), RedisModule,
  LoggerModule,
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
  ClientsModule.register([
    {
      name: 'AUTH_SERVICE',
      transport: Transport.GRPC,
      options: {
        package: 'auth', 
        protoPath: "src/grpc/proto/auth.proto", // adjust path to your actual proto
        url: 'localhost:50051', // adjust to your auth service host/port
      },
    },
  ]),

  ],
  providers: [RestaurantService],
  controllers: [RestaurantController],
  exports: []
})
export class RestaurantModule { }
