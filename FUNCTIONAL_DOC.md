# Quote Builder — Functional Documentation

## Purpose

Quote Builder is a web application embedded in Salesforce that allows sales representatives to assemble subscription quotes from a Zuora product catalog, configure pricing, and submit them as live Zuora subscriptions — all without leaving the Salesforce interface.

---

## Who Is This For?

| Role | What they do in the app |
|---|---|
| **Sales Representative** | Builds quotes, selects rate plans, adjusts quantities and discounts, submits subscriptions |
| **Sales Manager** | Reviews quote structure and pricing before submission |
| **Solution Engineer** | Uses the demo mode (mock data) to showcase the quoting flow to prospects |

---

## Application Layout

The application is a single-page, two-column interface:

```
┌───────────────────────────┬──────────────────────────────────────────┐
│        PRODUCT            │             QUOTE BUILDER                 │
│        CATALOG            │                                           │
│                           │  ┌────────────────────────────────────┐  │
│  [ Search... ]            │  │ Quote Name | Customer | Account ID  │  │
│                           │  │           | Expiry Date             │  │
│  [All][CRM][Marketing]    │  └────────────────────────────────────┘  │
│  [Analytics][Integration] │                                           │
│  [Platform]               │  Recurring Charges                       │
│                           │  ┌────────────────────────────────────┐  │
│  ┌─────────┐ ┌─────────┐  │  │ Product | Billing | Qty | Price... │  │
│  │  Card   │ │  Card   │  │  └────────────────────────────────────┘  │
│  └─────────┘ └─────────┘  │                                           │
│  ┌─────────┐ ┌─────────┐  │  One-Time Fees                           │
│  │  Card   │ │  Card   │  │  ┌────────────────────────────────────┐  │
│  └─────────┘ └─────────┘  │  │ Product | Billing | Qty | Price... │  │
│                           │  └────────────────────────────────────┘  │
│                           │                                           │
│                           │  ┌────────────────────────────────────┐  │
│                           │  │  Monthly Recurring  $X,XXX         │  │
│                           │  │  One-Time Fees      $X,XXX         │  │
│                           │  │  Subtotal           $X,XXX         │  │
│                           │  │  Tax (20%)          $X,XXX         │  │
│                           │  │  Total              $X,XXX         │  │
│                           │  │                                    │  │
│                           │  │  [Create Subscription]  [🗑]       │  │
│                           │  └────────────────────────────────────┘  │
└───────────────────────────┴──────────────────────────────────────────┘
```

---

## Step-by-Step User Workflow

### Step 1 — Fill in quote details

At the top of the right panel, fill in the four header fields before adding any products:

| Field | Required | Description |
|---|---|---|
| **Quote Name** | Yes | A label for this quote (e.g. `Acme Corp Q2-2026`). Required before saving. |
| **Customer** | No | Customer or account name for reference |
| **Zuora Account ID** | No | The Zuora account key (e.g. `A00001234`) used when creating the subscription |
| **Expiration Date** | No | Quote validity date; defaults to 30 days from today |

---

### Step 2 — Browse the product catalog

The left panel shows all available rate plans from the Zuora catalog. Each card represents **one rate plan** (not one product) — a single product such as *Sales Cloud Enterprise* may appear as multiple cards: Monthly, Annual, and an Implementation package.

**Searching:**
Type any part of a product name, SKU, rate plan name, or category into the search box. Results filter in real time.

**Filtering by category:**
Click a pill to narrow results to a product category:

| Category | Products |
|---|---|
| CRM | Sales Cloud Enterprise, Service Cloud Pro |
| Marketing | Marketing Cloud Engagement |
| Analytics | Tableau Analytics |
| Integration | MuleSoft Anypoint Platform |
| Platform | Salesforce Platform |

Click **All** to remove the filter.

**Reading a product card:**

```
┌──────────────────────────────────────┐
│  Sales Cloud Enterprise          [3] │  ← [3] = qty already in quote
│  [CRM]  [Monthly]                    │  ← category badge + billing badge
│                                      │
│  CRM platform for sales teams to    │
│  manage leads and opportunities...   │
│                                      │
│  SC-ENT              $1,500.00/mo   │
│                              [Add]   │
└──────────────────────────────────────┘
```

| Element | Meaning |
|---|---|
| **Blue badge** (e.g. CRM) | Product category |
| **Sky badge** Monthly | Billed monthly — recurring charge |
| **Green badge** Annual | Billed annually — recurring charge |
| **Orange badge** One-Time | Charged once — setup or professional services |
| **Price suffix** `/mo` | Price per month |
| **Price suffix** `/yr` | Price per year |
| **Price suffix** `one-time` | Single charge, not recurring |
| **Number in circle** | Quantity of this rate plan already in the quote |

---

### Step 3 — Add rate plans to the quote

Click **Add** on any product card. The item appears in the quote lines on the right.

**Important:** You can add multiple rate plans from the same product. For example, adding *Sales Cloud Enterprise — Annual* and *Sales Cloud Enterprise — Implementation* creates two separate line items. They are tracked independently.

If you click **Add** on a rate plan that is already in the quote, its quantity increments by 1 instead of creating a duplicate line.

---

### Step 4 — Adjust line items

Once items are in the quote, the right panel shows them grouped into two sections:

#### Recurring Charges
Items billed on a monthly or annual schedule. Each row has:

