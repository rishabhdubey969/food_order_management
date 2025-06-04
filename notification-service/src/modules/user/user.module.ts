import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { NotificationHelperService } from 'src/utils/helper'

@Module({
  controllers: [UserController],
  providers: [UserService, NotificationHelperService],
})
export class UserModule {}
