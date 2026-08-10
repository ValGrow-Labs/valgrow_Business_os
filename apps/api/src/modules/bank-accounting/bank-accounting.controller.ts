import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { BankAccountingService } from "./bank-accounting.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";
import { CreateBankReconciliationDto } from "./dto/create-bank-reconciliation.dto";

@Controller("bank-accounts")
export class BankAccountingController {
  constructor(private readonly bankService: BankAccountingService) {}

  @RequirePermissions("accounting.manage_bank")
  @Get()
  getBankAccounts(@CurrentOrg("id") orgId: string) {
    return this.bankService.getBankAccounts(orgId);
  }

  @RequirePermissions("accounting.manage_bank")
  @Post()
  createBankAccount(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.bankService.createBankAccount(orgId, dto);
  }

  @RequirePermissions("accounting.reconcile")
  @Get("reconciliations")
  getReconciliations(
    @CurrentOrg("id") orgId: string,
    @Query("bankAccountId") bankAccountId?: string,
  ) {
    return this.bankService.getBankReconciliations(orgId, bankAccountId);
  }

  @RequirePermissions("accounting.reconcile")
  @Post("reconciliations")
  createReconciliation(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateBankReconciliationDto,
  ) {
    return this.bankService.createBankReconciliation(orgId, dto);
  }
}
