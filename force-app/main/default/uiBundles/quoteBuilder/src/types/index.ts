export type ChargeType = 'Recurring' | 'OneTime' | 'Usage';
export type BillingPeriod = 'Month' | 'Annual' | 'OneTime';

// ---------------------------------------------------------------------------
// Zuora catalog shape (mirrors GET /v1/catalog/products response)
// ---------------------------------------------------------------------------
export interface ZuoraRatePlan {
  id: string;
  name: string;
  description: string;
  chargeType: ChargeType;
  billingPeriod: BillingPeriod;
  unitPrice: number;
}

export interface ZuoraProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  ratePlans: ZuoraRatePlan[];
}

// Flat view — one card per rate plan in the catalog UI
export interface ZuoraCatalogItem {
  ratePlanId: string;
  productId: string;
  productName: string;
  ratePlanName: string;
  description: string;
  sku: string;
  category: string;
  chargeType: ChargeType;
  billingPeriod: BillingPeriod;
  unitPrice: number;
}

// ---------------------------------------------------------------------------
// Quote / subscription state
// ---------------------------------------------------------------------------
export interface QuoteLineItem {
  id: string;
  ratePlanId: string;
  productId: string;
  productName: string;
  ratePlanName: string;
  sku: string;
  chargeType: ChargeType;
  billingPeriod: BillingPeriod;
  unitPrice: number;
  quantity: number;
  discount: number;
}

export interface QuoteMeta {
  quoteName: string;
  customerName: string;
  zuoraAccountId: string;
  expirationDate: string;
}

// ---------------------------------------------------------------------------
// API results
// ---------------------------------------------------------------------------
export interface SaveSubscriptionResult {
  subscriptionId: string;
  success: boolean;
  message?: string;
}

// Kept for the existing QuoteController Apex endpoint
export interface SaveQuoteResult {
  quoteId: string;
  success: boolean;
  message?: string;
}
