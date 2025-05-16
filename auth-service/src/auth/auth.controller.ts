import { BadRequestException, Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import {
  LoginRequest,
  LogoutRequest,
  TokenRequest,
  RefreshRequest,
  GenerateTokenRequest,
  TokenResponse,
  ValidationResponse,
  LogoutResponse,
  GrpcMethodInterface,
} from './interfaces';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==================== gRPC METHODS WITH SWAGGER ====================
  @Post('login')
  @GrpcMethod('AuthService', 'Login')
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return tokens',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { 
          type: 'string',
          example: 'user@example.com',
          description: 'User email address'
        },
        password: {
          type: 'string',
          example: 'securePassword123',
          description: 'User password'
        },
        deviceId: {
          type: 'string',
          example: 'device-12345',
          description: 'Unique device identifier'
        },
        role: {
          type: 'number',
          example: 1,
          description: 'User role (0=Admin, 1=User, 2=Manager, 3=Delivery)',
          enum: [0, 1, 2, 3]
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'JWT access token'
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'JWT refresh token'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(
  @Body() body: {
    email: string;
    password: string;
    deviceId: string;
    role: number;
  }
) {
  if (!body.email || !body.password || !body.deviceId || body.role === undefined) {
    throw new BadRequestException('Missing required fields');
  }
   return this.authService.login(
    body.email,
    body.password,
    body.deviceId,
    body.role
  );
}

  @Post('logout')
  @GrpcMethod('AuthService', 'Logout')
  @ApiOperation({
    summary: 'User logout',
    description: 'Invalidate user session and tokens',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'User ID'
        },
        deviceId: {
          type: 'string',
          example: 'device-12345',
          description: 'Device ID to logout'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Successful logout',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Logout successful'
        }
      }
    }
  })
  logout(...args: Parameters<GrpcMethodInterface<LogoutRequest, LogoutResponse>>) {
    const [data] = args;
    return this.authService.logout(data.userId, data.deviceId);
  }

  @Post('validate-token')
  @GrpcMethod('AuthService', 'ValidateToken')
  @ApiOperation({
    summary: 'Validate access token',
    description: 'Check if access token is valid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'Access token to validate'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: {
          type: 'boolean',
          example: true,
          description: 'Whether token is valid'
        },
        message: {
          type: 'string',
          example: 'Token is valid',
          description: 'Validation message'
        }
      }
    }
  })
  validateToken(...args: Parameters<GrpcMethodInterface<TokenRequest, ValidationResponse>>) {
    const [data] = args;
    return this.authService.validateAccessToken(data.accessToken);
  }

  @Post('refresh-token')
  @GrpcMethod('AuthService', 'RefreshToken')
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate new access token using refresh token',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'Refresh token'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'New tokens',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'New access token'
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'New refresh token'
        }
      }
    }
  })
  refreshToken(...args: Parameters<GrpcMethodInterface<RefreshRequest, TokenResponse>>) {
    const [data] = args;
    return this.authService.refreshTokens(data.refreshToken);
  }

  @Post('generate-token')
  @GrpcMethod('AuthService', 'GenerateToken')
  @ApiOperation({
    summary: 'Generate tokens',
    description: 'Generate new tokens for authenticated user',
  })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          example: '507f1f77bcf86cd799439011',
          description: 'User ID'
        },
        email: {
          type: 'string',
          example: 'user@example.com',
          description: 'User email'
        },
        name: {
          type: 'string',
          example: 'John Doe',
          description: 'User name'
        },
        role: {
          type: 'number',
          example: 1,
          description: 'User role',
          enum: [0, 1, 2, 3]
        },
        deviceId: {
          type: 'string',
          example: 'device-12345',
          description: 'Device ID'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Generated tokens',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'Generated access token'
        },
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOi...',
          description: 'Generated refresh token'
        }
      }
    }
  })
  generateToken(...args: Parameters<GrpcMethodInterface<GenerateTokenRequest, TokenResponse>>) {
    const [data] = args;
    return this.authService.generateTokens({
      userId: data.userId,
      email: data.email,
      name: data.name,
      role: data.role,
      deviceId: data.deviceId,
    });
  }

  // ==================== REST ENDPOINTS ====================
  @UseGuards(AuthGuard('google'))
  @Get('google')
  @ApiExcludeEndpoint()
  googleLogin() {
    return { 
      message: 'Redirecting to Google for authentication',
      url: '/auth/google/redirect' 
    };
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/redirect')
  @ApiExcludeEndpoint()
  googleRedirect() {
    return { 
      success: true,
      message: 'Google authentication successful' 
    };
  }
}