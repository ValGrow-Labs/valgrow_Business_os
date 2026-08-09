import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
} from "@nestjs/common";
import { QuotationsService } from "./quotations.service";
import { CreateQuotationDto } from "./dto/create-quotation.dto";
import { UpdateQuotationDto } from "./dto/update-quotation.dto";
import { QuotationActionDto } from "./dto/quotation-action.dto";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("quotations")
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Get()
  @RequirePermissions("sales.read")
  getQuotations(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.quotationsService.getQuotations(organizationId, status);
  }

  @Get(":id")
  @RequirePermissions("sales.read")
  getQuotationById(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.quotationsService.getQuotationById(id, organizationId);
  }

  @Post()
  @RequirePermissions("sales.create")
  createQuotation(
    @CurrentOrg("id") organizationId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationsService.createQuotation(organizationId, dto);
  }

  @Patch(":id")
  @RequirePermissions("sales.update")
  updateQuotation(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @Body() dto: UpdateQuotationDto,
  ) {
    return this.quotationsService.updateQuotation(id, organizationId, dto);
  }

  @Post(":id/send")
  @RequirePermissions("sales.update")
  send(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: QuotationActionDto,
  ) {
    return this.quotationsService.send(id, organizationId, userId, dto);
  }

  @Post(":id/accept")
  @RequirePermissions("sales.update")
  accept(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: QuotationActionDto,
  ) {
    return this.quotationsService.accept(id, organizationId, userId, dto);
  }

  @Post(":id/reject")
  @RequirePermissions("sales.update")
  reject(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: QuotationActionDto,
  ) {
    return this.quotationsService.reject(id, organizationId, userId, dto);
  }

  @Post(":id/expire")
  @RequirePermissions("sales.update")
  expire(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: QuotationActionDto,
  ) {
    return this.quotationsService.expire(id, organizationId, userId, dto);
  }

  @Post(":id/cancel")
  @RequirePermissions("sales.update")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: QuotationActionDto,
  ) {
    return this.quotationsService.cancel(id, organizationId, userId, dto);
  }

  @Post(":id/convert")
  @RequirePermissions("sales.create")
  convert(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.quotationsService.convertToSalesOrder(
      id,
      organizationId,
      userId,
    );
  }
}
