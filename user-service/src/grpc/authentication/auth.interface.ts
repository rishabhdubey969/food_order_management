import { Observable } from "rxjs";

export const AUTH_PACKAGE_NAME = 'auth';
export const AUTH_SERVICE_NAME = 'AuthService';

export interface TokenData {
  id: string;
  email: string;
  phone: number;
  role: number;
  isActive: boolean;
}

export interface accessTokenRequest {
  accessToken: string;
}

export interface accessTokenResponse {
  isValid: boolean;
  message: string;
}


export interface GrpcAuthService {
    ValidateToken(accessToken): Observable<accessTokenResponse>;
    GenerateToken(data) : Observable<TokenData>;
}
