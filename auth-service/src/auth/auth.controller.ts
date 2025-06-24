import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login.dto';
import { CONSTANTS } from 'config/constant';
import { GenerateTokenRequest, TokenRequest } from 'src/grpc/interfaces/auth-interface';
import { GrpcMethod } from '@nestjs/microservices';
import { LoginSwagger, LogoutAllSwagger, LogoutSwagger, RefreshTokenSwagger } from 'src/doc/auth.swagger';
import { AuthGuard } from 'src/guard/google-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * User login endpoint.
   * @param loginDto - User credentials (email/username and password).
   * @param req - HTTP request object.
   * @returns JWT access and refresh tokens with user info.
   */
  @Post('login')
  @LoginSwagger()
  async login(@Body() loginDto: LoginAuthDto, @Req() req: Request) {
    const user = await this.authService.validateUser(loginDto); // assume a function
    return this.authService.login(user, req);
  }

  /**
   * Refresh access token using a valid refresh token.
   * @param body - Object containing the refreshToken string.
   * @param req - HTTP request object.
   * @returns New JWT access and refresh tokens.
   */
  @Post('refresh')
  @RefreshTokenSwagger()
  async refresh(@Body() body: { refreshToken: string }, @Req() req: Request) {
    return this.authService.refreshToken(body.refreshToken, req);
  }

  /**
   * Logout from a specific session.
   * @param body - Object containing the sessionId to logout.
   * @returns Success message or status.
   */
  @Post('logout')
  @LogoutSwagger()
  async logout(@Body() body: { sessionId: string }) {
    return this.authService.logout(body.sessionId);
  }

  /**
   * Logout from all sessions for the current user.
   * @param req - HTTP request object containing authenticated user info.
   * @returns Success message or status.
   */
  @Post('logout-all')
  @UseGuards(AuthGuard)
  @LogoutAllSwagger()
  async logoutAll(@Req() req: Request & { user: any }) {
    return this.authService.logoutAll(req.user.payload.sub);
  }

  /**
   * gRPC: Generate a new token for a user.
   * @param request - Contains user id, userAgent, and ip.
   * @returns Generated JWT tokens.
   */
  @GrpcMethod('AuthService', 'GenerateToken')
  async generateToken(request: GenerateTokenRequest) {
    const req = { userAgent: request.userAgent, ip: request.ip };
    return this.authService.generateTokenService(request.id, req);
  }

  /**
   * gRPC: Validate an access token.
   * @param data - Contains the accessToken string.
   * @returns Token validation result (valid/invalid, user info if valid).
   */
  @GrpcMethod('AuthService', 'ValidateToken')
  async ValidateToken(data: TokenRequest) {
    return this.authService.ValidateTokenService(data.accessToken);
  }
}
