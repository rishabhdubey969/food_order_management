import { Request, response, Response } from 'express';
import { responseHandler } from '../utils/error.handler';
import ratingService from '../services/ratingService';
import { CONSTANTS } from '../constant/ratingConstant';

class RatingController {
  /**
   * Adds a rating for a restaurant.
   * @param req - The request object containing the rating data
   * @param res - The response object to send the result
   */
  async addRating(req: Request, res: Response): Promise<void> {
    try {
      const result = await ratingService.addRatingService(req.body);
      responseHandler.successHandle(res, {
        result,
        message: 'Rating added successfully!',
      });
    } catch (error) {
      responseHandler.errorHandle(res, error);
    }
  }

  /**
   * Updates a rating for a restaurant.
   * @param req - The request object containing the rating data
   * @param res - The response object to send the result
   */
  async getRestaurantReviews(req: Request, res: Response): Promise<void> {
    try {
      const result = await ratingService.getRestaurantReviewsService(req.params.restaurantId);
      responseHandler.successHandle(res, {
        result,
        message: 'Rating fetch successfully!',
      });
    } catch (error) {
      responseHandler.errorHandle(res, error);
    }
  }

  /** * Gets the average rating for a restaurant.
   * @param req - The request object containing the restaurant ID
   * @param res - The response object to send the result
   */
  async getAverageRating(req: Request, res: Response): Promise<void> {
    try {
      const result = await ratingService.getAverageRatingService(req.params.restaurantId);
      responseHandler.successHandle(res, {
        result,
        message: 'Average rating fetch successfully!',
      });
    } catch (error) {
      responseHandler.errorHandle(res, error);
    }
  }
}

export default new RatingController();
