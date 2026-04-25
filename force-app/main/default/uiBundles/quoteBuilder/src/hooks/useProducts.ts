import { useState, useEffect, useCallback } from 'react';
import { executeGraphQL } from '@/api/graphqlClient';
import type { SalesforceProduct } from '@/types';

// ---------------------------------------------------------------------------
// Mock data — used when running outside the Salesforce runtime (local dev)
// ---------------------------------------------------------------------------
const MOCK_PRODUCTS: SalesforceProduct[] = [
  {
    id: 'prod-001',
    pricebookEntryId: 'pbe-001',
    name: 'Salesforce Sales Cloud',
    description: 'CRM platform for sales teams to manage leads and opportunities.',
    productCode: 'SC-ENT',
    family: 'CRM',
    unitPrice: 1500,
  },
  {
    id: 'prod-002',
    pricebookEntryId: 'pbe-002',
    name: 'Salesforce Service Cloud',
    description: 'Customer service platform with case management and automation.',
    productCode: 'SVC-ENT',
    family: 'CRM',
    unitPrice: 1200,
  },
  {
    id: 'prod-003',
    pricebookEntryId: 'pbe-003',
    name: 'Marketing Cloud Engagement',
    description: 'Email and mobile marketing automation at enterprise scale.',
    productCode: 'MC-ENG',
    family: 'Marketing',
    unitPrice: 2000,
  },
  {
    id: 'prod-004',
    pricebookEntryId: 'pbe-004',
    name: 'Tableau CRM',
    description: 'AI-powered analytics and business intelligence platform.',
    productCode: 'TAB-CRM',
    family: 'Analytics',
    unitPrice: 750,
  },
  {
    id: 'prod-005',
    pricebookEntryId: 'pbe-005',
    name: 'MuleSoft Anypoint Platform',
    description: 'Integration platform for connecting apps, data, and devices.',
    productCode: 'MUL-ANY',
    family: 'Integration',
    unitPrice: 3000,
  },
  {
    id: 'prod-006',
    pricebookEntryId: 'pbe-006',
    name: 'Salesforce Platform',
    description: 'Low-code platform for building custom business applications.',
    productCode: 'PLT-ENT',
    family: 'Platform',
    unitPrice: 900,
  },
];

// ---------------------------------------------------------------------------
// Salesforce GraphQL query — runs when deployed to an org
// ---------------------------------------------------------------------------
const PRODUCTS_QUERY = `
  query GetPricebookEntries {
    uiapi {
      query {
        PricebookEntry(
          where: { IsActive: { eq: true } }
          orderBy: { Product2: { Name: { order: ASC } } }
          first: 100
        ) {
          edges {
            node {
              Id
              UnitPrice { value }
              Product2 {
                Id { value }
                Name { value }
                Description { value }
                ProductCode { value }
                Family { value }
              }
            }
          }
        }
      }
    }
  }
`;

interface GraphQLProduct {
  Id: string;
  UnitPrice: { value: number };
  Product2: {
    Id: { value: string };
    Name: { value: string };
    Description: { value: string | null };
    ProductCode: { value: string | null };
    Family: { value: string | null };
  };
}

interface GraphQLResponse {
  uiapi: {
    query: {
      PricebookEntry: {
        edges: { node: GraphQLProduct }[];
      };
    };
  };
}

function mapGraphQLProduct(node: GraphQLProduct): SalesforceProduct {
  return {
    id: node.Product2.Id.value,
    pricebookEntryId: node.Id,
    name: node.Product2.Name.value,
    description: node.Product2.Description.value ?? '',
    productCode: node.Product2.ProductCode.value ?? '',
    family: node.Product2.Family.value ?? 'Other',
    unitPrice: node.UnitPrice.value,
  };
}

const isLocalDev = import.meta.env.DEV;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useProducts(search: string) {
  const [products, setProducts] = useState<SalesforceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isLocalDev) {
        await new Promise(r => setTimeout(r, 400)); // simulate network
        setProducts(MOCK_PRODUCTS);
      } else {
        const data = await executeGraphQL<GraphQLResponse, Record<string, never>>(
          PRODUCTS_QUERY
        );
        const mapped = data.uiapi.query.PricebookEntry.edges.map(e =>
          mapGraphQLProduct(e.node)
        );
        setProducts(mapped);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = search.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.productCode.toLowerCase().includes(search.toLowerCase()) ||
          p.family.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return { products: filtered, loading, error, refetch: fetchProducts };
}
