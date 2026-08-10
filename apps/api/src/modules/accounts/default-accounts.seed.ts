import { PrismaClient, AccountType, AccountCategory, NormalBalance } from "@prisma/client";

export const DEFAULT_ACCOUNTS = [
  { code: "1000", name: "Assets", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, isSystem: true },
  { code: "1010", name: "Cash & Bank", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1000", isSystem: true },
  { code: "1011", name: "Main Cash Register", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1010", isSystem: true, reconciliation: true },
  { code: "1012", name: "Main Operating Bank Account", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1010", isSystem: true, reconciliation: true },
  { code: "1020", name: "Accounts Receivable", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1000", isSystem: true },
  { code: "1030", name: "Inventory Asset", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1000", isSystem: true },
  { code: "1040", name: "Input Tax Credit (GST/VAT)", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1000", isSystem: true },
  { code: "1050", name: "Clearing Accounts", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1000", isSystem: true },
  { code: "1051", name: "POS Card Clearing Account", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1050", isSystem: true },
  { code: "1052", name: "POS UPI Clearing Account", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.DEBIT, parentCode: "1050", isSystem: true },
  { code: "1053", name: "Goods Received Not Invoiced (GRNI)", type: AccountType.ASSET, category: AccountCategory.CURRENT_ASSET, normalBalance: NormalBalance.CREDIT, parentCode: "1050", isSystem: true },

  { code: "2000", name: "Liabilities", type: AccountType.LIABILITY, category: AccountCategory.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, isSystem: true },
  { code: "2010", name: "Accounts Payable", type: AccountType.LIABILITY, category: AccountCategory.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, parentCode: "2000", isSystem: true },
  { code: "2020", name: "Output Tax Payable (GST/VAT)", type: AccountType.LIABILITY, category: AccountCategory.CURRENT_LIABILITY, normalBalance: NormalBalance.CREDIT, parentCode: "2000", isSystem: true },

  { code: "3000", name: "Equity", type: AccountType.EQUITY, category: AccountCategory.EQUITY, normalBalance: NormalBalance.CREDIT, isSystem: true },
  { code: "3010", name: "Owner's Equity", type: AccountType.EQUITY, category: AccountCategory.EQUITY, normalBalance: NormalBalance.CREDIT, parentCode: "3000", isSystem: true },
  { code: "3020", name: "Retained Earnings", type: AccountType.EQUITY, category: AccountCategory.EQUITY, normalBalance: NormalBalance.CREDIT, parentCode: "3000", isSystem: true },

  { code: "4000", name: "Revenue", type: AccountType.REVENUE, category: AccountCategory.OPERATING_REVENUE, normalBalance: NormalBalance.CREDIT, isSystem: true },
  { code: "4010", name: "Sales Revenue", type: AccountType.REVENUE, category: AccountCategory.OPERATING_REVENUE, normalBalance: NormalBalance.CREDIT, parentCode: "4000", isSystem: true },
  { code: "4020", name: "Sales Discounts Allowed", type: AccountType.REVENUE, category: AccountCategory.OPERATING_REVENUE, normalBalance: NormalBalance.DEBIT, parentCode: "4000", isSystem: true },
  { code: "4030", name: "Sales Returns & Allowances", type: AccountType.REVENUE, category: AccountCategory.OPERATING_REVENUE, normalBalance: NormalBalance.DEBIT, parentCode: "4000", isSystem: true },

  { code: "5000", name: "Expenses", type: AccountType.EXPENSE, category: AccountCategory.COST_OF_GOODS_SOLD, normalBalance: NormalBalance.DEBIT, isSystem: true },
  { code: "5010", name: "Cost of Goods Sold (COGS)", type: AccountType.EXPENSE, category: AccountCategory.COST_OF_GOODS_SOLD, normalBalance: NormalBalance.DEBIT, parentCode: "5000", isSystem: true },
  { code: "5020", name: "Inventory Adjustment Write-offs", type: AccountType.EXPENSE, category: AccountCategory.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, parentCode: "5000", isSystem: true },
  { code: "5030", name: "General Operating Expense", type: AccountType.EXPENSE, category: AccountCategory.OPERATING_EXPENSE, normalBalance: NormalBalance.DEBIT, parentCode: "5000", isSystem: true },
];

export const DEFAULT_ACCOUNT_MAPPINGS = [
  { key: "SALES_REVENUE", accountCode: "4010", description: "Default account for sales invoice and POS sales revenue" },
  { key: "SALES_RETURNS", accountCode: "4030", description: "Default account for customer returns and credit notes" },
  { key: "COGS", accountCode: "5010", description: "Default account for cost of goods sold" },
  { key: "INVENTORY_ASSET", accountCode: "1030", description: "Default account for inventory valuation asset" },
  { key: "ACCOUNTS_RECEIVABLE", accountCode: "1020", description: "Default sub-ledger account for customer outstanding receivables" },
  { key: "ACCOUNTS_PAYABLE", accountCode: "2010", description: "Default sub-ledger account for supplier outstanding payables" },
  { key: "INPUT_TAX", accountCode: "1040", description: "Default input tax credit asset account" },
  { key: "OUTPUT_TAX", accountCode: "2020", description: "Default output tax payable liability account" },
  { key: "CASH", accountCode: "1011", description: "Default cash on hand account" },
  { key: "BANK", accountCode: "1012", description: "Default bank account" },
  { key: "CARD_CLEARING", accountCode: "1051", description: "Default POS card clearing account" },
  { key: "UPI_CLEARING", accountCode: "1052", description: "Default POS UPI clearing account" },
  { key: "PURCHASE_CLEARING", accountCode: "1053", description: "Default GRNI purchase clearing account" },
  { key: "DISCOUNTS", accountCode: "4020", description: "Default sales discounts allowed account" },
  { key: "INVENTORY_ADJUSTMENT", accountCode: "5020", description: "Default inventory shrinkage/write-off expense account" },
];

export async function seedDefaultChartOfAccounts(prisma: PrismaClient, organizationId: string) {
  const accountMap = new Map<string, string>(); // code -> id

  // Pass 1: Root accounts (no parentCode)
  for (const acc of DEFAULT_ACCOUNTS.filter((a) => !a.parentCode)) {
    const created = await prisma.account.upsert({
      where: { organizationId_accountCode: { organizationId, accountCode: acc.code } },
      update: {
        accountName: acc.name,
        accountType: acc.type,
        accountCategory: acc.category,
        normalBalance: acc.normalBalance,
        isSystemAccount: acc.isSystem,
        reconciliationEnabled: acc.reconciliation || false,
      },
      create: {
        organizationId,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        accountCategory: acc.category,
        normalBalance: acc.normalBalance,
        isSystemAccount: acc.isSystem,
        reconciliationEnabled: acc.reconciliation || false,
      },
    });
    accountMap.set(acc.code, created.id);
  }

  // Pass 2: Child accounts (has parentCode)
  for (const acc of DEFAULT_ACCOUNTS.filter((a) => a.parentCode)) {
    const parentId = accountMap.get(acc.parentCode!);
    const created = await prisma.account.upsert({
      where: { organizationId_accountCode: { organizationId, accountCode: acc.code } },
      update: {
        accountName: acc.name,
        accountType: acc.type,
        accountCategory: acc.category,
        normalBalance: acc.normalBalance,
        parentAccountId: parentId || null,
        isSystemAccount: acc.isSystem,
        reconciliationEnabled: acc.reconciliation || false,
      },
      create: {
        organizationId,
        accountCode: acc.code,
        accountName: acc.name,
        accountType: acc.type,
        accountCategory: acc.category,
        normalBalance: acc.normalBalance,
        parentAccountId: parentId || null,
        isSystemAccount: acc.isSystem,
        reconciliationEnabled: acc.reconciliation || false,
      },
    });
    accountMap.set(acc.code, created.id);
  }

  // Pass 3: Account Mappings
  for (const mapItem of DEFAULT_ACCOUNT_MAPPINGS) {
    const accountId = accountMap.get(mapItem.accountCode);
    if (accountId) {
      await prisma.accountMapping.upsert({
        where: { organizationId_mappingKey: { organizationId, mappingKey: mapItem.key } },
        update: { accountId, description: mapItem.description },
        create: { organizationId, mappingKey: mapItem.key, accountId, description: mapItem.description },
      });
    }
  }

  // Pass 4: Seed Default Fiscal Year & Monthly Periods (e.g. FY 2025-2026: April 1, 2025 to March 31, 2027)
  const fyName = "FY 2025-2026";
  const fyStart = new Date("2025-04-01T00:00:00.000Z");
  const fyEnd = new Date("2026-03-31T23:59:59.999Z");

  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { organizationId_name: { organizationId, name: fyName } },
    update: {},
    create: {
      organizationId,
      name: fyName,
      startDate: fyStart,
      endDate: fyEnd,
    },
  });

  // Monthly periods for FY 2025-2026
  for (let month = 0; month < 12; month++) {
    const pNumber = month + 1;
    const pStart = new Date(Date.UTC(2025, 3 + month, 1)); // April is month 3
    const pEnd = new Date(Date.UTC(2025, 4 + month, 0, 23, 59, 59, 999));
    const pName = `2025-M${String(pNumber).padStart(2, "0")}`;

    await prisma.accountingPeriod.upsert({
      where: {
        organizationId_fiscalYearId_periodNumber: {
          organizationId,
          fiscalYearId: fiscalYear.id,
          periodNumber: pNumber,
        },
      },
      update: {},
      create: {
        organizationId,
        fiscalYearId: fiscalYear.id,
        periodName: pName,
        periodNumber: pNumber,
        startDate: pStart,
        endDate: pEnd,
        status: "OPEN",
      },
    });
  }

  // Seed FY 2026-2027 as well so current date (Aug 2026) is covered
  const fyNameNext = "FY 2026-2027";
  const fyStartNext = new Date("2026-04-01T00:00:00.000Z");
  const fyEndNext = new Date("2027-03-31T23:59:59.999Z");

  const fiscalYearNext = await prisma.fiscalYear.upsert({
    where: { organizationId_name: { organizationId, name: fyNameNext } },
    update: {},
    create: {
      organizationId,
      name: fyNameNext,
      startDate: fyStartNext,
      endDate: fyEndNext,
    },
  });

  for (let month = 0; month < 12; month++) {
    const pNumber = month + 1;
    const pStart = new Date(Date.UTC(2026, 3 + month, 1));
    const pEnd = new Date(Date.UTC(2026, 4 + month, 0, 23, 59, 59, 999));
    const pName = `2026-M${String(pNumber).padStart(2, "0")}`;

    await prisma.accountingPeriod.upsert({
      where: {
        organizationId_fiscalYearId_periodNumber: {
          organizationId,
          fiscalYearId: fiscalYearNext.id,
          periodNumber: pNumber,
        },
      },
      update: {},
      create: {
        organizationId,
        fiscalYearId: fiscalYearNext.id,
        periodName: pName,
        periodNumber: pNumber,
        startDate: pStart,
        endDate: pEnd,
        status: "OPEN",
      },
    });
  }

  // Seed Default Bank Account linked to account 1012
  const bankAccId = accountMap.get("1012");
  if (bankAccId) {
    await prisma.bankAccount.upsert({
      where: { organizationId_accountNumber: { organizationId, accountNumber: "HDFC-001298457" } },
      update: {},
      create: {
        organizationId,
        accountId: bankAccId,
        bankName: "HDFC Bank",
        accountName: "ValGrow Holdings Primary Account",
        accountNumber: "HDFC-001298457",
        ifscCode: "HDFC0001234",
        accountType: "CURRENT",
        openingBalance: 500000.0,
      },
    });
  }

  return accountMap;
}
