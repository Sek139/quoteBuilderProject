# Quote Builder — Technical Documentation

A Salesforce-native sales quoting application built with the Salesforce UI Bundle framework (React). Sales reps browse a Zuora product catalog, configure rate plan line items with quantity and discount, and create subscriptions directly in Zuora via a secure Apex proxy.

> **Beta Notice:** UI Bundles are in open beta on Agentforce 360. Deployment to production orgs is not yet supported. The React app requires enabling **React Development with Agentforce Vibes and Salesforce Multi-Framework (Beta)** in org Setup before the UIBundle can be deployed.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Data Flow](#data-flow)
5. [Prerequisites](#prerequisites)
6. [Setup & Local Development](#setup--local-development)
7. [Deploying to Salesforce](#deploying-to-salesforce)
8. [Zuora Integration](#zuora-integration)
9. [State Management](#state-management)
10. [Testing](#testing)
11. [Environment Modes](#environment-modes)
12. [Known Limitations](#known-limitations)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         BROWSER / SFDC RUNTIME                        │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                       React UI Bundle                            │  │
│  │                                                                   │  │
│  │  ┌───────────────┐    ┌──────────────┐    ┌──────────────────┐  │  │
│  │  │ ProductCatalog │    │  QuoteLines  │    │  QuoteSummary    │  │  │
│  │  │  Search+Filter │    │  Recurring   │    │  Recurring Total │  │  │
│  │  │  per Rate Plan │    │  + One-Time  │    │  + One-Time Total│  │  │
│  │  └──────┬────────┘    └──────┬───────┘    └────────┬─────────┘  │  │
│  │         │                    │                      │             │  │
│  │         └────────────────────┼──────────────────────┘             │  │
│  │                              │                                     │  │
│  │                     ┌────────▼────────┐                           │  │
│  │                     │  Zustand Store  │ ← localStorage persisted  │  │
│  │                     │  quoteStore.ts  │   (key: zuora-quote-draft) │  │
│  │                     └────────┬────────┘                           │  │
│  │                              │                                     │  │
│  │           ┌──────────────────┼─────────────────┐                  │  │
│  │           │                  │                 │                  │  │
│  │  ┌────────▼──────┐  ┌────────▼────────┐        │                  │  │
│  │  │  useProducts  │  │   useZuora      │        │                  │  │
│  │  │  (catalog)    │  │  (subscription) │        │                  │  │
│  │  └────────┬──────┘  └────────┬────────┘        │                  │  │
│  │           │                  │                  │                  │  │
│  │  ┌────────▼──────────────────▼───────────────┐  │                  │  │
│  │  │              zuoraClient.ts               │  │                  │  │
│  │  │    zuoraGet('/catalog')                   │  │                  │  │
│  │  │    zuoraPost('/subscribe', payload)       │  │                  │  │
│  │  └────────────────────┬──────────────────────┘  │                  │  │
│  └───────────────────────┼─────────────────────────┘                  │  │
│                          │                                             │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │  /services/apexrest/ZuoraProxy/*
                           ▼
              ┌────────────────────────┐
              │   ZuoraProxy.cls       │  Apex REST — injects Bearer token
              │   ZuoraAuthService.cls │  OAuth2 client credentials
              │   ZuoraConfig__mdt     │  CMT — stores clientId/secret/baseUrl
              └────────────┬───────────┘
                           │  HTTPS + Bearer token
                           ▼
              ┌────────────────────────┐
              │      Zuora REST API    │
              │  GET  /v1/catalog/     │
              │       products         │
              │  POST /v1/subscriptions│
              └────────────────────────┘
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
| Salesforce Platform | @salesforce/ui-bundle | 1.120 |
| Backend Proxy | Apex REST (ZuoraProxy) | API v66 |
| Auth | Zuora OAuth 2.0 client credentials | — |
| Config | Custom Metadata Type (ZuoraConfig__mdt) | — |
| Unit Testing | Vitest + Testing Library | latest |
| E2E Testing | Playwright | latest |
| Code Quality | ESLint + Prettier + Husky | latest |

---

## Project Structure

```
quoteBuilderProject/
├── .forceignore                         Excludes QuoteController + UIBundle (until beta enabled)
├── sfdx-project.json                    Salesforce DX config (API v66, no namespace)
├── config/
│   └── project-scratch-def.json         Scratch org definition (Developer edition)
└── force-app/main/default/
    ├── classes/
    │   ├── ZuoraProxy.cls               Apex REST proxy → Zuora catalog + subscription
    │   ├── ZuoraAuthService.cls         OAuth2 token fetch + in-request cache
    │   └── QuoteController.cls          Legacy Salesforce quotes (excluded from deploy)
    ├── objects/
    │   └── ZuoraConfig__mdt/            Custom Metadata Type definition
    │       ├── ZuoraConfig__mdt.object-meta.xml
    │       └── fields/
    │           ├── ClientId__c.field-meta.xml
    │           ├── ClientSecret__c.field-meta.xml
    │           └── BaseUrl__c.field-meta.xml
    ├── customMetadata/
    │   └── ZuoraConfig.Default.md-meta.xml  Default record (sandbox URL + placeholder creds)
    └── uiBundles/
        └── quoteBuilder/                React application root
            ├── ui-bundle.json
            ├── vite.config.ts
            ├── vitest.config.ts         85% coverage threshold enforced
            ├── playwright.config.ts
            └── src/
                ├── app.tsx              Router bootstrap, StrictMode
                ├── appLayout.tsx        App shell (header + outlet)
                ├── routes.tsx           Route definitions
                ├── api/
                │   └── zuoraClient.ts   zuoraGet / zuoraPost → /services/apexrest/ZuoraProxy/*
                ├── stores/
                │   └── quoteStore.ts    Zustand store (persisted: zuora-quote-draft)
                ├── hooks/
                │   ├── useProducts.ts   Zuora catalog → ZuoraCatalogItem[] (mocked in dev)
                │   └── useZuora.ts      Creates Zuora subscription via Apex proxy
                ├── types/index.ts       ZuoraProduct, ZuoraCatalogItem, QuoteLineItem, etc.
                ├── pages/
                │   ├── QuoteBuilder.tsx Two-column layout page
                │   └── NotFound.tsx     404 fallback
                └── components/
                    ├── quote/
                    │   ├── ProductCatalog.tsx  Search + category filter (one card per rate plan)
                    │   ├── ProductCard.tsx     Category + billing period badges, price suffix
                    │   ├── QuoteHeader.tsx     Quote name, customer, Zuora Account ID, expiry
                    │   ├── QuoteLines.tsx      Grouped tables: Recurring / One-Time
                    │   └── QuoteSummary.tsx    Split totals + Create Subscription button
                    ├── layouts/card-layout.tsx
                    ├── alerts/status-alert.tsx
                    └── ui/                    shadcn/ui primitives
```

---

## Data Flow

### Browsing the Zuora Catalog

```
Component mount → useProducts(search, category)
    DEV mode  → 6 mock ZuoraProducts × 2–3 rate plans each (400ms delay)
    PROD mode → GET /services/apexrest/ZuoraProxy/catalog
                    → ZuoraProxy: GET /v1/catalog/products (Bearer token)
                    → returns { products: ZuoraProduct[] }
                → flattenCatalog(): one ZuoraCatalogItem per rate plan
                → filtered by search + category in the hook

ZuoraProduct hierarchy:
  Product (id, sku, name, category)
    └── ProductRatePlan[] (id, name, chargeType, billingPeriod, unitPrice)
          Monthly  → chargeType: "Recurring", billingPeriod: "Month"
          Annual   → chargeType: "Recurring", billingPeriod: "Annual"
          Setup    → chargeType: "OneTime",   billingPeriod: "OneTime"
```

### Adding Items & Quote Calculations

```
User clicks "Add" on a ProductCard (ZuoraCatalogItem)
    → quoteStore.addProduct(item)
        → Dedup key: ratePlanId (not productId)
        → Same rate plan: increments quantity
        → New rate plan: appends QuoteLineItem

Computed totals (recalculated on every access):
  recurringSubtotal() = Σ lineTotal(l) where l.chargeType === "Recurring"
  oneTimeSubtotal()   = Σ lineTotal(l) where l.chargeType === "OneTime"
  subtotal()          = recurringSubtotal + oneTimeSubtotal
  discountAmount()    = Σ (unitPrice × qty × discount/100)
  tax()               = subtotal × 0.20
  total()             = subtotal × 1.20
```

### Creating a Zuora Subscription

```
User clicks "Create Subscription"
    → useZuora.saveSubscription()
    → Reads state from quoteStore (meta + lineItems)
    → Builds payload:
        {
          accountKey, termType: "TERMED",
          termStartDate, termEndDate,
          subscribeToRatePlans: [
            { productRatePlanId, chargeOverrides: [{ quantity, price }] }
          ]
        }
    → POST /services/apexrest/ZuoraProxy/subscribe
        → ZuoraProxy: fetches token via ZuoraAuthService
        → ZuoraProxy: POST /v1/subscriptions (Bearer token)
        → Returns { subscriptionId, success, message }
    → QuoteSummary displays subscriptionId
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
- Set `salesforcedx-vscode-apex.java.home` to your JDK path:
  `C:\Program Files\Eclipse Adoptium\jdk-25.0.2.10-hotspot`

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

In dev mode the app runs entirely on mock Zuora data — no org, no Zuora account needed.

---

## Deploying to Salesforce

Deployment is **two phases** because the UIBundle requires a beta feature to be manually enabled in the org before it can be pushed.

### Phase 1 — Apex + Custom Metadata (works immediately)

```bash
# From project root
npm run build   # builds the React bundle (required before deploy)

sf project deploy start --target-org react \
  --source-dir force-app/main/default/classes \
  --source-dir force-app/main/default/objects \
  --source-dir force-app/main/default/customMetadata
```

This deploys: `ZuoraProxy`, `ZuoraAuthService`, `ZuoraConfig__mdt` type + fields + the `Default` record.

### Phase 2 — UIBundle (React app)

**Step 1:** Enable the beta in the org:

```bash
sf org open --target-org react
```

Navigate to **Setup → Apps → React Development with Agentforce Vibes and Salesforce Multi-Framework (Beta)** and enable it.

**Step 2:** Edit [.forceignore](.forceignore) and remove these two lines:

```
**/uiBundles/**
**/*.uibundle-meta.xml
```

**Step 3:** Build and deploy:

```bash
cd force-app/main/default/uiBundles/quoteBuilder
npm run build

cd ../../../../..   # back to project root
sf project deploy start --target-org react
```

### Other useful commands

```bash
# List configured orgs
sf org list

# Open scratch org in browser
sf org open --target-org react

# Create a new scratch org (if needed)
sf org create scratch \
  --definition-file config/project-scratch-def.json \
  --alias my-scratch \
  --duration-days 30
```

---

## Zuora Integration

### Custom Metadata Type — `ZuoraConfig__mdt`

Credentials and the base URL are stored in a Custom Metadata Type so they are deployable as source and never hard-coded.

| Field | Purpose | Default record value |
|---|---|---|
| `ClientId__c` | Zuora OAuth client ID | `REPLACE_WITH_YOUR_CLIENT_ID` |
| `ClientSecret__c` | Zuora OAuth client secret | `REPLACE_WITH_YOUR_CLIENT_SECRET` |
| `BaseUrl__c` | Zuora REST base URL | `https://rest.apisandbox.zuora.com` |

Update the values in [customMetadata/ZuoraConfig.Default.md-meta.xml](force-app/main/default/customMetadata/ZuoraConfig.Default.md-meta.xml) before deploying to a real org. For production use `https://rest.zuora.com`.

### `ZuoraAuthService.cls`

Fetches an OAuth 2.0 Bearer token using client credentials flow (`POST /oauth/token`). Token is cached in a static variable with a 60-second safety margin before expiry. All callouts in the same Apex transaction reuse the cached token.

### `ZuoraProxy.cls` — REST Endpoints

**Endpoint:** `/services/apexrest/ZuoraProxy/*`

#### `GET /ZuoraProxy/catalog`

Proxies `GET /v1/catalog/products?pageSize=100` from Zuora. Returns the full product + rate plan catalog as-is. The frontend's `useProducts` hook calls this in production.

#### `POST /ZuoraProxy/subscribe`

**Request body:**

```json
{
  "accountKey": "A00001234",
  "quoteName": "Acme Corp Q2-2026",
  "customerName": "Acme Corp",
  "termType": "TERMED",
  "termStartDate": "2026-04-26",
  "termEndDate": "2026-10-26",
  "subscribeToRatePlans": [
    {
      "productRatePlanId": "zuora-rp-001-mo",
      "chargeOverrides": [{ "quantity": 5, "price": 1500.00 }]
    }
  ],
  "subtotal": 7500.00,
  "discountAmount": 0,
  "tax": 1500.00,
  "total": 9000.00
}
```

**Response:**

```json
{
  "subscriptionId": "SUB-00001234",
  "success": true,
  "message": "Subscription created successfully"
}
```

### Zuora Data Model vs Salesforce Native

| Salesforce (legacy) | Zuora (current) |
|---|---|
| `PricebookEntry` | `ProductRatePlan` |
| `Product2` | `Product` |
| Single `unitPrice` | `ProductRatePlanCharge[]` per billing period |
| `Quote` SObject | `Subscription` |
| `QuoteLineItem` SObject | `SubscriptionRatePlan` |

---

## State Management

**Store:** [src/stores/quoteStore.ts](force-app/main/default/uiBundles/quoteBuilder/src/stores/quoteStore.ts)
**Persisted key:** `zuora-quote-draft` (browser localStorage)

```typescript
interface QuoteStore {
  meta: QuoteMeta;        // quoteName, customerName, zuoraAccountId, expirationDate
  lineItems: QuoteLineItem[];
  isSaving: boolean;
  savedQuoteId: string | null;   // stores subscriptionId after save

  // Actions
  addProduct(item: ZuoraCatalogItem): void;   // dedup by ratePlanId
  updateLine(id, patch): void;
  removeLine(id): void;
  clearQuote(): void;

  // Computed
  subtotal(): number;
  recurringSubtotal(): number;   // Σ Recurring lines only
  oneTimeSubtotal(): number;     // Σ OneTime lines only
  discountAmount(): number;
  tax(): number;                 // fixed 20%
  total(): number;               // subtotal × 1.20
}
```

**Key behaviors:**
- Dedup key is `ratePlanId` — same product can appear multiple times with different rate plans (e.g. Monthly + Annual)
- Adding the same rate plan twice increments quantity
- Quantity clamped 1–9999, discount clamped 0–100%
- Draft survives page refresh via localStorage

---

## Testing

### Unit tests (Vitest)

```bash
cd force-app/main/default/uiBundles/quoteBuilder
npm run test
```

Coverage thresholds enforced: **85%** lines, functions, branches, statements.

### E2E tests (Playwright)

```bash
npm run test:e2e
```

### Linting & formatting

```bash
# From project root
npm run lint      # ESLint on all JS/TS
npm run prettier  # Prettier on all files
```

A Husky pre-commit hook runs `lint-staged` automatically on every commit.

---

## Environment Modes

Controlled by `import.meta.env.DEV` — no config files need changing when switching.

| Mode | Product Data | Save Behavior |
|---|---|---|
| **Development** (`npm run dev`) | 6 mock Zuora products × 2–3 rate plans, 400ms delay | 800ms simulated delay, returns `SUB-MOCK-{timestamp}` |
| **Production** (deployed to org) | Live `GET /v1/catalog/products` via ZuoraProxy | Real `POST /v1/subscriptions` via ZuoraProxy, returns Zuora subscription ID |

---

## Known Limitations

- **UIBundle beta required:** The React app cannot be deployed until "React Development with Agentforce Vibes and Salesforce Multi-Framework (Beta)" is enabled in org Setup
- **Beta only:** UI Bundles cannot be deployed to production Salesforce orgs
- **Scratch org lifespan:** Scratch orgs expire after 30 days (current `react` org expires 2026-05-25)
- **Tax rate hardcoded:** 20% is a constant in `quoteStore.ts` — not configurable at runtime
- **Zuora credentials in CMT:** `ClientSecret__c` is stored as plain Text — use Named Credentials or an encrypted field for production
- **No quote editing:** Saved subscriptions cannot be reloaded into the builder for amendment
- **No multi-currency:** Pricing uses a single currency; Zuora multi-currency support not wired up
