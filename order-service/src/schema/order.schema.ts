import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Double } from 'mongoose';
import { OrderStatus, PaymentMethod, PaymentStatus } from 'src/order/constant/enum.constant';

export type OrderDocument = Order & Document;



export class ProductItem {
  @Prop({ required: true })
  productId: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true })
  name: string;
}


export class Address {

  @Prop({required:true})
  address:string;

  @Prop({ required: true})
  contactNumber:string;

  @Prop({ required: true})
  email:string;

  @Prop({required:true})
  latitude:Number;

  @Prop({required:true})
  longitude:Number;

}


@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  restaurantId: string;

  @Prop({ required: true ,index:true})
  cartId: string;

  @Prop({required: true, index: true })
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

  @Prop({ type:  Address, required: true })
  deliveryAddress: Address;

  @Prop({ type:  Address, required: true })
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

  @Prop()
  timestamp:Number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);


OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ restaurantId: 1, status: 1 });
OrderSchema.index({ createdAt: -1 });