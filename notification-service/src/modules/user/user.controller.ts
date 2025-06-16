import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    await this.userService.signupUser(data);
  }

 @EventPattern('signup_otp')
  async handleSignupOtp(@Payload() data: any) {
    await this.userService.signupOtp(data);
  }

   @EventPattern('reset_link')
  async handleResetLink(@Payload() data: any) {
    await this.userService.resetLink(data);
  }

}