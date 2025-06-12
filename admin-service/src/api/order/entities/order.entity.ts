import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderDocument = Order & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CASH_ON_DELIVERY = 'cash_on_delivery',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  UPI = 'upi',
}

class ProductItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  name: string;
}

class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  postalCode: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  landmark?: string;

  @Prop()
  contactNumber?: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  restaurantId: string;

  @Prop({ required: true, index: true })
  cartId: string;

  @Prop({ required: true, index: true })
  paymentId: string;

  @Prop({ 
    required: true,
    enum: PaymentMethod,
    default: PaymentMethod.CASH_ON_DELIVERY 
  })
  paymentMethod: string;

  @Prop({
    required: true,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: string;

  @Prop({ type: Address, required: true })
  deliveryAddress: Address;

  @Prop({ type: Address, required: true })
  restaurantAddress: Address;

  @Prop({ type: [ProductItem], required: true })
  items: ProductItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: true, min: 0 })
  tax: number;

  @Prop({ required: true, min: 0 })
  deliveryFee: number;

  @Prop({ required: true, min: 0 })
  platformFee: number;

  @Prop({ required: true, min: 0 })
  discount: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({
    required: true,
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: string;

  @Prop()
  cancellationReason?: string;

  @Prop()
  estimatedDeliveryTime?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });