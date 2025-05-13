import { Controller, Get, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken({ accessToken }: { accessToken: string }) {
    console.log(accessToken);
    return await this.authService.validateAccessToken(accessToken);
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken({ refreshToken }: { refreshToken: string }) {
    return await this.authService.refreshAccessToken(refreshToken);
  }
  @GrpcMethod('AuthService', 'GenerateToken')
  async generateToken(payload) {
    return this.authService.generateTokens(payload);
  }
  @UseGuards(AuthGuard('google'))
  @Get('google')
  async googleLogin() {
    return 'This route will redirect you to Google for authentication';
  }

  @UseGuards(AuthGuard('google'))
  @Get('google/redirect')
  googleRedirect() {
  
    return 'Google Authentication successful, now you can handle your post-login logic here';
  }
}