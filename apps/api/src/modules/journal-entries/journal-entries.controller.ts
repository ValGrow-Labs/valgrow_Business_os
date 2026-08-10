import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
} from "@nestjs/common";
import { JournalEntriesService } from "./journal-entries.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { ReverseJournalEntryDto } from "./dto/reverse-journal-entry.dto";
import { JournalEntryStatus } from "@prisma/client";

@Controller("journal-entries")
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @RequirePermissions("accounting.read")
  @Get()
  getJournalEntries(
    @CurrentOrg("id") orgId: string,
    @Query("sourceModule") sourceModule?: string,
    @Query("referenceType") referenceType?: string,
    @Query("referenceId") referenceId?: string,
    @Query("status") status?: JournalEntryStatus,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("accountId") accountId?: string,
  ) {
    return this.journalEntriesService.getJournalEntries(orgId, {
      sourceModule,
      referenceType,
      referenceId,
      status,
      startDate,
      endDate,
      accountId,
    });
  }

  @RequirePermissions("accounting.read")
  @Get(":id")
  getJournalEntry(@Param("id") id: string, @CurrentOrg("id") orgId: string) {
    return this.journalEntriesService.getJournalEntry(id, orgId);
  }

  @RequirePermissions("accounting.create")
  @Post("manual")
  createManualJournalEntry(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.createManualJournalEntry(orgId, userId, dto);
  }

  @RequirePermissions("accounting.create")
  @Post()
  createJournalEntry(
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.journalEntriesService.createManualJournalEntry(orgId, userId, dto);
  }

  @RequirePermissions("accounting.reverse")
  @Post(":id/reverse")
  reverseJournalEntry(
    @Param("id") id: string,
    @CurrentOrg("id") orgId: string,
    @CurrentUser("id") userId: string,
    @Body() dto: ReverseJournalEntryDto,
  ) {
    return this.journalEntriesService.reverseJournalEntry(orgId, userId, id, dto);
  }
}
