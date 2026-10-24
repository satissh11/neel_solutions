import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { parseUploadedImage, productWithImageUrls } from '../lib/image';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: true,
        images: true
      }
    });
    res.json(products.map(productWithImageUrls));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
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

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(productWithImageUrls(product));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
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
