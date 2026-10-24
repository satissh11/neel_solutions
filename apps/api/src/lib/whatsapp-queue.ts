import { WhatsAppMessageState } from '@prisma/client';
import { prisma } from './prisma';
import { isWhatsAppConfigured, sendOrderStatusWhatsApp } from './whatsapp';

const maxAttempts = 6;
const retryDelaysMs = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 6 * 60 * 60_000];
let running = false;

export async function processWhatsAppQueue(): Promise<void> {
  if (running || !isWhatsAppConfigured()) return;
  running = true;
  try {
    await prisma.whatsAppMessage.updateMany({
      where: { state: 'PROCESSING', updatedAt: { lt: new Date(Date.now() - 10 * 60_000) } },
      data: { state: 'QUEUED', nextAttemptAt: new Date() },
    });
    const dueMessages = await prisma.whatsAppMessage.findMany({
      where: { state: 'QUEUED', nextAttemptAt: { lte: new Date() } },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: { id: true },
    });

    for (const candidate of dueMessages) {
      const claimed = await prisma.whatsAppMessage.updateMany({
        where: { id: candidate.id, state: 'QUEUED' },
        data: { state: 'PROCESSING', attempts: { increment: 1 } },
      });
      if (claimed.count !== 1) continue;

      const message = await prisma.whatsAppMessage.findUnique({
        where: { id: candidate.id },
        select: { id: true, orderId: true, orderStatus: true, templateName: true, recipient: true, customerName: true, attempts: true },
      });
      if (!message) continue;

      try {
        const sent = await sendOrderStatusWhatsApp({
          orderId: message.orderId,
          status: message.orderStatus,
          phone: message.recipient,
          customerName: message.customerName,
          templateName: message.templateName,
        });
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: {
            state: 'SENT',
            providerMessageId: sent.providerMessageId,
            sentAt: new Date(),
            lastErrorCode: null,
            lastErrorMessage: null,
          },
        });
      } catch (reason) {
        const detail = reason instanceof Error ? reason.message : 'Unknown WhatsApp API error.';
        const retry = message.attempts < maxAttempts;
        const nextState: WhatsAppMessageState = retry ? 'QUEUED' : 'FAILED';
        const errorCode = detail.match(/\((\d+)\)/)?.[1] || (reason instanceof Error && reason.name === 'AbortError' ? 'TIMEOUT' : 'SEND_ERROR');
        const delay = retryDelaysMs[Math.min(message.attempts - 1, retryDelaysMs.length - 1)];
        await prisma.whatsAppMessage.update({
          where: { id: message.id },
          data: {
            state: nextState,
            nextAttemptAt: retry ? new Date(Date.now() + delay) : new Date(),
            lastErrorCode: errorCode,
            lastErrorMessage: detail.slice(0, 500),
            failedAt: retry ? null : new Date(),
          },
        });
        console.error('[WhatsApp queue] send failed', { messageId: message.id, attempt: message.attempts, errorCode, retry });
      }
    }
  } catch (reason) {
    console.error('[WhatsApp queue] worker error', reason instanceof Error ? reason.message : 'Unknown error');
  } finally {
    running = false;
  }
}

export function startWhatsAppQueue(): void {
  const run = () => { void processWhatsAppQueue(); };
  run();
  setInterval(run, 15_000).unref();
}
