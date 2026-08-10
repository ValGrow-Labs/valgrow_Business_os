import {
  Controller,
  Get,
  Post,
  Param,
  Body,
} from "@nestjs/common";
import { FiscalYearsService } from "./fiscal-years.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateFiscalYearDto } from "./dto/create-fiscal-year.dto";

@Controller("fiscal-years")
export class FiscalYearsController {
  constructor(private readonly fiscalYearsService: FiscalYearsService) {}

  @RequirePermissions("accounting.read")
  @Get()
  getFiscalYears(@CurrentOrg("id") orgId: string) {
    return this.fiscalYearsService.getFiscalYears(orgId);
  }

  @RequirePermissions("accounting.read")
  @Get(":id")
  getFiscalYear(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.fiscalYearsService.getFiscalYear(id, orgId);
  }

  @RequirePermissions("accounting.close_period")
  @Post()
  createFiscalYear(
    @CurrentOrg("id") orgId: string,
    @Body() dto: CreateFiscalYearDto,
  ) {
    return this.fiscalYearsService.createFiscalYear(orgId, dto);
  }

  @RequirePermissions("accounting.close_period")
  @Post(":id/close")
  closeFiscalYear(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.fiscalYearsService.closeFiscalYear(id, orgId);
  }
}
