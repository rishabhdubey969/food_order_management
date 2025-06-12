import { Router } from 'express';
import RatingController from '../controllers/ratingController';
const router = Router();

// api/ratings
router.post('/ratings', RatingController.addRating);
router.get('/ratings/:restaurantId', RatingController.getRestaurantReviews);
router.get('/ratings/:restaurantId/average', RatingController.getAverageRating);

export default router;      