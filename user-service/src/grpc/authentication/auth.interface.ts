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

export interface PaymentById {
  orderid: number;
}

export interface GrpcAuthService {
    GenerateToken(data) : Observable<TokenData>;
}