# 📦 Inventra — User Guide
### *The Complete Guide for Business Owners & Staff*

---

> **Who is this guide for?**  
> This guide is written for **you — the business owner, sales executive, accountant, or warehouse staff** using Inventra daily.  
> No technical knowledge needed. Every step is explained simply.

---

## 🗂️ What Can Inventra Do For Your Business?

Inventra is a **complete business management system** that helps you:

| What you want to do | Where it happens |
|---------------------|-----------------|
| Track your products and stock | Inventory & Products |
| Send quotes to customers | Estimates |
| Manage customer orders | Sales Orders |
| Pack and ship goods | Packages & Shipments |
| Raise invoices and collect money | Invoices & Payments |
| Order from suppliers | Purchase Orders |
| Receive goods and pay vendors | Receives & Bills |
| See how your business is doing | Dashboard & Reports |

---

## 📋 Table of Contents

1. [Logging In](#1-logging-in)
2. [Your Dashboard — Business Overview](#2-your-dashboard--business-overview)
3. [Setting Up Your Products](#3-setting-up-your-products)
4. [Setting Up Your Warehouses (Godowns)](#4-setting-up-your-warehouses-godowns)
5. [Checking Your Stock (Inventory)](#5-checking-your-stock-inventory)
6. [Correcting Stock (Adjustments)](#6-correcting-stock-adjustments)
7. [Moving Stock Between Warehouses (Transfers)](#7-moving-stock-between-warehouses-transfers)
8. [Adding Your Customers](#8-adding-your-customers)
9. [Adding Your Vendors / Suppliers](#9-adding-your-vendors--suppliers)
10. [Sending a Quotation to a Customer (Estimates)](#10-sending-a-quotation-to-a-customer-estimates)
11. [Creating a Customer Order (Sales Orders)](#11-creating-a-customer-order-sales-orders)
12. [Packing the Order (Packages)](#12-packing-the-order-packages)
13. [Dispatching the Order (Shipments)](#13-dispatching-the-order-shipments)
14. [Raising a Customer Invoice (Billing)](#14-raising-a-customer-invoice-billing)
15. [Collecting Payment from Customer](#15-collecting-payment-from-customer)
16. [When a Customer Returns Goods](#16-when-a-customer-returns-goods)
17. [Ordering Goods from a Supplier (Purchase Orders)](#17-ordering-goods-from-a-supplier-purchase-orders)
18. [Receiving Goods from Supplier](#18-receiving-goods-from-supplier)
19. [Paying Your Supplier (Bills)](#19-paying-your-supplier-bills)
20. [Viewing Business Reports](#20-viewing-business-reports)
21. [Managing Your Team (Users)](#21-managing-your-team-users)
22. [Complete Business Workflow — Step by Step](#22-complete-business-workflow--step-by-step)
23. [Understanding Order Statuses](#23-understanding-order-statuses)
24. [Frequently Asked Questions](#24-frequently-asked-questions)

---

## 1. Logging In

1. Open your browser and go to your Inventra link (e.g., `http://localhost:5176`)
2. Enter your **Email** and **Password**
3. Click **Sign In**

You will land on your **Dashboard** — the home page showing your business summary.

> 🔑 **Forgot password?** Contact your system administrator to reset it.

---

## 2. Your Dashboard — Business Overview

**The Dashboard is the first page you see after logging in.** Think of it as your **business health report card** — everything important in one place.

### 🏭 Warehouse Filter (Top Right Corner)
You will see a dropdown that says **"All Warehouses"**.

- Leave it on **"All Warehouses"** to see your full business picture
- Select a **specific warehouse** (e.g., "Main Godown", "Chennai Branch") to see only that location's numbers

### 📊 The 8 Big Numbers (Metric Cards)

| Card | What it tells you | Why it matters |
|------|-------------------|----------------|
| **Total Sales Revenue** | Total value of all your sales orders | How much business you have done |
| **Total Collected** | Cash you have actually received from customers | Your real cash inflow |
| **Receivables (Pending)** | Money customers still owe you | How much is yet to come in |
| **Total Purchases** | Value of goods you ordered from suppliers | Your procurement spending |
| **Bills Payable** | Money you still owe to suppliers | What you need to pay out |
| **Inventory Value** | Current market value of all your stock | How much is tied up in goods |
| **Stock Units** | Total number of items in your warehouse | Physical stock count |
| **Low Stock Items** | Products running low | Items you need to reorder |

### 📈 Charts You Will See

- **Sales Order Trend** — A line graph showing your last 10 orders. Going up = good business!
- **Collections Overview** — A circle chart showing how much you collected vs. how much is still outstanding
- **Top Selling Items** — Your 5 best-selling products this period
- **Low Stock Alerts** — Products that need urgent reordering
- **Recent Payments** — Last few payments received from customers
- **Recent Orders** — Last few customer orders with their status

### ⚠️ Red Warning Banner
If you see an orange/red banner at the bottom saying **"X items are running low"** — you need to reorder those products from your supplier soon!

---

## 3. Setting Up Your Products

**Sidebar → Products**

Before you can sell anything, you must add your products to Inventra.

### What is a Product?
A product is any item you sell to customers or buy from suppliers — a pen, a machine, a service, etc.

### How to Add a New Product

1. Click **Products** in the left sidebar
2. Click the **"+ New Item"** button (top right)
3. Fill in the form:

| Field | What to enter | Example |
|-------|--------------|---------|
| **Item Name** | The name of your product | "A4 Paper Ream 500 sheets" |
| **SKU** | A short unique code you choose | "A4-500" |
| **Selling Price** | How much you sell it for (Rs.) | 250 |
| **Cost Price** | How much you buy it for (Rs.) | 180 |
| **Tax Rate** | GST percentage | 18 |
| **Reorder Level** | Minimum stock before alert fires | 10 |
| **Description** | Optional notes | "White A4 paper" |

4. Click **"Create Item"**

> ✅ **Tip on SKU**: SKU is your own shortcode. Make it simple and memorable. Once set, it cannot be the same as another product.

> ✅ **Tip on Reorder Level**: If you set reorder level = 10, the system will alert you when stock drops to 10 or below. Set this to how many days of stock you want as a buffer.

---

## 4. Setting Up Your Warehouses (Godowns)

**Sidebar → Warehouses**

A Warehouse is any physical location where you store goods — a godown, a shop, a branch office.

### Why add multiple warehouses?
- **Main Godown** — your central storage
- **Delhi Branch** — stock sent to Delhi office
- **Showroom** — stock kept for display/sale at the shop

Each warehouse tracks its own stock independently.

### How to Add a Warehouse

1. Click **Warehouses** in the sidebar
2. Click **"+ New Warehouse"**
3. Enter:
   - **Name**: e.g., "Main Godown", "Chennai Store"
   - **Address/Location**: Where it is physically located
4. Click **"Create Warehouse"**

---

## 5. Checking Your Stock (Inventory)

**Sidebar → Inventory**

This page shows you **exactly how much of each product you have** in each warehouse right now.

### Understanding the Stock Numbers

| Column | Plain Meaning |
|--------|--------------|
| **On Hand** | Total physical quantity currently in the godown |
| **Reserved** | Quantity already promised to customers (confirmed orders waiting to ship) |
| **Available** | What you can still sell = On Hand minus Reserved |
| **Value** | Worth of your available stock in rupees |

### Example
Your A4 Paper stock:
- On Hand: **100 reams**
- Reserved: **30 reams** (for 3 confirmed orders)
- Available: **70 reams** (what you can still sell to new customers)

---

## 6. Correcting Stock (Adjustments)

**Sidebar → Adjustments**

Use Stock Adjustments when your **physical count does not match what the system shows**.

### When would you need this?
- After a yearly or monthly stock audit
- Some goods were damaged and thrown away
- New stock was added before a PO was raised
- Setting up opening stock for the first time

### How to Adjust Stock

1. Click **Adjustments** in the sidebar
2. Click **"New Adjustment"**
3. Select:
   - **Warehouse** (which godown)
   - **Product** (which item)
   - **New Quantity** (what the actual count is NOW)
   - **Reason** (e.g., "Annual audit", "Damaged goods disposed")
4. Click **"Save Adjustment"**

> ℹ️ The system records the old quantity and new quantity. This is kept in the audit trail.

---

## 7. Moving Stock Between Warehouses (Transfers)

**Sidebar → Transfers**

Use Transfers to **physically move goods from one of your warehouses to another**.

### When would you need this?
- Sending goods from Main Godown to a branch store
- Replenishing low stock at one location from another
- Consolidating slow-moving stock

### How to Transfer Stock

1. Click **Transfers** in the sidebar
2. Click **"New Transfer"**
3. Select:
   - **From Warehouse** (where stock is coming from)
   - **To Warehouse** (where stock is going)
   - **Product** and **Quantity**
4. Click **"Create Transfer"**

> ⚠️ The transfer happens immediately — stock is deducted from the source and added to the destination right away.

---

## 8. Adding Your Customers

**Sidebar → Customers**

Customers are the companies or people you **sell goods to**.

### How to Add a Customer

1. Click **Customers** in the sidebar
2. Click **"+ New Customer"**
3. Enter:
   - **Name**: Company name or person's name
   - **Email**: Their email address
   - **Phone**: Contact number
   - **City**: Their city
   - **GSTIN**: Their GST number (important for B2B invoicing)
4. Click **"Create Customer"**

> 💡 You need to add a customer first before creating any sales order or invoice for them.

---

## 9. Adding Your Vendors / Suppliers

**Sidebar → Vendors**

Vendors are the companies or people you **buy goods from**.

### How to Add a Vendor

1. Click **Vendors** in the sidebar
2. Click **"+ New Vendor"**
3. Enter:
   - **Name**: Supplier's company name
   - **Email**: Their email
   - **Phone**: Contact number
   - **City**: Their city
   - **GSTIN**: Their GST number
4. Click **"Create Vendor"**

> 💡 You need to add a vendor first before creating any purchase order for them.

---

## 10. Sending a Quotation to a Customer (Estimates)

**Sidebar → Estimates**

An Estimate (also called a Quotation or Quote) is a **price proposal you send to a customer before they formally order**.

### When to use it?
- A customer asks: *"How much will 100 units cost?"*
- You want to give them a written quote before they confirm

### How to Create an Estimate

1. Click **Estimates** in the sidebar
2. Click **"New Estimate"**
3. Select the **Customer**
4. Add your products:
   - Click **"Add Line"**
   - Choose Product, enter Quantity
   - The price auto-fills from your product's selling price (you can change it)
5. Add **Discount** or **Shipping** if needed
6. Click **"Create Estimate"**

### What happens next?
- Share the estimate number / details with your customer
- If they agree → Convert it to a Sales Order
- If they don't agree → Mark estimate as Declined

---

## 11. Creating a Customer Order (Sales Orders)

**Sidebar → Sales Orders**

A Sales Order is created when a customer **confirms they want to buy** — either verbally, by email, or by sending you their own Purchase Order.

### How to Create a Sales Order

1. Click **Sales Orders** in the sidebar
2. Click **"+ New Sales Order"**
3. Select:
   - **Customer** (who is buying)
   - **Warehouse** (from which godown will goods be dispatched)
4. Add products:
   - Select Product, enter Quantity
   - Unit Price auto-fills (you can edit)
5. Add Discount or Shipping if needed
6. Click **"Create Order"**

The order is now in **DRAFT** status.

### How to Confirm the Order

- Find the order in the list
- Click **"Confirm"** button
- Status changes to **CONFIRMED** ✅
- The stock is now **reserved** for this customer

> ⚠️ **Important**: Confirming an order does NOT deduct stock yet. Stock is only deducted when you ship the goods. Confirming just reserves the stock so you don't sell it to someone else.

---

## 12. Packing the Order (Packages)

**Sidebar → Packages**

After confirming an order, the next step is to **physically pack the goods** at your warehouse.

### How to Pack an Order

1. Click **Packages** in the sidebar
2. You will see a section called **"Orders Ready for Packing"**
3. It shows all your CONFIRMED orders waiting to be packed
4. Click **"Pack Order"** next to the order
5. A package record is created — the status is now **PACKED** ✅

> 💡 Think of this as: your warehouse team has put the goods in a box and stuck the delivery label on it. Ready to hand over to the courier.

---

## 13. Dispatching the Order (Shipments)

**Sidebar → Shipments**

After packing, the next step is to **hand over the parcel to the courier / transport** and mark it as dispatched.

### How to Ship a Package

1. Click **Shipments** in the sidebar
2. You will see a section called **"Packages Ready to Ship"**
3. It shows all packed orders waiting to be dispatched
4. Click **"Confirm Shipment"** next to the package
5. The system:
   - ✅ Deducts the goods from your warehouse stock
   - ✅ Updates the Sales Order status to FULFILLED
   - ✅ Creates a Shipment record

> ⚠️ **This is the step where stock actually leaves your warehouse.** Until you confirm shipment, the goods are still counted in your inventory.

---

## 14. Raising a Customer Invoice (Billing)

**Sidebar → Invoices**

After dispatching goods, you need to **raise a formal invoice (bill)** asking the customer to pay.

### How to Create an Invoice

1. Click **Invoices** in the sidebar
2. You will see a section called **"Orders Ready for Invoicing"**
3. It shows all shipped/fulfilled orders waiting for an invoice
4. Click **"Create Invoice"** next to the order
5. The system generates invoice number (e.g., **INV-00001**) automatically
6. The invoice appears in your **"All Customer Invoices"** list below

### What does the invoice contain?
- Your company name & address
- Customer name & GSTIN
- Invoice number and date
- List of goods supplied with quantities and prices
- Tax (GST) breakdown
- Total amount due

> 💡 You can print or email the invoice number/details to your customer and ask them to pay.

---

## 15. Collecting Payment from Customer

**Sidebar → Payments**

When your customer pays you (by bank transfer, UPI, cheque, or cash), record it here.

### How to Record a Payment

1. Click **Payments** in the sidebar
2. You will see **"Invoices Awaiting Payment Collection"** section
3. It shows all invoices where the customer has NOT paid yet
4. Find the invoice and click **"Collect Payment"**
5. A form opens showing:
   - Customer name
   - Invoice total amount
   - How much they have paid so far (if partial)
   - **Balance due** (pre-filled automatically)
6. Choose the **Payment Method**:
   - Bank Transfer (NEFT/RTGS/IMPS)
   - UPI (PhonePe, GPay, Paytm)
   - Cheque
   - Cash
   - Credit Card
7. Enter the **amount received** (or leave it as the full balance)
8. Click **"Record Payment"**

### What happens automatically?
- If customer paid the **full amount** → Invoice status becomes **PAID** ✅
- If customer paid **partial amount** → Invoice status becomes **PARTIALLY PAID** 🔶
- Your **Receivables** balance on the Dashboard decreases
- A payment receipt record is created in the Payment Receipt History table

---

## 16. When a Customer Returns Goods

**Sidebar → Sales Returns**

If a customer sends back goods (damaged, wrong item, changed mind):

1. Go to **Sales Returns** in the sidebar
2. Create a Sales Return record against the original Sales Order
3. Once approved, the stock is added back to your warehouse

---

## 17. Ordering Goods from a Supplier (Purchase Orders)

**Sidebar → Purchase Orders**

When you need to **buy stock from a supplier**, create a Purchase Order (PO).

### How to Create a Purchase Order

1. Click **Purchase Orders** in the sidebar
2. Click **"+ New Purchase Order"**
3. Select:
   - **Vendor** (which supplier you are buying from)
   - **Warehouse** (which godown the goods will come to)
4. Add products:
   - Select Product, enter Quantity
   - Unit cost auto-fills from your product's cost price (you can edit)
5. Click **"Create Purchase Order"**

### What to do next?
- Share this PO number with your supplier
- Wait for them to deliver the goods
- When goods arrive → go to **Receives** to accept them

---

## 18. Receiving Goods from Supplier

**Sidebar → Receives** (Purchase Receives)

When the supplier **delivers goods to your warehouse**, record it here.

### How to Receive Goods

1. Click **Receives** in the sidebar
2. You will see confirmed purchase orders waiting to be received
3. Click **"Receive"** against the PO from which goods arrived
4. The system:
   - ✅ Adds the received quantity to your warehouse stock
   - ✅ Updates the PO status to RECEIVED

> ⚠️ **This is the step where stock actually enters your warehouse.** Until you mark it as Received, the goods are NOT counted in your inventory.

---

## 19. Paying Your Supplier (Bills)

**Sidebar → Bills**

After you receive goods, the supplier sends you their invoice (which you need to pay). Record it as a Bill.

### How to Create a Bill from a Purchase Order

1. Click **Bills** in the sidebar
2. You will see **"Purchase Orders Ready for Billing"** showing received POs
3. Click **"Bill from PO"** next to the PO
4. A bill is automatically created (e.g., **BILL-00001**) with the PO amount

### How to Pay the Bill

1. Find the bill in the Bills list
2. Click **"Pay Bill"**
3. Choose payment method and enter amount
4. Click **"Record Payment"**

Your **Payables** amount on the Dashboard will decrease after payment.

---

## 20. Viewing Business Reports

**Sidebar → Reports**

Reports give you deeper analysis of your business beyond the Dashboard.

### Available Reports

| Report | What it tells you |
|--------|------------------|
| **Inventory Summary** | Full stock list — every product, every warehouse, quantity and value |
| **Stock Movement** | Complete history — every time stock came in or went out |
| **Low Stock Alert** | List of all products that need reordering now |
| **Sales by Customer** | Which customers gave you the most business |
| **Download CSV** | Export any report to Excel / spreadsheet for further analysis |

### How to view a report
1. Click **Reports** in the sidebar
2. Click on the report tab you want to view

---

## 21. Managing Your Team (Users)

**Sidebar → Users**

You can add your staff members to Inventra with specific access levels.

### Staff Roles & What They Can Do

| Role | What they can access |
|------|---------------------|
| **Admin** | Everything — full access |
| **Sales Manager** | Sales orders, estimates, invoices, payments |
| **Purchase Manager** | Purchase orders, receives, bills |
| **Warehouse Staff** | Inventory, stock adjustments, transfers |
| **Accountant** | Invoices, bills, payments, reports |
| **Viewer** | Can only view (cannot create or edit anything) |

### How to Add a Staff Member

1. Click **Users** in the sidebar
2. Click **"Invite User"**
3. Enter their **Email** and select their **Role**
4. They can now log in with their own email and password

> 💡 Give only the access level that person needs. For example, a delivery boy only needs Warehouse Staff access.

---

## 22. Complete Business Workflow — Step by Step

### 📦 Selling to a Customer (One Complete Cycle)

```
You add your products → Customers tab (add buyer) → Sales Orders (create order)
→ Confirm the order → Packages (pack the goods) → Shipments (dispatch)
→ Invoices (raise the invoice) → Payments (collect the money) ✅ Done!
```

### 🛒 Buying from a Supplier (One Complete Cycle)

```
You add vendors → Purchase Orders (raise PO to supplier) 
→ Receives (mark goods received when they arrive)
→ Bills (enter supplier's invoice) → Pay the bill ✅ Done!
```

---

## 23. Understanding Order Statuses

### Sales Order Status

| Status | What it means | What to do next |
|--------|--------------|-----------------|
| 🔵 **DRAFT** | Order created but not yet confirmed | Click "Confirm" |
| 🟡 **CONFIRMED** | Confirmed, stock reserved | Go to Packages → Pack it |
| 📦 **PACKED** | Goods packed in box | Go to Shipments → Dispatch it |
| 🚚 **FULFILLED** | Goods dispatched to customer | Go to Invoices → Raise invoice |
| ✅ **PAID** | Invoice paid by customer | Nothing — completed! |
| ❌ **CANCELLED** | Order was cancelled | No further action |

### Invoice Status

| Status | What it means |
|--------|--------------|
| 📝 **DRAFT** | Invoice created, not yet sent |
| 📤 **SENT** | Sent to customer |
| 🔶 **PARTIALLY PAID** | Customer paid some amount |
| ✅ **PAID** | Fully paid — nothing pending |
| ❌ **VOID** | Invoice cancelled / reversed |

### Purchase Order Status

| Status | What it means |
|--------|--------------|
| 🔵 **DRAFT** | PO created, not sent to vendor |
| 🟡 **CONFIRMED** | Sent to vendor and confirmed |
| ✅ **RECEIVED** | Goods arrived and received |
| ❌ **CANCELLED** | PO was cancelled |

---

## 24. Frequently Asked Questions

**Q: I confirmed a sales order. Where did my stock go?**  
A: It is still in your warehouse but "Reserved". It won't show in Available stock. Stock is deducted only when you ship the order.

---

**Q: I shipped an order but the invoice page is empty. Why?**  
A: Go to **Invoices** and look at the **"Orders Ready for Invoicing"** section at the top. Click **"Create Invoice"** to generate the invoice for that order.

---

**Q: I created an invoice but Payments page shows nothing. Why?**  
A: Go to **Payments** and look at the **"Invoices Awaiting Payment Collection"** section at the top. Click **"Collect Payment"** next to your invoice.

---

**Q: My Dashboard shows Receivables but I already collected payment. Why is it still showing?**  
A: You need to record the payment in the **Payments** page. Simply shipping and invoicing does not automatically mark it as paid — you must click "Collect Payment" and record the actual receipt.

---

**Q: How do I add opening stock when I am setting up for the first time?**  
A: Go to **Adjustments** and create an adjustment for each product in each warehouse. Enter the current physical stock count. This will set your opening stock.

---

**Q: Can I have different selling prices for different customers?**  
A: Yes! When creating a Sales Order, you can manually change the Unit Price for any line item to give a special price to that customer.

---

**Q: A customer is asking for a credit note / refund. What do I do?**  
A: Go to **Sales Returns** and create a return against their original Sales Order. The system will record the return and add the stock back to your warehouse.

---

**Q: The system says "Low Stock" for a product. What should I do?**  
A: Create a **Purchase Order** for that product from your supplier to restock it.

---

**Q: Can my accountant see only billing, not stock?**  
A: Yes. Assign them the **Accountant** role in the Users section. They will only see Invoices, Bills, Payments, and Reports.

---

*Inventra User Guide — Written for Business Owners & Staff*  
*For technical support, contact your system administrator.*
