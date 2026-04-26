import { useState, useEffect, useCallback } from 'react';
import { zuoraGet } from '@/api/zuoraClient';
import type { ZuoraProduct, ZuoraCatalogItem } from '@/types';

// ---------------------------------------------------------------------------
// Mock catalog — mirrors the shape of GET /v1/catalog/products from Zuora
// ---------------------------------------------------------------------------
const MOCK_PRODUCTS: ZuoraProduct[] = [
  {
    id: 'zuora-prod-001',
    sku: 'SC-ENT',
    name: 'Sales Cloud Enterprise',
    description: 'CRM platform for sales teams to manage leads, opportunities, and pipelines at enterprise scale.',
    category: 'CRM',
    ratePlans: [
      { id: 'zuora-rp-001-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 1500 },
      { id: 'zuora-rp-001-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 15000 },
      { id: 'zuora-rp-001-impl', name: 'Implementation', description: 'One-time guided setup and onboarding package.', chargeType: 'OneTime', billingPeriod: 'OneTime', unitPrice: 2000 },
    ],
  },
  {
    id: 'zuora-prod-002',
    sku: 'SVC-PRO',
    name: 'Service Cloud Pro',
    description: 'Customer service platform with case management, automation, and self-service portals.',
    category: 'CRM',
    ratePlans: [
      { id: 'zuora-rp-002-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 1200 },
      { id: 'zuora-rp-002-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 12000 },
    ],
  },
  {
    id: 'zuora-prod-003',
    sku: 'MC-ENG',
    name: 'Marketing Cloud Engagement',
    description: 'Email and mobile marketing automation platform built for enterprise scale and personalization.',
    category: 'Marketing',
    ratePlans: [
      { id: 'zuora-rp-003-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 2000 },
      { id: 'zuora-rp-003-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 20000 },
      { id: 'zuora-rp-003-onb', name: 'Onboarding Package', description: 'One-time campaign setup, template design, and team training.', chargeType: 'OneTime', billingPeriod: 'OneTime', unitPrice: 3000 },
    ],
  },
  {
    id: 'zuora-prod-004',
    sku: 'TAB-CRM',
    name: 'Tableau Analytics',
    description: 'AI-powered analytics and business intelligence deeply integrated with your Salesforce data.',
    category: 'Analytics',
    ratePlans: [
      { id: 'zuora-rp-004-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 750 },
      { id: 'zuora-rp-004-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 7500 },
    ],
  },
  {
    id: 'zuora-prod-005',
    sku: 'MUL-ANY',
    name: 'MuleSoft Anypoint Platform',
    description: 'Enterprise integration platform for connecting apps, data, and devices across any cloud or on-premise system.',
    category: 'Integration',
    ratePlans: [
      { id: 'zuora-rp-005-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 3000 },
      { id: 'zuora-rp-005-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 30000 },
      { id: 'zuora-rp-005-impl', name: 'Professional Services', description: 'One-time integration design, build, and go-live support.', chargeType: 'OneTime', billingPeriod: 'OneTime', unitPrice: 5000 },
    ],
  },
  {
    id: 'zuora-prod-006',
    sku: 'PLT-ENT',
    name: 'Salesforce Platform',
    description: 'Low-code platform for building custom business apps, automations, and workflows at scale.',
    category: 'Platform',
    ratePlans: [
      { id: 'zuora-rp-006-mo', name: 'Monthly', description: 'Billed monthly, cancel any time.', chargeType: 'Recurring', billingPeriod: 'Month', unitPrice: 900 },
      { id: 'zuora-rp-006-yr', name: 'Annual', description: 'Billed annually — save ~17%.', chargeType: 'Recurring', billingPeriod: 'Annual', unitPrice: 9000 },
    ],
  },
];

function flattenCatalog(products: ZuoraProduct[]): ZuoraCatalogItem[] {
  return products.flatMap(p =>
    p.ratePlans.map(rp => ({
      ratePlanId: rp.id,
      productId: p.id,
      productName: p.name,
      ratePlanName: rp.name,
      description: rp.description || p.description,
      sku: p.sku,
      category: p.category,
      chargeType: rp.chargeType,
      billingPeriod: rp.billingPeriod,
      unitPrice: rp.unitPrice,
    }))
  );
}

const isLocalDev = import.meta.env.DEV;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useProducts(search: string, category: string) {
  const [items, setItems] = useState<ZuoraCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLocalDev) {
        await new Promise(r => setTimeout(r, 400));
        setItems(flattenCatalog(MOCK_PRODUCTS));
      } else {
        const data = await zuoraGet<{ products: ZuoraProduct[] }>('/catalog');
        setItems(flattenCatalog(data.products));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = items.filter(item => {
    const matchesCategory = category === 'All' || item.category === category;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.productName.toLowerCase().includes(q) ||
      item.ratePlanName.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return { products: filtered, loading, error, refetch: fetchProducts };
}
