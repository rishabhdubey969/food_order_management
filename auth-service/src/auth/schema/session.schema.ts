// session.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Session extends Document {
  @Prop({ required: true }) userId: string;
  @Prop({ required: true }) sessionId: string;
  @Prop({ required: true }) refreshToken: string;
  @Prop({ default: false }) used: boolean;
  @Prop({ required: true }) userAgent: string;
  @Prop({ required: true }) ip: string;
  @Prop({ required: true }) expiresAt: Date;
  @Prop({ default: Date.now }) createdAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
