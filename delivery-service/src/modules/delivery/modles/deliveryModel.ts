import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DeliveryStatus, PaymentMethod } from '../enums/deliveryEnums';

export type DeliveryDocument = Delivery & Document;

@Schema({ timestamps: true})
export class Delivery {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Order' })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'DeliveryPartner' })
  partnerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Restaurant' })
  restaurantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({
    type: {
      address: { type: String, required: true },
      mobileNumber: {type: String, required: true},
      coordinates: { 
        type: [Number],
        required: true,
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: 'Coordinates must be an array of two numbers [longitude, latitude]',
      } 
    },
  },
    required: true,
  })
  pickupLocation: {
    address: string;
    mobileNumber: string;
    coordinates: [number, number];
  };

  @Prop({
    type: {
      address: { type: String, required: true },
      mobileNumber: {type: String, required: true},
      coordinates: { type: [Number], required: true, validate: {
        validator: (coords: number[]) => coords.length === 2,
        message: 'Coordinates must be an array of two numbers [longitude, latitude]',
      } },
    },
    required: true,
  })
  deliveryLocation: {
    address: string;
    mobileNumber: string;
    coordinates: [number, number];
  };

  @Prop({
    type: String,
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING
  })
  status: string;

  @Prop({ type: Number, required: true, min: 0 })
  totalOrderAmount: number;

  @Prop({type: Number, required: true})
  deliveryFee: Number;

  @Prop({ type: String })
  notes?: string;

  @Prop({type: String, enum: PaymentMethod, required: true})
  paymentMethod: String;

  @Prop({ default: 0 })
  rating: number;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);