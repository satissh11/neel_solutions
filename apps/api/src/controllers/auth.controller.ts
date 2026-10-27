import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import crypto from 'node:crypto';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from '@neel-solutions/shared';
import { isMailConfigured, sendMail } from '../lib/mailer';

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

// --- Password reset -------------------------------------------------------
// The reset link carries a signed, 30-minute token. It embeds a fingerprint of
// the current password hash, so it stops working as soon as the password changes
// (single use) and no extra database table is needed.
const RESET_TOKEN_MINUTES = 30;
const RESET_COOLDOWN_MS = 60 * 1000;
const lastResetRequest = new Map<string, number>();

const passwordFingerprint = (passwordHash: string) =>
  crypto.createHash('sha256').update(passwordHash).digest('hex').slice(0, 24);

const getSiteOrigin = () => {
  const configured = process.env.SITE_URL || (process.env.WEB_ORIGIN || '').split(',')[0];
  return configured.trim().replace(/\/$/, '');
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] as string));

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const genericMessage = 'If an account exists for this email, a password reset link has been sent.';
  try {
    const { email: rawEmail } = ForgotPasswordSchema.parse(req.body);
    const email = rawEmail.toLowerCase();

    const siteOrigin = getSiteOrigin();
    if (!isMailConfigured() || !siteOrigin) {
      console.warn('[Auth] Password reset requested but SMTP_HOST/SMTP_USER/SMTP_PASS or WEB_ORIGIN is not configured.');
      res.status(503).json({ error: 'Password reset email is not available right now. Please contact support.' });
      return;
    }

    const lastRequest = lastResetRequest.get(email) ?? 0;
    if (Date.now() - lastRequest < RESET_COOLDOWN_MS) {
      res.json({ message: genericMessage });
      return;
    }
    lastResetRequest.set(email, Date.now());

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = jwt.sign(
        { userId: user.id, purpose: 'password-reset', fp: passwordFingerprint(user.password) },
        getJwtSecret(),
        { expiresIn: `${RESET_TOKEN_MINUTES}m` }
      );
      const link = `${siteOrigin}/reset-password?token=${encodeURIComponent(token)}`;
      const name = escapeHtml(user.name || 'there');
      await sendMail({
        to: user.email,
        subject: 'Reset your Neel Solutions password',
        text: `Hi ${user.name || 'there'},\n\nUse this link to set a new password (valid for ${RESET_TOKEN_MINUTES} minutes):\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
        html: `<p>Hi ${name},</p><p>Use the button below to set a new password. The link is valid for ${RESET_TOKEN_MINUTES} minutes.</p><p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#789b80;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600">Reset password</a></p><p>If the button does not work, copy this link into your browser:<br>${link}</p><p>If you did not ask for this, you can ignore this email.</p>`,
      });
    }

    res.json({ message: genericMessage });
  } catch (error: any) {
    if (error?.errors) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    console.error('[Auth] Failed to send password reset email:', error?.message);
    res.status(500).json({ error: 'Could not send the reset email. Please try again later.' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const invalidLink = 'This reset link is invalid or has expired. Please request a new one.';
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);

    let payload: any;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      res.status(400).json({ error: invalidLink });
      return;
    }
    if (!payload || payload.purpose !== 'password-reset' || typeof payload.userId !== 'string') {
      res.status(400).json({ error: invalidLink });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || passwordFingerprint(user.password) !== payload.fp) {
      res.status(400).json({ error: invalidLink });
      return;
    }

    await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 10) } });
    res.json({ message: 'Password updated. Please sign in with your new password.' });
  } catch (error: any) {
    if (error?.errors) {
      res.status(400).json({ error: error.errors[0]?.message || 'Check your details and try again.' });
      return;
    }
    res.status(500).json({ error: 'Could not reset the password. Please try again.' });
  }
};
