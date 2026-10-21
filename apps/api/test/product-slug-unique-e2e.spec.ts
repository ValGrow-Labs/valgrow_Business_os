import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Product Unique Slug Generation & Concurrency Safety E2E", () => {
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

  const testUserAEmail = "slug.user.a@slug-e2e.test";
  const testUserBEmail = "slug.user.b@slug-e2e.test";
  const testOrgASlug = "slug-org-alpha";
  const testOrgBSlug = "slug-org-beta";

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

    // Clean up test data if present
    await prisma.user.deleteMany({
      where: { email: { in: [testUserAEmail, testUserBEmail] } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { in: [testOrgASlug, testOrgBSlug] } },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: testUserAEmail,
        password: "Password123!",
        firstName: "SlugUser",
        lastName: "Alpha",
        organizationName: "Slug Org Alpha",
        organizationSlug: testOrgASlug,
      });
    expect(resA.status).toBe(201);
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: testUserBEmail,
        password: "Password123!",
        firstName: "SlugUser",
        lastName: "Beta",
        organizationName: "Slug Org Beta",
        organizationSlug: testOrgBSlug,
      });
    expect(resB.status).toBe(201);
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { in: [testUserAEmail, testUserBEmail] } },
      });
      await prisma.organization.deleteMany({
        where: { slug: { in: [testOrgASlug, testOrgBSlug] } },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  });

  describe("1. Duplicate Product Names within Same Organization", () => {
    let firstProdId: string;

    it("should generate base slug for the first product created", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Coffee",
          costPrice: 5.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Coffee");
      expect(res.body.slug).toBe("coffee");
      expect(res.body.organizationId).toBe(orgAId);
      firstProdId = res.body.id;
    });

    it("should generate 'coffee-2' for second product with the same name", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Coffee",
          costPrice: 6.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Coffee");
      expect(res.body.slug).toBe("coffee-2");
      expect(res.body.organizationId).toBe(orgAId);
    });

    it("should generate 'coffee-3' for third product with the same name", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Coffee",
          costPrice: 7.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Coffee");
      expect(res.body.slug).toBe("coffee-3");
      expect(res.body.organizationId).toBe(orgAId);
    });

    it("should safely handle soft-deleted products without unique constraint error", async () => {
      // Soft-delete the first product ('coffee')
      await request(app.getHttpServer())
        .delete(`/products/${firstProdId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      // Create another product named "Coffee"
      // Since 'coffee', 'coffee-2', and 'coffee-3' exist in DB, it should generate 'coffee-4'
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Coffee",
          costPrice: 8.0,
        })
        .expect(201);

      expect(res.body.slug).toBe("coffee-4");
    });

    it("should auto-increment custom slug if duplicate provided", async () => {
      const res1 = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Original Tea",
          slug: "custom-tea",
        })
        .expect(201);
      expect(res1.body.slug).toBe("custom-tea");

      const res2 = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Duplicate Tea",
          slug: "custom-tea",
        })
        .expect(201);
      expect(res2.body.slug).toBe("custom-tea-2");
    });
  });

  describe("2. Cross-Organization Slug Scoping (Multi-Tenant Isolation)", () => {
    it("should allow Org B to create 'Coffee' with base slug 'coffee' independently of Org A", async () => {
      // Org A already has coffee, coffee-2, coffee-3, coffee-4
      // Org B creating "Coffee" should get "coffee" without conflict
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          name: "Coffee",
          costPrice: 10.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Coffee");
      expect(res.body.slug).toBe("coffee");
      expect(res.body.organizationId).toBe(orgBId);
    });

    it("should allow Org B to create second 'Coffee' with 'coffee-2' independently of Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          name: "Coffee",
          costPrice: 12.0,
        })
        .expect(201);

      expect(res.body.name).toBe("Coffee");
      expect(res.body.slug).toBe("coffee-2");
      expect(res.body.organizationId).toBe(orgBId);
    });
  });

  describe("3. Concurrent Creation Handling", () => {
    it("should safely handle 5 simultaneous creation requests for the same product name without 500 errors", async () => {
      const productName = "Cold Brew Nitro";
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app.getHttpServer())
          .post("/products")
          .set("Cookie", userACookie)
          .set("Authorization", `Bearer ${userAToken}`)
          .send({
            name: productName,
            costPrice: 4.5 + i,
            sku: `CBN-CONCUR-${i + 1}`,
          }),
      );

      const responses = await Promise.all(requests);

      // Verify all 5 succeeded with 201 Created
      for (const res of responses) {
        expect(res.status).toBe(201);
        expect(res.body.name).toBe(productName);
        expect(res.body.organizationId).toBe(orgAId);
      }

      // Verify all 5 slugs are distinct
      const slugs = responses.map((r) => r.body.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(5);

      // Verify slugs follow the expected pattern: cold-brew-nitro, cold-brew-nitro-2, ...-3, ...-4, ...-5
      const expectedSlugs = new Set([
        "cold-brew-nitro",
        "cold-brew-nitro-2",
        "cold-brew-nitro-3",
        "cold-brew-nitro-4",
        "cold-brew-nitro-5",
      ]);
      expect(uniqueSlugs).toEqual(expectedSlugs);
    });
  });

  describe("4. Product Update Slug Handling", () => {
    it("should generate a unique slug when updating a product name to an existing product's name", async () => {
      // Create a unique product
      const resCreate = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Matcha Latte",
          costPrice: 4.0,
        })
        .expect(201);

      expect(resCreate.body.slug).toBe("matcha-latte");
      const matchaId = resCreate.body.id;

      // Update name to "Coffee" which already has slugs coffee, coffee-2, coffee-3, coffee-4
      const resUpdate = await request(app.getHttpServer())
        .patch(`/products/${matchaId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Coffee",
        })
        .expect(200);

      expect(resUpdate.body.name).toBe("Coffee");
      expect(resUpdate.body.slug).toBe("coffee-5");
    });

    it("should keep existing slug when updating non-slug fields like description or costPrice", async () => {
      const resCreate = await request(app.getHttpServer())
        .post("/products")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Espresso Shot",
          costPrice: 2.5,
        })
        .expect(201);

      const id = resCreate.body.id;
      const initialSlug = resCreate.body.slug;
      expect(initialSlug).toBe("espresso-shot");

      const resUpdate = await request(app.getHttpServer())
        .patch(`/products/${id}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          costPrice: 3.0,
          description: "Double extraction",
        })
        .expect(200);

      expect(resUpdate.body.slug).toBe("espresso-shot");
      expect(Number(resUpdate.body.costPrice)).toBe(3.0);
      expect(resUpdate.body.description).toBe("Double extraction");
    });
  });
});
