import { Router } from 'express';
import { placeOrder, getMyOrders, getOrderById } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);

export default router;
