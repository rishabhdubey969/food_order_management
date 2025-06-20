import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Creates a new user.
   * @param createUserDto - The data transfer object containing user details.
   * @returns The created user object.
   */
  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    await this.userService.signupUser(data);
  }

  /**
   * Updates an existing user.
   * @param updateUserDto - The data transfer object containing updated user details.
   * @returns The updated user object.
   */
  @EventPattern('signup_otp')
  async handleSignupOtp(@Payload() data: any) {
    await this.userService.signupOtp(data);
  }

  /**
   * Updates an existing user.
   * @param updateUserDto - The data transfer object containing updated user details.
   * @returns The updated user object.
   */
  @EventPattern('reset_link')
  async handleResetLink(@Payload() data: any) {
    await this.userService.resetLink(data);
  }
}
