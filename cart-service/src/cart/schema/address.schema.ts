import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Address extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop()
  label: string;

  @Prop()
  house_no: string;

  @Prop()
  address_location_1: string;

  @Prop()
  city: string;

  @Prop()
  postal_code: number;

  @Prop()
  country: string;

  @Prop()
  latitude: number;

  @Prop()
  longitude: number;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
