import { useState } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Input, Skeleton } from '@/components/ui';
import { ProductCard } from './ProductCard';
import { useProducts } from '@/hooks/useProducts';

const FAMILIES = ['All', 'CRM', 'Marketing', 'Analytics', 'Integration', 'Platform'];

export function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('All');
  const { products, loading, error, refetch } = useProducts(search);

  const visible =
    family === 'All' ? products : products.filter(p => p.family === family);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Family filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FAMILIES.map(f => (
          <button
            key={f}
            onClick={() => setFamily(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              family === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-muted-foreground">
          {visible.length} product{visible.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 pb-2 pr-1">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-lg" />
            ))
          : visible.map(p => <ProductCard key={p.id} product={p} />)}

        {!loading && !error && visible.length === 0 && (
          <div className="col-span-2 flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Search className="w-8 h-8" />
            <p className="text-sm">No products found</p>
            <p className="text-xs">Try a different search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
