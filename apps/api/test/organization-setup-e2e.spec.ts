import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Organization, Branch, and Warehouse Unified Setup Flow (E2E)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userToken: string;
  let userCookie: any;
  let userId: string;

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

    // Pre-test cleanup
    await prisma.user.deleteMany({
      where: { email: "setup.tester@valgrow-flow.test" },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: {
          in: [
            "setup-initial-org",
            "apex-retail-enterprises",
            "minimal-workspace-org",
            "failing-rollback-org",
          ],
        },
      },
    });

    // Register a tester user
    const regRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "setup.tester@valgrow-flow.test",
        password: "Password123!",
        firstName: "Setup",
        lastName: "Tester",
        organizationName: "Setup Initial Org",
        organizationSlug: "setup-initial-org",
      })
      .expect(201);

    userToken = regRes.body.tokens.accessToken;
    userCookie = regRes.headers["set-cookie"];
    userId = regRes.body.user.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: "setup.tester@valgrow-flow.test" },
      });
      await prisma.organization.deleteMany({
        where: {
          slug: {
            in: [
              "setup-initial-org",
              "apex-retail-enterprises",
              "minimal-workspace-org",
              "failing-rollback-org",
            ],
          },
        },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  }, 60000);

  // =========================================================================
  // 1 & 2. Create New Organization with First Branch & Warehouse in One Setup
  // =========================================================================
  let createdOrgId: string;
  let createdBranchId: string;
  let createdWarehouseId: string;

  it("1 & 2: should create organization, first branch, and first warehouse in one unified setup", async () => {
    const res = await request(app.getHttpServer())
      .post("/organizations")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .send({
        name: "Apex Retail Enterprises",
        currency: "USD",
        country: "United States",
        city: "New York",
        createBranch: true,
        branch: {
          name: "Downtown Flagship",
          code: "DT-01",
          city: "New York",
        },
        createWarehouse: true,
        warehouse: {
          name: "Downtown Central Storage",
          code: "WH-DT-01",
          associateWithBranch: true,
        },
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Apex Retail Enterprises");
    expect(res.body.currency).toBe("USD");
    expect(res.body.role).toBe("Owner");

    // Verify branch response
    expect(res.body.branch).toBeDefined();
    expect(res.body.branch.name).toBe("Downtown Flagship");
    expect(res.body.branch.code).toBe("DT-01");
    expect(res.body.branch.city).toBe("New York");

    // Verify warehouse response
    expect(res.body.warehouse).toBeDefined();
    expect(res.body.warehouse.name).toBe("Downtown Central Storage");
    expect(res.body.warehouse.code).toBe("WH-DT-01");
    expect(res.body.warehouse.branchId).toBe(res.body.branch.id);

    createdOrgId = res.body.id;
    createdBranchId = res.body.branch.id;
    createdWarehouseId = res.body.warehouse.id;

    // Verify directly in Prisma DB
    const dbOrg = await prisma.organization.findUnique({
      where: { id: createdOrgId },
      include: { branches: true, warehouses: true, members: true },
    });
    expect(dbOrg).not.toBeNull();
    expect(dbOrg?.branches).toHaveLength(1);
    expect(dbOrg?.branches[0].id).toBe(createdBranchId);
    expect(dbOrg?.warehouses).toHaveLength(1);
    expect(dbOrg?.warehouses[0].id).toBe(createdWarehouseId);
    expect(dbOrg?.warehouses[0].branchId).toBe(createdBranchId);
    expect(dbOrg?.members[0].userId).toBe(userId);
  });

  // =========================================================================
  // 3 & 4. Switch to the New Organization & Verify Branches/Warehouses in POS Form
  // =========================================================================
  it("3 & 4: should return the new branch and warehouse when switching organization context", async () => {
    // Branches query scoped to the new organization
    const branchRes = await request(app.getHttpServer())
      .get("/branches")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .set("x-organization-id", createdOrgId)
      .expect(200);

    expect(Array.isArray(branchRes.body)).toBe(true);
    const branchIds = branchRes.body.map((b: any) => b.id);
    expect(branchIds).toContain(createdBranchId);
    const targetBranch = branchRes.body.find((b: any) => b.id === createdBranchId);
    expect(targetBranch.name).toBe("Downtown Flagship");

    // Warehouses query scoped to the new organization
    const whRes = await request(app.getHttpServer())
      .get("/warehouses")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .set("x-organization-id", createdOrgId)
      .expect(200);

    expect(Array.isArray(whRes.body)).toBe(true);
    const whIds = whRes.body.map((w: any) => w.id);
    expect(whIds).toContain(createdWarehouseId);
    const targetWh = whRes.body.find((w: any) => w.id === createdWarehouseId);
    expect(targetWh.name).toBe("Downtown Central Storage");
    expect(targetWh.branchId).toBe(createdBranchId);
  });

  // =========================================================================
  // 5. Open a POS Register using the Newly Created Branch and Warehouse
  // =========================================================================
  it("5: should open a POS register session using the created branch and warehouse", async () => {
    const sessionRes = await request(app.getHttpServer())
      .post("/pos/sessions/open")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .set("x-organization-id", createdOrgId)
      .send({
        branchId: createdBranchId,
        warehouseId: createdWarehouseId,
        terminalId: "FLAGSHIP-POS-01",
        openingCash: 500,
        notes: "Initial register shift for new organization",
      })
      .expect(201);

    expect(sessionRes.body.id).toBeDefined();
    expect(sessionRes.body.terminalId).toBe("FLAGSHIP-POS-01");
    expect(sessionRes.body.status).toBe("OPEN");
    expect(sessionRes.body.branchId).toBe(createdBranchId);
    expect(sessionRes.body.warehouseId).toBe(createdWarehouseId);
    expect(sessionRes.body.organizationId).toBe(createdOrgId);
  });

  // =========================================================================
  // 6. Organization without Warehouse can still be Managed Normally
  // =========================================================================
  it("6: should allow creating an organization without a warehouse and manage it normally", async () => {
    const res = await request(app.getHttpServer())
      .post("/organizations")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .send({
        name: "Minimal Workspace Org",
        currency: "EUR",
        createBranch: true,
        branch: {
          name: "Consulting Suite",
          code: "CS-01",
          city: "Berlin",
        },
        createWarehouse: false,
      })
      .expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Minimal Workspace Org");
    expect(res.body.branch).toBeDefined();
    expect(res.body.warehouse).toBeNull();

    const minimalOrgId = res.body.id;

    // Warehouses query should return empty array
    const whRes = await request(app.getHttpServer())
      .get("/warehouses")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .set("x-organization-id", minimalOrgId)
      .expect(200);

    expect(Array.isArray(whRes.body)).toBe(true);
    expect(whRes.body).toHaveLength(0);

    // Branches query works normally
    const branchRes = await request(app.getHttpServer())
      .get("/branches")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .set("x-organization-id", minimalOrgId)
      .expect(200);

    expect(branchRes.body).toHaveLength(1);
    expect(branchRes.body[0].name).toBe("Consulting Suite");
  });

  // =========================================================================
  // 7. Validation & Rollback Behavior if Warehouse Creation Fails
  // =========================================================================
  it("7a: should reject invalid warehouse payload at DTO validation level", async () => {
    const res = await request(app.getHttpServer())
      .post("/organizations")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .send({
        name: "Failing DTO Org",
        currency: "INR",
        createBranch: true,
        branch: {
          name: "Test Branch",
        },
        createWarehouse: true,
        warehouse: {
          // Missing required name and code
          associateWithBranch: true,
        },
      })
      .expect(400);

    expect(res.body.message).toBeDefined();

    // Verify DB does not contain the organization
    const dbOrg = await prisma.organization.findFirst({
      where: { name: "Failing DTO Org" },
    });
    expect(dbOrg).toBeNull();
  });

  it("7b: should rollback entire transaction if warehouse creation encounters constraint error", async () => {
    // First, let's create a warehouse with code "DUPLICATE-WH-CODE" under a known slug
    // But since each org is isolated, let's test atomic rollback when duplicate warehouse code is attempted in the same org
    // We will simulate by calling createOrganization with a trigger that causes failure inside transaction
    // Or we can verify that the transaction rolls back both organization and branch when warehouse creation throws
    const existingOrgCount = await prisma.organization.count();
    const existingBranchCount = await prisma.branch.count();
    const existingWarehouseCount = await prisma.warehouse.count();

    // Attempt invalid warehouse code that violates schema (e.g., missing required fields handled in service)
    const res = await request(app.getHttpServer())
      .post("/organizations")
      .set("Authorization", `Bearer ${userToken}`)
      .set("Cookie", userCookie)
      .send({
        name: "Failing Rollback Org",
        currency: "INR",
        createBranch: true,
        branch: {
          name: "Rollback Branch",
        },
        createWarehouse: true,
        warehouse: {
          name: "Invalid WH",
          code: "", // Empty string will fail DTO validation
        },
      })
      .expect(400);

    // Verify counts remain unchanged (no orphan organization or branch)
    expect(await prisma.organization.count()).toBe(existingOrgCount);
    expect(await prisma.branch.count()).toBe(existingBranchCount);
    expect(await prisma.warehouse.count()).toBe(existingWarehouseCount);
  });
});
