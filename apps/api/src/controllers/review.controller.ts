import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const MAX_REVIEWS_PER_HOUR = 5;
const recentSubmissions = new Map<string, number[]>();

const clientKey = (req: Request) =>
  (typeof req.headers['x-forwarded-for'] === 'string' ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') || req.ip || 'unknown';

const tooManyRecent = (key: string) => {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  const recent = (recentSubmissions.get(key) || []).filter(time => time > hourAgo);
  if (recent.length >= MAX_REVIEWS_PER_HOUR) {
    recentSubmissions.set(key, recent);
    return true;
  }
  recent.push(Date.now());
  recentSubmissions.set(key, recent);
  return false;
};

// Public: approved reviews shown on the homepage. Email addresses are never returned.
export const getApprovedReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'APPROVED' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { id: true, name: true, product: true, rating: true, text: true, createdAt: true },
    });
    res.json(reviews);
  } catch (error: any) {
    console.error('[Reviews] Failed to load approved reviews:', error?.message);
    res.json([]);
  }
};

// Public: customers submit a review. It stays hidden until an admin approves it.
export const submitReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body || {};
    if (typeof body._gotcha === 'string' && body._gotcha) {
      res.status(201).json({ message: 'Thank you! Your review will appear after approval.' });
      return;
    }
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 191) : '';
    const product = typeof body.product === 'string' ? body.product.trim().slice(0, 160) : '';
    const text = typeof body.review === 'string' ? body.review.trim().slice(0, 1500) : '';
    const rating = Number(body.rating);
    if (!name || !text || !/^\S+@\S+\.\S+$/.test(email) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Please enter your name, a valid email, a rating and your review.' });
      return;
    }
    if (tooManyRecent(clientKey(req))) {
      res.status(429).json({ error: 'Too many reviews from this connection. Please try again later.' });
      return;
    }
    await prisma.review.create({ data: { name, email, product: product || null, rating, text } });
    res.status(201).json({ message: 'Thank you! Your review will appear after approval.' });
  } catch (error: any) {
    console.error('[Reviews] Failed to save review:', error?.message);
    res.status(500).json({ error: 'Could not save your review.' });
  }
};

export const getAdminReviews = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    res.json(reviews);
  } catch (error: any) {
    console.error('[Reviews] Admin list failed:', error?.message);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (status !== 'APPROVED' && status !== 'REJECTED' && status !== 'PENDING') {
      res.status(400).json({ error: 'Invalid review status.' });
      return;
    }
    const review = await prisma.review.update({ where: { id: req.params.id }, data: { status } });
    res.json(review);
  } catch (error: any) {
    console.error('[Reviews] Status update failed:', error?.message);
    res.status(500).json({ error: 'Could not update the review.' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted.' });
  } catch (error: any) {
    console.error('[Reviews] Delete failed:', error?.message);
    res.status(500).json({ error: 'Could not delete the review.' });
  }
};
