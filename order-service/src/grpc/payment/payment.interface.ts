import { Observable } from "rxjs";

export const PAYMENT_PACKAGE_NAME = 'payment';
export const PAYMENT_SERVICE_NAME = 'PaymentService';

export interface Payment {
  paymentID: string;
  paymentStatus: string;
}

export interface PaymentById {
  orderid: number;
}

export interface PaymentService {
    GetPayStatus(data: {orderId: string}) : Observable<Payment>;
}