| Column | Description |
|---|---|
| **Product** | Product name + rate plan name + SKU |
| **Billing** | Monthly or Annual |
| **Qty** | Number of seats/units (1–9999). Edit directly. |
| **Unit Price** | Price per unit (read-only) |
| **Disc %** | Discount percentage (0–100%). Edit directly. |
| **Total** | `Unit Price × Qty × (1 − Discount/100)` |
| **Delete (🗑)** | Removes the line from the quote |

#### One-Time Fees
Items charged once (setup, onboarding, professional services). Same columns as above.

---

### Step 5 — Review the summary

The summary panel at the bottom right shows a live breakdown:

| Line | When shown | Description |
|---|---|---|
| **Monthly Recurring** | When both types present | Sum of all recurring lines after discount |
| **One-Time Fees** | When both types present | Sum of all one-time lines after discount |
| **Subtotal** | Always | Total of all lines after discount |
| **Discount** | Only if > $0 | Total discount amount (shown in green) |
| **Tax (20%)** | Always | Fixed 20% applied to subtotal |
| **Total** | Always | Subtotal + Tax |

All values update instantly as you change quantities or discounts.

---

### Step 6 — Create the subscription

When the quote is ready:

1. Make sure **Quote Name** is filled in (the button is disabled otherwise)
2. Click **Create Subscription**
3. A spinner appears while the request is processed
4. On success, the button turns green and shows **Created!** with the Zuora subscription ID displayed below it

If an error occurs, a red message appears below the totals with the reason.

To start a new quote, click the **trash icon** next to the button. This clears all line items and resets the header fields.

---

## Pricing Rules

### How line totals are calculated

```
Line Total = Unit Price × Quantity × (1 − Discount / 100)
```

**Example:** 5 seats of Sales Cloud Enterprise Monthly at 10% discount:

```
$1,500 × 5 × (1 − 10/100) = $1,500 × 5 × 0.90 = $6,750
```

### Subtotal

```
Subtotal = Sum of all line totals (recurring + one-time)
```

### Tax

Tax is fixed at **20%** and is always applied to the subtotal. It cannot be changed in the UI.

```
Tax = Subtotal × 0.20
Total = Subtotal × 1.20
```

### Discount limits

- Minimum: **0%** (no discount)
- Maximum: **100%** (free)
- Values outside this range are clamped automatically

### Quantity limits

- Minimum: **1**
- Maximum: **9,999**
- Values outside this range are clamped automatically

---

## Available Products (Demo / Mock Mode)

When running locally or without a Zuora org connection, the catalog shows the following mock products:

| Product | SKU | Category | Rate Plans |
|---|---|---|---|
| Sales Cloud Enterprise | SC-ENT | CRM | Monthly $1,500/mo · Annual $15,000/yr · Implementation $2,000 one-time |
| Service Cloud Pro | SVC-PRO | CRM | Monthly $1,200/mo · Annual $12,000/yr |
| Marketing Cloud Engagement | MC-ENG | Marketing | Monthly $2,000/mo · Annual $20,000/yr · Onboarding $3,000 one-time |
| Tableau Analytics | TAB-CRM | Analytics | Monthly $750/mo · Annual $7,500/yr |
| MuleSoft Anypoint Platform | MUL-ANY | Integration | Monthly $3,000/mo · Annual $30,000/yr · Professional Services $5,000 one-time |
| Salesforce Platform | PLT-ENT | Platform | Monthly $900/mo · Annual $9,000/yr |

Annual plans save approximately **17%** compared to 12 months of monthly billing.

---

## Draft Auto-Save

The quote is automatically saved to the browser's local storage after every change. If the page is refreshed or the tab is closed accidentally, the draft is restored on next open — no data is lost mid-quote.

The draft is stored under the key `zuora-quote-draft`. Clicking **Clear quote** (trash icon) permanently removes the draft and resets the form.

---

## Validation Rules

| Rule | Message shown |
|---|---|
| Quote Name is empty when saving | "Enter a quote name above before saving." |
| No line items when saving | Save button is disabled |
| Save in progress | Button shows spinner and is disabled |

---

## Key Concepts

**Rate Plan**
A pricing option for a product. A single product (e.g. Sales Cloud Enterprise) can have several rate plans — one for monthly billing, one for annual billing, and one for a one-time setup fee. Each appears as a separate card in the catalog.

**Recurring Charge**
A charge that repeats on a schedule (monthly or annually) for the duration of the subscription.

**One-Time Charge**
A charge billed a single time — typically for implementation, onboarding, or professional services. It does not recur.

**Subscription**
The record created in Zuora when the quote is submitted. It contains all the selected rate plans, quantities, and pricing, linked to a Zuora account.

**Zuora Account ID**
The identifier of the customer's account in Zuora (e.g. `A00001234`). Required by Zuora when creating a subscription. In demo mode this field is optional.

---

## Frequently Asked Questions

**Can I add the same product twice with different billing periods?**
Yes. Adding *Sales Cloud Enterprise — Monthly* and *Sales Cloud Enterprise — Annual* creates two separate line items. They are tracked by rate plan, not by product.

**What happens if I add the same rate plan twice?**
The quantity increments by 1. No duplicate line is created.

**Can I edit the unit price?**
No. Unit prices come from the Zuora product catalog and cannot be overridden in the UI. Use the Discount % field to adjust the effective price.

**Is the quote saved automatically?**
Yes — to the browser's local storage as a draft. It is not saved to Salesforce or Zuora until you click **Create Subscription**.

**What does "Created!" mean?**
The subscription was successfully created in Zuora. The subscription ID is displayed below the button. At this point the subscription is live in Zuora.

**Can I edit a subscription after it's created?**
Not through this application. Amendments to existing subscriptions must be done directly in Zuora or via a separate amendment flow.
