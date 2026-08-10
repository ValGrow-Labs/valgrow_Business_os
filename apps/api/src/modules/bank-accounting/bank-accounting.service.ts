import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBankAccountDto } from "./dto/create-bank-account.dto";
import { CreateBankReconciliationDto } from "./dto/create-bank-reconciliation.dto";

@Injectable()
export class BankAccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async getBankAccounts(orgId: string) {
    return this.prisma.bankAccount.findMany({
      where: { organizationId: orgId },
      include: {
        account: { select: { id: true, accountCode: true, accountName: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createBankAccount(orgId: string, dto: CreateBankAccountDto) {
    const glAcc = await this.prisma.account.findFirst({
      where: { id: dto.accountId, organizationId: orgId },
    });
    if (!glAcc) throw new BadRequestException("GL Account not found in this organization");

    return this.prisma.bankAccount.create({
      data: {
        organizationId: orgId,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        bankName: dto.bankName,
        branchName: dto.branchName || null,
        ifscCode: dto.ifscCode || null,
        swiftCode: dto.swiftCode || null,
        accountType: dto.accountType,
        accountId: dto.accountId,
      },
      include: { account: true },
    });
  }

  async getBankReconciliations(orgId: string, bankAccountId?: string) {
    return this.prisma.bankReconciliation.findMany({
      where: {
        organizationId: orgId,
        ...(bankAccountId ? { bankAccountId } : {}),
      },
      include: {
        bankAccount: { select: { id: true, accountName: true, accountNumber: true } },
      },
      orderBy: { statementDate: "desc" },
    });
  }

  async createBankReconciliation(orgId: string, dto: CreateBankReconciliationDto) {
    const bankAcc = await this.prisma.bankAccount.findFirst({
      where: { id: dto.bankAccountId, organizationId: orgId },
    });
    if (!bankAcc) throw new BadRequestException("Bank account not found");

    // Compute book balance from GL lines
    const glLines = await this.prisma.journalEntryLine.findMany({
      where: {
        organizationId: orgId,
        accountId: bankAcc.accountId,
        journalEntry: { status: "POSTED" },
      },
    });

    let clearedBalance = 0;
    for (const line of glLines) {
      clearedBalance += Number(line.debit) - Number(line.credit);
    }

    const endingBalance = dto.endingBalance;
    const isReconciled = Math.abs(endingBalance - clearedBalance) < 0.01;

    return this.prisma.bankReconciliation.create({
      data: {
        organizationId: orgId,
        bankAccountId: dto.bankAccountId,
        statementDate: new Date(dto.statementDate),
        endingBalance,
        clearedBalance,
        isReconciled,
        notes: dto.notes || null,
      },
      include: { bankAccount: true },
    });
  }
}
