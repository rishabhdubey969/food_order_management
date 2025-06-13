import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login.dto';
import { CONSTANTS } from 'config/constant';
import {
  GenerateTokenRequest,
  TokenRequest,
  TokenResponse,
  ValidationResponse,
} from 'src/grpc/interfaces/auth-interface';
import { GrpcMethod } from '@nestjs/microservices';
import { LoginSwagger, LogoutAllSwagger, LogoutSwagger, RefreshTokenSwagger } from 'src/doc/auth.swagger';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @LoginSwagger()
  async login(@Body() loginDto: LoginAuthDto, @Req() req: Request) {
    const user = await this.authService.validateUser(loginDto); // assume a function
    return this.authService.login(user, req);
  }

  @Post('refresh')
  @RefreshTokenSwagger()
  async refresh(@Body() body: { refreshToken: string }, @Req() req: Request) {
    return this.authService.refreshToken(body.refreshToken, req);
  }

  @Post('logout')
  @LogoutSwagger()
  async logout(@Body() body: { sessionId: string }) {
    return this.authService.logout(body.sessionId);
  }

  @Post('logout-all')
  @LogoutAllSwagger()
  async logoutAll(@Req() req) {
    return this.authService.logoutAll(req.user.sub);
  }

  @GrpcMethod('AuthService', 'GenerateToken')
  async generateToken(request: GenerateTokenRequest) {
    const req = { userAgent: request.userAgent, ip: request.ip };
    return this.authService.generateTokenService(request.id, req);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async ValidateToken(data: TokenRequest) {
    return this.authService.ValidateTokenService(data.accessToken);
  }
}
