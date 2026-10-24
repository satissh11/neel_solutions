const maxImageBytes = 5 * 1024 * 1024;

export function parseUploadedImage(value: string) {
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/i);
  if (!match || value.length > 7_100_000) return null;

  const bytes = Buffer.from(match[2], 'base64');
  const mimeType = `image/${match[1].toLowerCase()}`;
  const signatureMatches = mimeType === 'image/png'
    ? bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : mimeType === 'image/jpeg'
      ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';

  return bytes.length <= maxImageBytes && signatureMatches ? { mimeType, bytes } : null;
}

export function productWithImageUrls<T extends { id: string; images: { url: string }[] }>(product: T) {
  return {
    ...product,
    images: product.images.map(image => ({
      ...image,
      url: image.url.startsWith('data:image/') ? `/api/v1/products/${product.id}/image` : image.url,
    })),
  };
}
