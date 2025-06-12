import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Restaurant extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  phone: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  })
  location: {
    type: 'Point';
    coordinates: number[];
  };

  @Prop({ type: Types.ObjectId, ref: 'Manager' }) // One manager per restaurant
  managerId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: [] })
  tags: string[];

  @Prop({ default: false})
  isBlocked: boolean;

  @Prop({ default: false})
  isDeleted: boolean;
  
  @Prop({ default: null })
  DeletedAt: Date;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Enable geospatial index
RestaurantSchema.index({ location: '2dsphere' });
