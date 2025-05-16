export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface ValidationResponse {
  isValid: boolean;
  message: string;
}

export interface LogoutResponse {
  message: string;
}