import { useQuoteStore } from '@/stores/quoteStore';
import type { SaveQuoteResult } from '@/types';

const isLocalDev = import.meta.env.DEV;

async function saveQuoteToSalesforce(payload: object): Promise<SaveQuoteResult> {
  if (isLocalDev) {
    // Simulate a successful save in local dev
    await new Promise(r => setTimeout(r, 800));
    return { quoteId: `Q-${Date.now()}`, success: true, message: 'Saved (mock)' };
  }

  // When deployed on the Salesforce platform, fetch() to /services/apexrest/* is
  // automatically authenticated via the user's session — no token management needed.
  const response = await fetch('/services/apexrest/QuoteController/saveQuote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Save failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<SaveQuoteResult>;
}

export function useSalesforce() {
  const { meta, lineItems, subtotal, discountAmount, tax, total, setSaving, setSavedQuoteId } =
    useQuoteStore();

  async function saveQuote(): Promise<SaveQuoteResult> {
    setSaving(true);
    try {
      const payload = {
        quoteName: meta.quoteName,
        customerName: meta.customerName,
        expirationDate: meta.expirationDate,
        lineItems: lineItems.map(l => ({
          pricebookEntryId: l.pricebookEntryId,
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          totalPrice: l.unitPrice * l.quantity * (1 - l.discount / 100),
        })),
        subtotal: subtotal(),
        discountAmount: discountAmount(),
        tax: tax(),
        total: total(),
      };

      const result = await saveQuoteToSalesforce(payload);
      if (result.success) {
        setSavedQuoteId(result.quoteId);
      }
      return result;
    } finally {
      setSaving(false);
    }
  }

  return { saveQuote };
}
