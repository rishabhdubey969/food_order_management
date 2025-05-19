import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [  
    MongooseModule.forRoot('mongodb+srv://FoodOrder:FoodAdmin123@cluster0.hcogxon.mongodb.net/food?retryWrites=true&w=majority&appName=Cluster0'),
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    AuthModule,
  ],
})
export class AppModule {}
