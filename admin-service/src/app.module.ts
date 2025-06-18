import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import jwtConfig from './api/user/config/jwt.config';
import userConfig from './api/user/config/user.config'
import { AuthModule } from './api/auth/auth.module';
import { UserModule } from './api/user/user.module'
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { SeederModule } from  './seed/seeder.module'
import { AppController } from './app.controller';
import { ManagerModule } from './api/manager/manager.module';
import { JwtModule } from '@nestjs/jwt';
import { OrderModule } from './api/order/order.module';
import { RedisModule } from './redis/redis.module';
import { LoggerModule } from './api/logger/logger.module';
import { WinstonLogger, WinstonModule } from 'nest-winston';
import { winstonConfig } from './api/logger/winston.config';


@Module({
  
  imports: [  
     ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('URI'),
        
      }),
      inject: [ConfigService],
    }),
   
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.expiresIn },
    }),
    WinstonModule.forRoot(winstonConfig),
    AuthModule,
    UserModule, 
    SeederModule,
    ManagerModule,
    OrderModule,
    RedisModule
  ],
  controllers: [AppController],
  providers: [AppService,WinstonLogger],
  exports:[WinstonLogger]
})
export class AppModule {}