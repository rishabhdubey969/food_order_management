import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import jwtConfig from './api/user/config/jwt.config';
import userConfig from './api/user/config/user.config'
import { AuthModule } from './api/auth/auth.module';
import { UserModule } from './api/user/user.module'
import { MongooseModule } from '@nestjs/mongoose';
import { SeederModule } from './api/seeder/seeder.module';

@Module({
  imports: [  
    MongooseModule.forRoot('mongodb+srv://FoodOrder:FoodAdmin123@cluster0.hcogxon.mongodb.net/food?retryWrites=true&w=majority&appName=Cluster0'),
    ConfigModule.forRoot({ 
      isGlobal: true, 
      load: [jwtConfig, userConfig] // Add userConfig here
    }),
    AuthModule,
    UserModule, // Add this line
    SeederModule
  ],
})
export class AppModule {}