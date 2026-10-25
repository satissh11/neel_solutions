import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parseUploadedImage, productWithImageUrls } from '../lib/image';
import { OrderStatus } from '@prisma/client';
import { getWhatsAppTemplate } from '../lib/whatsapp';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalOrders = await prisma.order.count();
    const totalRevenueResult = await prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'CANCELLED' } }
    });
    
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    const totalProducts = await prisma.product.count();

    res.json({
      totalOrders,
      totalRevenue: totalRevenueResult._sum.totalAmount || 0,
      totalProducts,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } }, items: true,
        whatsappMessages: { orderBy: { createdAt: 'desc' }, select: { id: true, templateName: true, state: true, attempts: true, lastErrorCode: true, lastErrorMessage: true, createdAt: true, sentAt: true, deliveredAt: true, readAt: true } },
      }
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { user: { select: { name: true } } } });
      if (!current) return null;
      const nextStatus = status as OrderStatus;
      const order = await tx.order.update({ where: { id }, data: { status: nextStatus } });
      const changed = current.status !== nextStatus;
      const templateName = getWhatsAppTemplate(nextStatus);
      const recipient = (current.shippingPhone || '').replace(/\D/g, '');
      const internationalRecipient = recipient.length === 10 ? `91${recipient}` : recipient;
      let queued = false;
      if (changed) {
        await tx.orderStatusUpdate.create({ data: { orderId: id, status: nextStatus } });
        if (current.whatsappUpdates && templateName && /^\d{10,15}$/.test(internationalRecipient)) {
          const safeCustomerName = (current.user.name || 'Customer').replace(/[\r\n]+/g, ' ').trim().slice(0, 120) || 'Customer';
          await tx.whatsAppMessage.upsert({
            where: { orderId_orderStatus: { orderId: id, orderStatus: nextStatus } },
            create: {
              orderId: id, orderStatus: nextStatus, templateName,
              recipient: internationalRecipient, customerName: safeCustomerName,
            },
            update: {
              templateName, recipient: internationalRecipient, customerName: safeCustomerName,
              state: 'QUEUED', providerMessageId: null, attempts: 0, nextAttemptAt: new Date(),
              lastErrorCode: null, lastErrorMessage: null, sentAt: null, deliveredAt: null, readAt: null, failedAt: null,
            },
          });
          queued = true;
        }
      }
      return { order, changed, queued, optedIn: current.whatsappUpdates };
    });
    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const whatsapp = {
      queued: updated.queued,
      sent: false,
      reason: updated.queued ? 'Order status saved; WhatsApp message is queued.'
        : !updated.changed ? 'Order status did not change.'
          : updated.optedIn ? 'No message is configured for this status or the phone number is invalid.'
            : 'Customer did not opt in to WhatsApp updates.',
    };
    res.json({ order: updated.order, whatsapp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, sku, categoryId, imageUrl } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' ||
        !Number.isFinite(Number(price)) || Number(price) <= 0 ||
        !Number.isInteger(Number(stock)) || Number(stock) < 0 ||
        typeof sku !== 'string' || !sku.trim() || typeof categoryId !== 'string') {
      return res.status(400).json({ error: 'Enter a name, description, positive price, non-negative stock, SKU and category.' });
    }
    if (typeof imageUrl === 'string' && imageUrl && !parseUploadedImage(imageUrl) &&
        !/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(imageUrl)) {
      return res.status(400).json({ error: 'Enter a valid HTTPS image URL, site path, or supported uploaded image.' });
    }
    const product = await prisma.product.create({
      data: {
        name: name.trim(), description: description.trim(), price: Number(price),
        stock: Number(stock), sku: sku.trim(), categoryId,
        images: typeof imageUrl === 'string' && imageUrl.trim()
          ? { create: [{ url: imageUrl.trim(), isPrimary: true }] }
          : undefined,
      },
      include: { category: true, images: true },
    });
    return res.status(201).json(productWithImageUrls(product));
  } catch (error) {
    return res.status(400).json({ error: 'Failed to create product. Check the SKU and category.' });
  }
};

