export const ROLES = [
  "Admin",
  "Inventory Manager",
  "Sales Manager",
  "Purchase Manager",
  "Accountant",
  "Warehouse Staff",
  "Viewer",
] as const;

export type RoleName = (typeof ROLES)[number];

export const PERMISSIONS = [
  "organization:read",
  "organization:update",
  "user:create",
  "user:read",
  "user:update",
  "user:delete",
  "role:manage",
  "product:create",
  "product:read",
  "product:update",
  "product:delete",
  "warehouse:create",
  "warehouse:read",
  "warehouse:update",
  "warehouse:delete",
  "inventory:read",
  "inventory:adjust",
  "inventory:transfer",
  "inventory:reserve",
  "customer:create",
  "customer:read",
  "customer:update",
  "customer:delete",
  "vendor:create",
  "vendor:read",
  "vendor:update",
  "vendor:delete",
  "estimate:create",
  "estimate:read",
  "estimate:update",
  "sales_order:create",
  "sales_order:read",
  "sales_order:update",
  "sales_order:confirm",
  "sales_order:cancel",
  "package:create",
  "package:read",
  "shipment:create",
  "shipment:read",
  "shipment:confirm",
  "invoice:create",
  "invoice:read",
  "invoice:update",
  "invoice:void",
  "payment:create",
  "payment:read",
  "purchase_order:create",
  "purchase_order:read",
  "purchase_order:update",
  "purchase_receive:create",
  "purchase_receive:read",
  "bill:create",
  "bill:read",
  "vendor_payment:create",
  "return:create",
  "return:read",
  "return:approve",
  "report:read",
  "audit:read",
  "integration:manage",
  "notification:read",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<RoleName, readonly Permission[]> = {
  Admin: PERMISSIONS,
  "Inventory Manager": [
    "product:create",
    "product:read",
    "product:update",
    "warehouse:create",
    "warehouse:read",
    "warehouse:update",
    "inventory:read",
    "inventory:adjust",
    "inventory:transfer",
    "inventory:reserve",
    "report:read",
    "notification:read",
  ],
  "Sales Manager": [
    "product:read",
    "warehouse:read",
    "inventory:read",
    "customer:create",
    "customer:read",
    "customer:update",
    "estimate:create",
    "estimate:read",
    "estimate:update",
    "sales_order:create",
    "sales_order:read",
    "sales_order:update",
    "sales_order:confirm",
    "sales_order:cancel",
    "package:create",
    "package:read",
    "shipment:create",
    "shipment:read",
    "shipment:confirm",
    "invoice:create",
    "invoice:read",
    "payment:create",
    "payment:read",
    "return:create",
    "return:read",
    "return:approve",
    "report:read",
  ],
  "Purchase Manager": [
    "product:read",
    "warehouse:read",
    "inventory:read",
    "vendor:create",
    "vendor:read",
    "vendor:update",
    "purchase_order:create",
    "purchase_order:read",
    "purchase_order:update",
    "purchase_receive:create",
    "purchase_receive:read",
    "bill:create",
    "bill:read",
    "vendor_payment:create",
    "return:create",
    "return:read",
    "return:approve",
    "report:read",
  ],
  Accountant: [
    "product:read",
    "inventory:read",
    "customer:read",
    "vendor:read",
    "sales_order:read",
    "invoice:create",
    "invoice:read",
    "invoice:update",
    "invoice:void",
    "payment:create",
    "payment:read",
    "purchase_order:read",
    "bill:create",
    "bill:read",
    "vendor_payment:create",
    "report:read",
    "audit:read",
  ],
  "Warehouse Staff": [
    "product:read",
    "warehouse:read",
    "inventory:read",
    "inventory:adjust",
    "inventory:transfer",
    "package:create",
    "package:read",
    "shipment:create",
    "shipment:read",
    "shipment:confirm",
    "purchase_receive:create",
    "purchase_receive:read",
  ],
  Viewer: [
    "product:read",
    "warehouse:read",
    "inventory:read",
    "customer:read",
    "vendor:read",
    "sales_order:read",
    "invoice:read",
    "purchase_order:read",
    "report:read",
  ],
};

export type ProductType = "BASIC" | "SERIALIZED" | "BATCH" | "COMPOSITE";
export type DocumentStatus =
  | "DRAFT"
  | "CONFIRMED"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "CANCELLED";
export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "VOID";
export type InventoryTxnType =
  | "OPENING_STOCK"
  | "PURCHASE_RECEIVE"
  | "SALES_SHIPMENT"
  | "STOCK_ADJUSTMENT"
  | "STOCK_TRANSFER_OUT"
  | "STOCK_TRANSFER_IN"
  | "SALES_RETURN"
  | "PURCHASE_RETURN";
export type SerialStatus = "AVAILABLE" | "RESERVED" | "SOLD" | "RETURNED" | "DAMAGED";
export type BatchStrategy = "FIFO" | "FEFO";

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  error: string;
  details?: unknown;
  requestId?: string;
}
