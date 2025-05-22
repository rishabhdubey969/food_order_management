import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisService } from '../redis/redis.service';
import { GoogleStrategy } from './oauth.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthTokenService } from './token.service'


@Module({
  imports: [
    
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'myjwtsecret',
            signOptions: { expiresIn: '60m' }

    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, GoogleStrategy, AuthTokenService],
})
export class AuthModule {}



