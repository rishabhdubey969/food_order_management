import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RedisService } from '../redis/redis.service';
import { GoogleStrategy } from './oauth.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthTokenService } from './token.service';
import { Session, SessionSchema } from './schema/session.schema';
import { SessionService } from './session.service'


@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: '60m' }
    }),
     MongooseModule.forFeature([
      { name: Session.name, schema: SessionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RedisService, GoogleStrategy, AuthTokenService, SessionService],
})
export class AuthModule {}



