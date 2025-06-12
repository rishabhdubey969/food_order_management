import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { DataBaseConst } from 'database/mongo.const';

// Mongoose schema document interface
export type ProfileDocument = Profile & Document;

@Schema({ collection: DataBaseConst.USER, timestamps: true })
export class Profile {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  date_of_birth: Date;

  @Prop({ required: true })
  country: string;

  @Prop()
  image: string;
}

// Create the Mongoose schema
export const ProfileSchema = SchemaFactory.createForClass(Profile);
