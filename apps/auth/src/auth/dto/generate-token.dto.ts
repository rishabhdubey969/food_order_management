export class GenerateTokenDto {
    email: string;
    role: 'user' | 'admin';
    sessionId: string;
    deviceId: string;
  }
  