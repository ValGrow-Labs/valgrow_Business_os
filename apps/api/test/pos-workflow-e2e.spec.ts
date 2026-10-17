import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

describe("ValGrow Business OS — Multi-User POS Workflow E2E Tests (Phase 1)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Tenant A Context
  let orgAId: string;
  let ownerAToken: string;
  let ownerAId: string;
  let salespersonToken: string;
  let salespersonId: string;
  let billingStaff1Token: string;
  let billingStaff1Id: string;
  let billingStaff2Token: string;
  let billingStaff2Id: string;
  let cashier1Token: string;
  let cashier1Id: string;
  let cashier2Token: string;
  let cashier2Id: string;

  let branchAId: string;
  let warehouseAId: string;
  let locationAId: string;
  let productAId: string;
  let customerAId: string;
  let cashierSessionId: string;

  // Tenant B Context
  let orgBId: string;
  let ownerBToken: string;

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

    // Clean test data
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pos-wf-org-alpha", "pos-wf-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "wf.owner.a@pos-wf.test",
            "wf.sales@pos-wf.test",
            "wf.billing1@pos-wf.test",
            "wf.billing2@pos-wf.test",
            "wf.cashier1@pos-wf.test",
            "wf.cashier2@pos-wf.test",
            "wf.owner.b@pos-wf.test",
          ],
        },
      },
    });

    // 1. Seed POS Permissions
    const posPermissions = [
      { key: "pos.read", resource: "POS", action: "read" },
      { key: "pos.create", resource: "POS", action: "create" },
      { key: "pos.session", resource: "POS", action: "session" },
      { key: "pos.close", resource: "POS", action: "close" },
      { key: "pos.billing", resource: "POS", action: "billing" },
      { key: "pos.cashier", resource: "POS", action: "cashier" },
      { key: "pos.checkout", resource: "POS", action: "checkout" },
      { key: "pos.cancel", resource: "POS", action: "cancel" },
      { key: "pos.refund", resource: "POS", action: "refund" },
    ];

    const permMap = new Map<string, string>();
    for (const p of posPermissions) {
      const rec = await prisma.permission.upsert({
        where: { key: p.key },
        update: {},
        create: {
          key: p.key,
          resource: p.resource,
          action: p.action,
          description: `Permission for ${p.key}`,
        },
      });
      permMap.set(p.key, rec.id);
    }

    // 2. Register Tenant A Owner
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "wf.owner.a@pos-wf.test",
        password: "Password123!",
        firstName: "Owner",
        lastName: "Alpha",
        organizationName: "POS Workflow Org Alpha",
        organizationSlug: "pos-wf-org-alpha",
      });

    ownerAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;
    ownerAId = resA.body.user.id;

    // 3. Register Tenant B Owner
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "wf.owner.b@pos-wf.test",
        password: "Password123!",
        firstName: "Owner",
        lastName: "Beta",
        organizationName: "POS Workflow Org Beta",
        organizationSlug: "pos-wf-org-beta",
      });

    ownerBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;

    // 4. Create Custom Roles in Org A
    const salespersonRole = await prisma.role.create({
      data: {
        organizationId: orgAId,
        name: "POS Salesperson",
        description: "Drafts carts and scans items",
        scope: "Branch",
        permissions: {
          create: [
            { permissionId: permMap.get("pos.read")! },
            { permissionId: permMap.get("pos.create")! },
          ],
        },
      },
    });

    const billingRole = await prisma.role.create({
      data: {
        organizationId: orgAId,
        name: "POS Billing Clerk",
        description: "Reviews and claims billing queue",
        scope: "Branch",
        permissions: {
          create: [
            { permissionId: permMap.get("pos.read")! },
            { permissionId: permMap.get("pos.billing")! },
            { permissionId: permMap.get("pos.cancel")! },
          ],
        },
      },
    });

    const cashierRole = await prisma.role.create({
      data: {
        organizationId: orgAId,
        name: "POS Cashier",
        description: "Claims payment queue and conducts checkout",
        scope: "Branch",
        permissions: {
          create: [
            { permissionId: permMap.get("pos.read")! },
            { permissionId: permMap.get("pos.cashier")! },
            { permissionId: permMap.get("pos.checkout")! },
            { permissionId: permMap.get("pos.session")! },
            { permissionId: permMap.get("pos.close")! },
            { permissionId: permMap.get("pos.cancel")! },
          ],
        },
      },
    });

    const hash = await bcrypt.hash("Password123!", 10);

    // 5. Helper function to create user + member + token
    async function createTestMember(
      email: string,
      firstName: string,
      lastName: string,
      roleId: string,
    ) {
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: hash,
          jobTitle: firstName,
        },
      });

      await prisma.organizationMember.create({
        data: {
          organizationId: orgAId,
          userId: user.id,
          roleId,
        },
      });

      const token = jwtService.sign(
        { sub: user.id, email: user.email, type: "access" },
        {
          secret:
            process.env.JWT_SECRET ||
            "valgrow-dev-jwt-secret-key-change-in-production-32bytes",
          expiresIn: "1h",
        },
      );

      return { user, token };
    }

    const salesMember = await createTestMember(
      "wf.sales@pos-wf.test",
      "Sales",
      "Floor",
      salespersonRole.id,
    );
    salespersonId = salesMember.user.id;
    salespersonToken = salesMember.token;

    const billing1 = await createTestMember(
      "wf.billing1@pos-wf.test",
      "Billing1",
      "Desk",
      billingRole.id,
    );
    billingStaff1Id = billing1.user.id;
    billingStaff1Token = billing1.token;

    const billing2 = await createTestMember(
      "wf.billing2@pos-wf.test",
      "Billing2",
      "Desk",
      billingRole.id,
    );
    billingStaff2Id = billing2.user.id;
    billingStaff2Token = billing2.token;

    const cash1 = await createTestMember(
      "wf.cashier1@pos-wf.test",
      "Cashier1",
      "Counter",
      cashierRole.id,
    );
    cashier1Id = cash1.user.id;
    cashier1Token = cash1.token;

    const cash2 = await createTestMember(
      "wf.cashier2@pos-wf.test",
      "Cashier2",
      "Counter",
      cashierRole.id,
    );
    cashier2Id = cash2.user.id;
    cashier2Token = cash2.token;

    // 6. Branch, Warehouse, Location, Product, Stock
    const branchA = await prisma.branch.create({
      data: {
        organizationId: orgAId,
        name: "Multi-User Flagship Store",
        city: "Bengaluru",
        status: "ACTIVE",
      },
    });
    branchAId = branchA.id;

    const warehouseA = await prisma.warehouse.create({
      data: {
        organizationId: orgAId,
        branchId: branchAId,
        name: "Store Warehouse Alpha",
        code: "WH-MU-A",
        status: "ACTIVE",
      },
    });
    warehouseAId = warehouseA.id;

    const locationA = await prisma.location.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        name: "Main Floor Bin",
        code: "BIN-FLOOR-1",
        status: "ACTIVE",
      },
    });
    locationAId = locationA.id;

    const productA = await prisma.product.create({
      data: {
        organizationId: orgAId,
        name: "Bluetooth Headphones",
        slug: "bluetooth-headphones-wf",
        sku: "HP-WF-001",
        barcode: "8909876543210",
        costPrice: 400,
        status: "ACTIVE",
      },
    });
    productAId = productA.id;

    await prisma.productPrice.create({
      data: {
        organizationId: orgAId,
        productId: productAId,
        tier: "RETAIL",
        price: 1500,
      },
    });

    await prisma.stockLevel.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        locationId: locationAId,
        productId: productAId,
        onHand: 50,
        reserved: 0,
      },
    });

    await prisma.inventoryCostLayer.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        locationId: locationAId,
        productId: productAId,
        initialQty: 50,
        remainingQty: 50,
        unitCost: 400,
        status: "ACTIVE",
      },
    });

    const customerA = await prisma.customer.create({
      data: {
        organizationId: orgAId,
        customerCode: "CUST-MU-VIP",
        name: "Workflow VIP Customer",
        phone: "+919876543210",
        status: "ACTIVE",
      },
    });
    customerAId = customerA.id;

    // Cashier opens a register session
    const sessionRes = await request(app.getHttpServer())
      .post("/pos/sessions/open")
      .set("Authorization", `Bearer ${cashier1Token}`)
      .set("x-organization-id", orgAId)
      .send({
        branchId: branchAId,
        warehouseId: warehouseAId,
        terminalId: "CASH-REG-01",
        openingCash: 2000,
        notes: "Cashier 1 Register Shift",
      })
      .expect(201);

    cashierSessionId = sessionRes.body.id;
  }, 60000);

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pos-wf-org-alpha", "pos-wf-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "wf.owner.a@pos-wf.test",
            "wf.sales@pos-wf.test",
            "wf.billing1@pos-wf.test",
            "wf.billing2@pos-wf.test",
            "wf.cashier1@pos-wf.test",
            "wf.cashier2@pos-wf.test",
            "wf.owner.b@pos-wf.test",
          ],
        },
      },
    });
    await app.close();
  }, 60000);

  // ==================================================
  // 1. END-TO-END MULTI-USER WORKFLOW TRANSITIONS
  // ==================================================

  describe("1. Complete Multi-User POS Transaction Flow", () => {
    let cartId: string;
    let generatedTicket: string;

    it("Step 1: Salesperson creates a new cart (DRAFT status)", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({
          branchId: branchAId,
          warehouseId: warehouseAId,
          customerId: customerAId,
          notes: "Customer wants 2 Bluetooth Headphones",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.workflowStatus).toBe("DRAFT");
      expect(res.body.salespersonId).toBe(salespersonId);
      expect(res.body.cartNumber).toMatch(/^TKT-/);

      cartId = res.body.id;
      generatedTicket = res.body.cartNumber;
    });

    it("Step 2: Salesperson adds products to cart", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({
          productId: productAId,
          quantity: 2,
          unitPrice: 1500,
        })
        .expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(Number(res.body.totalAmount)).toBe(3000);
      expect(res.body.workflowStatus).toBe("DRAFT");
    });

    it("Step 3: Salesperson sends cart to billing queue (SENT_TO_BILLING)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ notes: "Items scanned, send to billing desk" })
        .expect(201);

      expect(res.body.workflowStatus).toBe("SENT_TO_BILLING");
      expect(res.body.cartNumber).toBe(generatedTicket);
      expect(res.body.salespersonId).toBe(salespersonId);
    });

    it("Step 4: Billing Staff retrieves pending work from billing queue", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/billing/queue")
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .query({ branchId: branchAId })
        .expect(200);

      expect(res.body.items).toBeDefined();
      const queuedCart = res.body.items.find((c: any) => c.id === cartId);
      expect(queuedCart).toBeDefined();
      expect(queuedCart.cartNumber).toBe(generatedTicket);
      expect(queuedCart.workflowStatus).toBe("SENT_TO_BILLING");
    });

    it("Step 5: Billing Staff claims the cart (BILLING_IN_PROGRESS)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .expect(201);

      expect(res.body.workflowStatus).toBe("BILLING_IN_PROGRESS");
      expect(res.body.billingStaffId).toBe(billingStaff1Id);
      expect(res.body.billingStaff.email).toBe("wf.billing1@pos-wf.test");
    });

    it("Step 6: Billing Staff sends verified bill to cashier queue (READY_FOR_PAYMENT)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-payment`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .send({ notes: "Verified items and discounts. Ready for cashier." })
        .expect(201);

      expect(res.body.workflowStatus).toBe("READY_FOR_PAYMENT");
    });

    it("Step 7: Cashier lists pending payment work in payment queue", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/payment/queue")
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .expect(200);

      expect(res.body.items).toBeDefined();
      const bill = res.body.items.find((c: any) => c.id === cartId);
      expect(bill).toBeDefined();
      expect(bill.workflowStatus).toBe("READY_FOR_PAYMENT");
    });

    it("Step 8: Cashier claims the bill for payment (PAYMENT_IN_PROGRESS)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/claim-payment`)
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .expect(201);

      expect(res.body.workflowStatus).toBe("PAYMENT_IN_PROGRESS");
      expect(res.body.cashierId).toBe(cashier1Id);
    });

    it("Step 9: Cashier completes checkout & payment (PAID)", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: cashierSessionId,
          cartId,
          payments: [
            {
              paymentMethod: "CASH",
              amount: 3000,
              receivedAmount: 3000,
            },
          ],
        })
        .expect(201);

      expect(res.body.sale).toBeDefined();
      expect(res.body.sale.receiptNumber).toMatch(/^POS-/);
      expect(Number(res.body.sale.totalAmount)).toBe(3000);

      // Verify cart status updated to PAID & COMPLETED
      const completedCart = await prisma.pOSCart.findUnique({
        where: { id: cartId },
      });
      expect(completedCart?.workflowStatus).toBe("PAID");
      expect(completedCart?.status).toBe("COMPLETED");

      // Verify inventory deducted by 2 (50 -> 48)
      const stock = await prisma.stockLevel.findFirst({
        where: {
          organizationId: orgAId,
          warehouseId: warehouseAId,
          productId: productAId,
        },
      });
      expect(Number(stock?.onHand)).toBe(48);
    });

    it("Step 10: Verify complete audit history and transitions", async () => {
      const res = await request(app.getHttpServer())
        .get(`/pos/carts/${cartId}/workflow`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .expect(200);

      expect(res.body.transitions).toBeDefined();
      expect(res.body.transitions.length).toBeGreaterThanOrEqual(4);

      const statusSequence = res.body.transitions.map(
        (t: any) => `${t.fromStatus} -> ${t.toStatus}`,
      );
      expect(statusSequence).toContain("DRAFT -> SENT_TO_BILLING");
      expect(statusSequence).toContain(
        "SENT_TO_BILLING -> BILLING_IN_PROGRESS",
      );
      expect(statusSequence).toContain(
        "BILLING_IN_PROGRESS -> READY_FOR_PAYMENT",
      );
      expect(statusSequence).toContain(
        "READY_FOR_PAYMENT -> PAYMENT_IN_PROGRESS",
      );
      expect(statusSequence).toContain("PAYMENT_IN_PROGRESS -> PAID");
    });
  });

  // ==================================================
  // 2. CONCURRENCY & SIMULTANEOUS CLAIM PREVENTION
  // ==================================================

  describe("2. Concurrency & Collision Protection", () => {
    it("should prevent two billing clerks from claiming the same cart simultaneously", async () => {
      // Create and send a new cart to billing
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      // Two billing staff members click 'Claim' simultaneously
      const [claim1, claim2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/pos/carts/${testCartId}/claim-billing`)
          .set("Authorization", `Bearer ${billingStaff1Token}`)
          .set("x-organization-id", orgAId),
        request(app.getHttpServer())
          .post(`/pos/carts/${testCartId}/claim-billing`)
          .set("Authorization", `Bearer ${billingStaff2Token}`)
          .set("x-organization-id", orgAId),
      ]);

      const statuses = [claim1.status, claim2.status].sort();
      // Exactly one succeeds (201) and the other is rejected with 409 Conflict
      expect(statuses).toEqual([201, 409]);
    });

    it("should prevent two cashiers from claiming the same bill simultaneously", async () => {
      // Create, itemize, and move a cart to READY_FOR_PAYMENT
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-payment`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      // Cashier 1 and Cashier 2 click 'Claim' simultaneously
      const [claim1, claim2] = await Promise.all([
        request(app.getHttpServer())
          .post(`/pos/carts/${testCartId}/claim-payment`)
          .set("Authorization", `Bearer ${cashier1Token}`)
          .set("x-organization-id", orgAId),
        request(app.getHttpServer())
          .post(`/pos/carts/${testCartId}/claim-payment`)
          .set("Authorization", `Bearer ${cashier2Token}`)
          .set("x-organization-id", orgAId),
      ]);

      const statuses = [claim1.status, claim2.status].sort();
      expect(statuses).toEqual([201, 409]);
    });

    it("should prevent duplicate checkout/payment execution on the same cart", async () => {
      // Prepare cart in PAYMENT_IN_PROGRESS
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-payment`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-payment`)
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId);

      const stockBefore = await prisma.stockLevel.findFirst({
        where: {
          organizationId: orgAId,
          warehouseId: warehouseAId,
          productId: productAId,
        },
      });

      // Two rapid checkout requests
      const [res1, res2] = await Promise.all([
        request(app.getHttpServer())
          .post("/pos/checkout")
          .set("Authorization", `Bearer ${cashier1Token}`)
          .set("x-organization-id", orgAId)
          .send({
            sessionId: cashierSessionId,
            cartId: testCartId,
            payments: [{ paymentMethod: "CASH", amount: 1500 }],
          }),
        request(app.getHttpServer())
          .post("/pos/checkout")
          .set("Authorization", `Bearer ${cashier1Token}`)
          .set("x-organization-id", orgAId)
          .send({
            sessionId: cashierSessionId,
            cartId: testCartId,
            payments: [{ paymentMethod: "CASH", amount: 1500 }],
          }),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one 201 Created and one 409 Conflict
      expect(statuses).toEqual([201, 409]);

      // Verify stock was decremented exactly ONCE (not twice)
      const stockAfter = await prisma.stockLevel.findFirst({
        where: {
          organizationId: orgAId,
          warehouseId: warehouseAId,
          productId: productAId,
        },
      });

      expect(Number(stockBefore?.onHand) - Number(stockAfter?.onHand)).toBe(1);
    });
  });

  // ==================================================
  // 3. WORKFLOW STATE RULES & PREMATURE CHECKOUT PREVENTION
  // ==================================================

  describe("3. Workflow State Rules & Guardrails", () => {
    let cartId: string;

    beforeEach(async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      cartId = res.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });
    });

    it("should reject checkout when cart is in SENT_TO_BILLING", async () => {
      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: cashierSessionId,
          cartId,
          payments: [{ paymentMethod: "CASH", amount: 1500 }],
        })
        .expect(400);

      expect(res.body.message).toContain("SENT_TO_BILLING");
    });

    it("should reject checkout when cart is in BILLING_IN_PROGRESS", async () => {
      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: cashierSessionId,
          cartId,
          payments: [{ paymentMethod: "CASH", amount: 1500 }],
        })
        .expect(400);

      expect(res.body.message).toContain("BILLING_IN_PROGRESS");
    });

    it("should reject checkout when bill is in READY_FOR_PAYMENT before cashier claims it", async () => {
      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-payment`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${cashier1Token}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: cashierSessionId,
          cartId,
          payments: [{ paymentMethod: "CASH", amount: 1500 }],
        })
        .expect(400);

      expect(res.body.message).toContain("READY_FOR_PAYMENT");
    });

    it("should prevent modifying cart items once sent to billing", async () => {
      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 })
        .expect(400);
    });
  });

  // ==================================================
  // 4. ROLE PERMISSIONS ENFORCEMENT
  // ==================================================

  describe("4. Role-Based Permissions Enforcement", () => {
    it("should prevent salesperson from accessing the billing queue (403)", async () => {
      await request(app.getHttpServer())
        .get("/pos/billing/queue")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .expect(403);
    });

    it("should prevent billing clerk from claiming payment or checkout (403)", async () => {
      await request(app.getHttpServer())
        .get("/pos/payment/queue")
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .expect(403);
    });

    it("should prevent unauthenticated requests (401)", async () => {
      await request(app.getHttpServer())
        .get("/pos/billing/queue")
        .set("x-organization-id", orgAId)
        .expect(401);
    });
  });

  // ==================================================
  // 5. RETURN TO QUEUE & AUTHORIZED CANCELLATION
  // ==================================================

  describe("5. Return to Queue & Authorized Cancellation", () => {
    it("should allow billing staff to release claimed cart back to billing queue", async () => {
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId);

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId);

      // Return to queue
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/return-to-queue`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .send({ notes: "Stepping away from counter" })
        .expect(201);

      expect(res.body.workflowStatus).toBe("SENT_TO_BILLING");
      expect(res.body.billingStaffId).toBeNull();

      // Another clerk can now claim it
      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-billing`)
        .set("Authorization", `Bearer ${billingStaff2Token}`)
        .set("x-organization-id", orgAId)
        .expect(201);
    });

    it("should cancel a transaction with mandatory reason and prevent further operations", async () => {
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/items`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ productId: productAId, quantity: 1, unitPrice: 1500 });

      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/cancel`)
        .set("Authorization", `Bearer ${billingStaff1Token}`)
        .set("x-organization-id", orgAId)
        .send({ reason: "Customer left store without buying" })
        .expect(201);

      expect(res.body.workflowStatus).toBe("CANCELLED");
      expect(res.body.cancellationReason).toBe(
        "Customer left store without buying",
      );

      // Attempt to send to billing or claim fails
      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/send-to-billing`)
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .expect(400);
    });
  });

  // ==================================================
  // 6. TENANT ISOLATION
  // ==================================================

  describe("6. Cross-Tenant Isolation", () => {
    it("should prevent Org B from viewing or claiming Org A carts", async () => {
      const cartRes = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${salespersonToken}`)
        .set("x-organization-id", orgAId)
        .send({ branchId: branchAId, warehouseId: warehouseAId });
      const testCartId = cartRes.body.id;

      // Org B user attempts to claim Org A cart
      await request(app.getHttpServer())
        .post(`/pos/carts/${testCartId}/claim-billing`)
        .set("Authorization", `Bearer ${ownerBToken}`)
        .set("x-organization-id", orgBId)
        .expect(404);

      // Org B user attempts to view Org A cart workflow
      await request(app.getHttpServer())
        .get(`/pos/carts/${testCartId}/workflow`)
        .set("Authorization", `Bearer ${ownerBToken}`)
        .set("x-organization-id", orgBId)
        .expect(404);
    });
  });
});
