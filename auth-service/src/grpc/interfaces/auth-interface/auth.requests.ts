export interface TokenRequest {
  accessToken: string;
}

export interface GenerateTokenRequest {
  id: string;
  userAgent: string;
  ip: string;
}