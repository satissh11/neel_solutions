import { Router } from 'express';
import { checkPinCode, validateCoupon } from '../controllers/checkout.controller';

const router = Router();

router.get('/pin/:pinCode', checkPinCode);
router.post('/coupon', validateCoupon);

export default router;
