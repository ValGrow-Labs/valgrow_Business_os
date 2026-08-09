import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — POS Domain & Security E2E Tests", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Org A Context
  let orgAToken: string;
  let orgAId: string;
  let userAId: string;
  let branchAId: string;
  let warehouseAId: string;
  let locationAId: string;
  let productAId: string;
  let variantAId: string;
  let customerAId: string;

  // Org B Context
  let orgBToken: string;
  let orgBId: string;
  let userBId: string;
  let branchBId: string;
  let warehouseBId: string;
  let locationBId: string;
  let productBId: string;

  // Created POS State
  let sessionAId: string;
  let cartAId: string;
  let cartItemId: string;
  let saleAId: string;

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

    // Clean test data
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pos-org-alpha", "pos-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ["pos.user.a@pos-e2e.test", "pos.user.b@pos-e2e.test"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "pos.user.a@pos-e2e.test",
        password: "Password123!",
        firstName: "POS",
        lastName: "UserA",
        organizationName: "POS Test Org Alpha",
        organizationSlug: "pos-org-alpha",
      });

    orgAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;
    userAId = resA.body.user.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "pos.user.b@pos-e2e.test",
        password: "Password123!",
        firstName: "POS",
        lastName: "UserB",
        organizationName: "POS Test Org Beta",
        organizationSlug: "pos-org-beta",
      });

    orgBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;
    userBId = resB.body.user.id;

    // Create Branch, Warehouse, Location for Org A
    const branchA = await prisma.branch.create({
      data: {
        organizationId: orgAId,
        name: "Main POS Store Alpha",
        city: "Mumbai",
        status: "ACTIVE",
      },
    });
    branchAId = branchA.id;

    const warehouseA = await prisma.warehouse.create({
      data: {
        organizationId: orgAId,
        branchId: branchAId,
        name: "Retail Warehouse Alpha",
        code: "WH-POS-A",
        status: "ACTIVE",
      },
    });
    warehouseAId = warehouseA.id;

    const locationA = await prisma.location.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        name: "Register Counter 1",
        code: "REG-01-BIN",
        status: "ACTIVE",
      },
    });
    locationAId = locationA.id;

    // Create Product, Variant, Price, StockLevel for Org A
    const productA = await prisma.product.create({
      data: {
        organizationId: orgAId,
        name: "Wireless Gaming Mouse",
        slug: "wireless-gaming-mouse-pos",
        sku: "MS-POS-001",
        barcode: "8901234567890",
        costPrice: 500,
        status: "ACTIVE",
        hasVariants: true,
      },
    });
    productAId = productA.id;

    const variantA = await prisma.productVariant.create({
      data: {
        organizationId: orgAId,
        productId: productAId,
        name: "Black Edition",
        sku: "MS-POS-001-BLK",
        barcode: "8901234567891",
        status: "ACTIVE",
      },
    });
    variantAId = variantA.id;

    await prisma.productPrice.create({
      data: {
        organizationId: orgAId,
        productId: productAId,
        variantId: variantAId,
        tier: "RETAIL",
        price: 99.99,
      },
    });

    await prisma.stockLevel.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        locationId: locationAId,
        productId: productAId,
        variantId: variantAId,
        onHand: 100,
        reserved: 0,
      },
    });

    await prisma.inventoryCostLayer.create({
      data: {
        organizationId: orgAId,
        warehouseId: warehouseAId,
        locationId: locationAId,
        productId: productAId,
        variantId: variantAId,
        initialQty: 100,
        remainingQty: 100,
        unitCost: 500,
        status: "ACTIVE",
      },
    });

    const customerA = await prisma.customer.create({
      data: {
        organizationId: orgAId,
        customerCode: "CUST-POS-A",
        name: "POS VIP Customer",
        status: "ACTIVE",
      },
    });
    customerAId = customerA.id;

    // Create Branch, Warehouse, Location for Org B
    const branchB = await prisma.branch.create({
      data: {
        organizationId: orgBId,
        name: "Main POS Store Beta",
        city: "Delhi",
        status: "ACTIVE",
      },
    });
    branchBId = branchB.id;

    const warehouseB = await prisma.warehouse.create({
      data: {
        organizationId: orgBId,
        branchId: branchBId,
        name: "Retail Warehouse Beta",
        code: "WH-POS-B",
        status: "ACTIVE",
      },
    });
    warehouseBId = warehouseB.id;

    const locationB = await prisma.location.create({
      data: {
        organizationId: orgBId,
        warehouseId: warehouseBId,
        name: "Register Counter Beta",
        code: "REG-02-BIN",
        status: "ACTIVE",
      },
    });
    locationBId = locationB.id;

    const productB = await prisma.product.create({
      data: {
        organizationId: orgBId,
        name: "Mechanical Keyboard",
        slug: "mechanical-keyboard-pos",
        sku: "KB-POS-001",
        costPrice: 1200,
        status: "ACTIVE",
      },
    });
    productBId = productB.id;
  }, 60000);

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pos-org-alpha", "pos-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["pos.user.a@pos-e2e.test", "pos.user.b@pos-e2e.test"],
        },
      },
    });
    await app.close();
  }, 60000);

  // ==================================================
  // 1. POS SESSION MANAGEMENT
  // ==================================================

  describe("1. POS Session Management", () => {
    it("should open a new POS session for Terminal REG-01", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/sessions/open")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          branchId: branchAId,
          warehouseId: warehouseAId,
          terminalId: "REG-01",
          openingCash: 1000,
          notes: "Morning Register Shift",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.terminalId).toBe("REG-01");
      expect(res.body.status).toBe("OPEN");
      expect(Number(res.body.openingCash)).toBe(1000);

      sessionAId = res.body.id;
    });

    it("should prevent opening a duplicate active session on Terminal REG-01", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/sessions/open")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          branchId: branchAId,
          warehouseId: warehouseAId,
          terminalId: "REG-01",
          openingCash: 500,
        })
        .expect(400);

      expect(res.body.message).toContain("already has an active OPEN session");
    });

    it("should retrieve active POS sessions", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/sessions?status=OPEN")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(sessionAId);
    });

    it("should suspend and resume a POS session", async () => {
      await request(app.getHttpServer())
        .post(`/pos/sessions/${sessionAId}/suspend`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/pos/sessions/${sessionAId}/resume`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(201);
    });
  });

  // ==================================================
  // 2. PRODUCT SEARCH & BARCODE SCANNING
  // ==================================================

  describe("2. Product Search & Barcode Scanning", () => {
    it("should search products by name", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/products/search?search=Mouse")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe("Wireless Gaming Mouse");
    });

    it("should find product by variant barcode scanner input", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/products/barcode/8901234567891")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(200);

      expect(res.body.product.id).toBe(productAId);
      expect(res.body.variant.id).toBe(variantAId);
      expect(res.body.price).toBe(99.99);
    });

    it("should enforce tenant isolation in product search", async () => {
      const res = await request(app.getHttpServer())
        .get("/pos/products/search?search=Mouse")
        .set("Authorization", `Bearer ${orgBToken}`)
        .set("x-organization-id", orgBId)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });
  });

  // ==================================================
  // 3. CART MANAGEMENT
  // ==================================================

  describe("3. POS Cart Management", () => {
    it("should create a new POS cart", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/carts")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          branchId: branchAId,
          warehouseId: warehouseAId,
          sessionId: sessionAId,
          customerId: customerAId,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("ACTIVE");
      cartAId = res.body.id;
    });

    it("should add an item to the cart and calculate totals", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/carts/${cartAId}/items`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          productId: productAId,
          variantId: variantAId,
          quantity: 2,
          unitPrice: 99.99,
          taxRate: 18,
        })
        .expect(201);

      expect(res.body.items.length).toBe(1);
      cartItemId = res.body.items[0].id;

      // 2 x 99.99 = 199.98 subtotal
      // 18% tax on 199.98 = 35.9964
      // Total = 235.9764
      expect(Number(res.body.subtotalAmount)).toBe(199.98);
      expect(Number(res.body.taxAmount)).toBeCloseTo(35.9964, 2);
    });

    it("should update item quantity in cart", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/pos/carts/${cartAId}/items/${cartItemId}`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          quantity: 3,
        })
        .expect(200);

      // 3 x 99.99 = 299.97 subtotal
      expect(Number(res.body.subtotalAmount)).toBe(299.97);
    });

    it("should hold and resume a cart", async () => {
      await request(app.getHttpServer())
        .post(`/pos/carts/${cartAId}/hold`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({ notes: "Customer forgot wallet" })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/pos/carts/${cartAId}/resume`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .expect(201);
    });
  });

  // ==================================================
  // 4. CHECKOUT & ATOMIC INVENTORY DEDUCTION
  // ==================================================

  describe("4. Checkout & Atomic Inventory Deduction", () => {
    it("should reject checkout if payment is insufficient", async () => {
      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: sessionAId,
          cartId: cartAId,
          payments: [
            { paymentMethod: "CASH", amount: 100, receivedAmount: 100 },
          ],
        })
        .expect(400);

      expect(res.body.message).toContain("Insufficient payment amount");
    });

    it("should perform atomic checkout with split payment & cash change calculation", async () => {
      // 3 x 99.99 = 299.97 subtotal + 18% tax (53.9946) = 353.9646 total
      // Payment: Cash 200 (received 500), Card 153.9646
      const res = await request(app.getHttpServer())
        .post("/pos/checkout")
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          sessionId: sessionAId,
          cartId: cartAId,
          payments: [
            { paymentMethod: "CASH", amount: 200, receivedAmount: 500 },
            {
              paymentMethod: "CREDIT_CARD",
              amount: 153.9646,
              referenceNumber: "TXN-998811",
            },
          ],
        })
        .expect(201);

      expect(res.body.sale.id).toBeDefined();
      expect(res.body.sale.receiptNumber).toMatch(/^POS-\d{4}-\d{6}$/);
      expect(res.body.salesOrder.status).toBe("DELIVERED");
      expect(res.body.salesInvoice.status).toBe("PAID");
      expect(res.body.deliveryNote.status).toBe("POSTED");

      expect(Number(res.body.sale.changeAmount)).toBe(300); // 500 - 200 = 300
      saleAId = res.body.sale.id;

      // Verify Stock onHand decremented by 3 (100 -> 97)
      const updatedStock = await prisma.stockLevel.findFirst({
        where: {
          organizationId: orgAId,
          warehouseId: warehouseAId,
          productId: productAId,
          variantId: variantAId,
        },
      });

      expect(Number(updatedStock?.onHand)).toBe(97);

      // Verify StockMovement SALE_SHIPMENT created
      const movement = await prisma.stockMovement.findFirst({
        where: {
          organizationId: orgAId,
          referenceType: "POS_SALE",
          referenceId: res.body.sale.receiptNumber,
        },
      });
      expect(movement).toBeDefined();
      expect(Number(movement?.quantity)).toBe(-3);
    });

    it("should close POS session and reconcile cash drawer", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/sessions/${sessionAId}/close`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          closingCash: 1200, // opening (1000) + cash payment (200) = 1200
          notes: "End of shift reconciliation",
        })
        .expect(201);

      expect(res.body.status).toBe("CLOSED");
      expect(Number(res.body.expectedCash)).toBe(1200);
      expect(Number(res.body.cashDifference)).toBe(0);
    });
  });

  // ==================================================
  // 5. REFUNDS VIA SALES RETURN INTEGRATION
  // ==================================================

  describe("5. Refunds via Sales Return Integration", () => {
    it("should process a refund and restock inventory", async () => {
      const res = await request(app.getHttpServer())
        .post(`/pos/sales/${saleAId}/refund`)
        .set("Authorization", `Bearer ${orgAToken}`)
        .set("x-organization-id", orgAId)
        .send({
          notes: "Customer returned full order",
        })
        .expect(201);

      expect(res.body.saleId).toBe(saleAId);
      expect(res.body.salesReturn.status).toBe("POSTED");

      // Verify Stock onHand restocked back from 97 to 100
      const restockedLevel = await prisma.stockLevel.findFirst({
        where: {
          organizationId: orgAId,
          warehouseId: warehouseAId,
          productId: productAId,
          variantId: variantAId,
        },
      });

      expect(Number(restockedLevel?.onHand)).toBe(100);
    });
  });

  // ==================================================
  // 6. MULTI-TENANT SECURITY
  // ==================================================

  describe("6. Multi-Tenant Security", () => {
    it("should prevent Org B from accessing Org A POS sale", async () => {
      await request(app.getHttpServer())
        .get(`/pos/sales/${saleAId}`)
        .set("Authorization", `Bearer ${orgBToken}`)
        .set("x-organization-id", orgBId)
        .expect(404);
    });

    it("should prevent Org B from opening session in Org A warehouse", async () => {
      await request(app.getHttpServer())
        .post("/pos/sessions/open")
        .set("Authorization", `Bearer ${orgBToken}`)
        .set("x-organization-id", orgBId)
        .send({
          branchId: branchAId,
          warehouseId: warehouseAId,
          terminalId: "REG-ILLEGAL",
          openingCash: 100,
        })
        .expect(400);
    });
  });
});
