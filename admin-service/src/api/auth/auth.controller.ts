import { Controller, Post, Body, Ip, Req, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/ reset-password.dto';
import { AdminGuard } from './guards/admin.guard';
import { LoginSwagger, VerifyOtpSwagger, RefreshTokenSwagger, LogoutSwagger, ForgotPasswordSwagger, ResetPasswordSwagger } from '../swagger/auth.swagger';
import { LoginGuard } from './guards/Login.guard';

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @LoginSwagger()
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(LoginGuard)
  @Post('verify-otp')
  @VerifyOtpSwagger()
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: any) {
    try {
  
      const userId = req.user._id;
    
      const {  otp } = verifyOtpDto;
      return await this.authService.verifyOtp(userId, otp);
    } catch (error) {
      throw new HttpException(
        error.message || 'OTP verification failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @RefreshTokenSwagger()
  async refresh(@Body('refreshToken') refreshToken: string) {
    try {
      return await this.authService.refreshToken(refreshToken);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to refresh token',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(AdminGuard)
  @Post('logout')
  @LogoutSwagger()
  async logout(@Body('adminId') adminId: string) {
    try {
      return await this.authService.logout(adminId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Logout failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('forgot-password')
  @ForgotPasswordSwagger()
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      return await this.authService.forgotPassword(forgotPasswordDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Forgot password failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('reset-password')
  @ResetPasswordSwagger()
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(resetPasswordDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Reset password failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}