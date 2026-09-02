import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_PERMISSIONS, ROLES } from "@inventra/shared";

const prisma = new PrismaClient();

async function seedOrganizationData(org: { id: string; name: string; slug: string }) {
  console.log(`Seeding data for Organization: ${org.name} (${org.slug})...`);

  // 1. Roles & Permissions
  const perms = await prisma.permission.findMany();
  const byKey = new Map(perms.map((p: any) => [p.key, p]));
  for (const name of ROLES) {
    const role = await prisma.role.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      create: { organizationId: org.id, name, isSystem: true },
      update: {},
    });
    for (const key of ROLE_PERMISSIONS[name]) {
      const perm: any = byKey.get(key);
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        create: { roleId: role.id, permissionId: perm.id },
        update: {},
      });
    }
  }

  // 2. Categories
  const categoriesData = [
    { name: "Electronics" },
    { name: "Furniture & Office" },
    { name: "Produce & Agri" },
    { name: "Packaging & Supplies" },
    { name: "Hardware & Fasteners" },
  ];
  const categories: Record<string, any> = {};
  for (const c of categoriesData) {
    categories[c.name] = await prisma.category.upsert({
      where: { organizationId_name: { organizationId: org.id, name: c.name } },
      create: { organizationId: org.id, name: c.name },
      update: {},
    });
  }

  // 3. Brands
  const brandsData = ["ProTech", "Inventra Gear", "FreshAgro", "PackMaster", "Generic"];
  const brands: Record<string, any> = {};
  for (const bName of brandsData) {
    brands[bName] = await prisma.brand.upsert({
      where: { organizationId_name: { organizationId: org.id, name: bName } },
      create: { organizationId: org.id, name: bName },
      update: {},
    });
  }

  // 4. Units
  const unitsData = [
    { name: "Piece", abbreviation: "pcs" },
    { name: "Kilogram", abbreviation: "kg" },
    { name: "Box", abbreviation: "box" },
    { name: "Liter", abbreviation: "L" },
    { name: "Meter", abbreviation: "m" },
  ];
  const units: Record<string, any> = {};
  for (const u of unitsData) {
    units[u.name] = await prisma.unit.upsert({
      where: { organizationId_name: { organizationId: org.id, name: u.name } },
      create: { organizationId: org.id, name: u.name, abbreviation: u.abbreviation },
      update: {},
    });
  }

  // 5. Warehouses
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "MAIN" } },
    create: {
      organizationId: org.id,
      name: "Main Distribution Hub",
      code: "MAIN",
      address: "100 Logistics Parkway",
      city: "Bengaluru",
      state: "Karnataka",
      country: "IN",
      postalCode: "560001",
    },
    update: {},
  });

  const eastWarehouse = await prisma.warehouse.upsert({
    where: { organizationId_code: { organizationId: org.id, code: "EAST" } },
    create: {
      organizationId: org.id,
      name: "East Coast Regional Hub",
      code: "EAST",
      address: "45 Port Highway",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "IN",
      postalCode: "600001",
    },
    update: {},
  });

  // 6. Customers
  let customer1 = await prisma.customer.findFirst({
    where: { organizationId: org.id, name: "Acme Corporation" },
  });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        organizationId: org.id,
        name: "Acme Corporation",
        email: "procurement@acme.com",
        phone: "+91 9876543210",
        billingAddress: "Suite 400, Innovation Tower, Bengaluru",
        shippingAddress: "Warehouse 2, Tech Park, Bengaluru",
      },
    });
  }

  let customer2 = await prisma.customer.findFirst({
    where: { organizationId: org.id, name: "Sathish Traders & Co" },
  });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        organizationId: org.id,
        name: "Sathish Traders & Co",
        email: "contact@sathishtraders.com",
        phone: "+91 9812345678",
        billingAddress: "12 Commercial Street, Chennai",
        shippingAddress: "12 Commercial Street, Chennai",
      },
    });
  }

  let customer3 = await prisma.customer.findFirst({
    where: { organizationId: org.id, name: "Metro Retail Mart" },
  });
  if (!customer3) {
    customer3 = await prisma.customer.create({
      data: {
        organizationId: org.id,
        name: "Metro Retail Mart",
        email: "orders@metromart.com",
        phone: "+91 9765432109",
        billingAddress: "88 Ring Road, Hyderabad",
        shippingAddress: "88 Ring Road, Hyderabad",
      },
    });
  }

  // 7. Vendors
  let vendor1 = await prisma.vendor.findFirst({
    where: { organizationId: org.id, name: "Prime Wholesale Tech Ltd" },
  });
  if (!vendor1) {
    vendor1 = await prisma.vendor.create({
      data: {
        organizationId: org.id,
        name: "Prime Wholesale Tech Ltd",
        email: "sales@primewholesale.com",
        phone: "+91 8012345678",
        address: "Electronic City Phase 1, Bengaluru",
      },
    });
  }

  let vendor2 = await prisma.vendor.findFirst({
    where: { organizationId: org.id, name: "Agro Fresh Organic Farms" },
  });
  if (!vendor2) {
    vendor2 = await prisma.vendor.create({
      data: {
        organizationId: org.id,
        name: "Agro Fresh Organic Farms",
        email: "supply@agrofresh.com",
        phone: "+91 8045678901",
        address: "Farm Zone 4, Mysuru",
      },
    });
  }

  // 8. Products
  const productsData = [
    {
      sku: "PROD-101",
      name: "Ergonomic Mesh Office Chair",
      type: "BASIC" as const,
      sellingPrice: 5999,
      costPrice: 3200,
      taxRate: 18,
      reorderLevel: 5,
      category: categories["Furniture & Office"],
      brand: brands["Inventra Gear"],
      unit: units["Piece"],
      vendor: vendor1,
    },
    {
      sku: "PROD-102",
      name: "Wireless Ergonomic Mouse 2.4G",
      type: "BASIC" as const,
      sellingPrice: 1299,
      costPrice: 650,
      taxRate: 18,
      reorderLevel: 15,
      category: categories["Electronics"],
      brand: brands["ProTech"],
      unit: units["Piece"],
      vendor: vendor1,
    },
    {
      sku: "PROD-103",
      name: "USB-C Fast Charging Hub 65W",
      type: "BASIC" as const,
      sellingPrice: 2499,
      costPrice: 1200,
      taxRate: 18,
      reorderLevel: 10,
      category: categories["Electronics"],
      brand: brands["ProTech"],
      unit: units["Piece"],
      vendor: vendor1,
    },
    {
      sku: "PROD-104",
      name: "Organic Farm Apples (Grade A)",
      type: "BASIC" as const,
      sellingPrice: 220,
      costPrice: 110,
      taxRate: 5,
      reorderLevel: 50,
      category: categories["Produce & Agri"],
      brand: brands["FreshAgro"],
      unit: units["Kilogram"],
      vendor: vendor2,
    },
    {
      sku: "PROD-105",
      name: "Heavy Duty Shipping Box 5-Ply",
      type: "BASIC" as const,
      sellingPrice: 65,
      costPrice: 25,
      taxRate: 12,
      reorderLevel: 100,
      category: categories["Packaging & Supplies"],
      brand: brands["PackMaster"],
      unit: units["Box"],
      vendor: vendor1,
    },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { organizationId_sku: { organizationId: org.id, sku: p.sku } },
      create: {
        organizationId: org.id,
        sku: p.sku,
        name: p.name,
        type: p.type,
        sellingPrice: p.sellingPrice,
        costPrice: p.costPrice,
        taxRate: p.taxRate,
        reorderLevel: p.reorderLevel,
        categoryId: p.category.id,
        brandId: p.brand.id,
        unitId: p.unit.id,
        preferredVendorId: p.vendor.id,
        trackInventory: true,
      },
      update: {},
    });
    products[p.sku] = prod;

    // Stock for MAIN warehouse
    const mainQty = p.sku === "PROD-104" ? 350 : p.sku === "PROD-105" ? 800 : 120;
    await prisma.inventoryStock.upsert({
      where: {
        organizationId_productId_warehouseId: {
          organizationId: org.id,
          productId: prod.id,
          warehouseId: mainWarehouse.id,
        },
      },
      create: {
        organizationId: org.id,
        productId: prod.id,
        warehouseId: mainWarehouse.id,
        quantity: mainQty,
        reservedQuantity: 10,
      },
      update: {},
    });

    const idempotencyKeyMain = `op-${org.id}-${prod.id}-${mainWarehouse.id}`;
    await prisma.inventoryTransaction.upsert({
      where: {
        organizationId_idempotencyKey: {
          organizationId: org.id,
          idempotencyKey: idempotencyKeyMain,
        },
      },
      create: {
        organizationId: org.id,
        productId: prod.id,
        warehouseId: mainWarehouse.id,
        type: "OPENING_STOCK",
        quantity: mainQty,
        beforeQuantity: 0,
        afterQuantity: mainQty,
        referenceType: "opening_stock",
        referenceId: prod.id,
        reason: "Initial Inventory Opening Stock",
        createdById: org.id,
        idempotencyKey: idempotencyKeyMain,
      },
      update: {},
    });

    // Stock for EAST warehouse
    const eastQty = p.sku === "PROD-104" ? 150 : 40;
    await prisma.inventoryStock.upsert({
      where: {
        organizationId_productId_warehouseId: {
          organizationId: org.id,
          productId: prod.id,
          warehouseId: eastWarehouse.id,
        },
      },
      create: {
        organizationId: org.id,
        productId: prod.id,
        warehouseId: eastWarehouse.id,
        quantity: eastQty,
        reservedQuantity: 0,
      },
      update: {},
    });
  }

  // 9. Estimate
  const estNumber = `EST-10001`;
  const p101 = products["PROD-101"];
  const p102 = products["PROD-102"];
  await prisma.estimate.upsert({
    where: { organizationId_number: { organizationId: org.id, number: estNumber } },
    create: {
      organizationId: org.id,
      number: estNumber,
      customerId: customer1.id,
      status: "SENT",
      subtotal: 13297,
      discount: 297,
      tax: 2340,
      total: 15340,
      notes: "Quotation valid for 30 days.",
      lines: {
        create: [
          {
            productId: p101.id,
            description: p101.name,
            quantity: 2,
            unitPrice: p101.sellingPrice,
            taxRate: p101.taxRate,
            amount: 11998,
          },
          {
            productId: p102.id,
            description: p102.name,
            quantity: 1,
            unitPrice: p102.sellingPrice,
            taxRate: p102.taxRate,
            amount: 1299,
          },
        ],
      },
    },
    update: {},
  });

  // 10. Sales Order (Confirmed)
  const soNumber1 = `SO-10001`;
  await prisma.salesOrder.upsert({
    where: { organizationId_number: { organizationId: org.id, number: soNumber1 } },
    create: {
      organizationId: org.id,
      number: soNumber1,
      customerId: customer2.id,
      warehouseId: mainWarehouse.id,
      status: "CONFIRMED",
      subtotal: 11998,
      discount: 0,
      tax: 2159.64,
      shipping: 250,
      total: 14407.64,
      notes: "Urgent dispatch requested.",
      lines: {
        create: [
          {
            productId: p101.id,
            description: p101.name,
            quantity: 2,
            fulfilledQty: 0,
            unitPrice: p101.sellingPrice,
            taxRate: p101.taxRate,
            amount: 11998,
          },
        ],
      },
    },
    update: {},
  });

  // 11. Sales Order (Fulfilled) & Shipment
  const soNumber2 = `SO-10002`;
  const salesOrder2 = await prisma.salesOrder.upsert({
    where: { organizationId_number: { organizationId: org.id, number: soNumber2 } },
    create: {
      organizationId: org.id,
      number: soNumber2,
      customerId: customer3.id,
      warehouseId: mainWarehouse.id,
      status: "FULFILLED",
      subtotal: 12990,
      discount: 500,
      tax: 2248.2,
      shipping: 300,
      total: 15038.2,
      lines: {
        create: [
          {
            productId: p102.id,
            description: p102.name,
            quantity: 10,
            fulfilledQty: 10,
            unitPrice: p102.sellingPrice,
            taxRate: p102.taxRate,
            amount: 12990,
          },
        ],
      },
    },
    update: {},
  });

  const pkg1 = await prisma.package.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `PKG-10001` } },
    create: {
      organizationId: org.id,
      number: `PKG-10001`,
      salesOrderId: salesOrder2.id,
      status: "SHIPPED",
      packedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lines: {
        create: [{ productId: p102.id, quantity: 10 }],
      },
    },
    update: {},
  });

  await prisma.shipment.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `SHP-10001` } },
    create: {
      organizationId: org.id,
      number: `SHP-10001`,
      salesOrderId: salesOrder2.id,
      packageId: pkg1.id,
      status: "DELIVERED",
      carrier: "BlueDart Express",
      trackingNumber: "BD-998822114",
      shippedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lines: {
        create: [{ productId: p102.id, quantity: 10 }],
      },
    },
    update: {},
  });

  // 12. Invoice & Payment
  const invoice1 = await prisma.invoice.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `INV-10001` } },
    create: {
      organizationId: org.id,
      number: `INV-10001`,
      customerId: customer3.id,
      salesOrderId: salesOrder2.id,
      status: "PAID",
      subtotal: 12990,
      discount: 500,
      tax: 2248.2,
      shipping: 300,
      total: 15038.2,
      amountPaid: 15038.2,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: p102.id,
            description: p102.name,
            quantity: 10,
            unitPrice: p102.sellingPrice,
            taxRate: p102.taxRate,
            amount: 12990,
          },
        ],
      },
    },
    update: {},
  });

  let payment1 = await prisma.payment.findFirst({
    where: { organizationId: org.id, providerRef: "pay_RZR_98765432" },
  });
  if (!payment1) {
    payment1 = await prisma.payment.create({
      data: {
        organizationId: org.id,
        customerId: customer3.id,
        amount: 15038.2,
        method: "Bank Transfer",
        provider: "Razorpay",
        providerRef: "pay_RZR_98765432",
        status: "SUCCEEDED",
      },
    });
    await prisma.paymentAllocation.create({
      data: {
        paymentId: payment1.id,
        invoiceId: invoice1.id,
        amount: 15038.2,
      },
    });
  }

  // 13. Purchase Order & Receive & Bill
  const po1 = await prisma.purchaseOrder.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `PO-10001` } },
    create: {
      organizationId: org.id,
      number: `PO-10001`,
      vendorId: vendor1.id,
      warehouseId: mainWarehouse.id,
      status: "RECEIVED",
      subtotal: 32000,
      tax: 5760,
      total: 37760,
      notes: "Stock replenishment",
      lines: {
        create: [
          {
            productId: p101.id,
            quantity: 10,
            receivedQty: 10,
            unitCost: p101.costPrice,
            taxRate: p101.taxRate,
            amount: 32000,
          },
        ],
      },
    },
    update: {},
  });

  await prisma.purchaseReceive.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `PR-10001` } },
    create: {
      organizationId: org.id,
      number: `PR-10001`,
      purchaseOrderId: po1.id,
      createdById: org.id,
      lines: {
        create: [{ productId: p101.id, quantity: 10 }],
      },
    },
    update: {},
  });

  const bill1 = await prisma.bill.upsert({
    where: { organizationId_number: { organizationId: org.id, number: `BILL-10001` } },
    create: {
      organizationId: org.id,
      number: `BILL-10001`,
      vendorId: vendor1.id,
      purchaseOrderId: po1.id,
      status: "PAID",
      total: 37760,
      amountPaid: 37760,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lines: {
        create: [
          {
            productId: p101.id,
            description: p101.name,
            quantity: 10,
            unitCost: p101.costPrice,
            amount: 32000,
          },
        ],
      },
    },
    update: {},
  });

  let vp1 = await prisma.vendorPayment.findFirst({
    where: { organizationId: org.id, vendorId: vendor1.id },
  });
  if (!vp1) {
    vp1 = await prisma.vendorPayment.create({
      data: {
        organizationId: org.id,
        vendorId: vendor1.id,
        amount: 37760,
        method: "NEFT",
      },
    });
    await prisma.vendorPaymentAllocation.create({
      data: {
        vendorPaymentId: vp1.id,
        billId: bill1.id,
        amount: 37760,
      },
    });
  }

  // 14. Notifications
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        type: "STOCK_UPDATE",
        title: "Initial Opening Stock Populated",
        body: "Warehouses MAIN and EAST updated with initial stock data.",
      },
      {
        organizationId: org.id,
        type: "INVOICE",
        title: "Invoice INV-10001 Paid",
        body: "Payment of ₹15,038.20 received from Metro Retail Mart.",
      },
    ],
  });

  console.log(`Successfully seeded Organization: ${org.name}`);
}

async function main() {
  const seedEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@demo.local";
  const seedPassword = process.env.SEED_ADMIN_PASSWORD ?? "Admin123!";

  // Seed default Demo Organization
  let demoOrg = await prisma.organization.findUnique({ where: { slug: "demo-organization" } });
  if (!demoOrg) {
    demoOrg = await prisma.organization.create({
      data: { name: "Demo Organization", slug: "demo-organization" },
    });
  }

  const passwordHash = await bcrypt.hash(seedPassword, 10);
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: demoOrg.id, email: seedEmail } },
    create: {
      organizationId: demoOrg.id,
      email: seedEmail,
      passwordHash,
      firstName: "Demo",
      lastName: "Admin",
      emailVerifiedAt: new Date(),
    },
    update: { passwordHash },
  });

  // Seed data for all registered organizations in MongoDB Atlas
  const allOrgs = await prisma.organization.findMany();
  for (const org of allOrgs) {
    await seedOrganizationData(org);
  }

  console.log("All sample data seeded successfully across all organizations!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
