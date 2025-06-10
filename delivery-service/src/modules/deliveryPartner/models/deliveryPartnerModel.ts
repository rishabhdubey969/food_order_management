import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DeliveryPartnerStatus, VehicleType } from '../enums/partnerEnum';

export type DeliveryPartnerDocument = DeliveryPartner & Document;

@Schema({ timestamps: true })
export class DeliveryPartner {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  mobileNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  dob: Date;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop({ required: false })
  profilePic?: string;

  @Prop({
    type: {
      vehicleType: { type: String, enum: VehicleType, required: true },
      vehicleNumber: { type: String, required: true },
      vehicleColor: { type: String, required: true },
    },
    required: true,
  })
  vehicleDetails: {
    vehicleType: VehicleType;
    vehicleNumber: string;
    vehicleColor: string;
  };

  @Prop({
    type: {
      rc: { type: String, required: true },
      aadhaar: { type: String, required: true },
      dl: { type: String, required: true },
    },
    required: true,
  })
  documents: {
    rc: string;
    aadhaar: string;
    dl: string;
  };

  @Prop({
    type: String,
    enum: DeliveryPartnerStatus,
    default: DeliveryPartnerStatus.OFFLINE,
  })
  status: DeliveryPartnerStatus;

  @Prop({
    type: {
      coordinates: {
        type: [Number],
        required: false,
        validate: {
          validator: (coords: number[]) => coords.length === 2,
          message: 'Coordinates must be an array of two numbers [longitude, latitude]',
        },
      },
    },
    required: false,
  })
  currentLocation?: {
    coordinates: [number, number];
  };

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalDeliveries: number;

  @Prop({default: 0})
  totalEarnings: number;

  @Prop({ type: Boolean, default: false })
  isActive: boolean;
}

export const DeliveryPartnerSchema = SchemaFactory.createForClass(DeliveryPartner);

DeliveryPartnerSchema.index({ currentLocation: '2dsphere' });