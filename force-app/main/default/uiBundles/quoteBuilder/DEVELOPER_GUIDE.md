# Quote Builder — Developer Guide

A native Salesforce sales quoting application built with React using the **Salesforce Multi-Framework (UI Bundles)** platform — currently in open beta on Agentforce 360.

Sales reps can browse the Salesforce product catalog, assemble quote line items, adjust quantities and discounts, and save the quote directly into Salesforce `Quote` and `QuoteLineItem` records via an Apex REST controller — all without leaving the Salesforce App Launcher.

---

## How It Works

```
Salesforce Org (scratch org / sandbox)
  └── uiBundles/quoteBuilder        React app — bundled with Vite, deployed as metadata
        ├── Salesforce GraphQL API  → fetch Product2 + PricebookEntry records
        └── Apex REST Controller   → create Quote + QuoteLineItem records
```

Authentication and session management are handled by the Salesforce platform. No token management is required in application code.

In **local development** (`npm run dev`), the app detects `import.meta.env.DEV` and substitutes mock data for all Salesforce API calls, so no connected org is needed to run the UI.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Bundler | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State management | Zustand (with localStorage persistence) |
| Routing | React Router v7 |
| Salesforce data | `@salesforce/sdk-data` — GraphQL API |
| Salesforce save | Apex REST (`/services/apexrest/QuoteController/saveQuote`) |
| Icons | lucide-react |

---

## Project Structure

```
quoteBuilderProject/
├── sfdx-project.json                        Salesforce DX project config
├── config/project-scratch-def.json          Scratch org definition
└── force-app/main/default/
    ├── classes/
    │   ├── QuoteController.cls              Apex REST controller (save quote)
    │   └── QuoteController.cls-meta.xml
    └── uiBundles/
        └── quoteBuilder/                    React application root
            ├── package.json
            ├── vite.config.ts
            ├── tsconfig.json
            └── src/
                ├── app.tsx                  Entry point — router bootstrap
                ├── appLayout.tsx            App shell (header + Outlet)
                ├── routes.tsx               Route definitions
                ├── types/
                │   └── index.ts             Shared TypeScript interfaces
                ├── stores/
                │   └── quoteStore.ts        Zustand store — quote state + computed totals
                ├── hooks/
                │   ├── useProducts.ts       Fetch products (GraphQL or mock)
                │   └── useSalesforce.ts     Save quote via Apex REST
                ├── api/
                │   └── graphqlClient.ts     Thin wrapper around @salesforce/sdk-data GraphQL
                ├── components/
                │   ├── ui/                  shadcn/ui primitives (Button, Card, Input, …)
                │   └── quote/
                │       ├── ProductCard.tsx  Individual product card with Add button
                │       ├── ProductCatalog.tsx  Search + filter + product grid (left panel)
                │       ├── QuoteHeader.tsx  Quote name, customer, expiration date fields
                │       ├── QuoteLines.tsx   Line items table — qty, discount, remove
                │       └── QuoteSummary.tsx Subtotal / tax / total + Save to Salesforce
                ├── pages/
                │   ├── QuoteBuilder.tsx     Main two-panel layout
                │   └── NotFound.tsx
                └── styles/
                    └── global.css           Tailwind + shadcn CSS variables
```

---

## Component Reference

### `ProductCatalog`
**Path:** `src/components/quote/ProductCatalog.tsx`

Left panel. Renders a search input, family filter pills (CRM, Marketing, Analytics, …), and a responsive grid of `ProductCard` components. Shows skeleton loaders while fetching and an empty-state illustration when no results match.

**Props:** none — reads from `useProducts` hook.

---

### `ProductCard`
**Path:** `src/components/quote/ProductCard.tsx`

Displays a single product: name, family badge, description, product code, unit price, and an **Add** button. Shows a quantity badge when the product is already in the quote. Clicking Add calls `addProduct()` on the Zustand store; if the product is already in the quote it increments quantity instead of creating a duplicate line.

**Props:**
| Prop | Type | Description |
|---|---|---|
| `product` | `SalesforceProduct` | The product to display |

---

### `QuoteHeader`
**Path:** `src/components/quote/QuoteHeader.tsx`

Three editable fields at the top of the quote panel: **Quote Name** (required to enable save), **Customer**, and **Expiration Date**. Writes directly to `quoteStore.meta` via `setMeta()`.

**Props:** none — reads/writes Zustand store.

---

### `QuoteLines`
**Path:** `src/components/quote/QuoteLines.tsx`

Line items table. Each row shows: product name, product code, a quantity input, unit price, a discount percentage input, the computed line total, and a remove button. Empty state is shown when no products have been added.

Quantity is clamped to 1–9999. Discount is clamped to 0–100%.

**Props:** none — reads/writes Zustand store.

---

### `QuoteSummary`
**Path:** `src/components/quote/QuoteSummary.tsx`

Pricing summary panel at the bottom of the quote. Shows subtotal, discount amount (only when > 0), tax (20%), and grand total. Contains the **Save to Salesforce** button and a **Clear Quote** button.

The save button is disabled when: the quote has no line items, or the quote name is blank. After a successful save it displays the returned Salesforce Quote ID.

**Props:** none — reads Zustand store, calls `useSalesforce().saveQuote()`.

---

### `QuoteBuilder` (page)
**Path:** `src/pages/QuoteBuilder.tsx`

The main page. Two-column layout: `ProductCatalog` on the left (fixed width), and the quote panel (`QuoteHeader` + `QuoteLines` + `QuoteSummary`) on the right in a scrollable column. Takes up the full viewport height below the app header.

