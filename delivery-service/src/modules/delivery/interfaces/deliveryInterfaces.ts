import { Types } from "mongoose";
import { PaymentMethod } from "../enums/deliveryEnums";
import { Delivery } from "../modles/deliveryModel";

export interface Location {
  address: string;
  mobileNumber: string;
  coordinates: [number, number];
}

export interface CompleteDelivery{ 
  orderId: Types.ObjectId;
  restaurantId: string;
  userId: string;
  pickupLocation: Location;
  deliveryLocation: Location;
  totalOrderAmount: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
}


export type DriverLocationResult = [string | null];


export interface PaginatedDeliveries {
  data: Delivery[];
  total: number;
  page: number;
  limit: number;
}