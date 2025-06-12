export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ValidationResponse {
  isValid: boolean;
  message: string;
  userId?: string;
  role?: number;
}
