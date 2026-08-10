import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — CRM Domain E2E Tests", () => {
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

  // Tenant A Created CRM Entities
  let leadSourceAId: string;
  let pipelineAId: string;
  let stage1AId: string;
  let stage2AId: string;
  let leadA1Id: string;
  let leadA2Id: string;
  let customerA1Id: string;
  let opportunityA1Id: string;
  let tagA1Id: string;
  let contactA1Id: string;
  let activityA1Id: string;
  let taskA1Id: string;
  let noteA1Id: string;
  let segmentA1Id: string;

  // Tenant B Created CRM Entities
  let leadSourceBId: string;
  let leadB1Id: string;
  let customerB1Id: string;

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

    // Cleanup test data
    await prisma.organization.deleteMany({
      where: { slug: { in: ["crm-org-alpha", "crm-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["crm.user.a@crm-e2e.test", "crm.user.b@crm-e2e.test"],
        },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "crm.user.a@crm-e2e.test",
        password: "Password123!",
        firstName: "CRM",
        lastName: "UserA",
        organizationName: "CRM Alpha",
        organizationSlug: "crm-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    userAId = resA.body.user.id;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "crm.user.b@crm-e2e.test",
        password: "Password123!",
        firstName: "CRM",
        lastName: "UserB",
        organizationName: "CRM Beta",
        organizationSlug: "crm-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    userBId = resB.body.user.id;
    orgBId = resB.body.activeOrganization.id;
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ["crm-org-alpha", "crm-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["crm.user.a@crm-e2e.test", "crm.user.b@crm-e2e.test"],
        },
      },
    });
    await app.close();
  });

  // ==================================================
  // 1. LEAD SOURCES
  // ==================================================
  describe("CRM Lead Sources", () => {
    it("should create a Lead Source in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/lead-sources")
        .set("Cookie", userACookie)
        .send({
          name: "Website Inbound",
          description: "Leads from company website form",
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Website Inbound");
      leadSourceAId = res.body.id;
    });

    it("should create a Lead Source in Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/lead-sources")
        .set("Cookie", userBCookie)
        .send({
          name: "Cold Calling",
          description: "Outbound sales team leads",
        });

      expect(res.status).toBe(201);
      leadSourceBId = res.body.id;
    });

    it("should list lead sources for Org A without seeing Org B sources", async () => {
      const res = await request(app.getHttpServer())
        .get("/crm/lead-sources")
        .set("Cookie", userACookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const names = res.body.map((s: any) => s.name);
      expect(names).toContain("Website Inbound");
      expect(names).not.toContain("Cold Calling");
    });
  });

  // ==================================================
  // 2. PIPELINES & STAGES
  // ==================================================
  describe("CRM Pipelines & Stages", () => {
    it("should create a custom Opportunity Pipeline in Org A with default stages", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/pipelines")
        .set("Cookie", userACookie)
        .send({
          name: "Enterprise Deals Pipeline",
          type: "OPPORTUNITY",
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.stages.length).toBe(6);
      pipelineAId = res.body.id;
      stage1AId = res.body.stages[0].id;
      stage2AId = res.body.stages[1].id;
    });

    it("should add a new stage to Org A pipeline", async () => {
      const res = await request(app.getHttpServer())
        .post(`/crm/pipelines/${pipelineAId}/stages`)
        .set("Cookie", userACookie)
        .send({
          name: "Security Audit / Compliance",
          probability: 70,
          color: "#9333EA",
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Security Audit / Compliance");
    });
  });

  // ==================================================
  // 3. LEADS & TENANT ISOLATION
  // ==================================================
  describe("CRM Leads", () => {
    it("should create a Lead in Org A with LEAD-YYYY-00001 number sequence", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/leads")
        .set("Cookie", userACookie)
        .send({
          firstName: "John",
          lastName: "Doe",
          companyName: "Acme Corp",
          email: "john.doe@acme-corp.test",
          phone: "+919876543210",
          sourceId: leadSourceAId,
          pipelineId: pipelineAId,
          stageId: stage1AId,
          assignedToId: userAId,
          estimatedValue: 150000,
          notes: "Interested in Enterprise plan",
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.leadNumber).toMatch(/^LEAD-\d{4}-00001$/);
      expect(res.body.status).toBe("NEW");
      leadA1Id = res.body.id;
    });

    it("should create a second Lead in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/leads")
        .set("Cookie", userACookie)
        .send({
          firstName: "Alice",
          lastName: "Smith",
          companyName: "Smith & Co",
          email: "alice@smith-co.test",
          phone: "+919876543211",
          estimatedValue: 75000,
        });

      expect(res.status).toBe(201);
      expect(res.body.leadNumber).toMatch(/^LEAD-\d{4}-00002$/);
      leadA2Id = res.body.id;
    });

    it("should create a Lead in Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/leads")
        .set("Cookie", userBCookie)
        .send({
          firstName: "Bob",
          lastName: "Builder",
          email: "bob@builder-org-b.test",
          sourceId: leadSourceBId,
        });

      expect(res.status).toBe(201);
      leadB1Id = res.body.id;
    });

    it("should REJECT creating Lead in Org A with cross-tenant sourceId from Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/leads")
        .set("Cookie", userACookie)
        .send({
          firstName: "Hacker",
          sourceId: leadSourceBId, // Cross-tenant!
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cross-tenant");
    });

    it("should REJECT creating Lead in Org A assigned to User B (cross-tenant user)", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/leads")
        .set("Cookie", userACookie)
        .send({
          firstName: "Hacker",
          assignedToId: userBId, // Cross-tenant user!
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("cross-tenant");
    });

    it("should prevent Tenant B from fetching Tenant A leads", async () => {
      const res = await request(app.getHttpServer())
        .get(`/crm/leads/${leadA1Id}`)
        .set("Cookie", userBCookie);

      expect(res.status).toBe(404);
    });
  });

  // ==================================================
  // 4. LEAD CONVERSION & DUPLICATE CUSTOMER PREVENTION
  // ==================================================
  describe("CRM Lead Conversion Workflow", () => {
    it("should prevent duplicate customer creation when converting lead if email already exists", async () => {
      // First manually create a Customer in Org A with matching email
      const existingCust = await prisma.customer.create({
        data: {
          organizationId: orgAId,
          customerCode: "CUST-PRE-EXISTING",
          name: "Acme Corp Existing",
          email: "john.doe@acme-corp.test",
        },
      });

      // Try converting Lead A1 (which has email john.doe@acme-corp.test) without specifying existing customer
      const res = await request(app.getHttpServer())
        .post(`/crm/leads/${leadA1Id}/convert`)
        .set("Cookie", userACookie)
        .send({
          createOpportunity: true,
          opportunityName: "Acme Big Deal",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("matching email/phone already exists");

      // Clean up pre-existing customer for next test step
      await prisma.customer.delete({ where: { id: existingCust.id } });
    });

    it("should successfully convert Lead A1 into NEW Customer and Opportunity in atomic transaction", async () => {
      const res = await request(app.getHttpServer())
        .post(`/crm/leads/${leadA1Id}/convert`)
        .set("Cookie", userACookie)
        .send({
          createOpportunity: true,
          opportunityName: "Acme Enterprise Deal",
          pipelineId: pipelineAId,
          stageId: stage1AId,
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("CONVERTED");
      expect(res.body.customerId).toBeDefined();
      expect(res.body.opportunityId).toBeDefined();
      customerA1Id = res.body.customerId;
      opportunityA1Id = res.body.opportunityId;

      // Verify Lead status updated to CONVERTED
      const updatedLead = await prisma.lead.findUnique({
        where: { id: leadA1Id },
      });
      expect(updatedLead?.status).toBe("CONVERTED");
      expect(updatedLead?.convertedCustomerId).toBe(customerA1Id);
    });

    it("should prevent converting an already CONVERTED lead", async () => {
      const res = await request(app.getHttpServer())
        .post(`/crm/leads/${leadA1Id}/convert`)
        .set("Cookie", userACookie)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("already been converted");
    });
  });

  // ==================================================
  // 5. OPPORTUNITIES & PIPELINE TRANSITIONS
  // ==================================================
  describe("CRM Opportunities & Stage Transitions", () => {
    it("should get Opportunity details by ID", async () => {
      const res = await request(app.getHttpServer())
        .get(`/crm/opportunities/${opportunityA1Id}`)
        .set("Cookie", userACookie);

      expect(res.status).toBe(200);
      expect(res.body.opportunityNumber).toMatch(/^OPP-\d{4}-00001$/);
      expect(res.body.customerId).toBe(customerA1Id);
    });

    it("should update Opportunity stage and recalculate probability", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/crm/opportunities/${opportunityA1Id}/stage`)
        .set("Cookie", userACookie)
        .send({
          stageId: stage2AId,
        });

      expect(res.status).toBe(200);
      expect(res.body.stageId).toBe(stage2AId);
    });

    it("should close Opportunity as WON when stage is moved to Won stage", async () => {
      const pipe = await prisma.crmPipeline.findUnique({
        where: { id: pipelineAId },
        include: { stages: true },
      });
      const wonStage = pipe?.stages.find((s) =>
        s.name.toLowerCase().includes("won"),
      );
      expect(wonStage).toBeDefined();

      const res = await request(app.getHttpServer())
        .patch(`/crm/opportunities/${opportunityA1Id}/stage`)
        .set("Cookie", userACookie)
        .send({
          stageId: wonStage!.id,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("WON");
      expect(res.body.probability).toBe(100);
      expect(res.body.closedAt).not.toBeNull();
    });
  });

  // ==================================================
  // 6. CONTACTS, ACTIVITIES, TASKS, NOTES, TAGS & SEGMENTS
  // ==================================================
  describe("CRM Related Entities (Contacts, Activities, Tasks, Notes, Tags, Segments)", () => {
    it("should create a Customer Contact", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/contacts")
        .set("Cookie", userACookie)
        .send({
          customerId: customerA1Id,
          name: "Robert CEO",
          role: "Chief Executive Officer",
          email: "robert@acme-corp.test",
          phone: "+919876500000",
          isPrimary: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      contactA1Id = res.body.id;
    });

    it("should create a CRM Activity", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/activities")
        .set("Cookie", userACookie)
        .send({
          type: "MEETING",
          subject: "Product Demo & Pricing Discussion",
          description: "Presented Enterprise features to management team",
          durationMinutes: 45,
          customerId: customerA1Id,
          opportunityId: opportunityA1Id,
        });

      expect(res.status).toBe(201);
      activityA1Id = res.body.id;
    });

    it("should create a CRM Task", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/tasks")
        .set("Cookie", userACookie)
        .send({
          title: "Send formal MSA contract",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: "HIGH",
          customerId: customerA1Id,
          opportunityId: opportunityA1Id,
          assignedToId: userAId,
        });

      expect(res.status).toBe(201);
      taskA1Id = res.body.id;
    });

    it("should create a CRM Note", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/notes")
        .set("Cookie", userACookie)
        .send({
          content: "Client prefers communication via WhatsApp and Email",
          customerId: customerA1Id,
        });

      expect(res.status).toBe(201);
      noteA1Id = res.body.id;
    });

    it("should create and assign a CRM Tag to Customer", async () => {
      const tagRes = await request(app.getHttpServer())
        .post("/crm/tags")
        .set("Cookie", userACookie)
        .send({
          name: "Key Account",
          color: "#10B981",
        });

      expect(tagRes.status).toBe(201);
      tagA1Id = tagRes.body.id;

      const assignRes = await request(app.getHttpServer())
        .post("/crm/tags/assign")
        .set("Cookie", userACookie)
        .send({
          tagId: tagA1Id,
          customerId: customerA1Id,
        });

      expect(assignRes.status).toBe(201);
    });

    it("should create a Customer Segment", async () => {
      const res = await request(app.getHttpServer())
        .post("/crm/segments")
        .set("Cookie", userACookie)
        .send({
          name: "Active Key Accounts",
          description: "High value customers with active opportunities",
          rules: { status: "ACTIVE" },
        });

      expect(res.status).toBe(201);
      segmentA1Id = res.body.id;
    });

    it("should list segment matching customers", async () => {
      const res = await request(app.getHttpServer())
        .get(`/crm/segments/${segmentA1Id}/customers`)
        .set("Cookie", userACookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.some((c: any) => c.id === customerA1Id)).toBe(true);
    });
  });

  // ==================================================
  // 7. CUSTOMER 360 INTEGRATION
  // ==================================================
  describe("Customer 360 Integration", () => {
    it("should fetch Customer 360 aggregated view with metrics, sales, CRM activities, and timeline", async () => {
      const res = await request(app.getHttpServer())
        .get(`/crm/customer-360/${customerA1Id}`)
        .set("Cookie", userACookie);

      expect(res.status).toBe(200);
      expect(res.body.customer.id).toBe(customerA1Id);
      expect(res.body.contacts.length).toBeGreaterThanOrEqual(1);
      expect(res.body.metrics.totalOpportunities).toBeGreaterThanOrEqual(1);
      expect(res.body.metrics.wonOpportunitiesValue).toBeGreaterThan(0);
      expect(Array.isArray(res.body.timeline)).toBe(true);
      expect(res.body.timeline.length).toBeGreaterThanOrEqual(3); // Meeting activity, Task, Note
    });

    it("should REJECT Tenant B from fetching Tenant A Customer 360", async () => {
      const res = await request(app.getHttpServer())
        .get(`/crm/customer-360/${customerA1Id}`)
        .set("Cookie", userBCookie);

      expect(res.status).toBe(404);
    });
  });
});
