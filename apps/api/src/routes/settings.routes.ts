import { Router } from 'express';
import { getPublicSiteSettings, getSiteBrandImage } from '../controllers/admin.controller';

const router = Router();
router.get('/', getPublicSiteSettings);
router.get('/:image/:index?', getSiteBrandImage);

export default router;
