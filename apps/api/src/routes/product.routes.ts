import { Router } from 'express';
import { getProducts, getProductById, getProductImage } from '../controllers/product.controller';

const router = Router();

router.get('/', getProducts);
router.get('/:id/image', getProductImage);
router.get('/:id', getProductById);

export default router;
