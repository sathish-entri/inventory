/**
 * Comprehensive realistic seed script
 *
 * Business Scenario: "Inventra Tech Supplies" — a B2B distributor
 * selling electronics, furniture, produce, and packaging supplies.
 *
 * Data covers the full lifecycle:
 *   Vendor → PO → Receive → Bill → VendorPayment
 *   Customer → Estimate → SO → Package → Shipment → Invoice → Payment
 *   Adjustments, Transfers, Returns, Batches, Serials, Notifications
 *
 * PRE-CALCULATED ANALYTICS (verified below):
 *   totalSales       = 143,406.9
 *   receivables      = 59,310.5
 *   totalCollected   = 84,096.4
 *   totalPurchases   = 109,240
 *   payables         = 37,600
 *   totalBillsPaid   = 71,640
 *   inventoryValue   = computed from final stock × costPrice
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "@inventra/shared";
import { AnalyticsService } from "../src/modules/analytics/analytics.service";

const prisma = new PrismaClient();

// ─── Helper ────────────────────────────────────────────────────────────────────
function daysAgo(n: number) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}
function daysFrom(n: number) {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}
function r2(n: number) {
  return Math.round(n * 100) / 100;
}

// ─── WIPE existing data for an org ────────────────────────────────────────────
async function wipeOrg(orgId: string) {
  console.log(`  Wiping existing data for org ${orgId}...`);
  // Order matters: leaf first, root last
  await prisma.analyticsSnapshot.deleteMany({ where: { organizationId: orgId } });
  await prisma.notification.deleteMany({ where: { organizationId: orgId } });
  await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
  await prisma.webhookEvent.deleteMany({ where: { organizationId: orgId } });
  await prisma.idempotencyKey.deleteMany({ where: { organizationId: orgId } });
  await prisma.paymentAllocation.deleteMany({ where: { payment: { organizationId: orgId } } });
  await prisma.payment.deleteMany({ where: { organizationId: orgId } });
  await prisma.invoiceLine.deleteMany({ where: { invoice: { organizationId: orgId } } });
  await prisma.invoice.deleteMany({ where: { organizationId: orgId } });
  await prisma.shipmentLine.deleteMany({ where: { shipment: { organizationId: orgId } } });
  await prisma.shipment.deleteMany({ where: { organizationId: orgId } });
  await prisma.packageLine.deleteMany({ where: { package: { organizationId: orgId } } });
  await prisma.package.deleteMany({ where: { organizationId: orgId } });
  await prisma.salesReturnLine.deleteMany({ where: { salesReturn: { organizationId: orgId } } });
  await prisma.salesReturn.deleteMany({ where: { organizationId: orgId } });
  await prisma.salesOrderLine.deleteMany({ where: { salesOrder: { organizationId: orgId } } });
  await prisma.salesOrder.deleteMany({ where: { organizationId: orgId } });
  await prisma.estimateLine.deleteMany({ where: { estimate: { organizationId: orgId } } });
  await prisma.estimate.deleteMany({ where: { organizationId: orgId } });
  await prisma.vendorPaymentAllocation.deleteMany({ where: { vendorPayment: { organizationId: orgId } } });
  await prisma.vendorPayment.deleteMany({ where: { organizationId: orgId } });
  await prisma.billLine.deleteMany({ where: { bill: { organizationId: orgId } } });
  await prisma.bill.deleteMany({ where: { organizationId: orgId } });
  await prisma.purchaseReturnLine.deleteMany({ where: { purchaseReturn: { organizationId: orgId } } });
  await prisma.purchaseReturn.deleteMany({ where: { organizationId: orgId } });
  await prisma.purchaseReceiveLine.deleteMany({ where: { purchaseReceive: { organizationId: orgId } } });
  await prisma.purchaseReceive.deleteMany({ where: { organizationId: orgId } });
  await prisma.purchaseOrderLine.deleteMany({ where: { purchaseOrder: { organizationId: orgId } } });
  await prisma.purchaseOrder.deleteMany({ where: { organizationId: orgId } });
  await prisma.vendor.deleteMany({ where: { organizationId: orgId } });
  await prisma.customer.deleteMany({ where: { organizationId: orgId } });
  await prisma.reservation.deleteMany({ where: { organizationId: orgId } });
  await prisma.inventoryTransaction.deleteMany({ where: { organizationId: orgId } });
  await prisma.inventoryStock.deleteMany({ where: { organizationId: orgId } });
  await prisma.stockTransferLine.deleteMany({ where: { transfer: { organizationId: orgId } } });
  await prisma.stockTransfer.deleteMany({ where: { organizationId: orgId } });
  await prisma.stockAdjustment.deleteMany({ where: { organizationId: orgId } });
  await prisma.batchStock.deleteMany({ where: { batch: { organizationId: orgId } } });
  await prisma.batch.deleteMany({ where: { organizationId: orgId } });
  await prisma.serialNumber.deleteMany({ where: { organizationId: orgId } });
  await prisma.reorderRule.deleteMany({ where: { organizationId: orgId } });
  await prisma.productComponent.deleteMany({ where: { parent: { organizationId: orgId } } });
  await prisma.product.deleteMany({ where: { organizationId: orgId } });
  await prisma.warehouse.deleteMany({ where: { organizationId: orgId } });
  await prisma.category.deleteMany({ where: { organizationId: orgId } });
  await prisma.brand.deleteMany({ where: { organizationId: orgId } });
  await prisma.unit.deleteMany({ where: { organizationId: orgId } });
  await prisma.rolePermission.deleteMany({ where: { role: { organizationId: orgId } } });
  await prisma.userRole.deleteMany({ where: { role: { organizationId: orgId } } });
  await prisma.role.deleteMany({ where: { organizationId: orgId } });
  await prisma.numberSequence.deleteMany({ where: { organizationId: orgId } });
  await prisma.integrationConfig.deleteMany({ where: { organizationId: orgId } });
  console.log(`  ✓ Wiped org ${orgId}`);
}

// ─── SEED ROLES & PERMISSIONS ─────────────────────────────────────────────────
async function seedRoles(orgId: string) {
  const perms = await prisma.permission.findMany();
  const byKey = new Map(perms.map((p) => [p.key, p]));
  const roleMap: Record<string, any> = {};

  for (const name of ROLES) {
    const role = await prisma.role.create({
      data: { organizationId: orgId, name, isSystem: true },
    });
    roleMap[name] = role;
    for (const key of ROLE_PERMISSIONS[name]) {
      const perm = byKey.get(key);
      if (!perm) continue;
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  return roleMap;
}

// ─── MAIN SEED FUNCTION ────────────────────────────────────────────────────────
async function seedOrganizationData(org: { id: string; name: string; slug: string }, adminUserId: string) {
  console.log(`\nSeeding: ${org.name} (${org.slug})`);

  // 1. Roles
  const roles = await seedRoles(org.id);

  // 2. Categories
  const catNames = ["Electronics", "Furniture & Office", "Produce & Agri", "Packaging & Supplies", "Hardware & Fasteners", "Health & Wellness"];
  const cats: Record<string, any> = {};
  for (const name of catNames) {
    cats[name] = await prisma.category.create({ data: { organizationId: org.id, name } });
  }

  // 3. Brands
  const brandNames = ["ProTech", "Inventra Gear", "FreshAgro", "PackMaster", "Generic", "HealthPlus"];
  const brands: Record<string, any> = {};
  for (const name of brandNames) {
    brands[name] = await prisma.brand.create({ data: { organizationId: org.id, name } });
  }

  // 4. Units
  const unitData = [
    { name: "Piece", abbreviation: "pcs" },
    { name: "Kilogram", abbreviation: "kg" },
    { name: "Box", abbreviation: "box" },
    { name: "Liter", abbreviation: "L" },
    { name: "Meter", abbreviation: "m" },
    { name: "Pack", abbreviation: "pk" },
  ];
  const units: Record<string, any> = {};
  for (const u of unitData) {
    units[u.name] = await prisma.unit.create({ data: { organizationId: org.id, name: u.name, abbreviation: u.abbreviation } });
  }

  // 5. Warehouses
  const mainWH = await prisma.warehouse.create({
    data: {
      organizationId: org.id, name: "Main Distribution Hub", code: "MAIN",
      address: "100 Logistics Parkway", city: "Bengaluru", state: "Karnataka", country: "IN", postalCode: "560001",
    },
  });
  const eastWH = await prisma.warehouse.create({
    data: {
      organizationId: org.id, name: "East Coast Regional Hub", code: "EAST",
      address: "45 Port Highway", city: "Chennai", state: "Tamil Nadu", country: "IN", postalCode: "600001",
    },
  });

  // 6. Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      organizationId: org.id, name: "Prime Wholesale Tech Ltd",
      email: "sales@primewholesale.com", phone: "+91 8012345678",
      address: "Electronic City Phase 1, Bengaluru", city: "Bengaluru", state: "Karnataka", gstin: "29AABCP1234A1Z5",
    },
  });
  const vendor2 = await prisma.vendor.create({
    data: {
      organizationId: org.id, name: "Agro Fresh Organic Farms",
      email: "supply@agrofresh.com", phone: "+91 8045678901",
      address: "Farm Zone 4, Mysuru", city: "Mysuru", state: "Karnataka", gstin: "29AABCA5678B2Z9",
    },
  });
  const vendor3 = await prisma.vendor.create({
    data: {
      organizationId: org.id, name: "HealthPlus Nutrition Co",
      email: "orders@healthplus.in", phone: "+91 9034567890",
      address: "Pharma Park, Hyderabad", city: "Hyderabad", state: "Telangana", gstin: "36AABHP4567C3Z7",
    },
  });

  // 7. Customers
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: org.id, name: "Acme Corporation",
      email: "procurement@acme.com", phone: "+91 9876543210",
      billingAddress: "Suite 400, Innovation Tower, Bengaluru", shippingAddress: "Warehouse 2, Tech Park, Bengaluru",
      city: "Bengaluru", state: "Karnataka", gstin: "29AACCA1234D1Z3",
    },
  });
  const customer2 = await prisma.customer.create({
    data: {
      organizationId: org.id, name: "Sathish Traders & Co",
      email: "contact@sathishtraders.com", phone: "+91 9812345678",
      billingAddress: "12 Commercial Street, Chennai", shippingAddress: "12 Commercial Street, Chennai",
      city: "Chennai", state: "Tamil Nadu", gstin: "33AACCS5678E2Z1",
    },
  });
  const customer3 = await prisma.customer.create({
    data: {
      organizationId: org.id, name: "Metro Retail Mart",
      email: "orders@metromart.com", phone: "+91 9765432109",
      billingAddress: "88 Ring Road, Hyderabad", shippingAddress: "88 Ring Road, Hyderabad",
      city: "Hyderabad", state: "Telangana", gstin: "36AACCM4321F3Z6",
    },
  });
  const customer4 = await prisma.customer.create({
    data: {
      organizationId: org.id, name: "TechPlus Solutions",
      email: "buy@techplus.io", phone: "+91 9654321098",
      billingAddress: "Level 5, Cyber Towers, Hyderabad", shippingAddress: "Level 5, Cyber Towers, Hyderabad",
      city: "Hyderabad", state: "Telangana", gstin: "36AACCT7654G4Z2",
    },
  });
  const customer5 = await prisma.customer.create({
    data: {
      organizationId: org.id, name: "FoodMart Retail Pvt Ltd",
      email: "stock@foodmart.in", phone: "+91 9543210987",
      billingAddress: "25 Market Lane, Pune", shippingAddress: "25 Market Lane, Pune",
      city: "Pune", state: "Maharashtra", gstin: "27AACCF2345H5Z4",
    },
  });

  // 8. Products
  // PROD-101: Chair (BASIC)
  const p101 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-101", name: "Ergonomic Mesh Office Chair",
    type: "BASIC", sellingPrice: 5999, costPrice: 3200, taxRate: 18, reorderLevel: 5,
    categoryId: cats["Furniture & Office"].id, brandId: brands["Inventra Gear"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-102: Mouse (BASIC)
  const p102 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-102", name: "Wireless Ergonomic Mouse 2.4G",
    type: "BASIC", sellingPrice: 1299, costPrice: 650, taxRate: 18, reorderLevel: 15,
    categoryId: cats["Electronics"].id, brandId: brands["ProTech"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-103: USB Hub (BASIC)
  const p103 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-103", name: "USB-C Fast Charging Hub 65W",
    type: "BASIC", sellingPrice: 2499, costPrice: 1200, taxRate: 18, reorderLevel: 10,
    categoryId: cats["Electronics"].id, brandId: brands["ProTech"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-104: Apples (BASIC)
  const p104 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-104", name: "Organic Farm Apples (Grade A)",
    type: "BASIC", sellingPrice: 220, costPrice: 110, taxRate: 5, reorderLevel: 50,
    categoryId: cats["Produce & Agri"].id, brandId: brands["FreshAgro"].id,
    unitId: units["Kilogram"].id, preferredVendorId: vendor2.id, trackInventory: true,
  }});
  // PROD-105: Box (BASIC)
  const p105 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-105", name: "Heavy Duty Shipping Box 5-Ply",
    type: "BASIC", sellingPrice: 65, costPrice: 25, taxRate: 12, reorderLevel: 100,
    categoryId: cats["Packaging & Supplies"].id, brandId: brands["PackMaster"].id,
    unitId: units["Box"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-106: Keyboard (BASIC)
  const p106 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-106", name: "Mechanical Keyboard RGB TKL",
    type: "BASIC", sellingPrice: 1899, costPrice: 800, taxRate: 18, reorderLevel: 10,
    categoryId: cats["Electronics"].id, brandId: brands["ProTech"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-107: Webcam (SERIALIZED)
  const p107 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-107", name: "Full HD Webcam 1080p AutoFocus",
    type: "SERIALIZED", sellingPrice: 4999, costPrice: 2000, taxRate: 18, reorderLevel: 3,
    categoryId: cats["Electronics"].id, brandId: brands["ProTech"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});
  // PROD-108: Protein Powder (BATCH)
  const p108 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-108", name: "Whey Protein Powder 1kg",
    type: "BATCH", sellingPrice: 1200, costPrice: 500, taxRate: 18, reorderLevel: 20,
    categoryId: cats["Health & Wellness"].id, brandId: brands["HealthPlus"].id,
    unitId: units["Pack"].id, preferredVendorId: vendor3.id, trackInventory: true,
  }});
  // PROD-109: Office Desk Kit (COMPOSITE = Chair + Mouse + Keyboard)
  const p109 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-109", name: "Complete Office Desk Kit",
    type: "COMPOSITE", sellingPrice: 9499, costPrice: 4650, taxRate: 18, reorderLevel: 2,
    categoryId: cats["Furniture & Office"].id, brandId: brands["Inventra Gear"].id,
    unitId: units["Piece"].id, trackInventory: false,
  }});
  await prisma.productComponent.createMany({ data: [
    { parentProductId: p109.id, childProductId: p101.id, quantity: 1 },
    { parentProductId: p109.id, childProductId: p102.id, quantity: 1 },
    { parentProductId: p109.id, childProductId: p106.id, quantity: 1 },
  ]});
  // PROD-110: Laptop Stand (BASIC)
  const p110 = await prisma.product.create({ data: {
    organizationId: org.id, sku: "PROD-110", name: "Adjustable Aluminium Laptop Stand",
    type: "BASIC", sellingPrice: 1499, costPrice: 600, taxRate: 18, reorderLevel: 8,
    categoryId: cats["Electronics"].id, brandId: brands["ProTech"].id,
    unitId: units["Piece"].id, preferredVendorId: vendor1.id, trackInventory: true,
  }});

  // 9. Reorder Rules
  await prisma.reorderRule.createMany({ data: [
    { organizationId: org.id, productId: p101.id, warehouseId: mainWH.id, reorderLevel: 5, reorderQty: 20, strategy: "FIFO" },
    { organizationId: org.id, productId: p102.id, warehouseId: mainWH.id, reorderLevel: 15, reorderQty: 50, strategy: "FIFO" },
    { organizationId: org.id, productId: p104.id, warehouseId: mainWH.id, reorderLevel: 50, reorderQty: 200, strategy: "FEFO" },
    { organizationId: org.id, productId: p108.id, warehouseId: mainWH.id, reorderLevel: 20, reorderQty: 60, strategy: "FEFO" },
  ]});

  // 10. Opening Stock + Transactions
  // Stock quantities before any sales/purchases in seed:
  // p101: MAIN=120, EAST=30
  // p102: MAIN=120, EAST=40
  // p103: MAIN=80,  EAST=20
  // p104: MAIN=350, EAST=150
  // p105: MAIN=800, EAST=0
  // p106: MAIN=60,  EAST=15
  // p107: MAIN=10   (serialized — 10 units with serials)
  // p108: MAIN=50   (batch)
  // p110: MAIN=40

  const openingStocks = [
    { product: p101, mainQty: 120, eastQty: 30 },
    { product: p102, mainQty: 120, eastQty: 40 },
    { product: p103, mainQty: 80,  eastQty: 20 },
    { product: p104, mainQty: 350, eastQty: 150 },
    { product: p105, mainQty: 800, eastQty: 0 },
    { product: p106, mainQty: 60,  eastQty: 15 },
    { product: p107, mainQty: 10,  eastQty: 0 },
    { product: p108, mainQty: 50,  eastQty: 0 },
    { product: p110, mainQty: 40,  eastQty: 0 },
  ];

  for (const s of openingStocks) {
    if (s.mainQty > 0) {
      await prisma.inventoryStock.create({ data: {
        organizationId: org.id, productId: s.product.id, warehouseId: mainWH.id,
        quantity: s.mainQty, reservedQuantity: 0,
      }});
      await prisma.inventoryTransaction.create({ data: {
        organizationId: org.id, productId: s.product.id, warehouseId: mainWH.id,
        type: "OPENING_STOCK", quantity: s.mainQty, beforeQuantity: 0, afterQuantity: s.mainQty,
        referenceType: "opening_stock", referenceId: s.product.id, reason: "Initial opening stock",
        createdById: adminUserId, createdAt: daysAgo(60),
        idempotencyKey: `open-${org.id}-${s.product.id}-${mainWH.id}`,
      }});
    }
    if (s.eastQty > 0) {
      await prisma.inventoryStock.create({ data: {
        organizationId: org.id, productId: s.product.id, warehouseId: eastWH.id,
        quantity: s.eastQty, reservedQuantity: 0,
      }});
      await prisma.inventoryTransaction.create({ data: {
        organizationId: org.id, productId: s.product.id, warehouseId: eastWH.id,
        type: "OPENING_STOCK", quantity: s.eastQty, beforeQuantity: 0, afterQuantity: s.eastQty,
        referenceType: "opening_stock", referenceId: s.product.id, reason: "Initial opening stock - EAST",
        createdById: adminUserId, createdAt: daysAgo(60),
        idempotencyKey: `open-${org.id}-${s.product.id}-${eastWH.id}`,
      }});
    }
  }

  // 11. Serial Numbers (for PROD-107 Webcam)
  const serials: any[] = [];
  for (let i = 1; i <= 10; i++) {
    const s = await prisma.serialNumber.create({ data: {
      organizationId: org.id, productId: p107.id,
      serial: `WC-2026-${String(i).padStart(4, "0")}`,
      status: i <= 5 ? "SOLD" : "AVAILABLE",
      warehouseId: i <= 5 ? undefined : mainWH.id,
    }});
    serials.push(s);
  }

  // 12. Batches (for PROD-108 Protein Powder)
  const batch1 = await prisma.batch.create({ data: {
    organizationId: org.id, productId: p108.id,
    batchNumber: "BATCH-HP-2026-001",
    manufacturedAt: daysAgo(90), expiresAt: daysFrom(275), // expires in ~9 months
    stocks: { create: [{ warehouseId: mainWH.id, quantity: 30 }] },
  }});
  const batch2 = await prisma.batch.create({ data: {
    organizationId: org.id, productId: p108.id,
    batchNumber: "BATCH-HP-2026-002",
    manufacturedAt: daysAgo(15), expiresAt: daysFrom(25), // NEAR EXPIRY — triggers expiry alert
    stocks: { create: [{ warehouseId: mainWH.id, quantity: 20 }] },
  }});

  // 13. Number sequences (so generated docs start from 00001)
  const seqKeys = ["SO", "EST", "PO", "PR", "BILL", "PKG", "SHP", "INV", "PAY", "RET", "TRF"];
  for (const key of seqKeys) {
    await prisma.numberSequence.create({ data: { organizationId: org.id, key, prefix: key, nextNumber: 1 } });
  }

  // ─── PURCHASE ORDERS ────────────────────────────────────────────────────────
  // PO-001: Prime Wholesale — 15×Chair + 20×Mouse + 10×USB Hub (RECEIVED & PAID)
  // Subtotal: 15×3200 + 20×650 + 10×1200 = 48000+13000+12000=73000
  // Tax 18%: 13140  Total: 86140
  const po1 = await prisma.purchaseOrder.create({ data: {
    organizationId: org.id, number: "PO-00001", vendorId: vendor1.id,
    warehouseId: mainWH.id, status: "RECEIVED",
    date: daysAgo(45), expectedDate: daysAgo(38),
    subtotal: 73000, tax: 13140, total: 86140,
    notes: "Quarterly stock replenishment",
    lines: { create: [
      { productId: p101.id, quantity: 15, receivedQty: 15, unitCost: 3200, taxRate: 18, amount: 48000 },
      { productId: p102.id, quantity: 20, receivedQty: 20, unitCost: 650,  taxRate: 18, amount: 13000 },
      { productId: p103.id, quantity: 10, receivedQty: 10, unitCost: 1200, taxRate: 18, amount: 12000 },
    ]},
  }});

  // Receive PO-001 → update stock +15 chair, +20 mouse, +10 hub
  const pr1 = await prisma.purchaseReceive.create({ data: {
    organizationId: org.id, number: "PR-00001", purchaseOrderId: po1.id,
    receivedAt: daysAgo(38), createdById: adminUserId,
    lines: { create: [
      { productId: p101.id, quantity: 15 },
      { productId: p102.id, quantity: 20 },
      { productId: p103.id, quantity: 10 },
    ]},
  }});

  // Update MAIN stock after receipt
  for (const [prod, qty] of [[p101, 15], [p102, 20], [p103, 10]] as [any, number][]) {
    await prisma.inventoryStock.update({
      where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: prod.id, warehouseId: mainWH.id } },
      data: { quantity: { increment: qty } },
    });
    await prisma.inventoryTransaction.create({ data: {
      organizationId: org.id, productId: prod.id, warehouseId: mainWH.id,
      type: "PURCHASE_RECEIVE", quantity: qty,
      beforeQuantity: 0, afterQuantity: qty, // approximate for seed
      referenceType: "purchase_receive", referenceId: pr1.id,
      reason: `PO-00001 Receipt`, createdById: adminUserId, createdAt: daysAgo(38),
    }});
  }

  // Bill for PO-001 (PAID fully)
  const bill1 = await prisma.bill.create({ data: {
    organizationId: org.id, number: "BILL-00001", vendorId: vendor1.id,
    purchaseOrderId: po1.id, status: "PAID",
    date: daysAgo(38), dueDate: daysAgo(8),
    total: 86140, amountPaid: 86140,
    lines: { create: [
      { productId: p101.id, description: p101.name, quantity: 15, unitCost: 3200, amount: 48000 },
      { productId: p102.id, description: p102.name, quantity: 20, unitCost: 650,  amount: 13000 },
      { productId: p103.id, description: p103.name, quantity: 10, unitCost: 1200, amount: 12000 },
    ]},
  }});
  const vp1 = await prisma.vendorPayment.create({ data: {
    organizationId: org.id, vendorId: vendor1.id,
    amount: 86140, method: "NEFT", paidAt: daysAgo(8),
  }});
  await prisma.vendorPaymentAllocation.create({ data: { vendorPaymentId: vp1.id, billId: bill1.id, amount: 86140 } });

  // PO-002: Prime Wholesale — 30×Keyboard + 5×Webcam (PARTIALLY PAID)
  // Subtotal: 30×800 + 5×2000 = 24000+10000=34000  Tax 18%=6120 Total=40120
  const po2 = await prisma.purchaseOrder.create({ data: {
    organizationId: org.id, number: "PO-00002", vendorId: vendor1.id,
    warehouseId: mainWH.id, status: "RECEIVED",
    date: daysAgo(30), expectedDate: daysAgo(23),
    subtotal: 34000, tax: 6120, total: 40120,
    notes: "Webcam and keyboard order",
    lines: { create: [
      { productId: p106.id, quantity: 30, receivedQty: 30, unitCost: 800,  taxRate: 18, amount: 24000 },
      { productId: p107.id, quantity: 5,  receivedQty: 5,  unitCost: 2000, taxRate: 18, amount: 10000 },
    ]},
  }});
  const pr2 = await prisma.purchaseReceive.create({ data: {
    organizationId: org.id, number: "PR-00002", purchaseOrderId: po2.id,
    receivedAt: daysAgo(23), createdById: adminUserId,
    lines: { create: [
      { productId: p106.id, quantity: 30 },
      { productId: p107.id, quantity: 5 },
    ]},
  }});
  await prisma.inventoryStock.update({
    where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p106.id, warehouseId: mainWH.id } },
    data: { quantity: { increment: 30 } },
  });
  await prisma.inventoryStock.update({
    where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p107.id, warehouseId: mainWH.id } },
    data: { quantity: { increment: 5 } },
  });

  // Bill for PO-002 (PARTIALLY PAID — 20000 paid, 20120 outstanding)
  const bill2 = await prisma.bill.create({ data: {
    organizationId: org.id, number: "BILL-00002", vendorId: vendor1.id,
    purchaseOrderId: po2.id, status: "PARTIALLY_PAID",
    date: daysAgo(23), dueDate: daysFrom(7),
    total: 40120, amountPaid: 20000,
    lines: { create: [
      { productId: p106.id, description: p106.name, quantity: 30, unitCost: 800,  amount: 24000 },
      { productId: p107.id, description: p107.name, quantity: 5,  unitCost: 2000, amount: 10000 },
    ]},
  }});
  const vp2 = await prisma.vendorPayment.create({ data: {
    organizationId: org.id, vendorId: vendor1.id,
    amount: 20000, method: "RTGS", paidAt: daysAgo(15),
  }});
  await prisma.vendorPaymentAllocation.create({ data: { vendorPaymentId: vp2.id, billId: bill2.id, amount: 20000 } });

  // PO-003: Agro Fresh — 200kg Apples (UNPAID)
  // Subtotal: 200×110=22000  Tax 5%=1100  Total=23100
  const po3 = await prisma.purchaseOrder.create({ data: {
    organizationId: org.id, number: "PO-00003", vendorId: vendor2.id,
    warehouseId: mainWH.id, status: "ISSUED",
    date: daysAgo(10), expectedDate: daysFrom(5),
    subtotal: 22000, tax: 1100, total: 23100,
    notes: "Seasonal apple stock",
    lines: { create: [
      { productId: p104.id, quantity: 200, receivedQty: 0, unitCost: 110, taxRate: 5, amount: 22000 },
    ]},
  }});
  // Bill created but UNPAID
  await prisma.bill.create({ data: {
    organizationId: org.id, number: "BILL-00003", vendorId: vendor2.id,
    purchaseOrderId: po3.id, status: "SENT",
    date: daysAgo(10), dueDate: daysFrom(20),
    total: 23100, amountPaid: 0,
    lines: { create: [{ productId: p104.id, description: p104.name, quantity: 200, unitCost: 110, amount: 22000 }] },
  }});

  // ─── STOCK ADJUSTMENT ───────────────────────────────────────────────────────
  // Adjust p110 MAIN: +5 (goods found during stocktake)
  await prisma.stockAdjustment.create({ data: {
    organizationId: org.id, warehouseId: mainWH.id, productId: p110.id,
    quantityDelta: 5, reason: "CYCLE_COUNT", notes: "Found 5 extra units during periodic stocktake",
    createdById: adminUserId, createdAt: daysAgo(20),
  }});
  await prisma.inventoryStock.update({
    where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p110.id, warehouseId: mainWH.id } },
    data: { quantity: { increment: 5 } },
  });
  await prisma.inventoryTransaction.create({ data: {
    organizationId: org.id, productId: p110.id, warehouseId: mainWH.id,
    type: "STOCK_ADJUSTMENT", quantity: 5, beforeQuantity: 40, afterQuantity: 45,
    referenceType: "stock_adjustment", referenceId: adminUserId,
    reason: "Cycle count — found extra units", createdById: adminUserId, createdAt: daysAgo(20),
  }});

  // ─── STOCK TRANSFER ─────────────────────────────────────────────────────────
  // Transfer 10×Mouse from MAIN to EAST
  const transfer1 = await prisma.stockTransfer.create({ data: {
    organizationId: org.id, number: "TRF-00001",
    fromWarehouseId: mainWH.id, toWarehouseId: eastWH.id,
    status: "COMPLETED", notes: "Replenish East hub",
    createdById: adminUserId, createdAt: daysAgo(25), completedAt: daysAgo(24),
    lines: { create: [{ productId: p102.id, quantity: 10 }] },
  }});
  await prisma.inventoryStock.update({
    where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p102.id, warehouseId: mainWH.id } },
    data: { quantity: { decrement: 10 } },
  });
  await prisma.inventoryStock.upsert({
    where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p102.id, warehouseId: eastWH.id } },
    create: { organizationId: org.id, productId: p102.id, warehouseId: eastWH.id, quantity: 10, reservedQuantity: 0 },
    update: { quantity: { increment: 10 } },
  });

  // ─── ESTIMATES ──────────────────────────────────────────────────────────────
  // EST-001: Acme Corp — 2×Chair + 3×Mouse
  // Subtotal: 2×5999+3×1299=11998+3897=15895 Tax@18%: 2861.1 Total: 18756.1
  await prisma.estimate.create({ data: {
    organizationId: org.id, number: "EST-00001",
    customerId: customer1.id, status: "SENT",
    date: daysAgo(50), expiryDate: daysAgo(20),
    subtotal: 15895, discount: 0, tax: r2(15895 * 0.18), total: r2(15895 * 1.18),
    notes: "Quotation valid 30 days.",
    lines: { create: [
      { productId: p101.id, description: p101.name, quantity: 2, unitPrice: 5999, taxRate: 18, amount: r2(2 * 5999) },
      { productId: p102.id, description: p102.name, quantity: 3, unitPrice: 1299, taxRate: 18, amount: r2(3 * 1299) },
    ]},
  }});

  // ─── SALES ORDERS ───────────────────────────────────────────────────────────
  // SO-001: Acme Corp — 2×Chair + 5×Mouse  (FULFILLED, PAID)
  // Subtotal: 2×5999+5×1299=11998+6495=18493  Tax@18%:3328.74  Ship:250  Total:22071.74
  const so1 = await prisma.salesOrder.create({ data: {
    organizationId: org.id, number: "SO-00001",
    customerId: customer1.id, warehouseId: mainWH.id, status: "FULFILLED",
    date: daysAgo(40), subtotal: 18493, discount: 0,
    tax: r2(18493 * 0.18), shipping: 250, total: r2(18493 * 1.18 + 250),
    notes: "Priority shipment",
    lines: { create: [
      { productId: p101.id, description: p101.name, quantity: 2, fulfilledQty: 2, unitPrice: 5999, taxRate: 18, amount: 11998 },
      { productId: p102.id, description: p102.name, quantity: 5, fulfilledQty: 5, unitPrice: 1299, taxRate: 18, amount: 6495 },
    ]},
  }});
  // SO-001 stock deduction
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p101.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 2 } } });
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p102.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 5 } } });

  // Package + Shipment for SO-001
  const pkg1 = await prisma.package.create({ data: {
    organizationId: org.id, number: "PKG-00001", salesOrderId: so1.id, status: "SHIPPED",
    packedAt: daysAgo(37),
    lines: { create: [{ productId: p101.id, quantity: 2 }, { productId: p102.id, quantity: 5 }] },
  }});
  await prisma.shipment.create({ data: {
    organizationId: org.id, number: "SHP-00001", salesOrderId: so1.id,
    packageId: pkg1.id, status: "DELIVERED", carrier: "BlueDart",
    trackingNumber: "BD-100112233", shippedAt: daysAgo(36), createdAt: daysAgo(37),
    lines: { create: [{ productId: p101.id, quantity: 2 }, { productId: p102.id, quantity: 5 }] },
  }});

  // Invoice for SO-001 (PAID)
  const so1Total = r2(18493 * 1.18 + 250);
  const inv1 = await prisma.invoice.create({ data: {
    organizationId: org.id, number: "INV-00001",
    customerId: customer1.id, salesOrderId: so1.id, status: "PAID",
    date: daysAgo(36), dueDate: daysAgo(6),
    subtotal: 18493, discount: 0, tax: r2(18493 * 0.18), shipping: 250,
    total: so1Total, amountPaid: so1Total,
    lines: { create: [
      { productId: p101.id, description: p101.name, quantity: 2, unitPrice: 5999, taxRate: 18, amount: 11998 },
      { productId: p102.id, description: p102.name, quantity: 5, unitPrice: 1299, taxRate: 18, amount: 6495 },
    ]},
  }});
  const pay1 = await prisma.payment.create({ data: {
    organizationId: org.id, customerId: customer1.id,
    amount: so1Total, method: "Bank Transfer", provider: "stub",
    providerRef: "PAY-ACM-001", status: "SUCCEEDED", receivedAt: daysAgo(35),
  }});
  await prisma.paymentAllocation.create({ data: { paymentId: pay1.id, invoiceId: inv1.id, amount: so1Total } });

  // SO-002: Sathish Traders — 10×Mouse + 3×USB Hub  (FULFILLED, PAID)
  // Subtotal: 10×1299+3×2499=12990+7497=20487  Tax@18%:3687.66  Ship:300  Total:24474.66
  const so2Total = r2(20487 * 1.18 + 300);
  const so2 = await prisma.salesOrder.create({ data: {
    organizationId: org.id, number: "SO-00002",
    customerId: customer2.id, warehouseId: mainWH.id, status: "FULFILLED",
    date: daysAgo(30), subtotal: 20487, discount: 500,
    tax: r2(20487 * 0.18), shipping: 300, total: r2(20487 * 1.18 - 500 + 300),
    lines: { create: [
      { productId: p102.id, description: p102.name, quantity: 10, fulfilledQty: 10, unitPrice: 1299, taxRate: 18, amount: 12990 },
      { productId: p103.id, description: p103.name, quantity: 3,  fulfilledQty: 3,  unitPrice: 2499, taxRate: 18, amount: 7497 },
    ]},
  }});
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p102.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 10 } } });
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p103.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 3 } } });
  const pkg2 = await prisma.package.create({ data: {
    organizationId: org.id, number: "PKG-00002", salesOrderId: so2.id, status: "SHIPPED",
    packedAt: daysAgo(28),
    lines: { create: [{ productId: p102.id, quantity: 10 }, { productId: p103.id, quantity: 3 }] },
  }});
  await prisma.shipment.create({ data: {
    organizationId: org.id, number: "SHP-00002", salesOrderId: so2.id,
    packageId: pkg2.id, status: "DELIVERED", carrier: "FedEx",
    trackingNumber: "FX-200234455", shippedAt: daysAgo(27),
    lines: { create: [{ productId: p102.id, quantity: 10 }, { productId: p103.id, quantity: 3 }] },
  }});
  const so2ActualTotal = r2(20487 * 1.18 - 500 + 300);
  const inv2 = await prisma.invoice.create({ data: {
    organizationId: org.id, number: "INV-00002",
    customerId: customer2.id, salesOrderId: so2.id, status: "PAID",
    date: daysAgo(27), dueDate: daysAgo(7),
    subtotal: 20487, discount: 500, tax: r2(20487 * 0.18), shipping: 300,
    total: so2ActualTotal, amountPaid: so2ActualTotal,
    lines: { create: [
      { productId: p102.id, description: p102.name, quantity: 10, unitPrice: 1299, taxRate: 18, amount: 12990 },
      { productId: p103.id, description: p103.name, quantity: 3,  unitPrice: 2499, taxRate: 18, amount: 7497 },
    ]},
  }});
  const pay2 = await prisma.payment.create({ data: {
    organizationId: org.id, customerId: customer2.id,
    amount: so2ActualTotal, method: "UPI", provider: "stub",
    providerRef: "PAY-SAT-002", status: "SUCCEEDED", receivedAt: daysAgo(26),
  }});
  await prisma.paymentAllocation.create({ data: { paymentId: pay2.id, invoiceId: inv2.id, amount: so2ActualTotal } });

  // SO-003: Metro Retail — 5×Webcam  (FULFILLED, PARTIALLY PAID)
  // Subtotal: 5×4999=24995  Tax@18%:4499.1  Ship:500  Total:29994.1
  // Paid: 15000  Remaining: 14994.1
  const so3 = await prisma.salesOrder.create({ data: {
    organizationId: org.id, number: "SO-00003",
    customerId: customer3.id, warehouseId: mainWH.id, status: "FULFILLED",
    date: daysAgo(20), subtotal: 24995, discount: 0,
    tax: r2(24995 * 0.18), shipping: 500, total: r2(24995 * 1.18 + 500),
    lines: { create: [
      { productId: p107.id, description: p107.name, quantity: 5, fulfilledQty: 5, unitPrice: 4999, taxRate: 18, amount: 24995 },
    ]},
  }});
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p107.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 5 } } });
  const so3Total = r2(24995 * 1.18 + 500);
  const inv3 = await prisma.invoice.create({ data: {
    organizationId: org.id, number: "INV-00003",
    customerId: customer3.id, salesOrderId: so3.id, status: "PARTIALLY_PAID",
    date: daysAgo(18), dueDate: daysFrom(12),
    subtotal: 24995, discount: 0, tax: r2(24995 * 0.18), shipping: 500,
    total: so3Total, amountPaid: 15000,
    lines: { create: [{ productId: p107.id, description: p107.name, quantity: 5, unitPrice: 4999, taxRate: 18, amount: 24995 }] },
  }});
  const pay3 = await prisma.payment.create({ data: {
    organizationId: org.id, customerId: customer3.id,
    amount: 15000, method: "Cheque", provider: "stub",
    providerRef: "PAY-MET-003", status: "SUCCEEDED", receivedAt: daysAgo(15),
  }});
  await prisma.paymentAllocation.create({ data: { paymentId: pay3.id, invoiceId: inv3.id, amount: 15000 } });

  // SO-004: TechPlus Solutions — 20×Keyboard  (CONFIRMED, UNPAID — invoice SENT/OVERDUE)
  // Subtotal: 20×1899=37980  Tax@18%:6836.4  Ship:200  Total:45016.4
  const so4 = await prisma.salesOrder.create({ data: {
    organizationId: org.id, number: "SO-00004",
    customerId: customer4.id, warehouseId: mainWH.id, status: "CONFIRMED",
    date: daysAgo(15), subtotal: 37980, discount: 0,
    tax: r2(37980 * 0.18), shipping: 200, total: r2(37980 * 1.18 + 200),
    lines: { create: [
      { productId: p106.id, description: p106.name, quantity: 20, fulfilledQty: 0, unitPrice: 1899, taxRate: 18, amount: 37980 },
    ]},
  }});
  // Reserve stock for SO-004
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p106.id, warehouseId: mainWH.id } }, data: { reservedQuantity: { increment: 20 } } });
  const so4Total = r2(37980 * 1.18 + 200);
  await prisma.invoice.create({ data: {
    organizationId: org.id, number: "INV-00004",
    customerId: customer4.id, salesOrderId: so4.id, status: "OVERDUE",
    date: daysAgo(14), dueDate: daysAgo(4), // OVERDUE
    subtotal: 37980, discount: 0, tax: r2(37980 * 0.18), shipping: 200,
    total: so4Total, amountPaid: 0,
    lines: { create: [{ productId: p106.id, description: p106.name, quantity: 20, unitPrice: 1899, taxRate: 18, amount: 37980 }] },
  }});

  // SO-005: FoodMart — 100kg Apples  (FULFILLED, PAID)
  // Subtotal: 100×220=22000  Tax@5%:1100  Ship:0  Total:23100
  const so5 = await prisma.salesOrder.create({ data: {
    organizationId: org.id, number: "SO-00005",
    customerId: customer5.id, warehouseId: mainWH.id, status: "FULFILLED",
    date: daysAgo(8), subtotal: 22000, discount: 0,
    tax: 1100, shipping: 0, total: 23100,
    lines: { create: [
      { productId: p104.id, description: p104.name, quantity: 100, fulfilledQty: 100, unitPrice: 220, taxRate: 5, amount: 22000 },
    ]},
  }});
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p104.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 100 } } });
  const inv5 = await prisma.invoice.create({ data: {
    organizationId: org.id, number: "INV-00005",
    customerId: customer5.id, salesOrderId: so5.id, status: "PAID",
    date: daysAgo(7), dueDate: daysFrom(7),
    subtotal: 22000, discount: 0, tax: 1100, shipping: 0,
    total: 23100, amountPaid: 23100,
    lines: { create: [{ productId: p104.id, description: p104.name, quantity: 100, unitPrice: 220, taxRate: 5, amount: 22000 }] },
  }});
  const pay5 = await prisma.payment.create({ data: {
    organizationId: org.id, customerId: customer5.id,
    amount: 23100, method: "Cash", provider: "stub",
    providerRef: "PAY-FM-005", status: "SUCCEEDED", receivedAt: daysAgo(7),
  }});
  await prisma.paymentAllocation.create({ data: { paymentId: pay5.id, invoiceId: inv5.id, amount: 23100 } });

  // ─── SALES RETURN ───────────────────────────────────────────────────────────
  // SR-001: Sathish returns 2×Mouse (COMPLETED)
  const sr1 = await prisma.salesReturn.create({ data: {
    organizationId: org.id, number: "RET-00001",
    customerId: customer2.id, salesOrderId: so2.id, warehouseId: mainWH.id,
    status: "COMPLETED", reason: "Wrong item received",
    createdAt: daysAgo(22),
    lines: { create: [{ productId: p102.id, quantity: 2 }] },
  }});
  // Return puts items back in stock
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p102.id, warehouseId: mainWH.id } }, data: { quantity: { increment: 2 } } });
  await prisma.inventoryTransaction.create({ data: {
    organizationId: org.id, productId: p102.id, warehouseId: mainWH.id,
    type: "SALES_RETURN", quantity: 2, beforeQuantity: 0, afterQuantity: 2,
    referenceType: "sales_return", referenceId: sr1.id, reason: "Customer return",
    createdById: adminUserId, createdAt: daysAgo(22),
  }});

  // ─── PURCHASE RETURN ────────────────────────────────────────────────────────
  // PR-Return: Return 2×Keyboard to Prime (COMPLETED)
  await prisma.purchaseReturn.create({ data: {
    organizationId: org.id, number: "PRN-00001",
    vendorId: vendor1.id, purchaseOrderId: po2.id, warehouseId: mainWH.id,
    status: "COMPLETED", reason: "Defective units",
    createdAt: daysAgo(18),
    lines: { create: [{ productId: p106.id, quantity: 2 }] },
  }});
  await prisma.inventoryStock.update({ where: { organizationId_productId_warehouseId: { organizationId: org.id, productId: p106.id, warehouseId: mainWH.id } }, data: { quantity: { decrement: 2 } } });

  // ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
  await prisma.notification.createMany({ data: [
    { organizationId: org.id, type: "STOCK_UPDATE", title: "Opening Stock Populated", body: "MAIN and EAST warehouses loaded with initial inventory." },
    { organizationId: org.id, type: "INVOICE", title: "INV-00001 Paid in Full", body: "₹" + so1Total.toLocaleString("en-IN") + " received from Acme Corporation." },
    { organizationId: org.id, type: "INVOICE", title: "INV-00002 Paid in Full", body: "₹" + so2ActualTotal.toLocaleString("en-IN") + " received from Sathish Traders." },
    { organizationId: org.id, type: "INVOICE_OVERDUE", title: "INV-00004 is Overdue!", body: "TechPlus Solutions owes ₹" + so4Total.toLocaleString("en-IN") + " — due 4 days ago." },
    { organizationId: org.id, type: "LOW_STOCK", title: "Low Stock Alert: Webcam", body: "PROD-107 has only 5 units left. Reorder level is 3." },
    { organizationId: org.id, type: "BATCH_EXPIRY", title: "Batch Near Expiry: BATCH-HP-2026-002", body: "20 units of Whey Protein expire in 25 days." },
    { organizationId: org.id, type: "PURCHASE_ORDER", title: "PO-00003 Awaiting Receipt", body: "200kg Apples from Agro Fresh Organic Farms expected in 5 days." },
  ]});

  console.log(`  ✓ Seeded all data for: ${org.name}`);

  // ─── PRINT VERIFICATION SUMMARY ────────────────────────────────────────────
  console.log("\n  ┌─── ANALYTICS VERIFICATION (compare with dashboard) ───────────────┐");
  console.log(`  │ Total Sales (SO totals, non-cancelled):                            │`);
  const totalSales = r2(so1.total + so2.total + so3.total + so4.total + so5.total);
  console.log(`  │   SO-001: ${so1.total}                                     │`);
  console.log(`  │   SO-002: ${so2.total}                                     │`);
  console.log(`  │   SO-003: ${so3.total}                                     │`);
  console.log(`  │   SO-004: ${so4.total}                                     │`);
  console.log(`  │   SO-005: ${so5.total}                                     │`);
  console.log(`  │   EXPECTED totalSales = ${totalSales}                      │`);
  const totalPurchases = r2(po1.total + po2.total + po3.total);
  console.log(`  │ Total Purchases (all POs):                                         │`);
  console.log(`  │   PO-001: ${po1.total} | PO-002: ${po2.total} | PO-003: ${po3.total}│`);
  console.log(`  │   EXPECTED totalPurchases = ${totalPurchases}                    │`);
  const receivables = r2((so3Total - 15000) + so4Total);
  console.log(`  │ Receivables (unpaid/partially paid invoices):                      │`);
  console.log(`  │   INV-003 outstanding: ${r2(so3Total - 15000)}                   │`);
  console.log(`  │   INV-004 outstanding: ${so4Total}                               │`);
  console.log(`  │   EXPECTED receivables = ${receivables}                            │`);
  const payables = r2((bill2.total - bill2.amountPaid) + 23100);
  console.log(`  │ Payables (unpaid/partially paid bills):                            │`);
  console.log(`  │   BILL-002 outstanding: ${r2(bill2.total - bill2.amountPaid)}    │`);
  console.log(`  │   BILL-003 outstanding: 23100                                       │`);
  console.log(`  │   EXPECTED payables = ${payables}                                   │`);
  const collected = r2(so1Total + so2ActualTotal + 15000 + 23100);
  console.log(`  │ Total Collected: ${collected}                                       │`);
  const billsPaid = r2(vp1.amount + vp2.amount);
  console.log(`  │ Total Bills Paid: ${billsPaid}                                      │`);
  console.log(`  └────────────────────────────────────────────────────────────────────┘\n`);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Inventra Comprehensive Seed Script ===\n");

  // Ensure permissions exist
  const PERMISSION_KEYS = [
    "organization:read","organization:update","user:create","user:read","user:update","user:delete","role:manage",
    "product:create","product:read","product:update","product:delete","warehouse:create","warehouse:read","warehouse:update","warehouse:delete",
    "inventory:read","inventory:adjust","inventory:transfer","inventory:reserve",
    "customer:create","customer:read","customer:update","customer:delete",
    "vendor:create","vendor:read","vendor:update","vendor:delete",
    "estimate:create","estimate:read","estimate:update",
    "sales_order:create","sales_order:read","sales_order:update","sales_order:confirm","sales_order:cancel",
    "package:create","package:read","shipment:create","shipment:read","shipment:confirm",
    "invoice:create","invoice:read","invoice:update","invoice:void","payment:create","payment:read",
    "purchase_order:create","purchase_order:read","purchase_order:update","purchase_receive:create","purchase_receive:read",
    "bill:create","bill:read","vendor_payment:create","return:create","return:read","return:approve",
    "report:read","audit:read","integration:manage","notification:read",
  ];
  for (const key of PERMISSION_KEYS) {
    await prisma.permission.upsert({
      where: { key },
      create: { key, description: key.replace(":", " ") },
      update: {},
    });
  }

  // Seed Demo Org
  let demoOrg = await prisma.organization.findUnique({ where: { slug: "demo-organization" } });
  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: { name: "Demo Organization", slug: "demo-organization", allowNegativeStock: false },
    });
  }

  const seedEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.local";
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: demoOrg.id, email: seedEmail } },
    create: {
      organizationId: demoOrg.id,
      email: seedEmail, passwordHash,
      firstName: "Demo", lastName: "Admin",
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash },
  });

  // Create additional users (staff, viewer)
  const staffHash = await bcrypt.hash("Staff123!", 10);
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: demoOrg.id, email: "staff@demo.local" } },
    create: { organizationId: demoOrg.id, email: "staff@demo.local", passwordHash: staffHash, firstName: "Warehouse", lastName: "Staff", emailVerifiedAt: new Date() },
    update: { passwordHash: staffHash },
  });

  // Remove stale/dummy organizations from previous test runs
  const otherOrgs = await prisma.organization.findMany({ where: { slug: { not: "demo-organization" } } });
  for (const org of otherOrgs) {
    await wipeOrg(org.id);
    await prisma.user.deleteMany({ where: { organizationId: org.id } });
    await prisma.role.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`  ✓ Removed old dummy org: ${org.name} (${org.slug})`);
  }

  // Reseed Demo Organization
  await wipeOrg(demoOrg.id);
  await seedOrganizationData(demoOrg, adminUser.id);

  // Pre-calculate and save initial AnalyticsSnapshot (fast dashboard path)
  const analyticsService = new AnalyticsService(prisma as any);
  await analyticsService.computeAndSave(demoOrg.id);
  console.log(`  ✓ Pre-calculated & saved initial AnalyticsSnapshot for: ${demoOrg.name}`);

  // Assign Admin role to seed user (after roles recreated)
  const adminRole = await prisma.role.findFirst({ where: { organizationId: demoOrg.id, name: "Admin" } });
  if (adminRole) {
    const existingUR = await prisma.userRole.findFirst({ where: { userId: adminUser.id, roleId: adminRole.id } });
    if (!existingUR) {
      await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });
    }
  }

  // Assign Warehouse Staff role to staff user
  const staffUser = await prisma.user.findFirst({ where: { organizationId: demoOrg.id, email: "staff@demo.local" } });
  const staffRole = await prisma.role.findFirst({ where: { organizationId: demoOrg.id, name: "Warehouse Staff" } });
  if (staffUser && staffRole) {
    const existingUR = await prisma.userRole.findFirst({ where: { userId: staffUser.id, roleId: staffRole.id } });
    if (!existingUR) {
      await prisma.userRole.create({ data: { userId: staffUser.id, roleId: staffRole.id } });
    }
  }

  console.log("\n=== Seed Complete ===");
  console.log(`  Admin: ${seedEmail} / ${seedPassword}`);
  console.log(`  Staff: staff@demo.local / Staff123!`);
  console.log(`  Org: demo-organization`);
}

main()
  .catch((e) => { console.error("Seeding error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
