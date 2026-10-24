import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request, Router } from 'express';
import { WhatsAppMessageState } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/', (req, res) => {
  const mode = String(req.query['hub.mode'] ?? '');
  const token = String(req.query['hub.verify_token'] ?? '');
  const challenge = String(req.query['hub.challenge'] ?? '');
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!verifyToken) { res.status(503).send('WhatsApp webhook verification is not configured.'); return; }
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    res.status(200).type('text/plain').send(challenge);
    return;
  }
  res.sendStatus(403);
});

type MetaStatusEvent = {
  id?: string;
  status?: string;
  timestamp?: string;
  errors?: { code?: number | string; title?: string; message?: string; error_data?: { details?: string } }[];
};

const states: Partial<Record<string, WhatsAppMessageState>> = {
  sent: 'SENT', delivered: 'DELIVERED', read: 'READ', failed: 'FAILED',
};
const stateRank: Record<WhatsAppMessageState, number> = {
  QUEUED: 0, PROCESSING: 0, SENT: 1, DELIVERED: 2, READ: 3, FAILED: 4,
};

router.post('/', async (req, res) => {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const signature = req.get('x-hub-signature-256') || '';
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!appSecret || !rawBody) { res.status(503).send('WhatsApp webhook signature validation is not configured.'); return; }
  const expected = `sha256=${createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
  const suppliedBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    res.sendStatus(401);
    return;
  }

  const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
  let statusesReceived = 0;
  try {
    for (const entry of entries) {
      const changes = Array.isArray(entry?.changes) ? entry.changes : [];
      for (const change of changes) {
        const statuses: MetaStatusEvent[] = Array.isArray(change?.value?.statuses) ? change.value.statuses : [];
        statusesReceived += statuses.length;
        for (const event of statuses) {
          const state = states[event.status || ''];
          if (!state || !event.id) continue;
          const record = await prisma.whatsAppMessage.findUnique({ where: { providerMessageId: event.id } });
          if (!record) {
            console.warn('[WhatsApp webhook] status for unknown provider message', { state, providerMessageId: event.id });
            continue;
          }

          const eventTime = event.timestamp && /^\d+$/.test(event.timestamp)
            ? new Date(Number(event.timestamp) * 1000)
            : new Date();
          const providerError = event.errors?.[0];
          const errorCode = providerError?.code == null ? null : String(providerError.code);
          const errorMessage = (providerError?.error_data?.details || providerError?.message || providerError?.title || '').replace(/[\r\n]+/g, ' ').slice(0, 500) || null;
          const isFailed = state === 'FAILED';
          const shouldAdvance = isFailed || stateRank[state] >= stateRank[record.state];
          if (!shouldAdvance) continue;

          await prisma.whatsAppMessage.update({
            where: { id: record.id },
            data: {
              state,
              ...(state === 'SENT' ? { sentAt: eventTime } : {}),
              ...(state === 'DELIVERED' ? { deliveredAt: eventTime } : {}),
              ...(state === 'READ' ? { readAt: eventTime } : {}),
              ...(isFailed ? { failedAt: eventTime } : {}),
              ...(isFailed ? { lastErrorCode: errorCode || 'META_DELIVERY_FAILED', lastErrorMessage: errorMessage || 'Meta reported message delivery failure.' } : {}),
            },
          });
          if (isFailed) console.error('[WhatsApp webhook] delivery failed', { orderId: record.orderId, errorCode, errorMessage });
        }
      }
    }
    console.info('[WhatsApp webhook] status events processed', { entries: entries.length, statuses: statusesReceived });
    res.sendStatus(200);
  } catch (reason) {
    console.error('[WhatsApp webhook] could not persist status events', reason instanceof Error ? reason.message : 'Unknown error');
    res.sendStatus(500);
  }
});

export default router;
