import { Controller,Get, Request, UseGuards  } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { GoogleAuthGuard } from './google-auth.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth() {
  }

  @Get('google/redirect')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req) {
    return req.user;
  }
  
  @GrpcMethod('AuthService', 'GenerateToken')
  async generateToken(data: GenerateTokenDto): Promise<{ accessToken: string }> {
    return this.authService.generateToken(data);
  }

  @GrpcMethod('AuthService', 'ValidateToken')
  async validateToken(data: ValidateTokenDto){
    return this.authService.validateToken(data);
  }
}

