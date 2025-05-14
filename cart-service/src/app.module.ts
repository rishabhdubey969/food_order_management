import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot('mongodb+srv://FoodOrder:FoodAdmin123@cluster0.hcogxon.mongodb.net/food?retryWrites=true&w=majority&appName=Cluster0'),
    CartModule,
  ],
  providers: [],
  exports: [],
})
export class AppModule {}
