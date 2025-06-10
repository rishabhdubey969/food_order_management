import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotificationService } from 'src/utils/helper';

@Injectable()
export class UserService {
  constructor(
    readonly notificationHelperService: NotificationService,
  ) {}

  async signupUser(data: CreateUserDto) {
    return this.notificationHelperService.welcomeEmail();
  }
}
