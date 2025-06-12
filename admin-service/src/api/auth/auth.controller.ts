import { Controller, Post, Body, Ip, Req, HttpException, HttpStatus } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/ reset-password.dto';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiResponse } from '@nestjs/swagger';

@Controller('auth/admin')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login an admin user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(error.message || 'Login failed', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP for admin login' })
  @ApiProperty()
  @ApiBody({ type: VerifyOtpDto })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      return await this.authService.verifyOtp(verifyOtpDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'OTP verification failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout an admin user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'The ID of the user to logout',
          example: '12345',
        },
      },
      required: ['userId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async logout(@Body('userId') userId: string) {
    try {
      return await this.authService.logout(userId);
    } catch (error) {
      throw new HttpException(error.message || 'Logout failed', error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset for an admin' })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset request successful',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
  @ApiOperation({ summary: 'Reset admin password using a token' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    type: Object,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
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
