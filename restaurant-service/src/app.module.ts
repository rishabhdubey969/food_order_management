import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerModule } from './manager/manager.module';
import { RestaurantModule } from './restaurant/restaurant.module';
// import { RestaurantModule } from './restaurant/restaurant.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally available
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
      inject: [ConfigService],
    }),
    ManagerModule, 
    RestaurantModule
    // RestaurantModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
