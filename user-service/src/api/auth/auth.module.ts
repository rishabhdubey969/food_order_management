import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth, AuthenticationSchema } from './entities/auth.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthenticationSchema }
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports:[MongooseModule],
})
export class AuthModule {}
