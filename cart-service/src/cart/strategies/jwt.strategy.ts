import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: 'jwt-secret',
    });
    console.log('JWT Strategy initialized');
  }

  async validate(payload: any) {
    console.log('Payload received in validate:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
