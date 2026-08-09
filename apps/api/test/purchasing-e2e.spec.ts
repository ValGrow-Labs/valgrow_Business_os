import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Purchasing Domain & Security E2E Tests", () => {
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

  // Master Data IDs for Org A
  let whAId: string;
  let locAId: string;
  let prodAId: string;
  let variantAId: string;

  // Master Data IDs for Org B
  let whBId: string;
  let locBId: string;
  let prodBId: string;

  // Created Purchasing IDs in Org A
  let supplierAId: string;
  let supplierContactAId: string;
  let prAId: string;
  let poAId: string;
  let poItemAId: string;
  let grnAId: string;
  let invoiceAId: string;
  let paymentAId: string;

  // Created Purchasing IDs in Org B
  let supplierBId: string;

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

    // Cleanup by deleting orgs (cascade deletes all related entities & members)
    await prisma.organization.deleteMany({
      where: { slug: { in: ["pur-org-alpha", "pur-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: { in: ["pur.user.a@pur-e2e.test", "pur.user.b@pur-e2e.test"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "pur.user.a@pur-e2e.test",
        password: "Password123!",
        firstName: "Purchasing",
        lastName: "UserA",
        organizationName: "Purchasing Alpha",
        organizationSlug: "pur-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "pur.user.b@pur-e2e.test",
        password: "Password123!",
        firstName: "Purchasing",
        lastName: "UserB",
        organizationName: "Purchasing Beta",
        organizationSlug: "pur-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;

    // Create Warehouse & Location for Org A
    const whARes = await request(app.getHttpServer())
      .post("/warehouses")
      .set("Cookie", userACookie)
      .send({ name: "Central Wh A", code: "WHA-01" });
    whAId = whARes.body.id;

    const locARes = await request(app.getHttpServer())
      .post(`/warehouses/${whAId}/locations`)
      .set("Cookie", userACookie)
      .send({ name: "Aisle A1", code: "LOCA-01" });
    locAId = locARes.body.id;

    // Create Product & Variant for Org A
    const prodARes = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .send({ name: "Laptop Core i7", sku: "PROD-A-01", type: "PHYSICAL" });
    prodAId = prodARes.body.id;

    const varARes = await request(app.getHttpServer())
      .post(`/products/${prodAId}/variants`)
      .set("Cookie", userACookie)
      .send({ name: "16GB RAM / 512GB SSD", sku: "VAR-A-01" });
    variantAId = varARes.body.id;

    // Create Warehouse & Location for Org B
    const whBRes = await request(app.getHttpServer())
      .post("/warehouses")
      .set("Cookie", userBCookie)
      .send({ name: "Central Wh B", code: "WHB-01" });
    whBId = whBRes.body.id;

    const locBRes = await request(app.getHttpServer())
      .post(`/warehouses/${whBId}/locations`)
      .set("Cookie", userBCookie)
      .send({ name: "Shelf B1", code: "LOCB-01" });
    locBId = locBRes.body.id;

    const prodBRes = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userBCookie)
      .send({ name: "Monitor 27 inch", sku: "PROD-B-01", type: "PHYSICAL" });
    prodBId = prodBRes.body.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.organization.deleteMany({
        where: { slug: { in: ["pur-org-alpha", "pur-org-beta"] } },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: ["pur.user.a@pur-e2e.test", "pur.user.b@pur-e2e.test"] },
        },
      });
      await prisma.$disconnect();
    }
  });

  // ==========================================
  // 1. SUPPLIERS & CONTACTS
  // ==========================================
  describe("1. Suppliers & Contacts CRUD", () => {
    it("should create a supplier in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/suppliers")
        .set("Cookie", userACookie)
        .send({
          name: "Acme Supplies Ltd",
          code: "SUP-ACME",
          email: "vendor@acme.com",
          phone: "+91 9876543210",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Acme Supplies Ltd");
      supplierAId = res.body.id;
    });

    it("should create a supplier in Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/suppliers")
        .set("Cookie", userBCookie)
        .send({
          name: "Beta Components Inc",
          code: "SUP-BETA",
        })
        .expect(201);

      supplierBId = res.body.id;
    });

    it("should reject duplicate supplier code in Org A", async () => {
      await request(app.getHttpServer())
        .post("/suppliers")
        .set("Cookie", userACookie)
        .send({ name: "Duplicate Code Inc", code: "SUP-ACME" })
        .expect(400);
    });

    it("should create a supplier contact", async () => {
      const res = await request(app.getHttpServer())
        .post(`/suppliers/${supplierAId}/contacts`)
        .set("Cookie", userACookie)
        .send({
          name: "John Manager",
          email: "john@acme.com",
          isPrimary: true,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      supplierContactAId = res.body.id;
    });

    it("should list suppliers for Org A", async () => {
      const res = await request(app.getHttpServer())
        .get("/suppliers")
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].id).toBe(supplierAId);
    });
  });

  // ==========================================
  // 2. PURCHASE REQUESTS & WORKFLOW
  // ==========================================
  describe("2. Purchase Requests Workflow", () => {
    it("should create a Purchase Request in DRAFT status", async () => {
      const res = await request(app.getHttpServer())
        .post("/purchase-requests")
        .set("Cookie", userACookie)
        .send({
          warehouseId: whAId,
          reason: "Q3 Hardware Refresh",
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              quantity: 10,
              estimatedCost: 50000,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.requestNumber).toMatch(/^PR-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      prAId = res.body.id;
    });

    it("should submit the Purchase Request (DRAFT -> SUBMITTED)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/purchase-requests/${prAId}/submit`)
        .set("Cookie", userACookie)
        .send({})
        .expect(201);

      expect(res.body.status).toBe("SUBMITTED");
    });

    it("should approve the Purchase Request (SUBMITTED -> APPROVED)", async () => {
      const res = await request(app.getHttpServer())
        .post(`/purchase-requests/${prAId}/approve`)
        .set("Cookie", userACookie)
        .send({ notes: "Approved by manager" })
        .expect(201);

      expect(res.body.status).toBe("APPROVED");
    });

    it("should reject invalid transition (APPROVED -> SUBMITTED)", async () => {
      await request(app.getHttpServer())
        .post(`/purchase-requests/${prAId}/submit`)
        .set("Cookie", userACookie)
        .send({})
        .expect(400);
    });
  });

  // ==========================================
  // 3. PURCHASE ORDERS & WORKFLOW
  // ==========================================
  describe("3. Purchase Orders Workflow", () => {
    it("should create a Purchase Order from PR", async () => {
      const res = await request(app.getHttpServer())
        .post("/purchase-orders")
        .set("Cookie", userACookie)
        .send({
          supplierId: supplierAId,
          purchaseRequestId: prAId,
          warehouseId: whAId,
          paymentTerms: "Net 30",
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              orderedQty: 10,
              unitPrice: 45000,
              taxRate: 18,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toMatch(/^PO-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      poAId = res.body.id;
      poItemAId = res.body.items[0].id;
    });

    it("should transition PO: DRAFT -> SUBMITTED -> APPROVED -> SENT", async () => {
      await request(app.getHttpServer())
        .post(`/purchase-orders/${poAId}/submit`)
        .set("Cookie", userACookie)
        .send({})
        .expect(201);

      await request(app.getHttpServer())
        .post(`/purchase-orders/${poAId}/approve`)
        .set("Cookie", userACookie)
        .send({})
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/purchase-orders/${poAId}/send`)
        .set("Cookie", userACookie)
        .send({})
        .expect(201);

      expect(res.body.status).toBe("SENT");
    });
  });

  // ==========================================
  // 4. GOODS RECEIPTS & TRANSACTIONAL INVENTORY
  // ==========================================
  describe("4. Goods Receipts & Inventory Integration", () => {
    it("should reject over-receiving against PO", async () => {
      await request(app.getHttpServer())
        .post("/goods-receipts")
        .set("Cookie", userACookie)
        .send({
          purchaseOrderId: poAId,
          supplierId: supplierAId,
          warehouseId: whAId,
          items: [
            {
              purchaseOrderItemId: poItemAId,
              productId: prodAId,
              variantId: variantAId,
              locationId: locAId,
              receivedQty: 15, // Only 10 ordered!
              unitCost: 45000,
            },
          ],
        })
        .expect(400);
    });

    it("should create DRAFT Goods Receipt for partial receipt (5 of 10)", async () => {
      const res = await request(app.getHttpServer())
        .post("/goods-receipts")
        .set("Cookie", userACookie)
        .send({
          purchaseOrderId: poAId,
          supplierId: supplierAId,
          warehouseId: whAId,
          items: [
            {
              purchaseOrderItemId: poItemAId,
              productId: prodAId,
              variantId: variantAId,
              locationId: locAId,
              batchNumber: "BATCH-2026-01",
              receivedQty: 5,
              unitCost: 45000,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.receiptNumber).toMatch(/^GRN-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      grnAId = res.body.id;
    });

    it("should POST Goods Receipt and execute atomic inventory updates", async () => {
      const res = await request(app.getHttpServer())
        .post(`/goods-receipts/${grnAId}/post`)
        .set("Cookie", userACookie)
        .expect(201);

      expect(res.body.status).toBe("POSTED");

      // Verify PO status updated to PARTIALLY_RECEIVED
      const poRes = await request(app.getHttpServer())
        .get(`/purchase-orders/${poAId}`)
        .set("Cookie", userACookie)
        .expect(200);
      expect(poRes.body.status).toBe("PARTIALLY_RECEIVED");

      // Verify StockLevel was updated
      const stockRes = await request(app.getHttpServer())
        .get(`/inventory/stock`)
        .set("Cookie", userACookie)
        .expect(200);
      const stockItem = stockRes.body.data.find(
        (s: any) => s.productId === prodAId && s.locationId === locAId,
      );
      expect(stockItem).toBeDefined();
      expect(Number(stockItem.onHand)).toBe(5);

      // Verify StockMovement record was created
      const movRes = await request(app.getHttpServer())
        .get(`/inventory/movements`)
        .set("Cookie", userACookie)
        .expect(200);
      const mov = movRes.body.data.find(
        (m: any) =>
          m.referenceId === grnAId && m.movementType === "PURCHASE_RECEIPT",
      );
      expect(mov).toBeDefined();
      expect(Number(mov.quantity)).toBe(5);
    });
  });

  // ==========================================
  // 5. LANDED COSTS
  // ==========================================
  describe("5. Landed Costs Allocation", () => {
    it("should allocate Freight landed cost to GRN and update cost layers", async () => {
      const res = await request(app.getHttpServer())
        .post("/landed-costs")
        .set("Cookie", userACookie)
        .send({
          goodsReceiptId: grnAId,
          costType: "FREIGHT",
          amount: 5000,
          notes: "Express freight charge",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(Number(res.body.amount)).toBe(5000);
    });
  });

  // ==========================================
  // 6. SUPPLIER INVOICES & PAYMENTS
  // ==========================================
  describe("6. Supplier Invoices & Payments", () => {
    it("should create a Supplier Invoice", async () => {
      const res = await request(app.getHttpServer())
        .post("/supplier-invoices")
        .set("Cookie", userACookie)
        .send({
          supplierId: supplierAId,
          purchaseOrderId: poAId,
          invoiceNumber: "INV-ACME-001",
          invoiceDate: "2026-08-01",
          dueDate: "2026-08-31",
          subtotalAmount: 225000,
          taxAmount: 40500,
          totalAmount: 265500,
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe("UNPAID");
      invoiceAId = res.body.id;
    });

    it("should run three-way match on invoice", async () => {
      const res = await request(app.getHttpServer())
        .get(`/supplier-invoices/${invoiceAId}/three-way-match`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.matched).toBeDefined();
    });

    it("should record a partial payment against the invoice", async () => {
      const res = await request(app.getHttpServer())
        .post("/supplier-payments")
        .set("Cookie", userACookie)
        .send({
          supplierId: supplierAId,
          supplierInvoiceId: invoiceAId,
          amount: 100000,
          paymentMethod: "BANK_TRANSFER",
          referenceNumber: "TXN-998877",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      paymentAId = res.body.id;

      // Verify invoice status updated to PARTIALLY_PAID
      const invRes = await request(app.getHttpServer())
        .get(`/supplier-invoices/${invoiceAId}`)
        .set("Cookie", userACookie)
        .expect(200);
      expect(invRes.body.status).toBe("PARTIALLY_PAID");
      expect(Number(invRes.body.paidAmount)).toBe(100000);
    });

    it("should reject overpayment beyond remaining balance", async () => {
      await request(app.getHttpServer())
        .post("/supplier-payments")
        .set("Cookie", userACookie)
        .send({
          supplierId: supplierAId,
          supplierInvoiceId: invoiceAId,
          amount: 200000, // Remaining is 165,500
          paymentMethod: "BANK_TRANSFER",
        })
        .expect(400);
    });
  });

  // ==========================================
  // 7. MULTI-TENANT SECURITY ISOLATION
  // ==========================================
  describe("7. Multi-Tenant Security Isolation", () => {
    it("Org B cannot read Org A's supplier", async () => {
      await request(app.getHttpServer())
        .get(`/suppliers/${supplierAId}`)
        .set("Cookie", userBCookie)
        .expect(404);
    });

    it("Org B cannot create PO using Org A's supplier", async () => {
      await request(app.getHttpServer())
        .post("/purchase-orders")
        .set("Cookie", userBCookie)
        .send({
          supplierId: supplierAId, // Belongs to Org A
          items: [{ productId: prodBId, orderedQty: 1, unitPrice: 100 }],
        })
        .expect(400);
    });

    it("Org B cannot create PO referencing Org A's product", async () => {
      await request(app.getHttpServer())
        .post("/purchase-orders")
        .set("Cookie", userBCookie)
        .send({
          supplierId: supplierBId,
          items: [{ productId: prodAId, orderedQty: 1, unitPrice: 100 }],
        })
        .expect(400);
    });

    it("Org B cannot receive against Org A's PO", async () => {
      await request(app.getHttpServer())
        .post("/goods-receipts")
        .set("Cookie", userBCookie)
        .send({
          purchaseOrderId: poAId,
          supplierId: supplierBId,
          warehouseId: whBId,
          items: [
            {
              purchaseOrderItemId: poItemAId,
              productId: prodBId,
              locationId: locBId,
              receivedQty: 1,
              unitCost: 100,
            },
          ],
        })
        .expect(400);
    });

    it("Org B cannot pay Org A's invoice", async () => {
      await request(app.getHttpServer())
        .post("/supplier-payments")
        .set("Cookie", userBCookie)
        .send({
          supplierId: supplierBId,
          supplierInvoiceId: invoiceAId,
          amount: 5000,
        })
        .expect(400);
    });
  });
});
