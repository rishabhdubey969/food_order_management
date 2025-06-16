export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  role: number;
  deviceId: string;
}

export interface ValidationResponse {
  isValid: boolean;
  message: string;
  payload: Record<string, any>;
}



