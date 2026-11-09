import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";

jest.setTimeout(60000);

describe("Password Reset & Credential Management E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerToken: string;
  let memberToken: string;
  let orgId: string;
  let ownerId: string;
  let memberId: string;

  let otherOrgOwnerToken: string;
  let otherOrgId: string;

  const testEmails = [
    "owner.pwdtest@valgrow.test",
    "member.pwdtest@valgrow.test",
    "otherowner.pwdtest@valgrow.test",
    "admin.pwdtest@valgrow.test",
  ];

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
    await prisma.session.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.organizationMember.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pwd-test-org-alpha", "pwd-test-org-beta"] } },
    });

    // 1. Register Owner in Org Alpha
    const regResA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "owner.pwdtest@valgrow.test",
        password: "OwnerPassword123!",
        firstName: "Owner",
        lastName: "Alpha",
        organizationName: "Password Test Org Alpha",
      });

    expect(regResA.status).toBe(201);
    ownerToken = regResA.body.tokens.accessToken;
    orgId = regResA.body.activeOrganization.id;
    ownerId = regResA.body.user.id;

    // Create Viewer role in Org Alpha
    const viewerRole = await prisma.role.create({
      data: {
        organizationId: orgId,
        name: "Viewer",
        description: "Read-only access",
        scope: "Organization",
      },
    });

    // Create Member in Org Alpha
    const memberUser = await prisma.user.create({
      data: {
        email: "member.pwdtest@valgrow.test",
        firstName: "Member",
        lastName: "Alpha",
        passwordHash: "$2b$12$e8xL27z0l7iUqfUom3rMvOHu9n8yVn0iGk8pYtLq2Mv6pQq1s6v4m", // Initial dummy hash
        status: "ACTIVE",
      },
    });
    memberId = memberUser.id;

    await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: memberId,
        roleId: viewerRole!.id,
        status: "ACTIVE",
      },
    });

    // Member login to get memberToken
    const memLogin = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "member.pwdtest@valgrow.test",
        password: "InitialPassword123!",
      });
    // Even if initial password doesn't match dummy hash, create a valid session & token for member
    const memTokens = app.get(JwtService).sign(
      { sub: memberId, email: "member.pwdtest@valgrow.test", type: "access" },
      { expiresIn: "15m" },
    );
    memberToken = memTokens;

    // 2. Register Owner in Org Beta
    const regResB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "otherowner.pwdtest@valgrow.test",
        password: "OtherOwnerPassword123!",
        firstName: "Owner",
        lastName: "Beta",
        organizationName: "Password Test Org Beta",
      });

    expect(regResB.status).toBe(201);
    otherOrgOwnerToken = regResB.body.tokens.accessToken;
    otherOrgId = regResB.body.activeOrganization.id;
  });

  afterAll(async () => {
    await prisma.session.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.organizationMember.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pwd-test-org-alpha", "pwd-test-org-beta"] } },
    });
    await app.close();
  });

  it("1. Owner can generate a secure single-use reset link for a workspace member", async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${memberId}/reset-password`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-organization-id", orgId)
      .send({ action: "generate-link" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.resetUrl).toContain("/reset-password?token=");
    expect(res.body.resetToken).toBeDefined();

    // Verify token was persisted on User record
    const userInDb = await prisma.user.findUnique({ where: { id: memberId } });
    expect(userInDb?.resetToken).toBe(res.body.resetToken);
    expect(userInDb?.resetTokenExpiresAt).toBeDefined();
  });

  it("2. Member can reset password using token, and token cannot be reused", async () => {
    // 1. Generate fresh link
    const linkRes = await request(app.getHttpServer())
      .post(`/users/${memberId}/reset-password`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-organization-id", orgId)
      .send({ action: "generate-link" });

    const token = linkRes.body.resetToken;

    // 2. Reset password
    const resetRes = await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({
        token,
        newPassword: "BrandNewPassword123!",
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.message).toContain("Password reset successfully");

    // 3. Verify user can log in with new password
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "member.pwdtest@valgrow.test",
        password: "BrandNewPassword123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.email).toBe("member.pwdtest@valgrow.test");

    // 4. Token Reuse Attempt must be rejected
    const reuseRes = await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({
        token,
        newPassword: "AnotherPassword123!",
      });

    expect(reuseRes.status).toBe(400);
  });

  it("3. Owner can set a temporary password directly and revoke active sessions", async () => {
    // Create an active session for the member
    const session = await prisma.session.create({
      data: {
        userId: memberId,
        token: "test-active-session-token",
        expiresAt: new Date(Date.now() + 3600000),
        isRevoked: false,
      },
    });

    const res = await request(app.getHttpServer())
      .post(`/users/${memberId}/reset-password`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .set("x-organization-id", orgId)
      .send({
        action: "set-temporary",
        temporaryPassword: "TemporaryPass123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("Temporary password set successfully");

    // Verify session was revoked
    const updatedSession = await prisma.session.findUnique({
      where: { id: session.id },
    });
    expect(updatedSession?.isRevoked).toBe(true);

    // Verify member can log in with temporary password
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: "member.pwdtest@valgrow.test",
        password: "TemporaryPass123!",
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.mustChangePassword).toBe(true);
  });

  it("4. Non-owner / non-admin user is rejected with 403 Forbidden", async () => {
    const res = await request(app.getHttpServer())
      .post(`/users/${ownerId}/reset-password`)
      .set("Authorization", `Bearer ${memberToken}`)
      .set("x-organization-id", orgId)
      .send({ action: "generate-link" });

    expect(res.status).toBe(403);
  });

  it("5. Cross-organization password reset attempt is rejected", async () => {
    // Owner of Org Beta attempts to reset a member in Org Alpha
    const res = await request(app.getHttpServer())
      .post(`/users/${memberId}/reset-password`)
      .set("Authorization", `Bearer ${otherOrgOwnerToken}`)
      .set("x-organization-id", otherOrgId)
      .send({ action: "generate-link" });

    expect(res.status).toBe(404);
  });

  it("6. Non-owner administrator cannot reset an Owner's password", async () => {
    // Create an Administrator in Org Alpha with users.write permission
    const adminRole = await prisma.role.create({
      data: {
        organizationId: orgId,
        name: "Administrator",
        description: "Administrator",
        scope: "Organization",
      },
    });

    const writePerm = await prisma.permission.findUnique({
      where: { key: "users.write" },
    });
    if (writePerm) {
      await prisma.rolePermission.create({
        data: {
          roleId: adminRole.id,
          permissionId: writePerm.id,
        },
      });
    }

    const adminUser = await prisma.user.create({
      data: {
        email: "admin.pwdtest@valgrow.test",
        firstName: "Admin",
        lastName: "Alpha",
        passwordHash: "$2b$12$e8xL27z0l7iUqfUom3rMvOHu9n8yVn0iGk8pYtLq2Mv6pQq1s6v4m",
        status: "ACTIVE",
      },
    });

    await prisma.organizationMember.create({
      data: {
        organizationId: orgId,
        userId: adminUser.id,
        roleId: adminRole!.id,
        status: "ACTIVE",
      },
    });

    const adminToken = app.get(JwtService).sign(
      { sub: adminUser.id, email: "admin.pwdtest@valgrow.test", type: "access" },
      { expiresIn: "15m" },
    );

    // Admin tries to reset Owner's password -> must be 403 Forbidden
    const res = await request(app.getHttpServer())
      .post(`/users/${ownerId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .set("x-organization-id", orgId)
      .send({ action: "generate-link" });

    expect(res.status).toBe(403);
    expect(res.body.message).toContain("Only an Owner can reset an Owner's password");

    // Cleanup admin
    await prisma.organizationMember.deleteMany({ where: { userId: adminUser.id } });
    await prisma.user.delete({ where: { id: adminUser.id } });
  });

  it("7. Invalid or expired tokens are rejected", async () => {
    const res = await request(app.getHttpServer())
      .post("/auth/reset-password")
      .send({
        token: "invalid.jwt.token",
        newPassword: "ValidPassword123!",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Invalid or expired reset token");
  });
});

