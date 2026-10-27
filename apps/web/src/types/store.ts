export interface StoreProduct {
  id: string; name: string; description: string; price: number | string; stock: number;
  sku?: string; category?: { id?: string; name: string } | null; images?: { url: string }[];
}

export function displayProductName(name: string): string {
  return name.trim() === 'NEW_PRODUCT_NAME' ? 'Moringa' : name;
}

export interface StoreOrderItem {
  id: string; productId?: string; productName?: string; product?: { name: string };
  price: number | string; quantity: number;
}
export interface StoreOrder {
  id: string; status: string; totalAmount: number | string; shippingFee?: number | string;
  createdAt: string; items: StoreOrderItem[];
  whatsappUpdates?: boolean;
  statusUpdates?: { id: string; status: string; createdAt: string }[];
  shippingPin?: string; shippingAddr?: string; shippingPhone?: string | null;
  returnEligible?: boolean; returnDeadline?: string | null;
  returnRequest?: { id: string; reason: string; details?: string | null; status: 'REQUESTED' | 'APPROVED' | 'REJECTED'; adminNote?: string | null; createdAt: string } | null;
}
