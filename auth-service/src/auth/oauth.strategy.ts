import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID|| "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET||"",
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
      passReqToCallback: true, 
    });
  }

  async validate(req: any, accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const { name, emails } = profile;
    const user = {
      name: name.givenName,
      email: emails[0].value,
      role: 'user',
      deviceId: 'oauth',
      userId: profile.id,
    };
    done(null, user);
  }
}
