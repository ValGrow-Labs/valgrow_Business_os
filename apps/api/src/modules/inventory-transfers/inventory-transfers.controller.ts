import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from "@nestjs/common";
import { InventoryTransfersService } from "./inventory-transfers.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { UpdateTransferDto } from "./dto/update-transfer.dto";

@Controller("inventory/transfers")
export class InventoryTransfersController {
  constructor(private readonly transfersService: InventoryTransfersService) {}

  @RequirePermissions("inventory.read")
  @Get()
  async getTransfers(
    @CurrentOrg("id") organizationId: string,
    @Query("status") status?: string,
  ) {
    return this.transfersService.getTransfers(organizationId, status);
  }

  @RequirePermissions("inventory.read")
  @Get(":id")
  async getTransfer(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.transfersService.getTransferById(id, organizationId);
  }

  @RequirePermissions("inventory.transfer")
  @Post()
  async createTransfer(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") createdById: string,
    @Body() dto: CreateTransferDto,
  ) {
    return this.transfersService.createTransfer(
      organizationId,
      createdById,
      dto,
    );
  }

  @RequirePermissions("inventory.transfer")
  @Patch(":id")
  async updateTransfer(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") actorId: string,
    @Body() dto: UpdateTransferDto,
  ) {
    return this.transfersService.updateTransfer(
      id,
      organizationId,
      actorId,
      dto,
    );
  }
}
