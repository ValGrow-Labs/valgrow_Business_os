import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from "@nestjs/common";
import { AccountsService } from "./accounts.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { UpdateMappingDto } from "./dto/update-mapping.dto";

@Controller("accounts")
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @RequirePermissions("accounting.read")
  @Get()
  getAccounts(@CurrentOrg("id") orgId: string) {
    return this.accountsService.getAccounts(orgId);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Get("mappings")
  getMappings(@CurrentOrg("id") orgId: string) {
    return this.accountsService.getAccountMappings(orgId);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Post("mappings")
  updateMapping(
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateMappingDto,
  ) {
    return this.accountsService.updateAccountMapping(orgId, dto);
  }

  @RequirePermissions("accounting.read")
  @Get(":id")
  getAccount(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.accountsService.getAccount(id, orgId);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Post()
  createAccount(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.accountsService.createAccount(orgId, dto);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Patch(":id")
  updateAccount(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(id, orgId, dto);
  }

  @RequirePermissions("accounting.manage_accounts")
  @Delete(":id")
  deleteAccount(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.accountsService.deleteAccount(id, orgId);
  }
}
