import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from '../auth/dto/login.dto';
import { VerifyOtpDto } from '../auth/dto/verify-otp.dto';
import { ForgotPasswordDto } from '../auth/dto/forgot-password.dto';
import { ResetPasswordDto } from '../auth/dto/ reset-password.dto';

export const LoginSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Login an admin user' }),
  ApiBody({ type: LoginDto }),
  ApiResponse({ status: 200, description: 'Successfully logged in', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const VerifyOtpSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Verify OTP for admin login' }),
  ApiBody({ type: VerifyOtpDto }),
  ApiResponse({ status: 200, description: 'OTP verified successfully', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const RefreshTokenSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Refresh admin token' }),
  ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          description: 'The refresh token to generate a new access token',
          example: 'your-refresh-token-here',
        },
      },
      required: ['refreshToken'],
    },
  }),
  ApiResponse({ status: 200, description: 'Token refreshed successfully', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const LogoutSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Logout an admin user' }),
  ApiBearerAuth('JWT'),
  ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminId: {
          type: 'string',
          description: 'The ID of the admin to logout',
          example: '12345',
        },
      },
      required: ['adminId'],
    },
  }),
  ApiResponse({ status: 200, description: 'Successfully logged out', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 401, description: 'Unauthorized' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const ForgotPasswordSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Request a password reset for an admin' }),
  ApiBody({ type: ForgotPasswordDto }),
  ApiResponse({ status: 200, description: 'Password reset request successful', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);

export const ResetPasswordSwagger = () => applyDecorators(
  ApiOperation({ summary: 'Reset admin password using a token' }),
  ApiBody({ type: ResetPasswordDto }),
  ApiResponse({ status: 200, description: 'Password reset successful', type: Object }),
  ApiResponse({ status: 400, description: 'Bad Request' }),
  ApiResponse({ status: 500, description: 'Internal Server Error' }),
);