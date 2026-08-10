import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AccountingPeriodsService } from "../accounting-periods/accounting-periods.service";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { ReverseJournalEntryDto } from "./dto/reverse-journal-entry.dto";
import { Prisma, JournalEntryType, JournalEntryStatus } from "@prisma/client";

@Injectable()
export class JournalEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly periodsService: AccountingPeriodsService,
  ) {}

  async getMappedAccountId(
    tx: Prisma.TransactionClient,
    orgId: string,
    mappingKey: string,
    fallbackCode: string,
  ): Promise<string> {
    const mapping = await tx.accountMapping.findUnique({
      where: { organizationId_mappingKey: { organizationId: orgId, mappingKey } },
      select: { accountId: true },
    });

    if (mapping) return mapping.accountId;

    const fallback = await tx.account.findUnique({
      where: { organizationId_accountCode: { organizationId: orgId, accountCode: fallbackCode } },
      select: { id: true },
    });

    if (fallback) return fallback.id;

    throw new BadRequestException(`Account mapping '${mappingKey}' (code ${fallbackCode}) not found for organization.`);
  }

  async getJournalEntries(
    orgId: string,
    query?: {
      sourceModule?: string;
      referenceType?: string;
      referenceId?: string;
      status?: JournalEntryStatus;
      startDate?: string;
      endDate?: string;
      accountId?: string;
    },
  ) {
    const where: Prisma.JournalEntryWhereInput = {
      organizationId: orgId,
      ...(query?.sourceModule ? { sourceModule: query.sourceModule } : {}),
      ...(query?.referenceType ? { referenceType: query.referenceType } : {}),
      ...(query?.referenceId ? { referenceId: query.referenceId } : {}),
      ...(query?.status ? { status: query.status } : {}),
      ...(query?.startDate || query?.endDate
        ? {
            postingDate: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
      ...(query?.accountId
        ? {
            lines: {
              some: { accountId: query.accountId },
            },
          }
        : {}),
    };

    return this.prisma.journalEntry.findMany({
      where,
      include: {
        period: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        postedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        lines: {
          include: {
            account: true,
            branch: { select: { id: true, name: true, code: true } },
            costCenter: { select: { id: true, name: true, code: true } },
            customer: { select: { id: true, name: true, customerCode: true } },
            supplier: { select: { id: true, name: true, code: true } },
          },
          orderBy: { debit: "desc" },
        },
      },
      orderBy: { postingDate: "desc" },
    });
  }

  async getJournalEntry(id: string, orgId: string) {
    const entry = await this.prisma.journalEntry.findFirst({
      where: { id, organizationId: orgId },
      include: {
        period: true,
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        postedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        reversalOf: true,
        reversals: true,
        lines: {
          include: {
            account: true,
            branch: { select: { id: true, name: true, code: true } },
            costCenter: { select: { id: true, name: true, code: true } },
            customer: { select: { id: true, name: true, customerCode: true } },
            supplier: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    if (!entry) throw new NotFoundException("Journal entry not found");
    return entry;
  }

  async createManualJournalEntry(orgId: string, userId: string, dto: CreateJournalEntryDto) {
    const postingDate = dto.postingDate ? new Date(dto.postingDate) : new Date();
    const period = await this.periodsService.findPeriodForDate(orgId, postingDate);

    // Calculate Debits & Credits
    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of dto.lines) {
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException("Line item cannot contain both debit and credit amounts");
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new BadRequestException("Line item must have debit or credit greater than zero");
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(`Double-entry balance mismatch: Total Debit (${totalDebit}) does not equal Total Credit (${totalCredit})`);
    }

    // Verify account existence and org scope
    const accountIds = Array.from(new Set(dto.lines.map((l) => l.accountId)));
    const accounts = await this.prisma.account.findMany({
      where: { id: { in: accountIds }, organizationId: orgId, deletedAt: null },
    });
    if (accounts.length !== accountIds.length) {
      throw new BadRequestException("One or more target accounts do not exist in this organization");
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Document sequence
      const year = postingDate.getFullYear();
      const seq = await tx.documentSequence.upsert({
        where: { organizationId_documentType_year: { organizationId: orgId, documentType: "JOURNAL_ENTRY", year } },
        update: { lastSequence: { increment: 1 } },
        create: { organizationId: orgId, documentType: "JOURNAL_ENTRY", year, lastSequence: 1 },
      });

      const journalNumber = `JE-${year}-${String(seq.lastSequence).padStart(5, "0")}`;

      return tx.journalEntry.create({
        data: {
          organizationId: orgId,
          periodId: period.id,
          journalNumber,
          entryDate: dto.entryDate ? new Date(dto.entryDate) : new Date(),
          postingDate,
          entryType: JournalEntryType.MANUAL,
          status: JournalEntryStatus.POSTED,
          referenceType: dto.referenceType || null,
          referenceId: dto.referenceId || null,
          sourceModule: dto.sourceModule || "GENERAL_LEDGER",
          description: dto.description || null,
          totalDebit,
          totalCredit,
          createdById: userId,
          postedById: userId,
          postedAt: new Date(),
          lines: {
            create: dto.lines.map((l) => ({
              organizationId: orgId,
              accountId: l.accountId,
              debit: l.debit,
              credit: l.credit,
              description: l.description || dto.description || null,
              branchId: l.branchId || null,
              costCenterId: l.costCenterId || null,
              customerId: l.customerId || null,
              supplierId: l.supplierId || null,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      });
    });
  }

  /**
   * Helper used by operational event listeners (Sales, POS, Purchasing, Inventory) to post GL journals inside transactions.
   */
  async postOperationalJournal(
    tx: Prisma.TransactionClient,
    params: {
      orgId: string;
      userId: string;
      sourceModule: string;
      referenceType: string;
      referenceId: string;
      description: string;
      postingDate?: Date;
      lines: Array<{
        accountId: string;
        debit: number;
        credit: number;
        description?: string;
        branchId?: string;
        costCenterId?: string;
        customerId?: string;
        supplierId?: string;
      }>;
    },
  ) {
    const postingDate = params.postingDate || new Date();

    // Check duplicate source event prevention
    const existing = await tx.journalEntry.findUnique({
      where: {
        organizationId_sourceModule_referenceType_referenceId: {
          organizationId: params.orgId,
          sourceModule: params.sourceModule,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
        },
      },
    });
    if (existing) {
      return existing; // Already posted for this business transaction
    }

    // Verify period openness
    const period = await tx.accountingPeriod.findFirst({
      where: {
        organizationId: params.orgId,
        startDate: { lte: postingDate },
        endDate: { gte: postingDate },
      },
    });

    if (period && period.status !== "OPEN") {
      throw new BadRequestException(`Accounting Period ${period.periodName} is ${period.status}`);
    }

    const fallbackPeriod = period || (await tx.accountingPeriod.findFirst({
      where: { organizationId: params.orgId, status: "OPEN" },
      orderBy: { startDate: "desc" },
    }));

    if (!fallbackPeriod) {
      throw new BadRequestException("No OPEN accounting period available for posting journal entry");
    }

    // Validate balance
    let totalDebit = 0;
    let totalCredit = 0;
    const validLines = params.lines.filter((l) => l.debit > 0 || l.credit > 0);

    for (const l of validLines) {
      totalDebit += Number(l.debit || 0);
      totalCredit += Number(l.credit || 0);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.0001) {
      throw new BadRequestException(
        `Operational journal balance error for ${params.referenceType} (${params.referenceId}): Debit (${totalDebit}) != Credit (${totalCredit})`,
      );
    }

    const year = postingDate.getFullYear();
    const seq = await tx.documentSequence.upsert({
      where: { organizationId_documentType_year: { organizationId: params.orgId, documentType: "JOURNAL_ENTRY", year } },
      update: { lastSequence: { increment: 1 } },
      create: { organizationId: params.orgId, documentType: "JOURNAL_ENTRY", year, lastSequence: 1 },
    });

    const journalNumber = `JE-${year}-${String(seq.lastSequence).padStart(5, "0")}`;

    return tx.journalEntry.create({
      data: {
        organizationId: params.orgId,
        periodId: fallbackPeriod.id,
        journalNumber,
        entryDate: new Date(),
        postingDate,
        entryType: JournalEntryType.AUTOMATIC,
        status: JournalEntryStatus.POSTED,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        sourceModule: params.sourceModule,
        description: params.description,
        totalDebit,
        totalCredit,
        createdById: params.userId,
        postedById: params.userId,
        postedAt: new Date(),
        lines: {
          create: validLines.map((l) => ({
            organizationId: params.orgId,
            accountId: l.accountId,
            debit: l.debit,
            credit: l.credit,
            description: l.description || params.description,
            branchId: l.branchId || null,
            costCenterId: l.costCenterId || null,
            customerId: l.customerId || null,
            supplierId: l.supplierId || null,
          })),
        },
      },
    });
  }

  async reverseJournalEntry(orgId: string, userId: string, id: string, dto: ReverseJournalEntryDto) {
    const original = await this.getJournalEntry(id, orgId);

    if (original.status === JournalEntryStatus.REVERSED) {
      throw new BadRequestException("Journal entry has already been reversed");
    }

    const postingDate = new Date();
    const period = await this.periodsService.findPeriodForDate(orgId, postingDate);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const year = postingDate.getFullYear();
      const seq = await tx.documentSequence.upsert({
        where: { organizationId_documentType_year: { organizationId: orgId, documentType: "JOURNAL_ENTRY", year } },
        update: { lastSequence: { increment: 1 } },
        create: { organizationId: orgId, documentType: "JOURNAL_ENTRY", year, lastSequence: 1 },
      });

      const journalNumber = `JE-${year}-${String(seq.lastSequence).padStart(5, "0")}`;

      // Swap debits & credits
      const reversalLines = original.lines.map((l: any) => ({
        organizationId: orgId,
        accountId: l.accountId,
        debit: Number(l.credit),
        credit: Number(l.debit),
        description: `Reversal of ${original.journalNumber}: ${dto.reason}`,
        branchId: l.branchId,
        costCenterId: l.costCenterId,
        customerId: l.customerId,
        supplierId: l.supplierId,
      }));

      const reversalEntry = await tx.journalEntry.create({
        data: {
          organizationId: orgId,
          periodId: period.id,
          journalNumber,
          entryDate: new Date(),
          postingDate,
          entryType: JournalEntryType.REVERSAL,
          status: JournalEntryStatus.POSTED,
          referenceType: original.referenceType,
          referenceId: original.referenceId,
          sourceModule: original.sourceModule,
          description: `Reversal of ${original.journalNumber}: ${dto.reason}`,
          reversalOfId: original.id,
          reversalReason: dto.reason,
          totalDebit: original.totalCredit,
          totalCredit: original.totalDebit,
          createdById: userId,
          postedById: userId,
          postedAt: new Date(),
          lines: { create: reversalLines },
        },
        include: { lines: true },
      });

      await tx.journalEntry.update({
        where: { id: original.id },
        data: { status: JournalEntryStatus.REVERSED },
      });

      return reversalEntry;
    });
  }
}
