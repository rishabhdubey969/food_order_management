import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationHelperService } from 'src/utils/helper';

@Injectable()
export class UserService {
  constructor(
    readonly notificationHelperService: NotificationHelperService,
  ) {}

  async signupUser(data: CreateUserDto) {
    return this.notificationHelperService.welcomeEmail();
  }
}
