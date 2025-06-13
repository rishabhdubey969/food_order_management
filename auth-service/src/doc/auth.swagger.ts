import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth, ApiBody, ApiProperty } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { LoginAuthDto } from '../auth/dto/login.dto';

class TokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token' })
  refreshToken: string;
}

class SessionDto {
  @ApiProperty({ example: '12345', description: 'Session ID' })
  sessionId: string;
}

class AuthResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Access token' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIs...', description: 'Refresh token' })
  refreshToken: string;
}

export const LoginSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticate user and generate access/refresh tokens',
    }),
    ApiBody({ type: LoginAuthDto }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      type: AuthResponse,
    }),
    ApiResponse({ status: 401, description: 'Invalid credentials' }),
  );

export const RefreshTokenSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Refresh access token',
      description: 'Generate new access token using refresh token',
    }),
    ApiBody({ type: TokenDto }),
    ApiResponse({
      status: 200,
      description: 'Token refreshed successfully',
      type: AuthResponse,
    }),
    ApiResponse({ status: 401, description: 'Invalid refresh token' }),
  );

export const LogoutSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Logout user',
      description: 'Invalidate current session',
    }),
    ApiBearerAuth(),
    ApiBody({ type: SessionDto }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );

export const LogoutAllSwagger = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Logout from all devices',
      description: 'Invalidate all active sessions',
    }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: 'Logged out from all sessions',
    }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
  );