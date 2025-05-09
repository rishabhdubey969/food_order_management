import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenDto } from './dto/generate-token.dto';
import { ValidateTokenDto } from './dto/validate-token.dto';
import { TokenPayload } from './interfaces/token-payload.interface';
import { JWT_SECRET } from '../auth/common/constants';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateToken(dto: GenerateTokenDto): Promise<{ accessToken: string }> {
    const payload: TokenPayload = {
      email: dto.email,
      role: dto.role,
      deviceId: dto.deviceId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: JWT_SECRET,
      expiresIn: '1h',
    });

    return { accessToken };
  }

  async validateToken(dto: ValidateTokenDto){
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(dto.accessToken, {
        secret: JWT_SECRET,
      });
      if(!payload) throw new UnauthorizedException('Invalid or expired token');
      
      return payload.email,payload.role;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
