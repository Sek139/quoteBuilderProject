import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuoteLineItem, QuoteMeta, ZuoraCatalogItem } from '@/types';

const TAX_RATE = 0.2;

function lineTotal(item: QuoteLineItem): number {
  return item.unitPrice * item.quantity * (1 - item.discount / 100);
}

interface QuoteStore {
  meta: QuoteMeta;
  lineItems: QuoteLineItem[];
  isSaving: boolean;
  savedQuoteId: string | null;

  setMeta: (patch: Partial<QuoteMeta>) => void;
  addProduct: (item: ZuoraCatalogItem) => void;
  updateLine: (id: string, patch: Partial<Pick<QuoteLineItem, 'quantity' | 'discount'>>) => void;
  removeLine: (id: string) => void;
  setSaving: (saving: boolean) => void;
  setSavedQuoteId: (id: string | null) => void;
  clearQuote: () => void;

  subtotal: () => number;
  recurringSubtotal: () => number;
  oneTimeSubtotal: () => number;
  discountAmount: () => number;
  tax: () => number;
  total: () => number;
}

const DEFAULT_META: QuoteMeta = {
  quoteName: '',
  customerName: '',
  zuoraAccountId: '',
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

export const useQuoteStore = create<QuoteStore>()(
  persist(
    (set, get) => ({
      meta: DEFAULT_META,
      lineItems: [],
      isSaving: false,
      savedQuoteId: null,

      setMeta: patch => set(s => ({ meta: { ...s.meta, ...patch } })),

      addProduct: item => {
        const { lineItems } = get();
        // Dedup by ratePlanId — same plan on same product just bumps quantity
        const existing = lineItems.find(l => l.ratePlanId === item.ratePlanId);
        if (existing) {
          set(s => ({
            lineItems: s.lineItems.map(l =>
              l.ratePlanId === item.ratePlanId ? { ...l, quantity: l.quantity + 1 } : l
            ),
          }));
        } else {
          const newLine: QuoteLineItem = {
            id: crypto.randomUUID(),
            ratePlanId: item.ratePlanId,
            productId: item.productId,
            productName: item.productName,
            ratePlanName: item.ratePlanName,
            sku: item.sku,
            chargeType: item.chargeType,
            billingPeriod: item.billingPeriod,
            unitPrice: item.unitPrice,
            quantity: 1,
            discount: 0,
          };
          set(s => ({ lineItems: [...s.lineItems, newLine] }));
        }
      },

      updateLine: (id, patch) =>
        set(s => ({
          lineItems: s.lineItems.map(l => (l.id === id ? { ...l, ...patch } : l)),
        })),

      removeLine: id =>
        set(s => ({ lineItems: s.lineItems.filter(l => l.id !== id) })),

      setSaving: isSaving => set({ isSaving }),
      setSavedQuoteId: savedQuoteId => set({ savedQuoteId }),

      clearQuote: () =>
        set({ meta: DEFAULT_META, lineItems: [], savedQuoteId: null }),

      subtotal: () => get().lineItems.reduce((sum, l) => sum + lineTotal(l), 0),

      recurringSubtotal: () =>
        get()
          .lineItems.filter(l => l.chargeType === 'Recurring')
          .reduce((sum, l) => sum + lineTotal(l), 0),

      oneTimeSubtotal: () =>
        get()
          .lineItems.filter(l => l.chargeType === 'OneTime')
          .reduce((sum, l) => sum + lineTotal(l), 0),

      discountAmount: () =>
        get().lineItems.reduce(
          (sum, l) => sum + l.unitPrice * l.quantity * (l.discount / 100),
          0
        ),

      tax: () => get().subtotal() * TAX_RATE,
      total: () => get().subtotal() * (1 + TAX_RATE),
    }),
    { name: 'zuora-quote-draft' }
  )
);
