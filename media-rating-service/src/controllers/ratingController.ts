import { Request, response, Response } from 'express';
import { responseHandler } from '../utils/error.handler';   
import  ratingService  from '../services/ratingService';
import  { CONSTANTS } from '../constant/ratingConstant';

 class RatingController {

 

  async addRating(req: Request, res: Response): Promise<void> {
    try {
      const result = await ratingService.addRatingService(req.body);
      responseHandler.successHandle(res, { result, message: "Rating added successfully!" });
    } catch (error) {
      responseHandler.errorHandle(res, error);
    }
  }


  async getRestaurantReviews(req: Request, res: Response): Promise<void> {
    try {
       const result = await ratingService.getRestaurantReviewsService(req.params.restaurantId);
        responseHandler.successHandle(res, {result, message: 'Rating fetch successfully!'});
    } catch (error) {
         responseHandler.errorHandle(res, error)
    }
  }


    async getAverageRating(req: Request, res: Response): Promise<void> {
   try {
        const result = await ratingService.getAverageRatingService(req.params.restaurantId);
        responseHandler.successHandle(res, {result, message: 'Average rating fetch successfully!'});
    } catch (error) {
         responseHandler.errorHandle(res, error)
    }
  }

}

export default new RatingController();