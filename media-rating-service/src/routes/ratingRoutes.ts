import { Router } from 'express';
import { addRating, getRestaurantReviews, getAverageRating } from '../controllers/ratingController';
const router = Router();

// api/ratings
router.post('/ratings', addRating);
router.get('/ratings/:restaurantId', getRestaurantReviews);
router.get('/ratings/:restaurantId/average', getAverageRating);

export default router;