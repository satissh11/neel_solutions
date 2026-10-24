import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { RegisterSchema, LoginSchema } from '@neel-solutions/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID || undefined);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    
    const email = validatedData.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      res.status(400).json({ error: 'Email already in use' });
      return;
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email,
        password: hashedPassword,
      },
      select: { id: true, email: true, name: true, role: true }
    });

    res.status(201).json({ message: 'Account created. Please sign in to continue.' });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    
    const user = await prisma.user.findUnique({ where: { email: validatedData.email.toLowerCase() } });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error: any) {
    res.status(400).json({ error: error.errors || 'Login failed' });
  }
};

export const googleSignIn = async (req: Request, res: Response): Promise<void> => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(503).json({ error: 'Google sign-in is not configured on the server.' });
    return;
  }
  if (typeof req.body.credential !== 'string' || !req.body.credential) {
    res.status(400).json({ error: 'Google credential is required.' });
    return;
  }

  try {
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: GOOGLE_CLIENT_ID });
    const profile = ticket.getPayload();
    if (!profile?.sub || !profile.email || !profile.email_verified) {
      res.status(401).json({ error: 'Google account email could not be verified.' });
      return;
    }

    const email = profile.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true },
    });
    const user = existingUser ?? await prisma.user.create({
      data: {
        email,
        name: profile.name || email.split('@')[0],
        password: await bcrypt.hash(`${profile.sub}:${JWT_SECRET}:${Date.now()}`, 10),
      },
      select: { id: true, email: true, name: true, role: true },
    });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch {
    res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
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
