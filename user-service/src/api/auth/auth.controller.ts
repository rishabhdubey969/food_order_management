import { Controller, Post, Body, Param, Delete, ValidationPipe, UsePipes, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * @description Endpoint to send an OTP to the user's email
   * @param sendOtpDto - Data Transfer Object containing the user's email
   * @returns Response from the send OTP service
   */
  @Post('send-otp')
  sendOtp(@Body() sendOtpDto: SendOtpDto) {
    return this.authService.sendOtpService(sendOtpDto.email);
  }

  /**
   * @description Sign up endpoint for user registration
   * @param createAuthDto - Data Transfer Object containing user registration details
   * @param req - Request object containing additional information
   * @returns Response from the sign-up service
   */
  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  signUp(@Body() createAuthDto: CreateAuthDto, @Req() req: any) {
    return this.authService.signUpService(createAuthDto, req);
  }

  /**
   * Endpoint to initiate forgot password process.
   * @param dto - DTO containing the user's email.
   * @returns Response from the forgot password service.
   */
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  /**
   * Endpoint to reset the user's password using a token.
   * @param token - Password reset token from the URL.
   * @param resetPasswordDto - DTO containing new password details.
   * @returns Response from the reset password service.
   */
  @Post('reset-password/:token')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async resetPassword(@Param('token') token: string, @Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(token, resetPasswordDto);
  }
}