export const getAdminProducts = async (req: Request, res: Response) => {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ include: { category: true, images: true }, orderBy: { createdAt: 'desc' } }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
    ]);
    res.json({ products: products.map(productWithImageUrls), categories });
  } catch {
    res.status(500).json({ error: 'Failed to fetch product management data.' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, sku, categoryId, imageUrl, isActive } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof description !== 'string' ||
        !Number.isFinite(Number(price)) || Number(price) <= 0 ||
        !Number.isInteger(Number(stock)) || Number(stock) < 0 ||
        typeof sku !== 'string' || !sku.trim() || typeof categoryId !== 'string' || typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Product details are invalid.' });
    }
    const imageRoute = `/api/v1/products/${req.params.id}/image`;
    if (typeof imageUrl === 'string' && imageUrl && imageUrl !== imageRoute &&
        !parseUploadedImage(imageUrl) && !/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(imageUrl)) {
      return res.status(400).json({ error: 'Enter a valid HTTPS image URL, site path, or supported uploaded image.' });
    }
    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: req.params.id },
        data: { name: name.trim(), description: description.trim(), price: Number(price), stock: Number(stock), sku: sku.trim(), categoryId, isActive },
      });
      if (typeof imageUrl === 'string' && imageUrl !== imageRoute) {
        await tx.productImage.deleteMany({ where: { productId: req.params.id } });
        if (imageUrl.trim()) await tx.productImage.create({ data: { productId: req.params.id, url: imageUrl.trim(), isPrimary: true } });
      }
      return tx.product.findUnique({ where: { id: req.params.id }, include: { category: true, images: true } });
    });
    res.json(product ? productWithImageUrls(product) : product);
  } catch {
    res.status(400).json({ error: 'Failed to update product. Check the SKU and category.' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ message: 'Product hidden from the storefront.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    res.json(await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } }));
  } catch {
    res.status(500).json({ error: 'Failed to fetch coupons.' });
  }
};

export const saveCoupon = async (req: Request, res: Response) => {
  try {
    const { id, code, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil, isActive } = req.body;
    const value = Number(discountValue);
    const min = minOrderAmount === '' || minOrderAmount == null ? null : Number(minOrderAmount);
    const uses = maxUses === '' || maxUses == null ? null : Number(maxUses);
    if (typeof code !== 'string' || !code.trim() || !['PERCENTAGE', 'FIXED'].includes(discountType) ||
        !Number.isFinite(value) || value <= 0 || (discountType === 'PERCENTAGE' && value > 100) ||
        (min !== null && (!Number.isFinite(min) || min < 0)) || (uses !== null && (!Number.isInteger(uses) || uses < 1)) ||
        typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Coupon details are invalid.' });
    }
    const data = {
      code: code.trim().toUpperCase(), discountType, discountValue: value,
      minOrderAmount: min, maxUses: uses,
      validFrom: validFrom ? new Date(validFrom) : new Date(),
      validUntil: validUntil ? new Date(validUntil) : null,
      isActive,
    };
    const coupon = id
      ? await prisma.coupon.update({ where: { id }, data })
      : await prisma.coupon.create({ data });
    res.json(coupon);
  } catch {
    res.status(400).json({ error: 'Failed to save coupon. Ensure the code is unique and dates are valid.' });
  }
};

const editableSettingKeys = ['logoUrl', 'heroImageUrl', 'heroImages'] as const;
const defaultSiteSettings = { logoUrl: '', heroImageUrl: '', heroImages: '[]' };

const parseHeroImages = (value: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every(image => typeof image === 'string') ? parsed : [];
  } catch {
    return value ? [value] : [];
  }
};

export const getSiteSettings = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...editableSettingKeys] } } });
    const settings = { ...defaultSiteSettings, ...Object.fromEntries(rows.map(row => [row.key, row.value])) };
    const heroImages = parseHeroImages(rows.find(row => row.key === 'heroImages')?.value || settings.heroImageUrl);
    res.json({ ...settings, heroImages, heroImageUrl: heroImages[0] || settings.heroImageUrl || '' });
  } catch {
    res.status(500).json({ error: 'Failed to fetch site settings.' });
  }
};

