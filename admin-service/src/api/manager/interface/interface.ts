import { Observable } from "rxjs";


export interface ManagerServiceGrpc {
  Signup(data: GetSignUpRequest): Observable<GetSignUpResponse>;
 
}
export interface GetSignUpRequest {
  name: string; 
  email: string;
  phone: string;
  password: string;
  restaurant_id: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}
export interface GetSignUpResponse {
  message: String;
  data: ManagerData;
}



export interface ManagerData {
  id: String;
  name: String;
  email: String;
  phone: String;
  password: String;
  restaurantId: String;
  accountNumber: String;
  ifscCode: String;
  bankName: String;
}
