import { registerAs } from '@nestjs/config';

export default registerAs('user', () => ({
  defaultListLimit: 10,
  maxListLimit: 100,
  defaultRole: 'users',
}));