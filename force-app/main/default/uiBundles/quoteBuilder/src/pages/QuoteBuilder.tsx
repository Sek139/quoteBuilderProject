import { ProductCatalog } from '@/components/quote/ProductCatalog';
import { QuoteHeader } from '@/components/quote/QuoteHeader';
import { QuoteLines } from '@/components/quote/QuoteLines';
import { QuoteSummary } from '@/components/quote/QuoteSummary';

export default function QuoteBuilder() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Left — Product Catalog */}
      <aside className="w-full max-w-sm border-r flex flex-col p-4 overflow-hidden shrink-0">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Product Catalog
        </h2>
        <ProductCatalog />
      </aside>

      {/* Right — Quote Builder */}
      <main className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Quote Builder
          </h2>
        </div>

        <QuoteHeader />
        <QuoteLines />
        <QuoteSummary />
      </main>
    </div>
  );
}
