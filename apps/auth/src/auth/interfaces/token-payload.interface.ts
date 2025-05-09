export interface TokenPayload {
    email: string;
    role: 'user' | 'admin';
  
    deviceId: string;
  }
  