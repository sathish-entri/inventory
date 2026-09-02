# 📦 Inventra — Complete User & Developer Documentation

> **Inventra** is a full-featured business management system built for small and medium businesses.  
> It covers the complete order-to-cash and procure-to-pay cycle — from creating a product catalog to collecting customer payments.

---

## 📋 Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard & Analytics](#2-dashboard--analytics)
3. [Products (Items)](#3-products-items)
4. [Warehouses](#4-warehouses)
5. [Inventory](#5-inventory)
6. [Stock Adjustments](#6-stock-adjustments)
7. [Stock Transfers](#7-stock-transfers)
8. [Customers](#8-customers)
9. [Vendors (Suppliers)](#9-vendors-suppliers)
10. [Estimates (Quotations)](#10-estimates-quotations)
11. [Sales Orders](#11-sales-orders)
12. [Packages (Packing)](#12-packages-packing)
13. [Shipments](#13-shipments)
14. [Invoices (Customer Billing)](#14-invoices-customer-billing)
15. [Payments Received](#15-payments-received)
16. [Sales Returns](#16-sales-returns)
17. [Purchase Orders](#17-purchase-orders)
18. [Purchase Receives (GRN)](#18-purchase-receives-grn)
19. [Bills (Vendor Invoices)](#19-bills-vendor-invoices)
20. [Purchase Returns](#20-purchase-returns)
21. [Reports & Analytics](#21-reports--analytics)
22. [Notifications](#22-notifications)
23. [Users & Access Control](#23-users--access-control)
24. [Audit Log](#24-audit-log)
25. [Settings](#25-settings)
26. [Complete Business Workflow](#26-complete-business-workflow)
27. [Technical Setup & Running](#27-technical-setup--running)

---

## 1. Getting Started

### What is Inventra?
Inventra is an **inventory + billing management system** designed for business owners. It handles:
- **Sales cycle**: Estimate → Sales Order → Pack → Ship → Invoice → Collect Payment
- **Purchase cycle**: Purchase Order → Receive Goods → Vendor Bill → Pay Vendor
- **Inventory management**: Real-time stock, warehouse management, transfers, adjustments
- **Financial tracking**: Receivables, Payables, Cash Flow, Billing KPIs

### First-Time Setup (Registration)
1. Open your browser and go to: `http://localhost:5176`
2. Click **"Register"** (if you don't have an account)
3. Fill in:
   - **Your Name**
   - **Email Address** (this is your login ID)
   - **Password**
   - **Company / Organization Name**
4. Click **"Create Account"** — your organization is created automatically
5. You will be redirected to the **Dashboard** after login

### Logging In
1. Go to `http://localhost:5176/login`
2. Enter your **Email** and **Password**
3. Click **"Sign In"**

> Your session token lasts 15 minutes. The system automatically refreshes it using your stored refresh token.

---

## 2. Dashboard & Analytics

**URL**: `/`

The Dashboard is your **business command center**. It shows real-time analytics of your entire business in one view.

### Warehouse Filter (Top Right)
- **"All Warehouses"** → Shows organization-wide analytics
- **Select a specific Warehouse** → Shows analytics only for that warehouse:
  - Inventory value of that warehouse
  - Stock units in that warehouse
  - Low stock alerts for that warehouse only

### Metric Cards (Row 1)
| Metric | What it means |
|--------|---------------|
| **Total Sales Revenue** | Sum of all confirmed + fulfilled sales orders |
| **Total Collected (Payments)** | Total cash actually received from customers |
| **Receivables (Pending)** | Money customers still owe you (unpaid invoices) |
| **Total Purchases** | Sum of all purchase orders placed |
| **Bills Payable (Pending)** | Money you still owe vendors |
| **Inventory Value** | Total cost value of all stock currently in warehouse(s) |
| **Stock Units** | Total units of all products in stock |
| **Low Stock Items** | Products at or below their reorder level |

### Billing KPIs (Row 2)
| KPI | What it means |
|-----|---------------|
| **Total Invoices Raised** | How many customer invoices you have created |
| **Unpaid Invoices** | Invoices still awaiting customer payment |
| **Overdue Invoices** | Invoices past their due date with outstanding balance |
| **Vendor Bills Open** | Vendor bills you have not paid yet |

### Charts & Panels
- **Sales Order Trend** — Area chart of your last 10 sales orders by value
- **Collections Overview** — Donut chart: Collected vs Outstanding receivables + mini summary cards
- **Top Selling Items** — Bar chart + table of your top 5 products by revenue and quantity sold
- **Low Stock Alerts** — Table of items below reorder level with status (LOW STOCK / OUT OF STOCK)
- **Recent Payments Received** — Latest 8 customer payments with method and date
- **Recent Sales Orders** — Latest 10 orders with customer, amount, and status

---

## 3. Products (Items)

**URL**: `/products`

Products (called "Items") are the goods or services your business sells or purchases.

### What information does a Product hold?
| Field | Description |
|-------|-------------|
| **Item Name** | The full name of the product |
| **SKU** | Stock Keeping Unit — a unique code (e.g., `ITEM-001`) |
| **Type** | `GOODS` (physical stock), `SERVICE` (no stock tracked), `COMPOSITE` (bundle) |
| **Selling Price** | Price you charge to customers (Rs.) |
| **Cost Price** | Price you pay to vendors (Rs.) |
| **Tax Rate** | GST / tax percentage applicable |
| **Reorder Level** | Minimum stock level before a "Low Stock" alert fires |

### How to Add a New Product
1. Go to **Products** in the sidebar
2. Click **"+ New Item"** (top right button)
3. Fill in: Name, SKU, Selling Price, Cost Price, Reorder Level, Description
4. Click **"Create Item"**

> **SKU must be unique** — each product must have a different SKU code.

---

## 4. Warehouses

**URL**: `/warehouses`

A Warehouse is a physical storage location where you keep your inventory.

### What is a Warehouse?
- You can have **multiple warehouses** (e.g., Main Godown, Delhi Branch, Chennai Store)
- Each warehouse has its own **independent stock levels**
- Sales shipments deduct stock from the specified warehouse
- Purchase receives add stock to the specified warehouse

### How to Add a Warehouse
1. Go to **Warehouses** in the sidebar
2. Click **"+ New Warehouse"**
3. Enter the **Warehouse Name** and **Location/Address**
4. Click **"Create Warehouse"**

---

## 5. Inventory

**URL**: `/inventory`

The Inventory page shows **current stock levels** across all warehouses.

### What the Inventory Table Shows
| Column | Description |
|--------|-------------|
| **Product** | Item name |
| **Warehouse** | Which warehouse this stock is in |
| **On Hand** | Total physical quantity in the warehouse |
| **Reserved** | Quantity reserved for confirmed orders (not available to sell) |
| **Available** | On Hand minus Reserved — this is what you can sell |
| **Inventory Value** | Available Qty multiplied by Cost Price |

### Key Concepts
- **On Hand**: Total physical stock in the warehouse
- **Reserved**: Stock locked for confirmed customer sales orders
- **Available** = On Hand minus Reserved
- Stock automatically updates when you ship a sales order or receive a purchase order

---

## 6. Stock Adjustments

**URL**: `/adjustments`

Use adjustments to **manually correct stock levels** — for example after a physical stock count reveals a discrepancy.

### When to Use Adjustments
- Physical count shows fewer items than the system (shrinkage, damage, theft)
- Physical count shows more items than the system (counting error correction)
- Opening stock entry when you first set up the system

### How to Create an Adjustment
1. Go to **Adjustments** in the sidebar
2. Click **"New Adjustment"**
3. Select the **Warehouse** and **Product**
4. Enter the **New Quantity** (the correct quantity after counting)
5. Add a **Reason** (e.g., "Annual stocktake", "Damaged goods")
6. Click **"Save Adjustment"**

> The system records the "before" and "after" quantities and creates an Inventory Transaction log for audit purposes.

---

## 7. Stock Transfers

**URL**: `/transfers`

Stock Transfers move inventory **from one warehouse to another**.

### When to Use Transfers
- Replenish a branch warehouse from the main godown
- Move slow-moving stock to a different location
- Redistribute inventory across locations

### How to Create a Transfer
1. Go to **Transfers** in the sidebar
2. Click **"New Transfer"**
3. Select **From Warehouse** (source) and **To Warehouse** (destination)
4. Select the **Product** and **Quantity** to transfer
5. Click **"Create Transfer"**

> The transfer deducts from the source warehouse and adds to the destination warehouse instantly.

---

## 8. Customers

**URL**: `/customers`

Customers are the businesses or individuals you **sell to**.

### What Information is Stored
| Field | Description |
|-------|-------------|
| **Name** | Customer's full name or company name |
| **Email** | Contact email address |
| **Phone** | Phone number |
| **City** | City of the customer |
| **GSTIN** | GST Identification Number (for B2B invoicing) |

### How to Add a Customer
1. Go to **Customers** in the sidebar
2. Click **"+ New Customer"**
3. Fill in Name, Email, Phone, City, GSTIN
4. Click **"Create Customer"**

---

## 9. Vendors (Suppliers)

**URL**: `/vendors`

Vendors are the businesses or individuals you **buy from** (your suppliers).

### What Information is Stored
| Field | Description |
|-------|-------------|
| **Name** | Vendor's company name |
| **Email** | Contact email address |
| **Phone** | Phone number |
| **City** | City of the vendor |
| **GSTIN** | GST Identification Number |

### How to Add a Vendor
1. Go to **Vendors** in the sidebar
2. Click **"+ New Vendor"**
3. Fill in Name, Email, Phone, City, GSTIN
4. Click **"Create Vendor"**

---

## 10. Estimates (Quotations)

**URL**: `/estimates`

An Estimate (also called a Quotation or Quote) is a **price proposal** sent to a customer before they confirm an order.

### When to Use Estimates
- Customer asks "How much will this cost?"
- You want to propose pricing before getting a purchase order from the customer
- Pre-sales negotiation

### How to Create an Estimate
1. Go to **Estimates** in the sidebar
2. Click **"New Estimate"**
3. Select the **Customer**
4. Add line items: **Product**, **Quantity**, **Unit Price**
5. Add **Discount** (if any) and **Shipping** charges
6. Click **"Create Estimate"**

### Estimate Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | Estimate is being prepared |
| `SENT` | Sent to customer for approval |
| `ACCEPTED` | Customer agreed to the price |
| `DECLINED` | Customer rejected the estimate |

---

## 11. Sales Orders

**URL**: `/sales-orders`

A Sales Order (SO) is the **official order document** created after a customer agrees to buy.

### How to Create a Sales Order
1. Go to **Sales Orders** in the sidebar
2. Click **"+ New Sales Order"**
3. Select:
   - **Customer** (required)
   - **Warehouse** (where stock will be shipped from)
4. Add **Line Items**: Product, Quantity, Unit Price
5. Add **Discount** and **Shipping** charges if applicable
6. Click **"Create Order"**

### How to Confirm an Order
After creating, the order is in `DRAFT`. To confirm it:
- Click **"Confirm"** button next to the order in the table

> Confirming an order **reserves the stock** in the warehouse so it cannot be sold to someone else.

### Sales Order Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | Order created, not yet confirmed |
| `CONFIRMED` | Order confirmed, stock reserved, ready for packing |
| `PACKED` | Goods have been packed |
| `PARTIALLY_FULFILLED` | Some items shipped, some pending |
| `FULFILLED` | All items shipped to customer |
| `CANCELLED` | Order was cancelled |

---

## 12. Packages (Packing)

**URL**: `/packages`

A Package is created when you **physically pack the goods** into a box or parcel for shipment.

### How to Pack an Order
1. Go to **Packages** in the sidebar
2. In the **"Orders Ready for Packing"** section, you will see all `CONFIRMED` sales orders
3. Click **"Pack Order"** next to the order you want to pack
4. The system creates a Package record with status `PACKED`

### Package Statuses
| Status | Meaning |
|--------|---------|
| `PACKED` | Goods are packed and ready to ship |
| `SHIPPED` | Package has been dispatched |

---

## 13. Shipments

**URL**: `/shipments`

A Shipment records when a packed package is **dispatched to the customer**.

### How to Ship a Package
1. Go to **Shipments** in the sidebar
2. In the **"Packages Ready to Ship"** section, you will see all packed packages
3. Click **"Confirm Shipment"** next to the package
4. The system:
   - Deducts stock from the warehouse (On Hand decreases)
   - Updates the Sales Order status to `FULFILLED`
   - Creates a Shipment record

> **IMPORTANT**: Stock is only deducted from the warehouse at the time of shipment — not when the order is created or confirmed.

---

## 14. Invoices (Customer Billing)

**URL**: `/invoices`

An Invoice is a **tax document** issued to the customer after goods are shipped, requesting payment.

### How to Create an Invoice
1. Go to **Invoices** in the sidebar
2. In the **"Orders Ready for Invoicing"** section, you will see fulfilled/shipped/confirmed orders
3. Click **"Create Invoice"** next to the order
4. The system generates an invoice (e.g., `INV-00001`) with the full order amount

### Invoice Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | Invoice generated, not yet sent |
| `SENT` | Invoice sent to customer |
| `PARTIALLY_PAID` | Customer has paid part of the invoice |
| `PAID` | Invoice is fully paid |
| `VOID` | Invoice was cancelled / reversed |

---

## 15. Payments Received

**URL**: `/payments`

Records **money collected from customers** against their invoices.

### How to Record a Customer Payment
1. Go to **Payments** in the sidebar
2. In the **"Invoices Awaiting Payment Collection"** section, you will see all unpaid customer invoices
3. Click **"Collect Payment"** next to the invoice
4. A payment modal opens showing: Customer name, Invoice total, Amount paid so far, Balance due
5. Choose **Payment Method**: Bank Transfer, UPI, Cheque, Cash, Credit Card
6. Adjust amount if collecting partial payment
7. Click **"Record Payment"**

### What happens automatically:
- If partial payment → Invoice status becomes `PARTIALLY_PAID`
- If full payment → Invoice status becomes `PAID`
- The "Receivables" amount on the Dashboard decreases

### Payment Methods
| Method | Use Case |
|--------|----------|
| `BANK` | NEFT / RTGS / IMPS bank transfer |
| `UPI` | PhonePe, Google Pay, Paytm |
| `CHEQUE` | Post-dated or regular cheque |
| `CASH` | Cash payment at counter |
| `CREDIT_CARD` | Card payment |

---

## 16. Sales Returns

**URL**: `/sales-returns`

A Sales Return records when a **customer sends back goods** they already received.

### When to Use
- Customer received damaged goods
- Customer ordered wrong product
- Customer needs to return items (per your return policy)

### What happens when a return is received:
- Stock is added back to the warehouse
- A Credit Note can be issued to the customer

---

## 17. Purchase Orders

**URL**: `/purchase-orders`

A Purchase Order (PO) is a document you send to a **vendor to order goods**.

### How to Create a Purchase Order
1. Go to **Purchase Orders** in the sidebar
2. Click **"+ New Purchase Order"**
3. Select:
   - **Vendor** (required — who you are buying from)
   - **Warehouse** (required — where goods will be received)
4. Add **Line Items**: Product, Quantity, Unit Cost
5. Click **"Create Purchase Order"**

### Purchase Order Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | PO created, not yet sent to vendor |
| `CONFIRMED` | Sent to vendor and confirmed |
| `RECEIVED` | Goods received from vendor |
| `CANCELLED` | PO was cancelled |

---

## 18. Purchase Receives (GRN)

**URL**: `/receives`

A Purchase Receive (also called **Goods Receipt Note / GRN**) records when you **physically receive goods from a vendor**.

### How to Receive Goods
1. Go to **Receives** in the sidebar
2. You will see all confirmed purchase orders
3. Click **"Receive"** against the PO
4. The system:
   - Adds the received quantity to the specified warehouse stock
   - Updates the Purchase Order status to `RECEIVED`

> **IMPORTANT**: Stock only increases in the warehouse when you mark goods as Received — not when the PO is created.

---

## 19. Bills (Vendor Invoices)

**URL**: `/bills`

A Bill is the **vendor's invoice** — the payment request you receive from your supplier after they deliver goods.

### How to Create a Bill from a Purchase Order
1. Go to **Bills** in the sidebar
2. In the **"Purchase Orders Ready for Billing"** section, you will see received POs
3. Click **"Bill from PO"** next to the PO
4. A bill is automatically created from the PO amount (e.g., `BILL-00001`)

### How to Pay a Bill
1. Click **"Pay Bill"** next to an unpaid bill
2. Select **Payment Method** and enter the **Amount Paid**
3. Click **"Record Payment"**

### Bill Statuses
| Status | Meaning |
|--------|---------|
| `DRAFT` | Bill received, not yet paid |
| `PARTIALLY_PAID` | Part payment made to vendor |
| `PAID` | Bill fully paid |
| `VOID` | Bill reversed / cancelled |

---

## 20. Purchase Returns

**URL**: `/purchase-returns`

A Purchase Return records when you **send goods back to a vendor** (e.g., defective goods received, wrong items delivered).

---

## 21. Reports & Analytics

**URL**: `/reports`

The Reports page provides detailed **business intelligence** for data-driven decisions.

### Available Reports
| Report | What it shows |
|--------|---------------|
| **Inventory Summary** | Stock levels, reserved quantity, available quantity, and value per product per warehouse |
| **Stock Movement** | Complete history of all stock movements (receipts, shipments, adjustments, transfers) |
| **Low Stock Alert** | All products at or below their reorder level |
| **Batch Expiry** | Products nearing their expiry date (for batch-tracked items) |
| **Serial Numbers** | All serial number records |
| **Sales by Customer** | Total revenue grouped by each customer |
| **CSV Export** | Download inventory or low stock report as a spreadsheet |

---

## 22. Notifications

**URL**: `/notifications`

System notifications are auto-generated for important business events such as:
- Payment received from a customer
- Invoice created
- Shipment confirmed
- Low stock alert triggered

---

## 23. Users & Access Control

**URL**: `/users`

You can **invite team members** to your organization with specific role-based access.

### Default Roles
| Role | Access Level |
|------|-------------|
| **Owner** | Full access to everything |
| **Admin** | Full access except organization-level settings |
| **Sales Manager** | Sales orders, estimates, invoices, payments |
| **Purchase Manager** | Purchase orders, receives, bills |
| **Warehouse Staff** | Inventory, adjustments, transfers |
| **Accountant** | Invoices, payments, bills, reports |
| **Viewer** | Read-only access to all sections |

### How to Add a User
1. Go to **Users** in the sidebar
2. Click **"Invite User"**
3. Enter their Email and select a Role
4. They can log in and access only their permitted sections

---

## 24. Audit Log

**URL**: `/audit`

The Audit Log shows a **complete history of every action** performed in the system:
- Who performed the action
- What action was taken (CREATE, UPDATE, DELETE)
- Which record was affected
- When it happened

This is useful for compliance, security reviews, and investigating data changes.

---

## 25. Settings

**URL**: `/settings`

Configure your organization settings:
- Organization name and address
- Invoice prefix and numbering
- Tax settings
- Currency settings (default: INR)
- Timezone and locale

---

## 26. Complete Business Workflow

### Sales Cycle (Order to Cash)

```
Step 1: Add Products      →  /products        (Set up your catalog)
Step 2: Add Warehouses    →  /warehouses      (Set up storage locations)
Step 3: Add Stock         →  /adjustments     (Enter opening inventory)
Step 4: Add Customer      →  /customers       (Register your buyer)
Step 5: Create Estimate   →  /estimates       (Optional: send a quote first)
Step 6: Create Sales Order→  /sales-orders    (Confirm the sale)
Step 7: Confirm Order     →  Click "Confirm"  (Reserve the stock)
Step 8: Pack Order        →  /packages        (Click "Pack Order")
Step 9: Ship Package      →  /shipments       (Click "Confirm Shipment" - stock deducted)
Step 10: Create Invoice   →  /invoices        (Click "Create Invoice" - tax document sent)
Step 11: Collect Payment  →  /payments        (Click "Collect Payment" - record cash received)
```

### Purchase Cycle (Procure to Pay)

```
Step 1: Add Vendor        →  /vendors              (Register your supplier)
Step 2: Create PO         →  /purchase-orders      (Order goods from vendor)
Step 3: Receive Goods     →  /receives             (Click "Receive" - stock added)
Step 4: Create Bill       →  /bills                (Click "Bill from PO" - record vendor invoice)
Step 5: Pay Bill          →  Click "Pay Bill"      (Record payment to vendor)
```

---

## 27. Technical Setup & Running

### Prerequisites
- Node.js 18 or higher
- npm 9 or higher
- MongoDB Atlas connection string (configured in `.env`)

### Project Structure
```
Zoho-bill/
├── apps/
│   ├── api/                    NestJS Backend REST API
│   │   ├── src/modules/
│   │   │   ├── auth/           Login, Register, JWT tokens
│   │   │   ├── catalog/        Products, Customers, Vendors
│   │   │   ├── inventory/      Stock, Adjustments, Transfers
│   │   │   ├── sales/          Orders, Packages, Shipments, Invoices, Payments
│   │   │   ├── purchases/      POs, Receives, Bills
│   │   │   └── reports/        Dashboard, Analytics, Reports
│   │   └── prisma/schema.prisma  Database schema (MongoDB)
│   └── web/                    React + Vite Frontend
│       └── src/
│           ├── App.tsx         Route definitions
│           ├── pages.tsx       All page components
│           ├── shell.tsx       App layout, sidebar navigation
│           └── api.ts          Axios API client
```

### Running the Development Server

```bash
# From the project root
npm run dev
```

This starts:
- **API Server**: http://localhost:3001  (NestJS)
- **Web App**:    http://localhost:5176  (Vite React)

The web app proxies all `/api/v1/*` requests to the backend automatically via Vite proxy configuration.

### Environment Variables

```env
# apps/api/.env
DATABASE_URL=mongodb+srv://...    # MongoDB Atlas connection string
JWT_SECRET=...                     # Secret key for JWT token signing
JWT_REFRESH_SECRET=...             # Secret key for refresh tokens
```

### Building for Production

```bash
npm run build -w apps/api    # Build NestJS API
npm run build -w apps/web    # Build React frontend (output: apps/web/dist/)
```

### API Documentation (Swagger)
Once the API is running, access interactive API docs at:
`http://localhost:3001/api-docs`

---

## Quick Reference: URL Guide

| Page | URL | Purpose |
|------|-----|---------|
| Dashboard | `/` | Business analytics overview |
| Products | `/products` | Manage product catalog |
| Warehouses | `/warehouses` | Manage storage locations |
| Inventory | `/inventory` | View current stock levels |
| Adjustments | `/adjustments` | Manual stock corrections |
| Transfers | `/transfers` | Move stock between warehouses |
| Customers | `/customers` | Manage buyer contacts |
| Vendors | `/vendors` | Manage supplier contacts |
| Estimates | `/estimates` | Create price quotations |
| Sales Orders | `/sales-orders` | Manage customer orders |
| Packages | `/packages` | Pack orders for shipment |
| Shipments | `/shipments` | Dispatch packed orders |
| Invoices | `/invoices` | Create and track customer invoices |
| Payments | `/payments` | Record customer payments |
| Sales Returns | `/sales-returns` | Handle customer returns |
| Purchase Orders | `/purchase-orders` | Order goods from vendors |
| Receives | `/receives` | Record goods received from vendors |
| Bills | `/bills` | Manage vendor invoices |
| Purchase Returns | `/purchase-returns` | Return goods to vendors |
| Reports | `/reports` | Business intelligence and exports |
| Notifications | `/notifications` | System alerts and events |
| Users | `/users` | Team access management |
| Audit Log | `/audit` | Complete activity history |
| Settings | `/settings` | Organization configuration |

---

*Inventra v1.0 Documentation — Built with NestJS + MongoDB + React + Vite*
