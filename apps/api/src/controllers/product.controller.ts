import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parseUploadedImage, productWithImageUrls } from '../lib/image';

export const FALLBACK_PRODUCTS = [
  {
    id: 'prod-tulsi-001',
    name: 'Tulsi — Natural Heritage',
    description: 'Discover the natural heritage of tulsi with this wellness product. Handcrafted to support immunity, vitality, and inner balance.',
    price: 2499.00,
    stock: 100,
    sku: 'NS-WHEY-001',
    isActive: true,
    categoryId: 'cat-supplements',
    category: {
      id: 'cat-supplements',
      name: 'Health Supplements',
      description: 'Premium supplements for a healthy lifestyle',
    },
    images: [
      {
        id: 'img-tulsi-1',
        url: '/images/tulsi.svg',
        productId: 'prod-tulsi-001',
        isPrimary: true,
      }
    ]
  },
  {
    id: 'prod-moringa-002',
    name: 'Moringa',
    description: 'A 100% organic moringa-based superfood product for your everyday wellness routine. Rich in essential nutrients and antioxidants.',
    price: 899.00,
    stock: 200,
    sku: 'NS-VITA-002',
    isActive: true,
    categoryId: 'cat-supplements',
    category: {
      id: 'cat-supplements',
      name: 'Health Supplements',
      description: 'Premium supplements for a healthy lifestyle',
    },
    images: [
      {
        id: 'img-moringa-1',
        url: '/images/moringa.svg',
        productId: 'prod-moringa-002',
        isPrimary: true,
      }
    ]
  }
];

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: true
      }
    });
    if (products && products.length > 0) {
      res.json(products.map(productWithImageUrls));
      return;
    }
  } catch (error) {
    console.warn('[Products] Database query failed or unavailable. Serving starter catalog.');
  }

  // Fallback starter products so the storefront and images ALWAYS display in preview
  res.json(FALLBACK_PRODUCTS);
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        images: true
      }
    });

    if (product) {
      res.json(productWithImageUrls(product));
      return;
    }
  } catch (error) {
    console.warn('[ProductDetail] Database query failed. Checking starter catalog.');
  }

  const fallback = FALLBACK_PRODUCTS.find(p => p.id === req.params.id || p.sku === req.params.id);
  if (fallback) {
    res.json(fallback);
    return;
  }

  res.status(404).json({ error: 'Product not found' });
};

export const getProductImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const productImage = await prisma.productImage.findFirst({
      where: { productId: req.params.id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      select: { url: true },
    });
    const image = productImage?.url.startsWith('data:image/') ? parseUploadedImage(productImage.url) : null;
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
