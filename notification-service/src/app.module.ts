import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { OrderModule } from './modules/order/order.module';
import { ManagerModule } from './modules/manager/manager.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // Globally Env Connection
      isGlobal: true,
    }),
    UserModule,
    OrderModule,
    ManagerModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}