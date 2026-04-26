# Quote Builder — Technical Documentation

A Salesforce-native sales quoting application built with the Salesforce UI Bundle framework (React). Sales reps browse the product catalog, configure line items with quantity and discount, and save quotes directly to Salesforce Quote and QuoteLineItem records via a REST Apex controller.

> **Beta Notice:** UI Bundles are in open beta on Agentforce 360. Deployment to production orgs is not yet supported.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Data Flow](#data-flow)
5. [Prerequisites](#prerequisites)
6. [Setup & Local Development](#setup--local-development)
7. [Deploying to Salesforce](#deploying-to-salesforce)
8. [Apex REST Controller](#apex-rest-controller)
9. [State Management](#state-management)
10. [GraphQL Integration](#graphql-integration)
11. [Testing](#testing)
12. [Environment Modes](#environment-modes)
13. [Known Limitations](#known-limitations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER / SFDC RUNTIME                    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    React UI Bundle                          │  │
│  │                                                             │  │
│  │  ┌──────────────┐    ┌──────────────┐    ┌─────────────┐  │  │
│  │  │ ProductCatalog│    │  QuoteLines  │    │QuoteSummary │  │  │
│  │  │  + Search     │    │  + Qty/Disc  │    │  + Totals   │  │  │
│  │  └──────┬───────┘    └──────┬───────┘    └──────┬──────┘  │  │
│  │         │                   │                    │          │  │
│  │         └───────────────────┼────────────────────┘          │  │
│  │                             │                                │  │
│  │                    ┌────────▼────────┐                       │  │
│  │                    │  Zustand Store  │  (localStorage cache) │  │
│  │                    │  quoteStore.ts  │                       │  │
│  │                    └────────┬────────┘                       │  │
│  │                             │                                │  │
│  │           ┌─────────────────┼──────────────────┐            │  │
│  │           │                 │                  │            │  │
│  │  ┌────────▼──────┐  ┌───────▼──────┐          │            │  │
│  │  │  useProducts  │  │ useSalesforce│          │            │  │
│  │  │  (GraphQL)    │  │  (REST save) │          │            │  │
│  │  └────────┬──────┘  └───────┬──────┘          │            │  │
│  └───────────┼─────────────────┼──────────────────┘            │  │
│              │                 │                                 │
└──────────────┼─────────────────┼─────────────────────────────────┘
               │                 │
     ┌─────────▼──────┐  ┌───────▼─────────────────┐
     │  Salesforce    │  │  Salesforce Apex REST    │
     │  GraphQL API   │  │  /QuoteController/save   │
     │  (PricebookEntry│  │                          │
     │   Product2)    │  │  → Quote (SObject)       │
     └────────────────┘  │  → QuoteLineItem[]       │
                         └──────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19 |
| Language | TypeScript | 5.9 |
| Bundler | Vite | 7 |
| Styling | Tailwind CSS | 4 |
| Component Library | shadcn/ui (Radix UI) | latest |
| State Management | Zustand | 5 |
| Routing | React Router | 7 |
| Salesforce Data | @salesforce/sdk-data (GraphQL) | 1.120 |
| Salesforce Platform | @salesforce/ui-bundle | 1.120 |
| Backend | Apex REST Controller | API v59 |
| Unit Testing | Vitest + Testing Library | latest |
| E2E Testing | Playwright | latest |
| Code Quality | ESLint + Prettier + Husky | latest |

---

## Project Structure

```
quoteBuilderProject/
├── sfdx-project.json                    Salesforce DX config (API v66, no namespace)
├── config/
│   └── project-scratch-def.json         Scratch org definition (Developer edition)
├── scripts/
│   ├── apex/hello.apex                  Sample Apex script
│   └── soql/account.soql                Sample SOQL query
└── force-app/main/default/
    ├── classes/
    │   └── QuoteController.cls          Apex REST endpoint — creates Quote + QuoteLineItems
    └── uiBundles/
        └── quoteBuilder/                React application root
            ├── ui-bundle.json           UI Bundle metadata
            ├── vite.config.ts           Bundler + dev server config
            ├── vitest.config.ts         Unit test config (85% coverage threshold)
            ├── playwright.config.ts     E2E test config
            └── src/
                ├── app.tsx              Router bootstrap, StrictMode
                ├── appLayout.tsx        App shell (header + outlet)
                ├── routes.tsx           Route definitions
                ├── api/
                │   └── graphqlClient.ts Salesforce GraphQL wrapper
                ├── stores/
                │   └── quoteStore.ts    Zustand store with localStorage persistence
                ├── hooks/
                │   ├── useProducts.ts   Fetches PricebookEntry via GraphQL (mocked in dev)
                │   └── useSalesforce.ts POSTs quote to Apex REST endpoint
                ├── types/index.ts       Shared TypeScript interfaces
                ├── pages/
                │   ├── QuoteBuilder.tsx Main two-column layout page
                │   └── NotFound.tsx     404 fallback
                └── components/
                    ├── quote/
                    │   ├── ProductCatalog.tsx  Search + family filter + product grid
                    │   ├── ProductCard.tsx     Single product card with Add button
                    │   ├── QuoteHeader.tsx     Quote name, customer, expiration date
                    │   ├── QuoteLines.tsx      Line item table (qty, discount, delete)
                    │   └── QuoteSummary.tsx    Totals + Save/Clear actions
                    ├── layouts/card-layout.tsx
                    ├── alerts/status-alert.tsx
                    └── ui/                    shadcn/ui primitives (button, table, etc.)
```

---

## Data Flow

### Browsing & Adding Products

```
User types in search box
    → ProductCatalog filters locally (name, code, family)
    → User clicks "Add" on a ProductCard
    → quoteStore.addProduct()
        → If product already in quote: increments quantity
        → Else: appends new QuoteLineItem
    → QuoteLines table re-renders reactively
```

### Quote Calculations (computed on every access)

```
quoteStore.subtotal()  = Σ (unitPrice × quantity × (1 − discount/100))
quoteStore.discountAmount() = Σ (unitPrice × quantity) − subtotal
quoteStore.tax()       = subtotal × 0.20   (20% fixed rate)
quoteStore.total()     = subtotal + tax
```

### Saving a Quote

```
User clicks "Save to Salesforce"
    → useSalesforce.saveQuote()
    → Reads state from quoteStore
    → Builds JSON payload
    → POST /services/apexrest/QuoteController/saveQuote
        → Apex: queries standard Pricebook2
        → Apex: INSERT Quote { Status: "Draft" }
        → Apex: bulk INSERT QuoteLineItem[]
        → Returns { quoteId, success, message }
    → QuoteSummary displays saved quote ID
```

### Product Data Fetching

```
Component mount → useProducts hook
    DEV mode  → returns 6 mock Salesforce products (400ms simulated delay)
    PROD mode → GraphQL query to Salesforce
                  PricebookEntry(where: { IsActive: { eq: true } }, first: 100)
                  → maps to SalesforceProduct[]
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | >= 22 |
| npm | >= 10 |
| Salesforce CLI | >= 2.x (`sf` command) |
| Java (Apex LSP in VS Code) | 21+ |
| VS Code | latest |

**Required VS Code Extensions:**
- Salesforce Extension Pack
- Set `salesforcedx-vscode-apex.java.home` to your JDK path (e.g. `C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot`)

---

## Setup & Local Development

### 1. Install root dependencies

```bash
# From project root
npm install
```

### 2. Install UI Bundle dependencies

```bash
cd force-app/main/default/uiBundles/quoteBuilder
npm install
```

### 3. Run the local dev server

```bash
npm run dev
# App available at http://localhost:5173
```

In dev mode the app runs with mock product data — no Salesforce org connection is needed.

### 4. (Optional) Generate GraphQL types from a connected org

```bash
# Fetch schema
npm run graphql:schema

# Generate TypeScript types
npm run graphql:codegen
```

---

## Deploying to Salesforce

### Create a scratch org

```bash
# From project root
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias quote-builder-dev \
  --duration-days 30
```

### Push source to org

```bash
sf project deploy start --target-org quote-builder-dev
```

### Open the org

```bash
sf org open --target-org quote-builder-dev
```

### Assign permissions (if needed)

```bash
sf org assign permset --name <PermSetName> --target-org quote-builder-dev
```

### Run Apex scripts

```bash
sf apex run --file scripts/apex/hello.apex --target-org quote-builder-dev
```

---

## Apex REST Controller

**Class:** `force-app/main/default/classes/QuoteController.cls`
**Endpoint:** `POST /services/apexrest/QuoteController/saveQuote`
**API Version:** 59.0

### Request payload

```json
{
  "quoteName": "Q-2026-001",
  "customerName": "Acme Corp",
  "expirationDate": "2026-06-30",
  "subtotal": 15000.00,
  "discountAmount": 1500.00,
  "tax": 2700.00,
  "total": 16200.00,
  "lineItems": [
    {
      "pricebookEntryId": "01u...",
      "productId": "01t...",
      "productName": "Sales Cloud",
      "quantity": 5,
      "unitPrice": 3000.00,
      "discount": 10,
      "totalPrice": 13500.00
    }
  ]
}
```

### Response payload

```json
{
  "quoteId": "0Q0...",
  "success": true,
  "message": "Quote saved successfully"
}
```

### What the controller does

1. Deserializes the JSON body into typed inner classes (`QuoteInput`, `LineItemInput`)
2. Queries for the standard `Pricebook2` record
3. Inserts a `Quote` SObject (`Status: "Draft"`)
4. Bulk-inserts `QuoteLineItem[]` linked to the new quote
5. Returns a `QuoteResult` as JSON

---

## State Management

**Store:** `src/stores/quoteStore.ts` — Zustand with `persist` middleware

**Persisted key:** `sf-quote-draft` (browser localStorage)

```typescript
interface QuoteStore {
  // State
  meta: QuoteMeta;           // quoteName, customerName, expirationDate
  lineItems: QuoteLineItem[];
  isSaving: boolean;
  savedQuoteId: string | null;

  // Actions
  setMeta(patch: Partial<QuoteMeta>): void;
  addProduct(product: SalesforceProduct): void;
  updateLine(id: string, patch: { quantity?: number; discount?: number }): void;
  removeLine(id: string): void;
  clearQuote(): void;

  // Computed
  subtotal(): number;
  discountAmount(): number;
  tax(): number;       // fixed 20%
  total(): number;
}
```

**Key behaviors:**
- Adding the same product twice increments quantity rather than duplicating
- Quantity is clamped to 1–9999
- Discount is clamped to 0–100%
- Draft survives page refresh via localStorage

---

## GraphQL Integration

Product data is fetched via Salesforce's GraphQL API using `@salesforce/sdk-data`.

**Client:** `src/api/graphqlClient.ts` — wraps `createDataSDK().graphql()` with centralized error handling.

**Query** (executed in `useProducts.ts`):

```graphql
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
```

---

## Testing

### Unit tests (Vitest)

```bash
cd force-app/main/default/uiBundles/quoteBuilder
npm run test
```

Coverage thresholds (enforced): **85%** lines, functions, branches, statements.

### E2E tests (Playwright)

```bash
npm run test:e2e
```

### Linting & formatting

```bash
# From project root
npm run lint      # ESLint on all JS/TS
npm run prettier  # Format all files
```

A Husky pre-commit hook runs `lint-staged` automatically on every commit.

---

## Environment Modes

The app auto-detects its environment via `import.meta.env.DEV`:

| Mode | Product Data | Save Behavior |
|---|---|---|
| **Development** (`npm run dev`) | 6 hardcoded mock products, 400ms delay | Simulated 800ms delay, returns mock quote ID |
| **Production** (deployed to org) | Live GraphQL query against Salesforce | Real POST to Apex REST, creates Salesforce records |

No configuration files or environment variables need to be changed when switching modes.

---

## Known Limitations

- **Beta only:** UI Bundles cannot be deployed to production Salesforce orgs
- **Scratch org lifespan:** Scratch orgs expire after 30 days
- **No Lightning App Builder support:** React UI Bundles cannot be placed via drag-and-drop in Lightning pages
- **Tax rate hardcoded:** 20% rate is a constant in `quoteStore.ts` — not configurable at runtime
- **No quote editing:** Saved quotes cannot be reloaded into the builder for amendment
- **Standard pricebook only:** The Apex controller always queries the single standard `Pricebook2`
