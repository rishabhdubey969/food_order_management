import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from 'database/mongo.const';

// Mongoose schema document interface
export type AddressDocument = Address & Document;

@Schema({ collection: DataBaseConst.ADDRESS, timestamps: true })
export class Address {

  @Prop({ required: true })
  user_id: string;

  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  house_no: string;

  @Prop({ required: true })
  address_location_1: string;

  @Prop()
  address_location_2?: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  postal_code: number;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

}

// Create the Mongoose schema
export const AddressSchema = SchemaFactory.createForClass(Address);

// Unique Index to prevent duplicates
AddressSchema.index({ user_id: 1, latitude: 1, longitude: 1 }, { unique: true });

