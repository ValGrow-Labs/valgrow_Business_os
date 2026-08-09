import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { PurchaseRequestsService } from "./purchase-requests.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import {
  UpdatePurchaseRequestDto,
  PRActionDto,
} from "./dto/update-purchase-request.dto";

@Controller("purchase-requests")
export class PurchaseRequestsController {
  constructor(private readonly service: PurchaseRequestsService) {}

  @RequirePermissions("purchasing.read")
  @Get()
  getAll(@CurrentOrg("id") orgId: string, @Query("status") status?: string) {
    return this.service.getPurchaseRequests(orgId, status);
  }

  @RequirePermissions("purchasing.read")
  @Get(":id")
  getOne(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.service.getPurchaseRequestById(id, orgId);
  }

  @RequirePermissions("purchasing.create")
  @Post()
  create(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreatePurchaseRequestDto,
  ) {
    return this.service.createPurchaseRequest(orgId, userId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Patch(":id")
  update(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdatePurchaseRequestDto,
  ) {
    return this.service.updatePurchaseRequest(id, orgId, dto);
  }

  @RequirePermissions("purchasing.create")
  @Post(":id/submit")
  submit(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: PRActionDto,
  ) {
    return this.service.submit(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.approve")
  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: PRActionDto,
  ) {
    return this.service.approve(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.approve")
  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: PRActionDto,
  ) {
    return this.service.reject(id, orgId, userId, dto);
  }

  @RequirePermissions("purchasing.update")
  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: PRActionDto,
  ) {
    return this.service.cancel(id, orgId, userId, dto);
  }
}
