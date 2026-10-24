import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { INDIA_WIDE_SHIPPING, isValidIndianPin } from '../lib/shipping';

export const checkPinCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pinCode } = req.params;

    if (!isValidIndianPin(pinCode)) {
      res.status(400).json({ serviceable: false, message: 'Enter a valid 6-digit Indian PIN code.' });
      return;
    }

    const serviceable = await prisma.serviceablePinCode.findUnique({
      where: { pinCode },
      include: { zone: true }
    });

    if (serviceable && !serviceable.isActive) {
      res.status(404).json({ serviceable: false, message: 'Delivery is temporarily unavailable for this PIN code.' });
      return;
    }

    const zone = serviceable?.zone;
    res.json({
      serviceable: true,
      deliveryDays: serviceable?.deliveryDays ?? INDIA_WIDE_SHIPPING.deliveryDays,
      codAllowed: zone?.codAllowed ?? INDIA_WIDE_SHIPPING.codAllowed,
      baseFee: zone?.baseFee ?? INDIA_WIDE_SHIPPING.baseFee,
      freeAbove: zone?.freeAbove ?? INDIA_WIDE_SHIPPING.freeAbove,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check PIN code' });
  }
};

export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = typeof req.body.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const orderAmount = Number(req.body.orderAmount);
    if (!code || !Number.isFinite(orderAmount) || orderAmount <= 0) {
      res.status(400).json({ valid: false, error: 'Enter a valid coupon code and order amount.' });
      return;
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code }
    });

    if (!coupon || !coupon.isActive) {
      res.status(404).json({ valid: false, error: 'Invalid or expired coupon.' });
      return;
    }

    if (new Date() < new Date(coupon.validFrom)) {
      res.status(400).json({ valid: false, error: 'Coupon is not active yet.' });
      return;
    }

    if (coupon.validUntil && new Date() > new Date(coupon.validUntil)) {
      res.status(400).json({ valid: false, error: 'Coupon has expired.' });
      return;
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ valid: false, error: 'Coupon usage limit reached.' });
      return;
    }

    if (coupon.minOrderAmount && Number(orderAmount) < Number(coupon.minOrderAmount)) {
      res.status(400).json({ valid: false, error: `Minimum order amount of ₹${coupon.minOrderAmount} required.` });
      return;
    }

    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (Number(orderAmount) * Number(coupon.discountValue)) / 100;
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, orderAmount);

    res.json({
      valid: true,
      discount,
      code: coupon.code
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};
