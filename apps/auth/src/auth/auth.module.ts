import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from  './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { JWT_SECRET } from './common/constants';
import { JwtModule } from '@nestjs/jwt';
import { GoogleOAuthStrategy } from './google-oauth.service';
import configuration from './config/configuration';
@Module({
  imports: [
 
      // ConfigModule.forRoot({ isGlobal: true }), // Loads .env automatically
      JwtModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          secret: configService.get<string>('jwt.JWT_SECRET'),
         
          signOptions: {
            expiresIn: configService.get<string>('jwt.JWT_EXPIRES_IN'),
          },
        }),
      }),
    
    
      MongooseModule.forRootAsync({
        useFactory: async (configService: ConfigService) => ({
            uri: configService.get<string>('db.uri'),
    })
    ,inject:[ConfigService]
    }),
    ConfigModule.forRoot({
      isGlobal: true, 
      envFilePath:'.env',
      load:[configuration]// This makes the config globally available
    })
  ],
  controllers: [AuthController],
  providers: [AuthService,GoogleOAuthStrategy],
  
})

export class AuthModule {}