---

## Shared Types

**Path:** `src/types/index.ts`

| Type | Description |
|---|---|
| `SalesforceProduct` | Product2 + PricebookEntry fields merged into one flat object |
| `QuoteLineItem` | A line in the in-progress quote (id, productId, qty, discount, …) |
| `QuoteMeta` | Quote-level fields: name, customer name, expiration date |
| `SaveQuoteResult` | Response from `QuoteController.saveQuote` |

---

## State Management

**Path:** `src/stores/quoteStore.ts`

Single Zustand store. Persisted to `localStorage` under the key `sf-quote-draft` so a quote survives a page refresh.

| Action | Description |
|---|---|
| `addProduct(product)` | Adds a line item or increments qty if already present |
| `updateLine(id, patch)` | Updates quantity or discount on a specific line |
| `removeLine(id)` | Removes a line item |
| `setMeta(patch)` | Updates quote name / customer / expiration date |
| `clearQuote()` | Resets all state |

Computed values (`subtotal`, `discountAmount`, `tax`, `total`) are functions on the store and recalculate on every call.

---

## Hooks

### `useProducts(search: string)`
**Path:** `src/hooks/useProducts.ts`

Fetches active `PricebookEntry` records (with joined `Product2` fields) via the Salesforce GraphQL API. In `import.meta.env.DEV` mode returns static mock data instead, so no connected org is needed locally. Client-side filters by the `search` string across name, code, and family.

Returns `{ products, loading, error, refetch }`.

### `useSalesforce()`
**Path:** `src/hooks/useSalesforce.ts`

Exposes a single `saveQuote()` function. Reads the current quote from the Zustand store, serialises it, and POSTs to `/services/apexrest/QuoteController/saveQuote`. In dev mode simulates an 800 ms delay and returns a mock quote ID.

---

## Apex Controller

**Path:** `force-app/main/default/classes/QuoteController.cls`

`@RestResource` class mapped to `/QuoteController/*`. The `@HttpPost saveQuote()` method:

1. Deserialises the JSON request body into typed inner classes
2. Looks up the standard `Pricebook2`
3. Creates a `Quote` record
4. Bulk-inserts `QuoteLineItem` records linked to the Quote
5. Returns `{ quoteId, success, message }` as JSON

The method uses `with sharing` to respect the running user's record access.

---

## Developer Setup

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 22 or later |
| npm | 10 or later |
| Salesforce CLI (`sf`) | 2.x or later |

Install the Salesforce CLI if you don't have it:
```bash
npm install -g @salesforce/cli
```

---

### 1. Clone and install

```bash
git clone <your-repo-url>
cd quoteBuilderProject/force-app/main/default/uiBundles/quoteBuilder
npm install
```

---

### 2. Run locally (no Salesforce org required)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The app runs with mock product data. Clicking **Save to Salesforce** simulates a save and returns a mock quote ID.

---

### 3. Connect a Salesforce org

You need a **scratch org** or **sandbox** — beta UI Bundles cannot be deployed to production.

**Log in:**
```bash
# Sandbox
sf org login web --alias my-sandbox --instance-url https://test.salesforce.com

# Or create a scratch org (requires a Dev Hub)
sf org create scratch --definition-file config/project-scratch-def.json --alias quote-scratch --duration-days 30
sf org open --target-org quote-scratch
```

**Enable Quotes** in the org (required for the `Quote` standard object):

1. Setup → Search "Quotes" → **Quotes Settings** → Enable Quotes

---

### 4. Deploy to the org

```bash
# From the project root (quoteBuilderProject/)
cd ../../../../..     # back to quoteBuilderProject/

# Build the React app
cd force-app/main/default/uiBundles/quoteBuilder
npm run build
cd ../../../../..

# Deploy all metadata (Apex + UI Bundle) to the org
sf project deploy start --target-org quote-scratch
```

---

### 5. Open the app in Salesforce

```bash
sf org open --target-org quote-scratch
```

In the org, click the **App Launcher** (grid icon) and search for **quoteBuilder**.

---

### 6. CSP Trusted Sites (external product APIs only)

If you replace the mock product data with an external REST API, whitelist the domain in the org:

**Setup → Security → CSP Trusted Sites → New**

| Field | Value |
|---|---|
| Name | YourAPIName |
| Trusted Site URL | `https://your-api-domain.com` |
| Context | All |

---

## Environment Behaviour

| Context | Products source | Save destination |
|---|---|---|
| `npm run dev` (local) | Static mock data | Mock (no org write) |
| Deployed to Salesforce org | Salesforce GraphQL (live PricebookEntry) | Apex → Quote + QuoteLineItem |

The switch is controlled by `import.meta.env.DEV` — Vite sets this to `true` during `npm run dev` and `false` in production builds.

---

## Available Scripts

Run all scripts from `force-app/main/default/uiBundles/quoteBuilder/`.

| Script | Description |
|---|---|
| `npm run dev` | Start local dev server on port 5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run test` | Run unit tests with Vitest |
| `npm run lint` | Run ESLint |
| `npm run graphql:schema` | Fetch GraphQL schema from connected org |
| `npm run graphql:codegen` | Regenerate TypeScript types from schema |

---

## Known Limitations (Beta)

- UI Bundles cannot be deployed to **production orgs** during the open beta period
- Lightning App Builder drag-and-drop is not yet supported for React UI Bundles
- Some Salesforce platform APIs are not available in the beta runtime
- Scratch org duration is limited to 30 days; redeploy when it expires
