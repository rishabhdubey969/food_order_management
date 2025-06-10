import { Observable } from "rxjs";

export const AUTH_PACKAGE_NAME = 'auth';
export const AUTH_SERVICE_NAME = 'AuthService';


export interface TokenValidationResponse {
    isValid:boolean;
    message:string;
}
export interface PaymentById {
  orderid: number;
}
export interface TokenResponse {
    accessToken:string;
    refreshToken:string;
    // google.protobuf.Struct userData = 3;
  }
export interface AuthService {
    ValidateToken (data:{ValidateTokenRequest:string}): Observable<TokenValidationResponse>;
    GenerateToken (GenerateTokenRequest): Observable<TokenResponse>;
}
