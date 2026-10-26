import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { RegisterSchema, LoginSchema } from '@neel-solutions/shared';

const getJwtSecret = () => process.env.JWT_SECRET || 'super-secret-key-for-dev';
const getGoogleClientId = () => process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const email = validatedData.email.toLowerCase();

    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch (e: any) {
      console.warn('[Auth] Database error on register check:', e.message);
      res.status(503).json({ error: 'Database is currently unavailable. Please check DATABASE_URL in your hosting settings.' });
      return;
    }

    if (existingUser) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    await prisma.user.create({
      data: {
        name: validatedData.name,
        email,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true }
    });

    res.status(201).json({ message: 'Account created. Please sign in to continue.' });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const email = validatedData.email.toLowerCase();
    
    let user = null;
    let dbError = null;
    try {
      user = await prisma.user.findUnique({ where: { email } });
    } catch (e: any) {
      dbError = e;
      console.warn('[Auth] Database error on login:', e.message);
    }

    if (dbError) {
      // Keep the preview fallback configurable and out of source control.
      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@neelsolutions.in').toLowerCase();
      const isDefaultAdmin = Boolean(process.env.ADMIN_PASSWORD) && email === adminEmail && validatedData.password === process.env.ADMIN_PASSWORD;
      if (isDefaultAdmin) {
        const demoAdmin = {
          id: 'admin-preview-user',
          email: adminEmail,
          name: 'Admin',
          role: 'ADMIN'
        };
        const token = jwt.sign({ userId: demoAdmin.id, role: demoAdmin.role }, getJwtSecret(), { expiresIn: '7d' });
        res.json({ user: demoAdmin, token });
        return;
      }
      res.status(503).json({ error: 'Database is currently unavailable. Please verify DATABASE_URL in your hosting settings.' });
      return;
    }

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || 'Login failed' });
  }
};

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  const googleClientId = getGoogleClientId();
  if (!googleClientId) {
    res.status(503).json({ error: 'Google sign-in is not configured. Please set GOOGLE_CLIENT_ID (or NEXT_PUBLIC_GOOGLE_CLIENT_ID) in your hosting settings.' });
    return;
  }
  if (typeof req.body.credential !== 'string' || !req.body.credential) {
    res.status(400).json({ error: 'Google credential is required.' });
    return;
  }

  try {
    const client = new OAuth2Client(googleClientId);
    const ticket = await client.verifyIdToken({ idToken: req.body.credential, audience: googleClientId });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || !profile.email_verified) {
      res.status(401).json({ error: 'Google account email could not be verified.' });
      return;
    }

    const email = profile.email.toLowerCase();
    let user = null;
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true },
      });
      user = existingUser ?? await prisma.user.create({
        data: {
          email,
          name: profile.name || email.split('@')[0],
          password: await bcrypt.hash(`${profile.sub}:${getJwtSecret()}:${Date.now()}`, 10),
        },
        select: { id: true, email: true, name: true, role: true },
      });
    } catch (dbErr: any) {
      console.warn('[Auth] Database error on Google sign-in. Using verified profile for preview session:', dbErr.message);
      user = {
        id: `google-${profile.sub}`,
        email,
        name: profile.name || email.split('@')[0],
        role: 'CUSTOMER',
      };
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err: any) {
    console.error('[Google sign-in error]', err.message);
    res.status(401).json({ error: 'Google verification failed. Ensure this domain is added to Authorized JavaScript Origins in Google Cloud Console.' });
  }
};

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore - added by auth middleware
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (userId === 'admin-preview-user') {
      res.json({ user: { id: 'admin-preview-user', email: 'admin@neelsolutions.in', name: 'Admin', role: 'ADMIN' } });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
