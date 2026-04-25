export interface SalesforceProduct {
  id: string;
  pricebookEntryId: string;
  name: string;
  description: string;
  productCode: string;
  family: string;
  unitPrice: number;
}

export interface QuoteLineItem {
  id: string;
  pricebookEntryId: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  discount: number;
}

export interface QuoteMeta {
  quoteName: string;
  customerName: string;
  expirationDate: string;
}

export interface SaveQuoteResult {
  quoteId: string;
  success: boolean;
  message?: string;
}
