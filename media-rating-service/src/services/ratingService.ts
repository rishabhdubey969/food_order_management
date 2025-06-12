import { Express } from "express";
import UserRatingModel from "../model/ratingModel";

class ratingService {
  addRatingService = async (body: any) => {
    try {
      const newRating = new UserRatingModel(body);
      const savedRating = await newRating.save();
      return savedRating;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };

  getRestaurantReviewsService = async (restaurantId: string) => {
    try {
         const getRating = await UserRatingModel.find({restaurantId});
         return getRating;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };

  getAverageRatingService = async (restaurantId: string) => {
    const reviews = await UserRatingModel.find({ restaurantId });
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const average = total / reviews.length;

    return {
      averageRating: Number(average.toFixed(1)) ?? 0,
      totalReviews: reviews.length ?? 0,
    };
  };
}

export default new ratingService();
