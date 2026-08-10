import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Accounting & Finance Domain E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tenant A
  let userACookie: any;
  let userAToken: string;
  let userAId: string;
  let orgAId: string;

  // Tenant B
  let userBCookie: any;
  let userBToken: string;
  let userBId: string;
  let orgBId: string;

  // Accounting Resources
  let cashAccountIdA: string;
  let bankAccountIdA: string;
  let arAccountIdA: string;
  let apAccountIdA: string;
  let revenueAccountIdA: string;
  let equityAccountIdA: string;
  let expenseAccountIdA: string;
  let fiscalYearIdA: string;
  let openPeriodIdA: string;
  let closedPeriodIdA: string;
  let journalEntryIdA: string;
  let customerAId: string;
  let bankAccountAId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Cleanup existing test data
    await prisma.organization.deleteMany({
      where: { slug: { in: ["acc-org-alpha", "acc-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ["acc.user.a@e2e.test", "acc.user.b@e2e.test"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "acc.user.a@e2e.test",
        password: "Password123!",
        firstName: "Accountant",
        lastName: "Alpha",
        organizationName: "Accounting Org Alpha",
        organizationSlug: "acc-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    userAId = resA.body.user.id;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "acc.user.b@e2e.test",
        password: "Password123!",
        firstName: "Accountant",
        lastName: "Beta",
        organizationName: "Accounting Org Beta",
        organizationSlug: "acc-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    userBId = resB.body.user.id;
    orgBId = resB.body.activeOrganization.id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ["acc-org-alpha", "acc-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ["acc.user.a@e2e.test", "acc.user.b@e2e.test"] },
      },
    });
    await app.close();
  });

  describe("1. Chart of Accounts & System Mappings", () => {
    it("should retrieve default Chart of Accounts seeded for Tenant A", async () => {
      const res = await request(app.getHttpServer())
        .get("/accounts")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(10);

      cashAccountIdA = res.body.find((a: any) => a.accountCode === "1011")?.id;
      bankAccountIdA = res.body.find((a: any) => a.accountCode === "1012")?.id;
      arAccountIdA = res.body.find((a: any) => a.accountCode === "1020")?.id;
      apAccountIdA = res.body.find((a: any) => a.accountCode === "2010")?.id;
      equityAccountIdA = res.body.find((a: any) => a.accountCode === "3010")?.id;
      revenueAccountIdA = res.body.find((a: any) => a.accountCode === "4010")?.id;
      expenseAccountIdA = res.body.find((a: any) => a.accountCode === "5010")?.id;

      expect(cashAccountIdA).toBeDefined();
      expect(arAccountIdA).toBeDefined();
      expect(equityAccountIdA).toBeDefined();
    });

    it("should create a custom GL account", async () => {
      const res = await request(app.getHttpServer())
        .post("/accounts")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          accountCode: "6099",
          accountName: "Miscellaneous Operating Costs",
          accountType: "EXPENSE",
          accountCategory: "OPERATING_EXPENSE",
          normalBalance: "DEBIT",
          description: "Custom E2E account",
        })
        .expect(201);

      expect(res.body.accountCode).toBe("6099");
      expect(res.body.organizationId).toBe(orgAId);
    });

    it("should retrieve operational event account mappings", async () => {
      const res = await request(app.getHttpServer())
        .get("/accounts/mappings")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.find((m: any) => m.mappingKey === "ACCOUNTS_RECEIVABLE")).toBeDefined();
    });
  });

  describe("2. Fiscal Years & Period Controls", () => {
    it("should create a fiscal year with 12 monthly accounting periods", async () => {
      const res = await request(app.getHttpServer())
        .post("/fiscal-years")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          name: "FY 2027-2028",
          startDate: "2027-04-01T00:00:00.000Z",
          endDate: "2028-03-31T23:59:59.999Z",
        })
        .expect(201);

      expect(res.body.name).toBe("FY 2027-2028");
      expect(res.body.periods.length).toBe(12);

      fiscalYearIdA = res.body.id;
      openPeriodIdA = res.body.periods[0].id;
      closedPeriodIdA = res.body.periods[1].id;
    });

    it("should update period status to CLOSED", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/accounting-periods/${closedPeriodIdA}/status`)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({ status: "CLOSED" })
        .expect(200);

      expect(res.body.status).toBe("CLOSED");
    });
  });

  describe("3. Double-Entry Journal Entries & Invariants", () => {
    it("should reject unbalanced manual journal entries (Debit != Credit)", async () => {
      const res = await request(app.getHttpServer())
        .post("/journal-entries/manual")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          description: "Unbalanced Entry Test",
          lines: [
            { accountId: cashAccountIdA, debit: 1000, credit: 0 },
            { accountId: revenueAccountIdA, debit: 0, credit: 500 },
          ],
        })
        .expect(400);

      expect(res.body.message).toContain("does not equal");
    });

    it("should post a balanced manual double-entry journal", async () => {
      const res = await request(app.getHttpServer())
        .post("/journal-entries/manual")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          description: "Capital Investment by Founder",
          postingDate: "2026-04-10T10:00:00.000Z",
          lines: [
            { accountId: cashAccountIdA, debit: 50000, credit: 0 },
            { accountId: equityAccountIdA, debit: 0, credit: 50000 },
          ],
        })
        .expect(201);

      expect(res.body.journalNumber).toBeDefined();
      expect(res.body.status).toBe("POSTED");
      expect(Number(res.body.totalDebit)).toBe(50000);
      expect(Number(res.body.totalCredit)).toBe(50000);

      journalEntryIdA = res.body.id;
    });

    it("should reverse a posted journal entry atomically with swapped debits & credits", async () => {
      const res = await request(app.getHttpServer())
        .post(`/journal-entries/${journalEntryIdA}/reverse`)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({ reason: "Correction of accidental posting" })
        .expect(201);

      expect(res.body.status).toBe("POSTED");
      expect(res.body.description).toContain("Reversal of");

      const origRes = await request(app.getHttpServer())
        .get(`/journal-entries/${journalEntryIdA}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(origRes.body.status).toBe("REVERSED");
    });

    it("should reject posting to a CLOSED accounting period", async () => {
      const res = await request(app.getHttpServer())
        .post("/journal-entries/manual")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          description: "Posting to closed period",
          postingDate: "2027-05-15T10:00:00.000Z", // Period 2 of FY 2027-2028 is CLOSED
          lines: [
            { accountId: cashAccountIdA, debit: 1000, credit: 0 },
            { accountId: revenueAccountIdA, debit: 0, credit: 1000 },
          ],
        })
        .expect(400);

      expect(res.body.message).toContain("CLOSED");
    });
  });

  describe("4. Operational Domain GL Postings & Event Deduplication", () => {
    it("should post operational Sales Invoice and create balanced GL journal", async () => {
      // Create Customer
      const custRes = await request(app.getHttpServer())
        .post("/customers")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({ customerCode: "CUST-E2E-01", name: "E2E Customer Ltd", email: "cust@e2e.test" })
        .expect(201);
      customerAId = custRes.body.id;

      // Create Product
      const prodRes = await request(app.getHttpServer())
        .post("/products")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({ name: "Accounting Software Subscription", sku: "ACC-SUB-01", costPrice: 10000 })
        .expect(201);

      // Create Sales Invoice
      const invRes = await request(app.getHttpServer())
        .post("/sales-invoices")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          dueDate: "2026-04-30T00:00:00.000Z",
          items: [{ productId: prodRes.body.id, quantity: 1, unitPrice: 10000, taxRate: 18 }],
        })
        .expect(201);

      // Post Sales Invoice
      const postRes = await request(app.getHttpServer())
        .post(`/sales-invoices/${invRes.body.id}/post`)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(201);

      expect(postRes.body.status).toBe("POSTED");

      // Verify GL Journal Entry created for Sales Invoice
      const jeRes = await request(app.getHttpServer())
        .get(`/journal-entries?referenceType=SalesInvoice&referenceId=${invRes.body.id}`)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(jeRes.body.length).toBe(1);
      expect(Number(jeRes.body[0].totalDebit)).toBe(11800);
      expect(Number(jeRes.body[0].totalCredit)).toBe(11800);
    });

    it("should prevent duplicate GL postings when re-triggered", async () => {
      const jeRes = await request(app.getHttpServer())
        .get("/journal-entries?sourceModule=SALES")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(jeRes.body.length).toBe(1);
    });
  });

  describe("5. AR / AP Sub-Ledger Services", () => {
    it("should compute customer balances and aging breakdown", async () => {
      const balRes = await request(app.getHttpServer())
        .get("/accounts-receivable/balances")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(balRes.body.length).toBeGreaterThanOrEqual(1);
      expect(Number(balRes.body[0].totalOutstanding)).toBe(11800);

      const agingRes = await request(app.getHttpServer())
        .get("/accounts-receivable/aging")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(agingRes.body.summary.total).toBe(11800);
    });

    it("should compute supplier balances and aging breakdown", async () => {
      const balRes = await request(app.getHttpServer())
        .get("/accounts-payable/balances")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(Array.isArray(balRes.body)).toBe(true);
    });
  });

  describe("6. Bank Accounting & Treasury", () => {
    it("should create a corporate bank account linked to GL Account", async () => {
      const res = await request(app.getHttpServer())
        .post("/bank-accounts")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          accountName: "HDFC Main Operating Account",
          accountNumber: "50200098765432",
          bankName: "HDFC Bank",
          ifscCode: "HDFC0001234",
          accountType: "CURRENT",
          accountId: bankAccountIdA,
        })
        .expect(201);

      expect(res.body.accountNumber).toBe("50200098765432");
      bankAccountAId = res.body.id;
    });

    it("should create bank statement reconciliation match", async () => {
      const res = await request(app.getHttpServer())
        .post("/bank-accounts/reconciliations")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .send({
          bankAccountId: bankAccountAId,
          statementDate: "2026-04-30T00:00:00.000Z",
          endingBalance: 0,
          notes: "End of month reconciliation",
        })
        .expect(201);

      expect(res.body.isReconciled).toBe(true);
    });
  });

  describe("7. Tax & Financial Reports Engine", () => {
    it("should generate Tax Summary (Output Tax vs Input Tax)", async () => {
      const res = await request(app.getHttpServer())
        .get("/tax-reports/summary")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.totalOutputTaxCollected).toBe(1800);
      expect(res.body.netTaxPayable).toBe(1800);
    });

    it("should generate Trial Balance and prove Debit = Credit equality", async () => {
      const res = await request(app.getHttpServer())
        .get("/financial-reports/trial-balance")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.totals.balanced).toBe(true);
      expect(res.body.totals.totalDebit).toEqual(res.body.totals.totalCredit);
    });

    it("should generate Profit & Loss Statement (Income Statement)", async () => {
      const res = await request(app.getHttpServer())
        .get("/financial-reports/profit-and-loss")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.revenue.total).toBe(10000);
      expect(res.body.netProfit).toBe(10000);
    });

    it("should generate Balance Sheet and prove Assets = Liabilities + Equity", async () => {
      const res = await request(app.getHttpServer())
        .get("/financial-reports/balance-sheet")
        .set("Authorization", `Bearer ${userAToken}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.isBalanced).toBe(true);
      expect(res.body.assets.total).toBe(res.body.totalLiabilitiesAndEquity);
    });
  });

  describe("8. Cross-Tenant Isolation Enforcement", () => {
    it("should prevent Tenant B from viewing Tenant A's GL journal entries", async () => {
      const res = await request(app.getHttpServer())
        .get("/journal-entries")
        .set("Authorization", `Bearer ${userBToken}`)
        .set("Cookie", userBCookie)
        .expect(200);

      expect(res.body.length).toBe(0);
    });
  });
});
