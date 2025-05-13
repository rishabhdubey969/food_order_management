import { Observable } from "rxjs";

export const AUTH_PACKAGE_NAME = 'auth';
export const AUTH_SERVICE_NAME = 'AuthService';

export interface Payment {
  paymentID: string;
  paymentStatus: string;
  paymentmessage: number;
  paymentmode: number;
}

export interface PaymentById {
  orderid: number;
}

export interface GrpcAuthService {
    ValidateToken(data: {accessToken: string}) : Observable<Payment>;
}