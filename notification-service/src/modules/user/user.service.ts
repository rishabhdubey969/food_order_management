import { Inject, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationHelperService } from 'src/utils/helper';

@Injectable()
export class UserService {
  constructor(readonly notificationHelperService: NotificationHelperService) {}

  /**
   * Creates a new user and sends a welcome email.
   * @param data - The data transfer object containing user details.
   * @returns A promise that resolves when the email is sent.
   */
  async signupUser(data: any) {
    return this.notificationHelperService.welcomeEmail(data, 'Welcome to FoodApp!', 'welcome-email');
  }

  /**
   * Sends a signup OTP to the user.
   * @param data - The data transfer object containing user details.
   * @returns A promise that resolves when the OTP email is sent.
   */
  async signupOtp(data: any) {
    console.log('Sending signup OTP:', data);
    return this.notificationHelperService.welcomeEmail(data, 'Signup OTP', 'signup-otp');
  }

  /**
   * Sends a reset password link to the user.
   * @param data - The data transfer object containing user details.
   * @returns A promise that resolves when the reset link email is sent.
   */
  async resetLink(data: any) {
    return this.notificationHelperService.resetEmail(data, 'Reset Password', 'reset-link');
  }
}
