import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DeliveryPartnerStatus, VehicleType } from '../enums/partnerEnumA';

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

  @Prop()
  profilePic: string;

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
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true
  }
  })
  currentLocation?: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0 })
  rating: number;

  @Prop({ default: 0 })
  totalDeliveries: number;
}

export const DeliveryPartnerSchema = SchemaFactory.createForClass(DeliveryPartner);

DeliveryPartnerSchema.index({ 'currentLocation': '2dsphere' });