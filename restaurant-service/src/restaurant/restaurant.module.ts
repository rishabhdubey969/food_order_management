import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { RestaurantController } from './restaurant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { RestaurantSchema } from './schema/restaurant.schema';
import { MenuItemSchema } from './schema/menuItem.schema';
import { ClientsModule, ClientsProviderAsyncOptions, Transport } from '@nestjs/microservices';
import { CouponSchema } from './schema/copon.schema';
import { RedisModule } from './redis/redis.module';
import { LoggerModule } from 'src/logger/logger.module';
import { ManagerSchema } from 'src/manager/schema/manager.schema';
import { Manager } from './schema/manager.schema';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [MongooseModule.forFeature([
    { name: 'Restaurant', schema: RestaurantSchema },
    { name: 'MenuItem', schema: MenuItemSchema },
    { name: 'Coupon', schema: CouponSchema },
    {  name: Manager.name, schema: ManagerSchema},
  ]), RedisModule,
  LoggerModule,
  ClientsModule.registerAsync([
      {
        name: 'AUTH_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: configService.get<string>('AUTH_GRPC_PACKAGE'),
            protoPath: configService.get<string>('AUTH_GRPC_PROTO_PATH'),
            url: configService.get<string>('AUTH_GRPC_URL'),
          },
        }),
        inject: [ConfigService],
      } as ClientsProviderAsyncOptions,
      // {
  //     name: 'MEDIA_SERVICE',
  //     transport: Transport.GRPC,
  //     options: {
  //       package: 'media', 
  //       protoPath:  '../proto/media.proto',
  //       url: 'localhost:50051', 
  //     },
  //   },
  ]),

  ],
  providers: [RestaurantService],
  controllers: [RestaurantController],
  exports: []
})
export class RestaurantModule { }
