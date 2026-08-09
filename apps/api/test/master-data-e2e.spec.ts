import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Master Data Domain & Security E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tenant A
  let userACookie: any;
  let userAToken: string;
  let orgAId: string;

  // Tenant B
  let userBCookie: any;
  let userBToken: string;
  let orgBId: string;

  // Master Data IDs
  let catAId: string;
  let catBId: string;
  let brandAId: string;
  let brandBId: string;
  let unitAId: string;
  let unitBId: string;
  let taxAId: string;
  let taxBId: string;
  let prodAId: string;
  let prodBId: string;
  let variantAId: string;

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

    // Clean up test orgs if left over
    await prisma.user.deleteMany({
      where: {
        email: { in: ["md.user.a@md-e2e.test", "md.user.b@md-e2e.test"] },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: { in: ["md-org-alpha", "md-org-beta"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "md.user.a@md-e2e.test",
        password: "Password123!",
        firstName: "MasterData",
        lastName: "UserA",
        organizationName: "Master Data Alpha",
        organizationSlug: "md-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "md.user.b@md-e2e.test",
        password: "Password123!",
        firstName: "MasterData",
        lastName: "UserB",
        organizationName: "Master Data Beta",
        organizationSlug: "md-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: { in: ["md.user.a@md-e2e.test", "md.user.b@md-e2e.test"] },
        },
      });
      await prisma.organization.deleteMany({
        where: { slug: { in: ["md-org-alpha", "md-org-beta"] } },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  }, 60000);

  describe("1. Taxes, Units, Brands, Categories Setup", () => {
    it("should create Tax A in Org A and Tax B in Org B", async () => {
      const resA = await request(app.getHttpServer())
        .post("/taxes")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "VAT 20%", code: "VAT20", rate: 20.0, type: "VAT" })
        .expect(201);
      taxAId = resA.body.id;

      const resB = await request(app.getHttpServer())
        .post("/taxes")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "VAT 10%", code: "VAT10", rate: 10.0, type: "VAT" })
        .expect(201);
      taxBId = resB.body.id;
    });

    it("should create Unit A in Org A and Unit B in Org B", async () => {
      const resA = await request(app.getHttpServer())
        .post("/units")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Pack", code: "PAK", allowDecimals: false })
        .expect(201);
      unitAId = resA.body.id;

      const resB = await request(app.getHttpServer())
        .post("/units")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Gallon", code: "GAL", allowDecimals: true })
        .expect(201);
      unitBId = resB.body.id;
    });

    it("should create Brand A in Org A and Brand B in Org B", async () => {
      const resA = await request(app.getHttpServer())
        .post("/brands")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "AlphaTech", slug: "alphatech" })
        .expect(201);
      brandAId = resA.body.id;

      const resB = await request(app.getHttpServer())
        .post("/brands")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "BetaSoft", slug: "betasoft" })
        .expect(201);
      brandBId = resB.body.id;
    });

    it("should create Category A in Org A and Category B in Org B", async () => {
      const resA = await request(app.getHttpServer())
        .post("/categories")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Hardware", slug: "hardware" })
        .expect(201);
      catAId = resA.body.id;

      const resB = await request(app.getHttpServer())
        .post("/categories")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Software", slug: "software" })
        .expect(201);
      catBId = resB.body.id;
    });
  });

  describe("2. Products & Variants Creation", () => {
    it("should create Product A in Org A referencing Org A master data", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Alpha Tablet",
          sku: "ALPHA-TAB-01",
          barcode: "770000000001",
          categoryId: catAId,
          brandId: brandAId,
          unitId: unitAId,
          taxId: taxAId,
          costPrice: 250.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Alpha Tablet");
      expect(res.body.organizationId).toBe(orgAId);
      prodAId = res.body.id;
    });

    it("should create Product B in Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          name: "Beta Operating System",
          sku: "BETA-OS-01",
          barcode: "880000000001",
          categoryId: catBId,
          brandId: brandBId,
          unitId: unitBId,
          taxId: taxBId,
          costPrice: 50.0,
        })
        .expect(201);

      prodBId = res.body.id;
    });

    it("should create a variant for Product A in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${prodAId}/variants`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "128GB / Silver",
          sku: "ALPHA-TAB-128-SIL",
          barcode: "770000000002",
          attributes: { storage: "128GB", color: "Silver" },
        })
        .expect(201);

      expect(res.body.sku).toBe("ALPHA-TAB-128-SIL");
      variantAId = res.body.id;
    });
  });

  describe("3. Single Source of Truth Pricing API", () => {
    it("should add base retail price to Product A", async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${prodAId}/prices`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          tier: "RETAIL",
          price: 399.99,
          minQuantity: 1,
        })
        .expect(201);

      expect(res.body.price).toBe("399.99");
      expect(res.body.tier).toBe("RETAIL");
    });

    it("should add variant-specific price to Variant A", async () => {
      const res = await request(app.getHttpServer())
        .post(`/products/${prodAId}/prices`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          variantId: variantAId,
          tier: "RETAIL",
          price: 449.99,
          minQuantity: 1,
        })
        .expect(201);

      expect(res.body.variantId).toBe(variantAId);
      expect(res.body.price).toBe("449.99");
    });
  });

  describe("4. CRITICAL MULTI-TENANT ISOLATION TESTS", () => {
    it("🔒 Org A cannot create Product referencing Org B Category", async () => {
      await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Hacked Product",
          categoryId: catBId, // Belongs to Org B!
        })
        .expect(400);
    });

    it("🔒 Org A cannot create Product referencing Org B Brand", async () => {
      await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Hacked Product",
          brandId: brandBId, // Belongs to Org B!
        })
        .expect(400);
    });

    it("🔒 Org A cannot read Org B Product by ID", async () => {
      await request(app.getHttpServer())
        .get(`/products/${prodBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);
    });

    it("🔒 Org A cannot update Org B Product", async () => {
      await request(app.getHttpServer())
        .patch(`/products/${prodBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Tampered Name" })
        .expect(404);
    });

    it("🔒 Org A cannot delete Org B Product", async () => {
      await request(app.getHttpServer())
        .delete(`/products/${prodBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);
    });

    it("🔒 Org A cannot add price level to Org B Product", async () => {
      await request(app.getHttpServer())
        .post(`/products/${prodBId}/prices`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          tier: "RETAIL",
          price: 10.0,
        })
        .expect(404);
    });

    it("🔒 Reject ProductPrice referencing a variant belonging to a different product", async () => {
      await request(app.getHttpServer())
        .post(`/products/${prodBId}/prices`)
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          variantId: variantAId, // Belongs to Product A!
          tier: "RETAIL",
          price: 99.0,
        })
        .expect(400);
    });
  });

  describe("5. Pagination, Search & Soft Deletion", () => {
    it("should list products in Org A with pagination and search", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=Tablet&page=1&limit=10")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.total).toBe(1);
      expect(res.body.data[0].name).toBe("Alpha Tablet");
    });

    it("should soft delete Product A", async () => {
      await request(app.getHttpServer())
        .delete(`/products/${prodAId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      // Product A should now return 404
      await request(app.getHttpServer())
        .get(`/products/${prodAId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);
    });
  });
});
