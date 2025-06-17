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

  async signupUser(data: any) {
    return this.notificationHelperService.welcomeEmail(data, 'Welcome to FoodApp!', 'welcome-email');
  }

  async signupOtp(data: any) {
    console.log('Sending signup OTP:', data);
    return this.notificationHelperService.welcomeEmail(data, 'Signup OTP', 'signup-otp');
  }

  async resetLink(data: any){
   return this.notificationHelperService.resetEmail(data, 'Reset Password', 'reset-link');
  }
}