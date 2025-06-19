import { Express } from "express";
import UserRatingModel from "../model/ratingModel";

class ratingService {
    
  /**
   * Adds a rating for a restaurant.
   * @param body - The request body containing the rating data
   * @returns The saved rating document
   */
  addRatingService = async (body: any) => {
    try {
      const newRating = new UserRatingModel(body);
      const savedRating = await newRating.save();
      return savedRating;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };

  /**
   * Retrieves all reviews for a specific restaurant.
   * @param restaurantId - The ID of the restaurant
   * @returns An array of rating documents for the specified restaurant
   */
  getRestaurantReviewsService = async (restaurantId: string) => {
    try {
         const getRating = await UserRatingModel.find({restaurantId});
         return getRating;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  };

  /**
   * Calculates the average rating and total reviews for a specific restaurant.
   * @param restaurantId - The ID of the restaurant
   * @returns An object containing the average rating and total number of reviews
   */
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
