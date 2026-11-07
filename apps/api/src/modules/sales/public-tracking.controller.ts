import { Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { SalesService } from "./sales.service";

@ApiTags("public-portal")
@Controller("public/portal")
export class PublicTrackingController {
  constructor(private readonly sales: SalesService) {}

  @Get("track/:id")
  trackOrder(@Param("id") id: string) {
    return this.sales.trackEstimateOrOrder(id);
  }

  @Post("confirm/:id")
  confirmOrder(@Param("id") id: string) {
    return this.sales.confirmEstimateByCustomer(id);
  }
}


