import { Router } from 'express';
import { getCart, addToCart } from '../controllers/cart.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/', getCart);
router.post('/', addToCart);

export default router;
