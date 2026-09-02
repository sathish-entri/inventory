import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanData() {
  console.log("🧹 Starting database cleanup (preserving Users, Organizations, Roles, Permissions)...");

  // Delete child records first to respect relational dependencies
  await prisma.paymentAllocation.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.payment.deleteMany({});

  await prisma.shipmentLine.deleteMany({});
  await prisma.shipment.deleteMany({});
  await prisma.packageLine.deleteMany({});
  await prisma.package.deleteMany({});
  await prisma.salesOrderLine.deleteMany({});
  await prisma.salesOrder.deleteMany({});

  await prisma.estimateLine.deleteMany({});
  await prisma.estimate.deleteMany({});

  await prisma.salesReturnLine.deleteMany({});
  await prisma.salesReturn.deleteMany({});

  await prisma.vendorPaymentAllocation.deleteMany({});
  await prisma.billLine.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.vendorPayment.deleteMany({});

  await prisma.purchaseReceiveLine.deleteMany({});
  await prisma.purchaseReceive.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});

  await prisma.purchaseReturnLine.deleteMany({});
  await prisma.purchaseReturn.deleteMany({});

  await prisma.stockTransferLine.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.reservation.deleteMany({});
  await prisma.inventoryTransaction.deleteMany({});
  await prisma.inventoryStock.deleteMany({});

  await prisma.batchStock.deleteMany({});
  await prisma.batch.deleteMany({});
  await prisma.serialNumber.deleteMany({});
  await prisma.reorderRule.deleteMany({});

  await prisma.productComponent.deleteMany({});
  await prisma.productImage.deleteMany({});
  await prisma.product.deleteMany({});

  await prisma.category.deleteMany({});
  await prisma.brand.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.warehouse.deleteMany({});

  await prisma.customer.deleteMany({});
  await prisma.vendor.deleteMany({});

  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.idempotencyKey.deleteMany({});
  await prisma.fileObject.deleteMany({});
  await prisma.integrationConfig.deleteMany({});

  // Reset number sequences so new orders start from 1 again (e.g. SO-0001)
  await prisma.numberSequence.deleteMany({});

  console.log("✅ Database successfully cleaned! All operational data removed while preserving User accounts & Organizations.");
}

cleanData()
  .catch((e) => {
    console.error("❌ Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