export const getPublicSiteSettings = async (req: Request, res: Response) => {
  try {
    const rows = await prisma.siteSetting.findMany({ where: { key: { in: [...editableSettingKeys] } } });
    const settings = { ...defaultSiteSettings, ...Object.fromEntries(rows.map(row => [row.key, row.value])) };
    const heroImages = parseHeroImages(rows.find(row => row.key === 'heroImages')?.value || settings.heroImageUrl);
    const publicHeroImages = heroImages.map((image, index) => image.startsWith('data:image/') ? `/api/v1/settings/hero-image/${index}` : image);
    res.json({
      logoUrl: settings.logoUrl.startsWith('data:image/') ? '/api/v1/settings/logo' : settings.logoUrl,
      heroImages: publicHeroImages,
      heroImageUrl: publicHeroImages[0] || '',
    });
  } catch {
    res.json({
      logoUrl: '/brand-logo.svg',
      heroImages: [],
      heroImageUrl: '',
    });
  }
};

export const getSiteBrandImage = async (req: Request, res: Response) => {
  const imageName = req.params.image;
  if (imageName !== 'logo' && imageName !== 'hero-image') {
    res.status(404).end();
    return;
  }
  try {
    let value = '';
    if (imageName === 'logo') {
      value = (await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } }))?.value || '';
    } else {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'heroImages' } });
      const images = setting ? parseHeroImages(setting.value) : [];
      const index = Number(req.params.index ?? 0);
      value = images[index] || (!setting && index === 0 ? (await prisma.siteSetting.findUnique({ where: { key: 'heroImageUrl' } }))?.value || '' : '');
    }
    const image = parseUploadedImage(value);
    if (!image) {
      res.status(404).end();
      return;
    }
    res.set({ 'Content-Type': image.mimeType, 'Cache-Control': 'public, max-age=300' });
    res.send(image.bytes);
  } catch {
    res.status(500).end();
  }
};

export const saveSiteSettings = async (req: Request, res: Response) => {
  try {
    const { logoUrl } = req.body;
    const heroImages: unknown = Array.isArray(req.body.heroImages) ? req.body.heroImages : req.body.heroImageUrl ? [req.body.heroImageUrl] : [];
    if (typeof logoUrl !== 'string' || !Array.isArray(heroImages) || heroImages.length > 6 || !heroImages.every(image => typeof image === 'string')) {
      return res.status(400).json({ error: 'Provide a logo and up to six homepage images.' });
    }
    const entries = [['logoUrl', logoUrl], ['heroImageUrl', heroImages[0] || ''], ['heroImages', JSON.stringify(heroImages)]] as const;
    for (const [key, value] of entries) {
      if (key === 'heroImages') continue;
      if (typeof value !== 'string') return res.status(400).json({ error: `Invalid image value for ${key}.` });
      if (key === 'heroImageUrl' && value !== (heroImages[0] || '')) continue;
      if (!value) continue;
      if (value.startsWith('data:')) {
        if (!parseUploadedImage(value)) {
          return res.status(400).json({ error: 'The uploaded file is not a valid PNG, JPEG, or WebP image or exceeds 5 MB.' });
        }
      } else if (value.length > 2048 || !(/^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(value))) {
        return res.status(400).json({ error: `Enter a valid HTTPS image URL or site-relative path for ${key}.` });
      }
    }
    for (const [index, image] of heroImages.entries()) {
      const valid = image.startsWith('data:') ? Boolean(parseUploadedImage(image)) : image.length <= 2048 && /^(https:\/\/[^\s]+|\/(?!\/)[^\s]*)$/i.test(image);
      if (!valid) return res.status(400).json({ error: `Homepage image ${index + 1} must be a supported upload, HTTPS URL, or site path.` });
    }
    await prisma.$transaction(entries.map(([key, value]) => prisma.siteSetting.upsert({
      where: { key }, create: { key, value }, update: { value },
    })));
    res.json({ logoUrl, heroImages });
  } catch {
    res.status(500).json({ error: 'Failed to save site settings.' });
  }
};
