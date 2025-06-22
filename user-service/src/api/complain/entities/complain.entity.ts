import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from 'database/mongo.const';
import { ComplainStatus } from '../complain-status.enum';

// Mongoose schema document interface
export type ComplainDocument = Complain & Document;

@Schema({ collection: DataBaseConst.COMPLAIN, timestamps: true })
export class Complain {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(ComplainStatus),
    default: ComplainStatus.Pending,
    required: true,
  })
  status: ComplainStatus;
}

// Create the Mongoose schema
export const ComplainSchema = SchemaFactory.createForClass(Complain);

// For additional indexing for performance
ComplainSchema.index({ userId: 1 });
ComplainSchema.index({ orderId: 1 });
ComplainSchema.index({ status: 1 });
