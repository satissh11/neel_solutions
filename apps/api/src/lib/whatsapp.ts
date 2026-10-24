import { OrderStatus } from '@prisma/client';

export interface WhatsAppSendInput {
  orderId: string;
  status: OrderStatus;
  phone: string;
  customerName: string;
  templateName?: string;
}

export interface WhatsAppSendResult {
  providerMessageId: string;
}

const templateByStatus: Partial<Record<OrderStatus, string>> = {
  SHIPPED: process.env.WHATSAPP_TEMPLATE_DISPATCHED || 'order_dispatched',
  DISPATCHED: process.env.WHATSAPP_TEMPLATE_DISPATCHED || 'order_dispatched',
  OUT_FOR_DELIVERY: process.env.WHATSAPP_TEMPLATE_OUT_FOR_DELIVERY || 'order_out_for_delivery',
  DELIVERED: process.env.WHATSAPP_TEMPLATE_DELIVERED || 'order_delivered',
};

export function getWhatsAppTemplate(status: OrderStatus): string | null {
  return templateByStatus[status] ?? null;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_API_VERSION &&
    process.env.WHATSAPP_APP_SECRET &&
    process.env.WHATSAPP_VERIFY_TOKEN,
  );
}

function safeTemplateText(value: string, field: string): string {
  const safe = value.replace(/[\r\n]+/g, ' ').trim();
  if (!safe) throw new Error(`WhatsApp ${field} must not be empty.`);
  return safe.slice(0, 512);
}

export async function sendOrderStatusWhatsApp(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  const templateName = input.templateName || getWhatsAppTemplate(input.status);
  if (!templateName) throw new Error(`No WhatsApp template for order status ${input.status}.`);

  const apiVersion = process.env.WHATSAPP_API_VERSION || '';
  if (!/^v\d+\.\d+$/.test(apiVersion)) throw new Error('WHATSAPP_API_VERSION must look like vXX.X.');

  const origin = (process.env.WEB_ORIGIN || '').split(',')[0].trim().replace(/\/$/, '');
  if (!/^https:\/\//i.test(origin) && process.env.NODE_ENV === 'production') {
    throw new Error('WEB_ORIGIN must be the public HTTPS storefront origin in production.');
  }
  const trackingUrl = `${origin || 'http://localhost:3000'}/orders/${encodeURIComponent(input.orderId)}`;
  const recipient = input.phone.replace(/\D/g, '');
  if (!/^\d{10,15}$/.test(recipient)) throw new Error('Customer WhatsApp number must be in international digits-only format.');
  const name = safeTemplateText(input.customerName || 'Customer', 'customer name');
  const orderId = safeTemplateText(input.orderId, 'order ID');

  const parameters = [
    { type: 'text', text: name },
    { type: 'text', text: orderId },
  ];
  if (input.status !== 'DELIVERED') parameters.push({ type: 'text', text: safeTemplateText(trackingUrl, 'tracking URL') });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`https://graph.facebook.com/${apiVersion}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en' },
          components: [{ type: 'body', parameters }],
        },
      }),
    });
    const payload = await response.json().catch(() => ({})) as {
      messages?: { id?: string }[];
      error?: { code?: number | string; message?: string };
    };
    if (!response.ok) {
      const errorCode = payload.error?.code ? ` (${payload.error.code})` : '';
      throw new Error(`WhatsApp API ${response.status}${errorCode}: ${payload.error?.message || 'message send failed'}`);
    }
    const providerMessageId = payload.messages?.[0]?.id;
    if (!providerMessageId) throw new Error('WhatsApp API returned no message ID.');
    return { providerMessageId };
  } finally {
    clearTimeout(timeout);
  }
}
