import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { INDIA_WIDE_SHIPPING, isValidIndianPin } from '../lib/shipping';

const RETURN_WINDOW_DAYS = 7;
const RETURN_REASONS = ['Damaged or defective item', 'Wrong item received', 'Item not as described', 'No longer needed', 'Other'];

// Returns are allowed for delivered orders within RETURN_WINDOW_DAYS of delivery.
const getReturnInfo = (order: { status: string; updatedAt: Date; statusUpdates?: { status: string; createdAt: Date }[]; returnRequest?: unknown | null }, returnDataLoaded = true) => {
  if (!returnDataLoaded || order.status !== 'DELIVERED') return { returnEligible: false, returnDeadline: null as Date | null };
  const delivered = [...(order.statusUpdates || [])].reverse().find(update => update.status === 'DELIVERED');
  const deliveredAt = delivered?.createdAt ?? order.updatedAt;
  const returnDeadline = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return { returnEligible: !order.returnRequest && new Date() <= returnDeadline, returnDeadline };
};

export const placeOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { items, shippingPin, shippingAddr, shippingPhone, whatsappUpdates = false, paymentMethod = 'COD' } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.some((item: any) =>
      typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
      res.status(400).json({ error: 'Order must contain at least one item.' });
      return;
    }
    if (typeof shippingPin !== 'string' || !isValidIndianPin(shippingPin) || typeof shippingAddr !== 'string' || !shippingAddr.trim()) {
      res.status(400).json({ error: 'Enter a valid six-digit delivery PIN and address.' });
      return;
    }
    const normalizedPhone = typeof shippingPhone === 'string' ? shippingPhone.replace(/\D/g, '') : '';
    const nationalPhone = normalizedPhone.startsWith('91') && normalizedPhone.length === 12 ? normalizedPhone.slice(2) : normalizedPhone;
    if (!/^[6-9]\d{9}$/.test(nationalPhone)) {
      res.status(400).json({ error: 'Enter a valid 10-digit Indian mobile number.' });
      return;
    }
    if (typeof whatsappUpdates !== 'boolean') {
      res.status(400).json({ error: 'Invalid WhatsApp update preference.' });
      return;
    }
    if (paymentMethod !== 'COD') {
      res.status(400).json({ error: 'Only Cash on Delivery is currently available.' });
      return;
    }

    // Transactional checkout: verify prices, check stock, create order atomically
    const order = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });

        if (!product || !product.isActive) {
          throw new Error(`Product ${item.productId} is not available.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
        }

        const lineTotal = Number(product.price) * item.quantity;
        totalAmount += lineTotal;

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: item.quantity,
        });
      }

      // Check PIN
      const serviceable = await tx.serviceablePinCode.findUnique({
        where: { pinCode: shippingPin },
        include: { zone: true }
      });
      
      if (serviceable && !serviceable.isActive) {
        throw new Error('Delivery is not available for this PIN code.');
      }
      const shippingZone = serviceable?.zone;
      const codAllowed = shippingZone?.codAllowed ?? INDIA_WIDE_SHIPPING.codAllowed;
      if (paymentMethod === 'COD' && !codAllowed) {
        throw new Error('COD is not available for this PIN code.');
      }

      const baseFee = Number(shippingZone?.baseFee ?? INDIA_WIDE_SHIPPING.baseFee);
      const freeAbove = shippingZone?.freeAbove != null ? Number(shippingZone.freeAbove) : INDIA_WIDE_SHIPPING.freeAbove;
      const shippingFee = totalAmount >= freeAbove ? 0 : baseFee;

      // Handle Coupon
      let discountAmount = 0;
      let appliedCouponId = null;

      if (req.body.couponCode) {
        const couponCode = typeof req.body.couponCode === 'string' ? req.body.couponCode.trim().toUpperCase() : '';
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (!coupon || !coupon.isActive) throw new Error('Invalid coupon code.');
        if (new Date() < new Date(coupon.validFrom)) throw new Error('Coupon is not active yet.');
        if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) throw new Error('Coupon expired.');
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new Error('Coupon usage limit reached.');
        if (coupon.minOrderAmount && totalAmount < Number(coupon.minOrderAmount)) throw new Error('Minimum order amount not met for coupon.');

        discountAmount = coupon.discountType === 'PERCENTAGE' 
          ? (totalAmount * Number(coupon.discountValue)) / 100 
          : Number(coupon.discountValue);
        discountAmount = Math.min(discountAmount, totalAmount);
        
        appliedCouponId = coupon.id;

        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }

      const finalTotal = totalAmount + shippingFee - discountAmount;

      // Create the order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: finalTotal > 0 ? finalTotal : 0,
          shippingFee,
          taxAmount: 0,
          shippingPin,
          shippingAddr,
          shippingPhone: `91${nationalPhone}`,
          whatsappUpdates,
          status: 'PENDING',
          items: { create: orderItemsData },
          statusUpdates: { create: { status: 'PENDING' } },
        },
        include: { items: true },
      });

      if (appliedCouponId) {
        await tx.couponRedemption.create({
          data: {
            couponId: appliedCouponId,
            userId,
            orderId: newOrder.id,
            discount: discountAmount
          }
        });
      }

      return newOrder;
    });

    res.status(201).json({ order, message: 'Order placed successfully!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to place order.' });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  // @ts-ignore
  const userId = req.user.userId;
  const baseInclude = {
    items: { include: { product: { select: { name: true } } } },
    statusUpdates: { orderBy: { createdAt: 'asc' as const } },
  };
  try {
    let returnDataLoaded = true;
    let orders: any[];
    try {
      orders = await prisma.order.findMany({
        where: { userId },
        include: { ...baseInclude, returnRequest: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (returnError: any) {
      // Keep orders working even if the OrderReturn table or client is not ready yet.
      console.error('[Orders] Loading return requests failed, retrying without them:', returnError?.message);
      returnDataLoaded = false;
      orders = await prisma.order.findMany({ where: { userId }, include: baseInclude, orderBy: { createdAt: 'desc' } });
    }
    res.json(orders.map(order => ({ ...order, ...getReturnInfo(order, returnDataLoaded) })));
  } catch (error: any) {
    console.error('[Orders] Failed to fetch orders:', error?.message);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const baseInclude = { items: true, statusUpdates: { orderBy: { createdAt: 'asc' as const } } };
    let returnDataLoaded = true;
    let order: any;
    try {
      order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { ...baseInclude, returnRequest: true } });
    } catch (returnError: any) {
      console.error('[Orders] Loading return request failed, retrying without it:', returnError?.message);
      returnDataLoaded = false;
      order = await prisma.order.findUnique({ where: { id: req.params.id }, include: baseInclude });
    }

    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
    // Prevent customers from accessing other customers' orders
    if (order.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }

    res.json({ ...order, ...getReturnInfo(order, returnDataLoaded) });
  } catch (error: any) {
    console.error('[Orders] Failed to fetch order:', error?.message);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

export const requestReturn = async (req: Request, res: Response): Promise<void> => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const details = typeof req.body.details === 'string' ? req.body.details.trim().slice(0, 1000) : '';
    if (!RETURN_REASONS.includes(reason)) {
      res.status(400).json({ error: 'Please choose a reason for the return.' });
      return;
    }

    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { statusUpdates: { orderBy: { createdAt: 'asc' } }, returnRequest: true },
    });
    if (!order) { res.status(404).json({ error: 'Order not found.' }); return; }
    if (order.userId !== userId) { res.status(403).json({ error: 'Forbidden.' }); return; }
    if (order.status !== 'DELIVERED') {
      res.status(400).json({ error: 'Returns can only be requested after the order is delivered.' });
      return;
    }
    if (order.returnRequest) {
      res.status(400).json({ error: 'A return has already been requested for this order.' });
      return;
    }
    if (!getReturnInfo(order).returnEligible) {
      res.status(400).json({ error: `The ${RETURN_WINDOW_DAYS}-day return window for this order has ended.` });
      return;
    }

    const returnRequest = await prisma.orderReturn.create({
      data: { orderId: order.id, reason, details: details || null },
    });
    res.status(201).json({ returnRequest, message: 'Return request submitted. We will review it and get back to you.' });
  } catch (error: any) {
    console.error('[Orders] Could not submit return request:', error?.message);
    res.status(500).json({ error: 'Could not submit the return request.' });
  }
};
