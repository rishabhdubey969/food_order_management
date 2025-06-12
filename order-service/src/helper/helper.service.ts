import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class helperService {
  constructor(private jwtService: JwtService) {}

  async generateToken(user: any) {
    const payload = { id: user.id, email: user.email };
    const token = await this.jwtService.sign(payload,{ expiresIn: '1h' });
    // console.log(token);
    return token ;
  }

  async verifyToken(token: string) {
    try {
      return await this.jwtService.verify(token);
    } catch (err) {
      return { error: 'Invalid token' };
    }
  }
}