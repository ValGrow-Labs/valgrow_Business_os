import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Searchable Product Picker for Purchase Orders — Backend E2E Tests", () => {
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

  // Product & Category IDs
  let catElectronicsId: string;
  let catFurnitureId: string;
  let prodLaptopId: string;
  let prodMouseId: string;
  let prodDeskId: string;
  let prodInactiveId: string;
  let prodOrgBId: string;

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
        email: { in: ["po.picker.user.a@test.dev", "po.picker.user.b@test.dev"] },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: { in: ["po-picker-org-a", "po-picker-org-b"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "po.picker.user.a@test.dev",
        password: "Password123!",
        firstName: "POPicker",
        lastName: "UserA",
        organizationName: "PO Picker Org A",
        organizationSlug: "po-picker-org-a",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "po.picker.user.b@test.dev",
        password: "Password123!",
        firstName: "POPicker",
        lastName: "UserB",
        organizationName: "PO Picker Org B",
        organizationSlug: "po-picker-org-b",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;

    // Create Categories in Org A
    const cat1 = await request(app.getHttpServer())
      .post("/categories")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Electronics", slug: "cat-electronics" })
      .expect(201);
    catElectronicsId = cat1.body.id;

    const cat2 = await request(app.getHttpServer())
      .post("/categories")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Office Furniture", slug: "cat-furniture" })
      .expect(201);
    catFurnitureId = cat2.body.id;

    // Create Products in Org A
    // 1. Laptop (Electronics, cost: 45000, SKU: LAP-PRO-01)
    const p1 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        name: "Pro Gaming Laptop",
        slug: "pro-gaming-laptop",
        sku: "LAP-PRO-01",
        barcode: "890100010001",
        costPrice: 45000,
        categoryId: catElectronicsId,
        status: "ACTIVE",
      })
      .expect(201);
    prodLaptopId = p1.body.id;

    // 2. Mouse (Electronics, cost: 1500, SKU: MOU-WIR-02)
    const p2 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        name: "Wireless Ergonomic Mouse",
        slug: "wireless-ergonomic-mouse",
        sku: "MOU-WIR-02",
        barcode: "890100010002",
        costPrice: 1500,
        categoryId: catElectronicsId,
        status: "ACTIVE",
      })
      .expect(201);
    prodMouseId = p2.body.id;

    // 3. Desk (Furniture, cost: 8000, SKU: DSK-ADJ-03)
    const p3 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        name: "Standing Adjustable Desk",
        slug: "standing-adjustable-desk",
        sku: "DSK-ADJ-03",
        costPrice: 8000,
        categoryId: catFurnitureId,
        status: "ACTIVE",
      })
      .expect(201);
    prodDeskId = p3.body.id;

    // 4. Inactive Product in Org A
    const p4 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({
        name: "Archived Keyboard",
        slug: "archived-keyboard",
        sku: "KB-OLD-04",
        costPrice: 500,
        categoryId: catElectronicsId,
        status: "ARCHIVED",
      })
      .expect(201);
    prodInactiveId = p4.body.id;

    // 5. Product in Org B (for multi-tenant isolation testing)
    const p5 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userBCookie)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        name: "Tenant B Secret Server",
        slug: "tenant-b-secret-server",
        sku: "SRV-SEC-99",
        costPrice: 99000,
        status: "ACTIVE",
      })
      .expect(201);
    prodOrgBId = p5.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ["po.picker.user.a@test.dev", "po.picker.user.b@test.dev"] },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: { in: ["po-picker-org-a", "po-picker-org-b"] },
      },
    });
    await app.close();
  });

  describe("1. Search by Product Name (case-insensitive)", () => {
    it("should find products matching 'gaming' case-insensitively", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=gaming")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(prodLaptopId);
      expect(res.body.data[0].name).toBe("Pro Gaming Laptop");
    });

    it("should find products matching uppercase 'MOUSE'", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=MOUSE")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(prodMouseId);
      expect(res.body.data[0].name).toBe("Wireless Ergonomic Mouse");
    });
  });

  describe("2. Search by SKU and Barcode", () => {
    it("should find product by SKU 'LAP-PRO-01'", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=LAP-PRO-01")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].sku).toBe("LAP-PRO-01");
    });

    it("should find product by partial SKU 'mou-wir'", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=mou-wir")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(prodMouseId);
    });

    it("should find product by barcode '890100010001'", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=890100010001")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(prodLaptopId);
    });
  });

  describe("3. Category Filtering", () => {
    it("should return only products belonging to Electronics category", async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?categoryId=${catElectronicsId}&status=ACTIVE`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(2);
      const names = res.body.data.map((p: any) => p.name);
      expect(names).toContain("Pro Gaming Laptop");
      expect(names).toContain("Wireless Ergonomic Mouse");
      expect(names).not.toContain("Standing Adjustable Desk");
    });

    it("should return only products belonging to Furniture category", async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?categoryId=${catFurnitureId}&status=ACTIVE`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Standing Adjustable Desk");
    });

    it("should combine search with category filter", async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?categoryId=${catElectronicsId}&search=Desk`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  describe("4. Pagination and Page Limits", () => {
    it("should paginate results correctly with limit=2", async () => {
      // Page 1
      const page1 = await request(app.getHttpServer())
        .get("/products?status=ACTIVE&page=1&limit=2&sortBy=name&sortOrder=asc")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(page1.body.data.length).toBe(2);
      expect(page1.body.meta.page).toBe(1);
      expect(page1.body.meta.limit).toBe(2);
      expect(page1.body.meta.total).toBe(3);
      expect(page1.body.meta.totalPages).toBe(2);

      // Page 2
      const page2 = await request(app.getHttpServer())
        .get("/products?status=ACTIVE&page=2&limit=2&sortBy=name&sortOrder=asc")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(page2.body.data.length).toBe(1);
      expect(page2.body.meta.page).toBe(2);
      expect(page2.body.data[0].id).not.toBe(page1.body.data[0].id);
      expect(page2.body.data[0].id).not.toBe(page1.body.data[1].id);
    });

    it("should respect max page limit cap of 100", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?limit=500")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.meta.limit).toBe(100);
    });
  });

  describe("5. No Results for Unmatched Search", () => {
    it("should return empty array and total=0 for unmatched search query", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=nonexistent_xyz_term_9999")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);
    });
  });

  describe("6. Organization Isolation (Multi-Tenancy)", () => {
    it("🔒 Org A cannot see Org B's product in search or listing", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?search=Secret")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });

    it("🔒 Org B sees only its own product", async () => {
      const res = await request(app.getHttpServer())
        .get("/products")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(prodOrgBId);
      expect(res.body.data[0].name).toBe("Tenant B Secret Server");
    });
  });

  describe("7. Inactive / Deleted Product Handling", () => {
    it("should filter out archived/inactive products when status=ACTIVE", async () => {
      const res = await request(app.getHttpServer())
        .get("/products?status=ACTIVE")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      const ids = res.body.data.map((p: any) => p.id);
      expect(ids).not.toContain(prodInactiveId);
      expect(ids).toContain(prodLaptopId);
    });

    it("should exclude soft-deleted products from all queries", async () => {
      // Soft-delete the mouse
      await request(app.getHttpServer())
        .delete(`/products/${prodMouseId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      // Verify it cannot be retrieved via search
      const res = await request(app.getHttpServer())
        .get("/products?search=Mouse")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  describe("8. Existing Product Listing Compatibility & Purchasing Fields", () => {
    it("should return costPrice and include relations (category, unit, stockLevels)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/products?search=Gaming`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      const product = res.body.data[0];
      expect(Number(product.costPrice)).toBe(45000);
      expect(product.category).toBeDefined();
      expect(product.category.name).toBe("Electronics");
      expect(Array.isArray(product.stockLevels)).toBe(true);
    });
  });
});
