import { useQuoteStore } from '@/stores/quoteStore';
import { Input, Label } from '@/components/ui';

export function QuoteHeader() {
  const { meta, setMeta } = useQuoteStore();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-muted/40 rounded-lg border">
      <div className="flex flex-col gap-1">
        <Label htmlFor="quoteName" className="text-xs font-medium">
          Quote Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="quoteName"
          placeholder="e.g. Acme Corp Q2 2026"
          value={meta.quoteName}
          onChange={e => setMeta({ quoteName: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="customerName" className="text-xs font-medium">
          Customer
        </Label>
        <Input
          id="customerName"
          placeholder="Customer or account name"
          value={meta.customerName}
          onChange={e => setMeta({ customerName: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="zuoraAccountId" className="text-xs font-medium">
          Zuora Account ID
        </Label>
        <Input
          id="zuoraAccountId"
          placeholder="e.g. A00001234"
          value={meta.zuoraAccountId}
          onChange={e => setMeta({ zuoraAccountId: e.target.value })}
          className="h-8 text-sm font-mono"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="expirationDate" className="text-xs font-medium">
          Expiration Date
        </Label>
        <Input
          id="expirationDate"
          type="date"
          value={meta.expirationDate}
          onChange={e => setMeta({ expirationDate: e.target.value })}
          className="h-8 text-sm"
        />
      </div>
    </div>
  );
}
