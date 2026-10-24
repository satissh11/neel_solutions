import { Router } from 'express';
import { 
  getDashboardStats, 
  getAllOrders, 
  updateOrderStatus,
  createProduct,
  deleteProduct,
  getAdminProducts,
  updateProduct,
  getCoupons,
  saveCoupon,
  saveSiteSettings,
  getSiteSettings,
} from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.get('/products', getAdminProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.get('/coupons', getCoupons);
router.post('/coupons', saveCoupon);
router.put('/coupons/:id', saveCoupon);
router.get('/settings', getSiteSettings);
router.put('/settings', saveSiteSettings);

export default router;
