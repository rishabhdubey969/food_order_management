import { Document, Schema, model } from 'mongoose';

// Define the IUser interface
export interface IUser extends Document {
  userId: string;
  orderId: string;
  restaurantId: string;
  rating: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the schema for the User model
const userSchema = new Schema<IUser>({
  userId: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  restaurantId: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  feedback: {
    type: String,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create and export the UserRating model
const UserRatingModel = model<IUser>('UserRating', userSchema);

export default UserRatingModel; // Default export for the model
