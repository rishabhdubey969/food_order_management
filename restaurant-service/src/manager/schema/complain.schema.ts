import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ComplaintDocument = Complaint & Document;

@Schema({ timestamps: true })
export class Complaint {
  // @Prop({ required: true })
  // managerId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  managerId: string;


  @Prop({ enum: ['pending', 'resolved', 'rejected'], default: 'pending' })
  status: 'pending' | 'resolved' | 'rejected';

  @Prop()
  description: string;
}

export const ComplaintSchema = SchemaFactory.createForClass(Complaint);
