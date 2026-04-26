import { useQuoteStore } from '@/stores/quoteStore';
import { zuoraPost } from '@/api/zuoraClient';
import type { SaveSubscriptionResult } from '@/types';

const isLocalDev = import.meta.env.DEV;

export function useZuora() {
  const { meta, lineItems, subtotal, discountAmount, tax, total, setSaving, setSavedQuoteId } =
    useQuoteStore();

  async function saveSubscription(): Promise<SaveSubscriptionResult> {
    setSaving(true);
    try {
      if (isLocalDev) {
        await new Promise(r => setTimeout(r, 800));
        const id = `SUB-MOCK-${Date.now()}`;
        setSavedQuoteId(id);
        return { subscriptionId: id, success: true, message: 'Subscription created (mock)' };
      }

      const payload = {
        accountKey: meta.zuoraAccountId,
        quoteName: meta.quoteName,
        customerName: meta.customerName,
        termType: 'TERMED',
        termStartDate: new Date().toISOString().split('T')[0],
        termEndDate: meta.expirationDate,
        subscribeToRatePlans: lineItems.map(l => ({
          productRatePlanId: l.ratePlanId,
          chargeOverrides: [
            {
              quantity: l.quantity,
              price: l.unitPrice * (1 - l.discount / 100),
            },
          ],
        })),
        subtotal: subtotal(),
        discountAmount: discountAmount(),
        tax: tax(),
        total: total(),
      };

      const result = await zuoraPost<typeof payload, SaveSubscriptionResult>(
        '/subscribe',
        payload
      );
      if (result.success) setSavedQuoteId(result.subscriptionId);
      return result;
    } finally {
      setSaving(false);
    }
  }

  return { saveSubscription };
}
