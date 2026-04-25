import { useState } from 'react';
import { Save, CheckCircle, Loader2, Trash2 } from 'lucide-react';
import { Button, Separator } from '@/components/ui';
import { useQuoteStore } from '@/stores/quoteStore';
import { useSalesforce } from '@/hooks/useSalesforce';

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

export function QuoteSummary() {
  const { lineItems, subtotal, discountAmount, tax, total, isSaving, savedQuoteId, meta, clearQuote } =
    useQuoteStore();
  const { saveQuote } = useSalesforce();
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const canSave = lineItems.length > 0 && meta.quoteName.trim().length > 0 && !isSaving;

  async function handleSave() {
    setError(null);
    try {
      const result = await saveQuote();
      if (result.success) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
      } else {
        setError(result.message ?? 'Save failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/40 rounded-lg border">
      {/* Line totals */}
      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal ({lineItems.length} item{lineItems.length !== 1 ? 's' : ''})</span>
          <span>{fmt(subtotal())}</span>
        </div>
        {discountAmount() > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{fmt(discountAmount())}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Tax (20%)</span>
          <span>{fmt(tax())}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>{fmt(total())}</span>
        </div>
      </div>

      {/* Validation hint */}
      {lineItems.length > 0 && !meta.quoteName.trim() && (
        <p className="text-xs text-amber-600">Enter a quote name above before saving.</p>
      )}

      {/* Error */}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Saved badge */}
      {savedQuoteId && (
        <div className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="w-3.5 h-3.5" />
          Saved as {savedQuoteId}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          className="flex-1 gap-2"
          onClick={handleSave}
          disabled={!canSave}
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : justSaved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isSaving ? 'Saving…' : justSaved ? 'Saved!' : 'Save to Salesforce'}
        </Button>
        {lineItems.length > 0 && (
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={clearQuote}
            title="Clear quote"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
