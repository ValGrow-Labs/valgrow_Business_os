import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateAccountDto } from "./dto/create-account.dto";
import { UpdateAccountDto } from "./dto/update-account.dto";
import { UpdateMappingDto } from "./dto/update-mapping.dto";
import { seedDefaultChartOfAccounts } from "./default-accounts.seed";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccounts(orgId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { organizationId: orgId, deletedAt: null },
      include: {
        parent: { select: { id: true, accountCode: true, accountName: true } },
        children: { select: { id: true, accountCode: true, accountName: true } },
      },
      orderBy: { accountCode: "asc" },
    });

    if (accounts.length === 0) {
      await seedDefaultChartOfAccounts(this.prisma, orgId);
      return this.prisma.account.findMany({
        where: { organizationId: orgId, deletedAt: null },
        include: {
          parent: { select: { id: true, accountCode: true, accountName: true } },
          children: { select: { id: true, accountCode: true, accountName: true } },
        },
        orderBy: { accountCode: "asc" },
      });
    }

    return accounts;
  }

  async getAccount(id: string, orgId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id, organizationId: orgId, deletedAt: null },
      include: {
        parent: true,
        children: true,
      },
    });
    if (!account) throw new NotFoundException("Account not found");
    return account;
  }

  async createAccount(orgId: string, dto: CreateAccountDto) {
    const existing = await this.prisma.account.findUnique({
      where: { organizationId_accountCode: { organizationId: orgId, accountCode: dto.accountCode } },
    });
    if (existing) {
      throw new BadRequestException(`Account code ${dto.accountCode} already exists`);
    }

    if (dto.parentAccountId) {
      const parent = await this.prisma.account.findFirst({
        where: { id: dto.parentAccountId, organizationId: orgId, deletedAt: null },
      });
      if (!parent) throw new BadRequestException("Parent account not found");
    }

    return this.prisma.account.create({
      data: {
        organizationId: orgId,
        accountCode: dto.accountCode,
        accountName: dto.accountName,
        accountType: dto.accountType,
        accountCategory: dto.accountCategory,
        normalBalance: dto.normalBalance,
        parentAccountId: dto.parentAccountId || null,
        description: dto.description || null,
        reconciliationEnabled: dto.reconciliationEnabled || false,
      },
    });
  }

  async updateAccount(id: string, orgId: string, dto: UpdateAccountDto) {
    const account = await this.getAccount(id, orgId);

    if (dto.accountCode && dto.accountCode !== account.accountCode) {
      const existing = await this.prisma.account.findUnique({
        where: { organizationId_accountCode: { organizationId: orgId, accountCode: dto.accountCode } },
      });
      if (existing) throw new BadRequestException(`Account code ${dto.accountCode} already exists`);
    }

    return this.prisma.account.update({
      where: { id },
      data: {
        ...(dto.accountCode ? { accountCode: dto.accountCode } : {}),
        ...(dto.accountName ? { accountName: dto.accountName } : {}),
        ...(dto.accountType ? { accountType: dto.accountType } : {}),
        ...(dto.accountCategory ? { accountCategory: dto.accountCategory } : {}),
        ...(dto.normalBalance ? { normalBalance: dto.normalBalance } : {}),
        ...(dto.parentAccountId !== undefined ? { parentAccountId: dto.parentAccountId } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.reconciliationEnabled !== undefined ? { reconciliationEnabled: dto.reconciliationEnabled } : {}),
      },
    });
  }

  async deleteAccount(id: string, orgId: string) {
    const account = await this.getAccount(id, orgId);
    if (account.isSystemAccount) {
      throw new BadRequestException("System accounts cannot be deleted");
    }

    const linesCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });
    if (linesCount > 0) {
      throw new BadRequestException("Cannot delete account with existing journal entry postings");
    }

    return this.prisma.account.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  // --- Account Mappings ---

  async getAccountMappings(orgId: string) {
    const mappings = await this.prisma.accountMapping.findMany({
      where: { organizationId: orgId },
      include: { account: true },
      orderBy: { mappingKey: "asc" },
    });

    if (mappings.length === 0) {
      await seedDefaultChartOfAccounts(this.prisma, orgId);
      return this.prisma.accountMapping.findMany({
        where: { organizationId: orgId },
        include: { account: true },
        orderBy: { mappingKey: "asc" },
      });
    }

    return mappings;
  }

  async updateAccountMapping(orgId: string, dto: UpdateMappingDto) {
    const account = await this.getAccount(dto.accountId, orgId);

    return this.prisma.accountMapping.upsert({
      where: { organizationId_mappingKey: { organizationId: orgId, mappingKey: dto.mappingKey } },
      update: {
        accountId: account.id,
        description: dto.description || null,
      },
      create: {
        organizationId: orgId,
        mappingKey: dto.mappingKey,
        accountId: account.id,
        description: dto.description || null,
      },
      include: { account: true },
    });
  }
}
