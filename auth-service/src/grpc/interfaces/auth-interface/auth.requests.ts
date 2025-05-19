export interface LoginRequest {
  email: string;
  password: string;
  deviceId: string;
  role: number;
}

export interface LogoutRequest {
  userId: string;
  deviceId: string;
}

export interface TokenRequest {
  accessToken: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface GenerateTokenRequest {
  userId: string;
  email: string;
  name: string;
  role: number;
  deviceId: string;
}