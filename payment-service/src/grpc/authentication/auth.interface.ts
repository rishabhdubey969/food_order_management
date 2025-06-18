import { Observable } from 'rxjs';

export const AUTH_PACKAGE_NAME = 'auth';
export const AUTH_SERVICE_NAME = 'AuthService';

export interface generateTokenData {
  id: string;
  userAgent: string;
  ip: string;
}

export interface accessTokenRequest {
  accessToken: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  phone: string;
  role: number;
  name: string;
}

export interface accessTokenResponse {
  isValid: boolean;
  message: string;
}

export interface generateTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface GrpcAuthService {
  GenerateToken(data: generateTokenData): Observable<generateTokenResponse>;
  ValidateToken(data: accessTokenRequest): Observable<accessTokenResponse>;
}
