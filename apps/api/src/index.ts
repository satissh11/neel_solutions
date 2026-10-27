import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { APP_NAME } from '@neel-solutions/shared';
import { prisma } from './lib/prisma';
import { startWhatsAppQueue } from './lib/whatsapp-queue';

const app = express();
const port = Number(process.env.PORT || 5000);

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
import reviewRoutes from './routes/review.routes';
import whatsappWebhookRoutes from './routes/whatsapp-webhook.routes';

const handleHealthCheck = async (_req: express.Request, res: express.Response) => {
  let dbConnected = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbConnected = true;
  } catch {
    dbConnected = false;
  }
  // Return HTTP 200 so PaaS container supervisors (GoDaddy Airo, Docker, etc.)
  // verify the application is up and healthy, preventing the placeholder page.
  res.status(200).json({
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'unavailable',
    app: APP_NAME,
    timestamp: new Date().toISOString()
  });
};

app.use('/api/v1/health', handleHealthCheck);
app.use('/api/health', handleHealthCheck);
app.use('/health', handleHealthCheck);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/webhook', whatsappWebhookRoutes);

import crypto from 'node:crypto';
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super-secret-key-for-dev' || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('[AUTH] Warning: Set a unique JWT_SECRET of at least 32 characters in production. Using auto-generated secure runtime secret.');
}

// Export the Express app so the production web server can mount the API on
// GoDaddy's single assigned PORT. Keep standalone API startup for local use.
if (require.main === module) {
  app.listen(port, '0.0.0.0', () => {
    console.log(`[API] Server is running on port ${port}`);
    startWhatsAppQueue();
  });
}

export { app as apiApp, startWhatsAppQueue };
