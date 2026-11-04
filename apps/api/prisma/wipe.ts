import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log("=================================================");
  console.log("       INVENTRA DATABASE FULL WIPE SCRIPT        ");
  console.log("=================================================\n");

  const keepPermissions = process.env.KEEP_PERMISSIONS !== "false";

  console.log("Deleting all records across all collections...");

  // Analytics & Logs
  await prisma.analyticsSnapshot.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});
  await prisma.fileObject.deleteMany({});
  await prisma.integrationConfig.deleteMany({});

  // Payments & Allocations
  await prisma.paymentAllocation.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.vendorPaymentAllocation.deleteMany({});
  await prisma.vendorPayment.deleteMany({});

  // Invoices & Bills
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.billLine.deleteMany({});
  await prisma.bill.deleteMany({});

  // Sales & Shipments
  await prisma.shipmentLine.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.packageLine.deleteMany({});
  await prisma.package.deleteMany({});
  await prisma.salesReturnLine.deleteMany({});
  await prisma.salesReturn.deleteMany({});
  await prisma.salesOrderLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.estimateLine.deleteMany({});
  await prisma.estimate.deleteMany({});

  // Purchases & Receives
  await prisma.purchaseReturnLine.deleteMany({});
  await prisma.purchaseReturn.deleteMany({});
  await prisma.purchaseReceiveLine.deleteMany({});
  await prisma.purchaseReceive.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});

  // Customers & Vendors
  await prisma.customer.deleteMany({});
  await prisma.vendor.deleteMany({});

  // Inventory & Stock
  await prisma.reservation.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryStock.deleteMany({});
  await prisma.stockTransferLine.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.batchStock.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.serialNumber.deleteMany({});
  await prisma.reorderRule.deleteMany({});

  // Catalog
  await prisma.productComponent.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.numberSequence.deleteMany({});

  // Auth, Users, Roles & Organizations
  await prisma.userRole.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  if (!keepPermissions) {
    await prisma.permission.deleteMany({});
    console.log("  ✓ Deleted permissions collection");
  }

  console.log("\n✓ ALL DATA EMPTIED SUCCESSFULLY!");
  console.log("Database is now completely blank and ready for fresh registration.\n");
}

wipeDatabase()
  .catch((e) => {
    console.error("Wipe failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

