import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface PaymentIntent {
  id: string;
  amount: number;
  status: "PENDING" | "SUCCEEDED" | "FAILED";
}

export interface PaymentProvider {
  readonly name: string;
  createIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<PaymentIntent>;
  verifyWebhook(rawBody: string, signature: string): Promise<{ eventId: string; type: string; payload: unknown }>;
}

export interface ShipmentRate {
  amount: number;
  currency: string;
  service: string;
}

export interface ShippingProvider {
  readonly name: string;
  createShipment(input: {
    to: string;
    weightKg: number;
    reference: string;
  }): Promise<{ trackingNumber: string; providerRef: string }>;
  cancelShipment(providerRef: string): Promise<void>;
  getTracking(providerRef: string): Promise<{ status: string; trackingNumber: string }>;
  calculateRate(input: { to: string; weightKg: number }): Promise<ShipmentRate>;
}

export interface EmailProvider {
  readonly name: string;
  send(to: string, subject: string, html: string): Promise<void>;
}

export const PAYMENT_PROVIDER = "PAYMENT_PROVIDER";
export const SHIPPING_PROVIDER = "SHIPPING_PROVIDER";
export const EMAIL_PROVIDER = "EMAIL_PROVIDER";

@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  readonly name = "stub";
  async createIntent(amount: number): Promise<PaymentIntent> {
    return { id: `pay_stub_${Date.now()}`, amount, status: "SUCCEEDED" };
  }
  async verifyWebhook(rawBody: string, signature: string) {
    if (signature !== "stub-signature") throw new Error("Invalid signature");
    const payload = JSON.parse(rawBody) as { eventId: string; type: string };
    return { eventId: payload.eventId, type: payload.type, payload };
  }
}

@Injectable()
export class StubShippingProvider implements ShippingProvider {
  readonly name = "stub";
  async createShipment(input: { reference: string }) {
    return { trackingNumber: `TRK${Date.now()}`, providerRef: `shp_${input.reference}` };
  }
  async cancelShipment(): Promise<void> {}
  async getTracking(providerRef: string) {
    return { status: "IN_TRANSIT", trackingNumber: providerRef };
  }
  async calculateRate() {
    return { amount: 50, currency: "INR", service: "standard" };
  }
}

@Injectable()
export class StubEmailProvider implements EmailProvider {
  readonly name = "stub";
  async send(to: string, subject: string, html: string): Promise<void> {
    console.log(`[email:${this.name}] to=${to} subject=${subject} body=${html.slice(0, 120)}`);
  }
}

export function providerFactory(config: ConfigService) {
  return {
    payment: new StubPaymentProvider(),
    shipping: new StubShippingProvider(),
    email: new StubEmailProvider(),
    selected: {
      payment: config.get("PAYMENT_PROVIDER", "stub"),
      shipping: config.get("SHIPPING_PROVIDER", "stub"),
      email: config.get("EMAIL_PROVIDER", "stub"),
    },
  };
}
