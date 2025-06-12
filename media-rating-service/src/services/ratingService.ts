import { Express } from "express";
import UserRatingModel from '../model/ratingModel';

class ratingService {

    addRatingService = async (body: any) =>{
        const newRating = new UserRatingModel(body);
        const savedRating = await newRating.save();
        return savedRating;

    }

    getRestaurantReviewsService = async () => {

    }

    getAverageRatingService = async () => {

    }

}

export default new ratingService();