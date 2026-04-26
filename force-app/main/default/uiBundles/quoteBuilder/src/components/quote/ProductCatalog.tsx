import { useState } from 'react';
import { Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Input, Skeleton } from '@/components/ui';
import { ProductCard } from './ProductCard';
import { useProducts } from '@/hooks/useProducts';

const CATEGORIES = ['All', 'CRM', 'Marketing', 'Analytics', 'Integration', 'Platform'];

export function ProductCatalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { products, loading, error, refetch } = useProducts(search, category);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products or plans..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              category === c
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-muted-foreground">
          {products.length} rate plan{products.length !== 1 ? 's' : ''}
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

      {/* Product grid — one card per rate plan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto flex-1 pb-2 pr-1">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-lg" />
            ))
          : products.map(item => <ProductCard key={item.ratePlanId} product={item} />)}

        {!loading && !error && products.length === 0 && (
          <div className="col-span-2 flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Search className="w-8 h-8" />
            <p className="text-sm">No rate plans found</p>
            <p className="text-xs">Try a different search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
