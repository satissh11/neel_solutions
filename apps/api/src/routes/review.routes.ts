import { Router } from 'express';
import { getApprovedReviews, submitReview } from '../controllers/review.controller';

const router = Router();
router.get('/', getApprovedReviews);
router.post('/', submitReview);

export default router;
