import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@neel-solutions/shared';
import { prisma } from './lib/prisma';
import { startWhatsAppQueue } from './lib/whatsapp-queue';

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = (process.env.WEB_ORIGIN || 'http://localhost:3000')
  .split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({
  limit: '45mb',
  verify: (req, _res, buffer) => {
    (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
  },
}));

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';
import checkoutRoutes from './routes/checkout.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import whatsappWebhookRoutes from './routes/whatsapp-webhook.routes';

app.use('/api/v1/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', app: APP_NAME, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', database: 'unavailable', app: APP_NAME, timestamp: new Date().toISOString() });
  }
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/webhook', whatsappWebhookRoutes);

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-key-for-dev' || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Set a unique JWT_SECRET of at least 32 characters before starting in production.');
}

app.listen(port, () => {
  console.log(`[API] Server is running on port ${port}`);
  startWhatsAppQueue();
});
