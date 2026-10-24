import { Router } from 'express';
import { register, login, googleSignIn, getMe } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);
router.get('/me', requireAuth, getMe);

export default router;
