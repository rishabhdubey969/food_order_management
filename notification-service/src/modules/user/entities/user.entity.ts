import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class UserNotification extends Document {
  @Prop() userId: number;
  @Prop() email: string;
  @Prop() type: string;
  @Prop() message: string;
  @Prop() timestamp: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(UserNotification);
