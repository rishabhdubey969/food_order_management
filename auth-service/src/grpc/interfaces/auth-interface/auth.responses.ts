export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  phone: string;
  role: number;
}
export interface ValidationResponse {
  isValid: boolean;
  message: string;
  payload: TokenPayload;
}

