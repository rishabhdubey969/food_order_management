import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { ProfileModule } from './api/profile/profile.module';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from 'logger/winston.logger';
import { JwtConstant } from 'jwt_security/jwt.const';
import { JwtModule } from '@nestjs/jwt';
import { AddressModule } from './api/address/address.module';
// import { ClientsModule, Transport } from '@nestjs/microservices';
// import { join } from 'path';
import { UserController } from './api/authentication/user/user.controller';
import { AdminController } from './api/authentication/admin/admin.controller';
import { ManagerController } from './api/authentication/manager/manager.controller';
import { DeliveryRiderController } from './api/authentication/delivery-rider/delivery-rider.controller';
import { DeliveryRiderModule } from './api/authentication/delivery-rider/delivery-rider.module';
import { ManagerModule } from './api/authentication/manager/manager.module';
import { AdminModule } from './api/authentication/admin/admin.module';
import { UserModule } from './api/authentication/user/user.module';

@Module({
  imports: [
    AuthModule, AddressModule, ProfileModule,
    ConfigModule.forRoot({
      // Globally Env Connection
      isGlobal: true,
    }),
    WinstonModule.forRoot(winstonConfig),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION as string), // Mongo Connection
    JwtModule.register({
      // JWT Configuration
      global: true,
      secret: JwtConstant.SECRET,
      signOptions: { expiresIn: JwtConstant.EXPIRE_TIME },
    }), DeliveryRiderModule, ManagerModule, AdminModule, UserModule,
    ],
  controllers: [AppController, UserController, AdminController, ManagerController, DeliveryRiderController],
  providers: [AppService],
})
export class AppModule {}
