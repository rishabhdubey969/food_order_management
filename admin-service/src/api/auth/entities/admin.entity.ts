// import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// @Schema({ timestamps: true })
// export class Admin extends Document {
//   @Prop({ required: true, unique: true })
//   email: string;

//   @Prop({ required: true, select: false })
//   password: string;

//   @Prop({ required: true })
//   name: string;

//   @Prop({ required: true, default: 0 })
//   phone: number;

//   @Prop({ required: true, default: 1 }) // 1 for admin role
//   role: number;

//   @Prop({ required: true, default: true })
//   is_active: boolean;

//   @Prop({ required: true, default: false })
//   is_verified: boolean;

//   @Prop({ required: true, default: false })
//   is_deleted: boolean;

//   @Prop()
//   otp?: string;

//   @Prop()
//   deviceId: string;

//   @Prop()
//   otpExpires?: Date;

//   @Prop()
//   resetToken?: string;

//   @Prop()
//   resetTokenExpires?: Date;
// }

// export const AdminSchema = SchemaFactory.createForClass(Admin);