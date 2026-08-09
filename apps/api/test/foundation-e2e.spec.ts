import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Foundation E2E & Multi-Tenant Security Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Tenant A Credentials & Tokens
  let userACookie: any;
  let userAToken: string;
  let orgAId: string;
  let branchAId: string;

  // Tenant B Credentials & Tokens
  let userBCookie: any;
  let userBToken: string;
  let orgBId: string;
  let branchBId: string;

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

    // Pre-test cleanup to ensure idempotent registration
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "user.a@orga-e2e.test",
            "user.b@orgb-e2e.test",
            "invited.member@orga-e2e.test",
          ],
        },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: {
          in: ["org-alpha-e2e", "org-beta-e2e"],
        },
      },
    });
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: {
            in: [
              "user.a@orga-e2e.test",
              "user.b@orgb-e2e.test",
              "invited.member@orga-e2e.test",
            ],
          },
        },
      });
      await prisma.organization.deleteMany({
        where: {
          slug: {
            in: ["org-alpha-e2e", "org-beta-e2e"],
          },
        },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  }, 60000);

  describe("1 & 6. Registration & Organization Creation", () => {
    it("should register User A and create Organization A", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "user.a@orga-e2e.test",
          password: "Password123!",
          firstName: "Alice",
          lastName: "TenantA",
          organizationName: "Organization Alpha E2E",
          organizationSlug: "org-alpha-e2e",
        })
        .expect(201);

      expect(res.body.user.email).toBe("user.a@orga-e2e.test");
      expect(res.body.activeOrganization.slug).toBe("org-alpha-e2e");
      expect(res.body.role).toBe("Owner");
      expect(res.headers["set-cookie"]).toBeDefined();

      userACookie = res.headers["set-cookie"];
      userAToken = res.body.tokens.accessToken;
      orgAId = res.body.activeOrganization.id;
    });

    it("should register User B and create Organization B", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "user.b@orgb-e2e.test",
          password: "Password123!",
          firstName: "Bob",
          lastName: "TenantB",
          organizationName: "Organization Beta E2E",
          organizationSlug: "org-beta-e2e",
        })
        .expect(201);

      expect(res.body.user.email).toBe("user.b@orgb-e2e.test");
      expect(res.body.activeOrganization.slug).toBe("org-beta-e2e");
      expect(res.body.role).toBe("Owner");

      userBCookie = res.headers["set-cookie"];
      userBToken = res.body.tokens.accessToken;
      orgBId = res.body.activeOrganization.id;
    });
  });

  describe("2. Login & Cookie Authentication", () => {
    it("should login User A and return httpOnly cookies", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "user.a@orga-e2e.test",
          password: "Password123!",
        })
        .expect(200);

      expect(res.body.message).toBe("Login successful");
      expect(res.body.activeOrganization.id).toBe(orgAId);
      expect(res.headers["set-cookie"]).toBeDefined();

      userACookie = res.headers["set-cookie"];
      userAToken = res.body.tokens.accessToken;
    });
  });

  describe("5. Current User Endpoint (/auth/me)", () => {
    it("should fetch User A profile and active Org A context", async () => {
      const res = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.user.email).toBe("user.a@orga-e2e.test");
      expect(res.body.activeOrganization.id).toBe(orgAId);
      expect(res.body.role.name).toBe("Owner");
    });
  });

  describe("11 & 7. Branch CRUD & CRITICAL MULTI-TENANT ISOLATION TEST", () => {
    it("should create Branch A in Organization A", async () => {
      const res = await request(app.getHttpServer())
        .post("/branches")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Branch Alpha North",
          code: "BAN",
          city: "Bengaluru",
          status: "ACTIVE",
        })
        .expect(201);

      expect(res.body.name).toBe("Branch Alpha North");
      expect(res.body.organizationId).toBe(orgAId);
      branchAId = res.body.id;
    });

    it("should create Branch B in Organization B", async () => {
      const res = await request(app.getHttpServer())
        .post("/branches")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({
          name: "Branch Beta South",
          code: "BBS",
          city: "Chennai",
          status: "ACTIVE",
        })
        .expect(201);

      expect(res.body.name).toBe("Branch Beta South");
      expect(res.body.organizationId).toBe(orgBId);
      branchBId = res.body.id;
    });

    it("🔒 CRITICAL SECURITY TEST: User A cannot read Branch B of Organization B by ID", async () => {
      await request(app.getHttpServer())
        .get(`/branches/${branchBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);
    });

    it("🔒 CRITICAL SECURITY TEST: User A cannot update Branch B of Organization B", async () => {
      await request(app.getHttpServer())
        .patch(`/branches/${branchBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Hacked Branch Name" })
        .expect(404);
    });

    it("🔒 CRITICAL SECURITY TEST: User A cannot delete Branch B of Organization B", async () => {
      await request(app.getHttpServer())
        .delete(`/branches/${branchBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(404);
    });

    it("🔒 CRITICAL SECURITY TEST: Manipulating X-Organization-Id header cannot grant User A access to Org B", async () => {
      const res = await request(app.getHttpServer())
        .get("/branches")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .set("X-Organization-Id", orgBId) // Fraudulent header
        .expect(200);

      // Backend must ignore unverified X-Organization-Id and return only Org A branches
      const branchIds = res.body.map((b: any) => b.id);
      expect(branchIds).toContain(branchAId);
      expect(branchIds).not.toContain(branchBId);
    });
  });

  describe("8 & 9. User CRUD & Role CRUD", () => {
    let customRoleId: string;

    it("should create a custom role in Organization A", async () => {
      const res = await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Custom Team Lead",
          description: "Team lead role with custom permissions",
        })
        .expect(201);

      expect(res.body.name).toBe("Custom Team Lead");
      expect(res.body.organizationId).toBe(orgAId);
      customRoleId = res.body.id;
    });

    it("should invite a new user into Organization A with custom role", async () => {
      const res = await request(app.getHttpServer())
        .post("/users")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          email: "invited.member@orga-e2e.test",
          firstName: "Invited",
          lastName: "Member",
          roleId: customRoleId,
          jobTitle: "Senior Specialist",
        })
        .expect(201);

      expect(res.body.email).toBe("invited.member@orga-e2e.test");
      expect(res.body.role).toBe("Custom Team Lead");
    });

    it("should list all members of Organization A", async () => {
      const res = await request(app.getHttpServer())
        .get("/users")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(2);
      const emails = res.body.map((u: any) => u.email);
      expect(emails).toContain("user.a@orga-e2e.test");
      expect(emails).toContain("invited.member@orga-e2e.test");
      expect(emails).not.toContain("user.b@orgb-e2e.test");
    });
  });

  describe("10. Permissions Catalog", () => {
    it("should return global permissions catalog", async () => {
      const res = await request(app.getHttpServer())
        .get("/permissions")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe("12. Notifications API", () => {
    it("should list notifications for User A", async () => {
      const res = await request(app.getHttpServer())
        .get("/notifications")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("13. Activity Logs API", () => {
    it("should list activity logs for Organization A", async () => {
      const res = await request(app.getHttpServer())
        .get("/activity-logs")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("14. File Foundation API", () => {
    let fileId: string;

    it("should create file record in Organization A", async () => {
      const res = await request(app.getHttpServer())
        .post("/files")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "e2e-test-document.pdf",
          path: "/uploads/e2e-test-document.pdf",
          mimeType: "application/pdf",
          size: 2048,
        })
        .expect(201);

      expect(res.body.name).toBe("e2e-test-document.pdf");
      expect(res.body.organizationId).toBe(orgAId);
      fileId = res.body.id;
    });

    it("should delete file record in Organization A", async () => {
      await request(app.getHttpServer())
        .delete(`/files/${fileId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);
    });
  });

  describe("4. Session Refresh & Logout", () => {
    it("should refresh session using httpOnly refresh token cookie", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/refresh")
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.message).toBe("Token refreshed successfully");
      expect(res.headers["set-cookie"]).toBeDefined();
    });

    it("should logout User A and clear cookies", async () => {
      const res = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.message).toBe("Logged out successfully");
    });
  });
});
