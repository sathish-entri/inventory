# Inventra

Original inventory and order management platform inspired by Zoho Inventory **workflows**, not its UI or source.

## Stack

- Frontend: React, TypeScript, Vite, TanStack Query, Tailwind CSS, Recharts
- Backend: NestJS, Prisma, PostgreSQL, Redis-ready queues, JWT + RBAC
- Inventory truth: `inventory_stock` + immutable `inventory_transactions` ledger
- Third parties: replaceable `PaymentProvider`, `ShippingProvider`, `EmailProvider` (stubs by default)

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
cd apps/api && npx prisma migrate dev --name init && npx prisma db seed && cd ../..
npm run dev:api
npm run dev:web
```

Open http://localhost:5173

Demo login (after seed): `admin@demo.local` / `Admin123!`

API docs: http://localhost:3001/docs  
Health: http://localhost:3001/api/v1/health

## Critical inventory rule

The UI never writes stock. Stock changes only through `InventoryService` inside a database transaction:

- Confirm sales order → reserve available quantity
- Confirm shipment → deduct physical + release reservation + ledger
- Purchase receive → increase stock (PO itself never increases stock)
- Transfer → out + in in one transaction
- Adjustment / returns → ledger entries

`available = quantity - reserved`

Example: physical 100, reserved 20, available 80. Reserve 10 → reserved 30, available 70. Ship 10 → physical 90, reserved 20, available 70.

## Business flows

1. **Purchase:** Vendor → PO (no stock) → Receive (stock up) → Bill → Vendor payment
2. **Sales:** Customer → Estimate → Sales order → Confirm (reserve) → Package → Shipment (stock down) → Invoice → Payment
3. **Returns:** Sales return receive restocks; purchase return issues stock
4. **Warehouse:** Opening stock, adjustment, transfer, batch/serial, composite BOM explosion on reserve/ship

## Multi-tenancy & security

Every business table has `organization_id`. JWT carries `orgId`. Queries always filter by the authenticated organization. Roles: Admin, Inventory Manager, Sales Manager, Purchase Manager, Accountant, Warehouse Staff, Viewer. Permissions use `resource:action`.

Webhooks verify signatures and unique `(provider, event_id)`. Mutations accept `Idempotency-Key`.

## Development phases (status)

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Monorepo, Docker, auth, orgs, RBAC, validation, errors, Swagger, versioning | Implemented |
| 2 | Categories, brands, units, products, warehouses | Implemented |
| 3 | Inventory engine, ledger, opening stock | Implemented |
| 4 | Sales, packages, shipments, invoices, payments | Implemented |
| 5 | Purchases, receives, bills | Implemented |
| 6 | Batch, serial, composite, reorder alerts | Implemented |
| 7 | Dashboard & reports | Implemented |
| 8 | Provider adapters + webhooks | Stub adapters |
| 9 | Rate limit, helmet, CORS, Docker | Baseline hardening |

## Tests

```bash
npm run test:api
npm run typecheck
```

## Definition of Done (module checklist)

Schema + API + validation + RBAC + tenant isolation + inventory/financial transactions + tests + UI states + audit + docs.

Core remaining production work: real Stripe/Razorpay and carrier adapters, PDF invoice storage on S3, BullMQ workers, Playwright E2E, and OpenSearch when search volume requires it.
