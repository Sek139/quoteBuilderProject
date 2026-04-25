import { Plus } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { useQuoteStore } from '@/stores/quoteStore';
import type { SalesforceProduct } from '@/types';

const FAMILY_COLORS: Record<string, string> = {
  CRM: 'bg-blue-100 text-blue-700',
  Marketing: 'bg-purple-100 text-purple-700',
  Analytics: 'bg-amber-100 text-amber-700',
  Integration: 'bg-green-100 text-green-700',
  Platform: 'bg-indigo-100 text-indigo-700',
};

function familyColor(family: string) {
  return FAMILY_COLORS[family] ?? 'bg-gray-100 text-gray-700';
}

interface Props {
  product: SalesforceProduct;
}

export function ProductCard({ product }: Props) {
  const addProduct = useQuoteStore(s => s.addProduct);
  const lineItems = useQuoteStore(s => s.lineItems);
  const qty = lineItems.find(l => l.productId === product.id)?.quantity ?? 0;

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
            {product.name}
          </CardTitle>
          {qty > 0 && (
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {qty}
            </span>
          )}
        </div>
        <span className={`w-fit text-xs px-2 py-0.5 rounded-full font-medium ${familyColor(product.family)}`}>
          {product.family}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-3 pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
          {product.description || 'No description available.'}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-xs text-muted-foreground">{product.productCode}</p>
            <p className="text-base font-bold">
              ${product.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <Button size="sm" onClick={() => addProduct(product)} className="gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
