export const INDIA_WIDE_SHIPPING = {
  baseFee: 60,
  freeAbove: 999,
  codAllowed: true,
  deliveryDays: 5,
} as const;

export const isValidIndianPin = (pinCode: string): boolean => /^[1-8]\d{5}$/.test(pinCode);
