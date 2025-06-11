import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { OtpModule } from '../otp/otp.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports:[
    OtpModule,
    ConfigModule
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}
