import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Auth, AuthenticationSchema } from './entities/auth.entity';
import { MongooseModule } from '@nestjs/mongoose';
// import { UserGrpcService } from '../../grpc/interface/user.client';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AuthClient } from 'src/grpc/authentication/auth.client';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auth.name, schema: AuthenticationSchema },
    ]),

  ],
  controllers: [AuthController],
  providers: [
    AuthService,
//    UserGrpcService,
AuthClient

  ],
  exports: [MongooseModule],
})
export class AuthModule {}