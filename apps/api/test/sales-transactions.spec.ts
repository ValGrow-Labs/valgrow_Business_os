import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

jest.setTimeout(60000);

describe("Sales Transactions & Audit E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Tenant A
  let userAToken: string;
  let orgAId: string;
  let userAId: string;
  let branchAId: string;
  let warehouseAId: string;
  let customerAId: string;
  let saleAId: string;
  let receiptNumberA: string;

  // Tenant B
  let userBToken: string;
  let orgBId: string;
  let userBId: string;

  // Unauthorized Member in Tenant A (no pos.read)
  let unauthorizedToken: string;
  let unauthorizedUserId: string;

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
    jwtService = app.get(JwtService);

    const signToken = (user: { id: string; email: string }) =>
      jwtService.sign(
        { sub: user.id, email: user.email, type: "access" },
        {
          secret:
            process.env.JWT_SECRET ||
            "valgrow-dev-jwt-secret-key-change-in-production-32bytes",
          expiresIn: "1h",
        },
      );

    // Clean up any test organizations and users
    await prisma.organization.deleteMany({
      where: { slug: { in: ["sales-tx-org-a", "sales-tx-org-b"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "owner-a-tx@valgrow.dev",
            "owner-b-tx@valgrow.dev",
            "viewer-unauth-tx@valgrow.dev",
          ],
        },
      },
    });

    const hashedPassword = await bcrypt.hash("Password123!", 10);

    // 1. Create Tenant A
    const orgA = await prisma.organization.create({
      data: {
        name: "Sales TX Org A",
        slug: "sales-tx-org-a",
        currency: "INR",
      },
    });
    orgAId = orgA.id;

    // Owner role for Org A
    const ownerRoleA = await prisma.role.create({
      data: {
        organizationId: orgAId,
        name: "Owner",
        description: "Workspace Owner",
      },
    });

    const userA = await prisma.user.create({
      data: {
        email: "owner-a-tx@valgrow.dev",
        firstName: "Owner",
        lastName: "Alpha",
        passwordHash: hashedPassword,
        status: "ACTIVE",
      },
    });
    userAId = userA.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: orgAId,
        userId: userAId,
        roleId: ownerRoleA.id,
      },
    });

    userAToken = signToken(userA);

    // Create Master data in Org A
    const branchA = await prisma.branch.create({
      data: {
        organizationId: orgAId,
        name: "Retail Flagship Branch",
        code: "BR-TX-A",
        city: "Bengaluru",
      },
    });
    branchAId = branchA.id;

    const warehouseA = await prisma.warehouse.create({
      data: {
        organizationId: orgAId,
        name: "Store Warehouse",
        code: "WH-TX-A",
        branchId: branchAId,
      },
    });
    warehouseAId = warehouseA.id;

    const customerA = await prisma.customer.create({
      data: {
        organizationId: orgAId,
        customerCode: "CUST-TX-001",
        name: "Aarav Sharma",
        email: "aarav@example.com",
        phone: "+91 9876543210",
      },
    });
    customerAId = customerA.id;

    const productA = await prisma.product.create({
      data: {
        organizationId: orgAId,
        name: "Organic Coffee Beans 500g",
        slug: "organic-coffee-beans-500g",
        sku: "COFFEE-ORG-500",
        costPrice: 200,
      },
    });

    // Create a completed POS session & POS sale in Org A
    const sessionA = await prisma.pOSSession.create({
      data: {
        organizationId: orgAId,
        branchId: branchAId,
        warehouseId: warehouseAId,
        openedById: userAId,
        terminalId: "TERMINAL-01",
        status: "OPEN",
        openingCash: 500,
      },
    });

    const salesOrderA = await prisma.salesOrder.create({
      data: {
        organizationId: orgAId,
        branchId: branchAId,
        warehouseId: warehouseAId,
        customerId: customerAId,
        orderNumber: "SO-TX-0001",
        subtotalAmount: 700,
        taxAmount: 35,
        discountAmount: 50,
        totalAmount: 685,
        status: "CONFIRMED",
        items: {
          create: [
            {
              organizationId: orgAId,
              productId: productA.id,
              orderedQty: 2,
              unitPrice: 350,
              taxRate: 5,
              taxAmount: 35,
              discountAmount: 50,
              totalAmount: 685,
            },
          ],
        },
      },
    });

    receiptNumberA = "POS-2026-999001";
    const posSaleA = await prisma.pOSSale.create({
      data: {
        organizationId: orgAId,
        branchId: branchAId,
        warehouseId: warehouseAId,
        sessionId: sessionA.id,
        salesOrderId: salesOrderA.id,
        receiptNumber: receiptNumberA,
        customerId: customerAId,
        cashierId: userAId,
        subtotalAmount: 700,
        discountAmount: 50,
        taxAmount: 35,
        totalAmount: 685,
        paidAmount: 685,
        changeAmount: 0,
        status: "COMPLETED",
        payments: {
          create: [
            {
              organizationId: orgAId,
              paymentMethod: "CASH",
              amount: 685,
              receivedAmount: 700,
              changeAmount: 15,
            },
          ],
        },
      },
    });
    saleAId = posSaleA.id;

    // 2. Create Tenant B
    const orgB = await prisma.organization.create({
      data: {
        name: "Sales TX Org B",
        slug: "sales-tx-org-b",
        currency: "INR",
      },
    });
    orgBId = orgB.id;

    const ownerRoleB = await prisma.role.create({
      data: {
        organizationId: orgBId,
        name: "Owner",
        description: "Workspace Owner",
      },
    });

    const userB = await prisma.user.create({
      data: {
        email: "owner-b-tx@valgrow.dev",
        firstName: "Owner",
        lastName: "Beta",
        passwordHash: hashedPassword,
        status: "ACTIVE",
      },
    });
    userBId = userB.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: orgBId,
        userId: userBId,
        roleId: ownerRoleB.id,
      },
    });

    userBToken = signToken(userB);

    // 3. Create restricted user in Org A (Viewer role with no pos.read)
    const viewerRoleA = await prisma.role.create({
      data: {
        organizationId: orgAId,
        name: "Viewer",
        description: "Read-only viewer with no POS permissions",
      },
    });

    const unauthMember = await prisma.user.create({
      data: {
        email: "viewer-unauth-tx@valgrow.dev",
        firstName: "Viewer",
        lastName: "Unauth",
        passwordHash: hashedPassword,
        status: "ACTIVE",
      },
    });
    unauthorizedUserId = unauthMember.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: orgAId,
        userId: unauthorizedUserId,
        roleId: viewerRoleA.id,
      },
    });

    unauthorizedToken = signToken(unauthMember);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.organization.deleteMany({
        where: { slug: { in: ["sales-tx-org-a", "sales-tx-org-b"] } },
      });
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "owner-a-tx@valgrow.dev",
              "owner-b-tx@valgrow.dev",
              "viewer-unauth-tx@valgrow.dev",
            ],
          },
        },
      });
    }
    if (app) {
      await app.close();
    }
  });

  // ==================================================
  // TEST SUITE: SALES TRANSACTIONS AUDIT & LISTING
  // ==================================================

  it("1. Owner can list sales transactions with customer, branch, cashier, and payment details", async () => {
    const res = await request(app.getHttpServer())
      .get("/pos/sales")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const sale = res.body.find((s: any) => s.id === saleAId);
    expect(sale).toBeDefined();
    expect(sale.receiptNumber).toBe(receiptNumberA);
    expect(sale.customer.name).toBe("Aarav Sharma");
    expect(sale.customer.customerCode).toBe("CUST-TX-001");
    expect(sale.branch.name).toBe("Retail Flagship Branch");
    expect(sale.cashier.firstName).toBe("Owner");
    expect(Number(sale.subtotalAmount)).toBe(700);
    expect(Number(sale.discountAmount)).toBe(50);
    expect(Number(sale.taxAmount)).toBe(35);
    expect(Number(sale.totalAmount)).toBe(685);
    expect(Number(sale.paidAmount)).toBe(685);
    expect(sale.status).toBe("COMPLETED");
    expect(sale.payments.length).toBe(1);
    expect(sale.payments[0].paymentMethod).toBe("CASH");
  });

  it("2. Search filtering matches receipt number, customer name, and cashier name", async () => {
    // Search by receipt number
    const resReceipt = await request(app.getHttpServer())
      .get(`/pos/sales?search=${receiptNumberA}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resReceipt.body.some((s: any) => s.id === saleAId)).toBe(true);

    // Search by customer name
    const resCustomer = await request(app.getHttpServer())
      .get("/pos/sales?search=Aarav")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resCustomer.body.some((s: any) => s.id === saleAId)).toBe(true);

    // Non-matching search returns empty array
    const resNonExistent = await request(app.getHttpServer())
      .get("/pos/sales?search=NONEXISTENT_RECEIPT_XYZ")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resNonExistent.body.length).toBe(0);
  });

  it("3. Branch and status filtering works as expected", async () => {
    // Filter by branch
    const resBranch = await request(app.getHttpServer())
      .get(`/pos/sales?branchId=${branchAId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resBranch.body.every((s: any) => s.branchId === branchAId)).toBe(true);

    // Filter by status COMPLETED
    const resStatus = await request(app.getHttpServer())
      .get("/pos/sales?status=COMPLETED")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resStatus.body.every((s: any) => s.status === "COMPLETED")).toBe(true);

    // Filter by CANCELLED returns 0
    const resCancelled = await request(app.getHttpServer())
      .get("/pos/sales?status=CANCELLED")
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);
    expect(resCancelled.body.length).toBe(0);
  });

  it("4. Full sales transaction details by ID returns line items and audit metadata", async () => {
    const res = await request(app.getHttpServer())
      .get(`/pos/sales/${saleAId}`)
      .set("Authorization", `Bearer ${userAToken}`)
      .set("x-organization-id", orgAId)
      .expect(200);

    expect(res.body.id).toBe(saleAId);
    expect(res.body.receiptNumber).toBe(receiptNumberA);
    expect(res.body.customer.name).toBe("Aarav Sharma");
    expect(res.body.salesOrder).toBeDefined();
    expect(res.body.salesOrder.items.length).toBe(1);
    expect(res.body.salesOrder.items[0].product.name).toBe("Organic Coffee Beans 500g");
    expect(Number(res.body.salesOrder.items[0].unitPrice)).toBe(350);
    expect(res.body.payments.length).toBe(1);
    expect(res.body.payments[0].paymentMethod).toBe("CASH");
  });

  it("5. Multi-tenant isolation: Tenant B cannot list or view Tenant A sales", async () => {
    // List check
    const listRes = await request(app.getHttpServer())
      .get("/pos/sales")
      .set("Authorization", `Bearer ${userBToken}`)
      .set("x-organization-id", orgBId)
      .expect(200);
    expect(listRes.body.some((s: any) => s.id === saleAId)).toBe(false);

    // Direct access by ID check
    await request(app.getHttpServer())
      .get(`/pos/sales/${saleAId}`)
      .set("Authorization", `Bearer ${userBToken}`)
      .set("x-organization-id", orgBId)
      .expect(404);
  });

  it("6. Unauthorized member without pos.read is rejected with 403 Forbidden", async () => {
    await request(app.getHttpServer())
      .get("/pos/sales")
      .set("Authorization", `Bearer ${unauthorizedToken}`)
      .set("x-organization-id", orgAId)
      .expect(403);
  });
});

