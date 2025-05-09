import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ManagerModule } from './manager/manager.module';
import { RestaurantModule } from './restaurant/restaurant.module';

@Module({
  imports: [
    MongooseModule.forRoot("mongodb+srv://FoodOrder:FoodAdmin123@cluster0.hcogxon.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"),
    ConfigModule.forRoot({
      isGlobal: true, // This makes the config globally available
    }),
    ManagerModule, 
    RestaurantModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
