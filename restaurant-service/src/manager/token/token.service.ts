import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async hash(data: any) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(data, salt);
  }

  async compare(data1: any, data2: any) {
    return await bcrypt.compare(data1, data2);
  }

  sign(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your_jwt_secret',
      expiresIn: '1d',
    });
  }

  async verify(accessToken: string) {
    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: process.env.JWT_SECRET || 'your_jwt_secret',
      });
    } catch (err) {
      throw new UnauthorizedException('Invalid Credentials: Login Again!');
    }
  }
}
