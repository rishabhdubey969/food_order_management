
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { PartnerStatus } from '../interfaces/partnerStatus.enum';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export type DeliveryPartnerDocument = DeliveryPartner & Document;

@Schema()
export class DeliveryPartner {
  @Prop({ required: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @Prop({ required: true, unique: true })
  @IsNotEmpty()
  @IsPhoneNumber()
  phoneNumber: string;

  @Prop({ required: false })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @Prop({ required: false })
  @IsOptional()
  @IsString()
  vehicleRegistration?: string;

  @Prop({ 
    type: String,
    enum: PartnerStatus,
    default: PartnerStatus.OFFLINE
  })
  @IsOptional()
  @IsEnum(PartnerStatus)
  status?: PartnerStatus;
}

export const DeliveryPartnerSchema = SchemaFactory.createForClass(DeliveryPartner);
