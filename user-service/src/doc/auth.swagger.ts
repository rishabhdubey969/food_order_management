import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { CreateAuthDto } from 'src/api/auth/dto/create-auth.dto';
import { ForgotPasswordDto } from 'src/api/auth/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/api/auth/dto/reset-password.dto';
import { SendOtpDto } from 'src/api/auth/dto/send-otp.dto';


export const SendOtpSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Send OTP to user email' }),
    ApiBody({ type: SendOtpDto }),
    ApiResponse({ status: 200, description: 'OTP sent successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
  );

export const SignUpSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Register new user' }),
    ApiBody({ type: CreateAuthDto }),
    ApiResponse({ status: 201, description: 'User registered successfully' }),
    ApiResponse({ status: 400, description: 'Bad request' }),
  );

export const ForgotPasswordSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Initiate forgot password process' }),
    ApiBody({ type: ForgotPasswordDto }),
    ApiResponse({ status: 200, description: 'Reset password email sent' }),
    ApiResponse({ status: 404, description: 'User not found' }),
  );

export const ResetPasswordSwagger = () =>
  applyDecorators(
    ApiOperation({ summary: 'Reset user password' }),
    ApiParam({ name: 'token', description: 'Password reset token' }),
    ApiBody({ type: ResetPasswordDto }),
    ApiResponse({ status: 200, description: 'Password reset successful' }),
    ApiResponse({ status: 400, description: 'Invalid token or password' }),
  );