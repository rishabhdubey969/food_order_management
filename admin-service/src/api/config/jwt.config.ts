// src/config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'defaultSecretKey',
  expiresIn: process.env.JWT_EXPIRES_IN || '60s',
}));