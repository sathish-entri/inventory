import { describe, it, expect, beforeEach, vi } from "vitest";
import { CatalogService } from "./catalog.service";
import { NotFoundException } from "@nestjs/common";

describe("CatalogService Customer & Vendor Operations", () => {
  let catalogService: CatalogService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      customer: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
      vendor: {
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
    };

    catalogService = new CatalogService(mockPrisma as any);
  });

  describe("Customer CRUD", () => {
    it("should create customer with state, pincode, lat & long", async () => {
      const data = {
        name: "Raja",
        email: "Test2002@gmail.com",
        phone: "8925158024",
        city: "Aliyur",
        state: "Tamil Nadu",
        pincode: "611117",
        gstin: "33Jaada",
        billingAddress: "Srirangadipuliyur, Aliyur",
        shippingAddress: "Srirangadipuliyur, Aliyur",
        latitude: 10.771971,
        longitude: 79.766038,
      };

      mockPrisma.customer.create.mockResolvedValue({ id: "cust_1", ...data, organizationId: "org_1" });

      const res = await catalogService.createCustomer("org_1", data);
      expect(mockPrisma.customer.create).toHaveBeenCalledWith({
        data: { ...data, organizationId: "org_1" },
      });
      expect(res.id).toBe("cust_1");
      expect(res.state).toBe("Tamil Nadu");
      expect(res.pincode).toBe("611117");
    });

    it("should update customer successfully", async () => {
      const updateData = { name: "Raja Updated", state: "Tamil Nadu", pincode: "611118" };
      mockPrisma.customer.findFirst.mockResolvedValue({ id: "cust_1", organizationId: "org_1", name: "Raja" });
      mockPrisma.customer.update.mockResolvedValue({ id: "cust_1", organizationId: "org_1", ...updateData });

      const res = await catalogService.updateCustomer("org_1", "cust_1", updateData);
      expect(mockPrisma.customer.findFirst).toHaveBeenCalledWith({ where: { id: "cust_1", organizationId: "org_1" } });
      expect(mockPrisma.customer.update).toHaveBeenCalledWith({ where: { id: "cust_1" }, data: updateData });
      expect(res.name).toBe("Raja Updated");
      expect(res.pincode).toBe("611118");
    });

    it("should throw NotFoundException if customer to update does not exist", async () => {
      mockPrisma.customer.findFirst.mockResolvedValue(null);

      await expect(catalogService.updateCustomer("org_1", "invalid_id", { name: "New" })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("Vendor CRUD", () => {
    it("should update vendor successfully", async () => {
      const updateData = { name: "Vendor Updated", city: "Chennai" };
      mockPrisma.vendor.findFirst.mockResolvedValue({ id: "vend_1", organizationId: "org_1", name: "Vendor 1" });
      mockPrisma.vendor.update.mockResolvedValue({ id: "vend_1", organizationId: "org_1", ...updateData });

      const res = await catalogService.updateVendor("org_1", "vend_1", updateData);
      expect(res.name).toBe("Vendor Updated");
    });
  });
});
