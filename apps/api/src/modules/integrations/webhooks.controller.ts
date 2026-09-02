import { BadRequestException, Body, Controller, Headers, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { PAYMENT_PROVIDER, SHIPPING_PROVIDER, type PaymentProvider, type ShippingProvider } from "../integrations/providers";
import { Inject } from "@nestjs/common";

@ApiTags("webhooks")
@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
    @Inject(SHIPPING_PROVIDER) private readonly shipping: ShippingProvider,
  ) {}

  @Post("payments/:provider")
  async paymentsHook(
    @Body() body: unknown,
    @Headers("x-webhook-signature") signature: string | undefined,
    @Req() req: Request,
  ) {
    const raw = JSON.stringify(body);
    let event: { eventId: string; type: string; payload: unknown };
    try {
      event = await this.payments.verifyWebhook(raw, signature ?? "");
    } catch {
      throw new BadRequestException("Invalid webhook signature");
    }
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: this.payments.name,
          eventId: event.eventId,
          eventType: event.type,
          payload: event.payload as object,
          processedAt: new Date(),
        },
      });
    } catch {
      return { duplicate: true };
    }
    void req;
    return { received: true };
  }

  @Post("shipping/:provider")
  async shippingHook(@Body() body: { eventId: string; type: string; payload: object }) {
    try {
      await this.prisma.webhookEvent.create({
        data: {
          provider: this.shipping.name,
          eventId: body.eventId,
          eventType: body.type,
          payload: body.payload,
          processedAt: new Date(),
        },
      });
    } catch {
      return { duplicate: true };
    }
    return { received: true };
  }
}
