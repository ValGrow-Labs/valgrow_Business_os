import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Sales Domain & Security E2E Tests", () => {
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

  // Created Sales IDs in Org A
  let customerAId: string;
  let quoteAId: string;
  let soAId: string;
  let soItemAId: string;
  let dnAId: string;
  let invoiceAId: string;
  let paymentAId: string;
  let returnAId: string;
  let cnAId: string;

  // Created Sales IDs in Org B
  let customerBId: string;
  let soBId: string;
  let invoiceBId: string;

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
      where: { slug: { in: ["sales-org-alpha", "sales-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["sales.user.a@sales-e2e.test", "sales.user.b@sales-e2e.test"],
        },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "sales.user.a@sales-e2e.test",
        password: "Password123!",
        firstName: "Sales",
        lastName: "UserA",
        organizationName: "Sales Alpha",
        organizationSlug: "sales-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "sales.user.b@sales-e2e.test",
        password: "Password123!",
        firstName: "Sales",
        lastName: "UserB",
        organizationName: "Sales Beta",
        organizationSlug: "sales-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;

    // Setup Master Data for Org A
    const whA = await prisma.warehouse.create({
      data: {
        organizationId: orgAId,
        name: "Main Sales WH A",
        code: "MSWH-A",
      },
    });
    whAId = whA.id;

    const locA = await prisma.location.create({
      data: {
        organizationId: orgAId,
        warehouseId: whAId,
        name: "Sales Bin A1",
        code: "SBIN-A1",
      },
    });
    locAId = locA.id;

    const prodA = await prisma.product.create({
      data: {
        organizationId: orgAId,
        name: "Widget Pro Sales",
        slug: "widget-pro-sales",
        sku: "WGT-PRO-S",
        costPrice: 50,
      },
    });
    prodAId = prodA.id;

    const variantA = await prisma.productVariant.create({
      data: {
        organizationId: orgAId,
        productId: prodAId,
        name: "Widget Pro Red",
        sku: "WGT-PRO-S-RED",
      },
    });
    variantAId = variantA.id;

    // Stock for Org A
    await prisma.stockLevel.create({
      data: {
        organizationId: orgAId,
        warehouseId: whAId,
        locationId: locAId,
        productId: prodAId,
        variantId: variantAId,
        onHand: 500,
        reserved: 0,
      },
    });
    await prisma.inventoryCostLayer.create({
      data: {
        organizationId: orgAId,
        warehouseId: whAId,
        locationId: locAId,
        productId: prodAId,
        variantId: variantAId,
        initialQty: 500,
        remainingQty: 500,
        unitCost: 50,
        status: "ACTIVE",
      },
    });

    // Setup Master Data for Org B
    const whB = await prisma.warehouse.create({
      data: {
        organizationId: orgBId,
        name: "Main Sales WH B",
        code: "MSWH-B",
      },
    });
    whBId = whB.id;

    const locB = await prisma.location.create({
      data: {
        organizationId: orgBId,
        warehouseId: whBId,
        name: "Sales Bin B1",
        code: "SBIN-B1",
      },
    });
    locBId = locB.id;

    const prodB = await prisma.product.create({
      data: {
        organizationId: orgBId,
        name: "Gadget Beta Sales",
        slug: "gadget-beta-sales",
        sku: "GDT-BETA-S",
        costPrice: 70,
      },
    });
    prodBId = prodB.id;
  }, 60000);

  afterAll(async () => {
    await prisma.organization.deleteMany({
      where: { slug: { in: ["sales-org-alpha", "sales-org-beta"] } },
    });
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ["sales.user.a@sales-e2e.test", "sales.user.b@sales-e2e.test"],
        },
      },
    });
    await app.close();
  }, 60000);

  // ==================================================
  // 1. CUSTOMERS
  // ==================================================

  describe("1. Customers Module", () => {
    it("should create a customer for Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/customers")
        .set("Cookie", userACookie)
        .send({
          customerCode: "CUST-001",
          name: "Acme Corp",
          email: "acme@corp.test",
          phone: "+1234567890",
          city: "Metropolis",
          creditLimit: 50000,
          paymentTerms: "NET30",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.customerCode).toBe("CUST-001");
      customerAId = res.body.id;
    });

    it("should create a customer for Org B", async () => {
      const res = await request(app.getHttpServer())
        .post("/customers")
        .set("Cookie", userBCookie)
        .send({
          customerCode: "CUST-001", // same code in different org allowed
          name: "Stark Industries",
          email: "stark@industries.test",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      customerBId = res.body.id;
    });

    it("should reject duplicate customer code in same org", async () => {
      await request(app.getHttpServer())
        .post("/customers")
        .set("Cookie", userACookie)
        .send({
          customerCode: "CUST-001",
          name: "Acme Duplicate",
        })
        .expect(400);
    });

    it("should list customers for Org A", async () => {
      const res = await request(app.getHttpServer())
        .get("/customers")
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(customerAId);
    });

    it("should update customer for Org A", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/customers/${customerAId}`)
        .set("Cookie", userACookie)
        .send({ name: "Acme Corporation Inc" })
        .expect(200);

      expect(res.body.name).toBe("Acme Corporation Inc");
    });
  });

  // ==================================================
  // 2. QUOTATIONS & WORKFLOW
  // ==================================================

  describe("2. Quotations Module", () => {
    it("should create a quotation for Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/quotations")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          warehouseId: whAId,
          currency: "INR",
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              quantity: 10,
              unitPrice: 100,
              taxRate: 18,
              discountAmount: 50,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.quotationNumber).toMatch(/^QUO-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      quoteAId = res.body.id;
    });

    it("should transition quotation state DRAFT -> SENT -> ACCEPTED", async () => {
      await request(app.getHttpServer())
        .post(`/quotations/${quoteAId}/send`)
        .set("Cookie", userACookie)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/quotations/${quoteAId}/accept`)
        .set("Cookie", userACookie)
        .expect(201);
    });

    it("should reject invalid state transition", async () => {
      // Cannot send an already ACCEPTED quotation
      await request(app.getHttpServer())
        .post(`/quotations/${quoteAId}/send`)
        .set("Cookie", userACookie)
        .expect(400);
    });

    it("should convert ACCEPTED quotation to Sales Order", async () => {
      const res = await request(app.getHttpServer())
        .post(`/quotations/${quoteAId}/convert`)
        .set("Cookie", userACookie)
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toMatch(/^SO-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      expect(res.body.customerId).toBe(customerAId);
      expect(res.body.items.length).toBe(1);

      // Verify quotation is now CONVERTED
      const qRes = await request(app.getHttpServer())
        .get(`/quotations/${quoteAId}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(qRes.body.status).toBe("CONVERTED");
    });
  });

  // ==================================================
  // 3. SALES ORDERS & WORKFLOW
  // ==================================================

  describe("3. Sales Orders Module", () => {
    it("should create a direct Sales Order for Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/sales-orders")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          warehouseId: whAId,
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              orderedQty: 20,
              unitPrice: 120,
              taxRate: 18,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.orderNumber).toMatch(/^SO-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      soAId = res.body.id;
      soItemAId = res.body.items[0].id;
    });

    it("should transition SO status: DRAFT -> CONFIRMED -> PROCESSING", async () => {
      await request(app.getHttpServer())
        .post(`/sales-orders/${soAId}/confirm`)
        .set("Cookie", userACookie)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/sales-orders/${soAId}/process`)
        .set("Cookie", userACookie)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get(`/sales-orders/${soAId}`)
        .set("Cookie", userACookie)
        .expect(200);

      expect(res.body.status).toBe("PROCESSING");
    });
  });

  // ==================================================
  // 4. DELIVERY NOTES & INVENTORY INTEGRATION
  // ==================================================

  describe("4. Delivery Notes & Critical Inventory Transaction", () => {
    it("should create a DRAFT Delivery Note", async () => {
      const res = await request(app.getHttpServer())
        .post("/delivery-notes")
        .set("Cookie", userACookie)
        .send({
          salesOrderId: soAId,
          customerId: customerAId,
          warehouseId: whAId,
          items: [
            {
              salesOrderItemId: soItemAId,
              productId: prodAId,
              variantId: variantAId,
              locationId: locAId,
              quantity: 10, // partial delivery (10 of 20)
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.deliveryNumber).toMatch(/^DN-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      dnAId = res.body.id;
    });

    it("should reject delivery exceeding ordered quantity", async () => {
      await request(app.getHttpServer())
        .post("/delivery-notes")
        .set("Cookie", userACookie)
        .send({
          salesOrderId: soAId,
          customerId: customerAId,
          warehouseId: whAId,
          items: [
            {
              salesOrderItemId: soItemAId,
              productId: prodAId,
              variantId: variantAId,
              locationId: locAId,
              quantity: 25, // 25 > 20 remaining
            },
          ],
        })
        .expect(400);
    });

    it("should post Delivery Note atomically and update inventory", async () => {
      const initialStock = await prisma.stockLevel.findFirst({
        where: { organizationId: orgAId, locationId: locAId },
      });
      const initialOnHand = Number(initialStock?.onHand || 0);

      await request(app.getHttpServer())
        .post(`/delivery-notes/${dnAId}/post`)
        .set("Cookie", userACookie)
        .expect(201);

      // Verify StockMovement created
      const movement = await prisma.stockMovement.findFirst({
        where: {
          organizationId: orgAId,
          referenceId: dnAId,
          movementType: "SALE_SHIPMENT",
        },
      });
      expect(movement).toBeDefined();
      expect(Number(movement?.quantity)).toBe(-10);

      // Verify StockLevel decreased
      const updatedStock = await prisma.stockLevel.findFirst({
        where: { organizationId: orgAId, locationId: locAId },
      });
      expect(Number(updatedStock?.onHand)).toBe(initialOnHand - 10);

      // Verify SalesOrderItem.deliveredQty updated
      const soItem = await prisma.salesOrderItem.findUnique({
        where: { id: soItemAId },
      });
      expect(Number(soItem?.deliveredQty)).toBe(10);

      // Verify SalesOrder status updated to PARTIALLY_DELIVERED
      const so = await prisma.salesOrder.findUnique({
        where: { id: soAId },
      });
      expect(so?.status).toBe("PARTIALLY_DELIVERED");
    });
  });

  // ==================================================
  // 5. SALES INVOICES & PAYMENTS
  // ==================================================

  describe("5. Sales Invoices & Customer Payments", () => {
    it("should create and post a Sales Invoice", async () => {
      const res = await request(app.getHttpServer())
        .post("/sales-invoices")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          salesOrderId: soAId,
          dueDate: new Date(Date.now() + 864000000).toISOString(),
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              quantity: 10,
              unitPrice: 120,
              taxRate: 18,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.invoiceNumber).toMatch(/^SINV-\d{4}-\d{5}$/);
      expect(res.body.status).toBe("DRAFT");
      invoiceAId = res.body.id;

      await request(app.getHttpServer())
        .post(`/sales-invoices/${invoiceAId}/post`)
        .set("Cookie", userACookie)
        .expect(201);
    });

    it("should reject overpayment on customer payment", async () => {
      const inv = await prisma.salesInvoice.findUnique({
        where: { id: invoiceAId },
      });
      const overAmount = Number(inv?.totalAmount || 100) + 500;

      await request(app.getHttpServer())
        .post("/customer-payments")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          salesInvoiceId: invoiceAId,
          amount: overAmount,
          paymentMethod: "BANK_TRANSFER",
        })
        .expect(400);
    });

    it("should record valid customer payment and update invoice status to PAID", async () => {
      const inv = await prisma.salesInvoice.findUnique({
        where: { id: invoiceAId },
      });
      const totalAmt = Number(inv?.totalAmount);

      const res = await request(app.getHttpServer())
        .post("/customer-payments")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          salesInvoiceId: invoiceAId,
          amount: totalAmt,
          paymentMethod: "BANK_TRANSFER",
          referenceNumber: "TXN-998877",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      paymentAId = res.body.id;

      const updatedInv = await prisma.salesInvoice.findUnique({
        where: { id: invoiceAId },
      });
      expect(updatedInv?.status).toBe("PAID");
      expect(Number(updatedInv?.paidAmount)).toBe(totalAmt);
    });
  });

  // ==================================================
  // 6. SALES RETURNS & CREDIT NOTES
  // ==================================================

  describe("6. Sales Returns & Credit Notes", () => {
    it("should create and post a Sales Return (updating inventory)", async () => {
      const initialStock = await prisma.stockLevel.findFirst({
        where: { organizationId: orgAId, locationId: locAId },
      });
      const initialOnHand = Number(initialStock?.onHand || 0);

      const res = await request(app.getHttpServer())
        .post("/sales-returns")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          salesOrderId: soAId,
          salesInvoiceId: invoiceAId,
          warehouseId: whAId,
          items: [
            {
              productId: prodAId,
              variantId: variantAId,
              locationId: locAId,
              originalQty: 10,
              returnedQty: 2,
              reason: "DAMAGED",
              refundAmount: 240,
            },
          ],
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      returnAId = res.body.id;

      await request(app.getHttpServer())
        .post(`/sales-returns/${returnAId}/post`)
        .set("Cookie", userACookie)
        .expect(201);

      // Verify StockLevel increased by 2
      const updatedStock = await prisma.stockLevel.findFirst({
        where: { organizationId: orgAId, locationId: locAId },
      });
      expect(Number(updatedStock?.onHand)).toBe(initialOnHand + 2);

      // Verify StockMovement type CUSTOMER_RETURN
      const movement = await prisma.stockMovement.findFirst({
        where: {
          organizationId: orgAId,
          referenceId: returnAId,
          movementType: "CUSTOMER_RETURN",
        },
      });
      expect(movement).toBeDefined();
      expect(Number(movement?.quantity)).toBe(2);
    });

    it("should create, issue, and apply a Sales Credit Note", async () => {
      const res = await request(app.getHttpServer())
        .post("/sales-credit-notes")
        .set("Cookie", userACookie)
        .send({
          customerId: customerAId,
          salesInvoiceId: invoiceAId,
          salesReturnId: returnAId,
          amount: 240,
          reason: "Damaged item refund",
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.creditNoteNumber).toMatch(/^CN-\d{4}-\d{5}$/);
      cnAId = res.body.id;

      await request(app.getHttpServer())
        .post(`/sales-credit-notes/${cnAId}/issue`)
        .set("Cookie", userACookie)
        .expect(201);

      const updated = await request(app.getHttpServer())
        .post(`/sales-credit-notes/${cnAId}/apply`)
        .set("Cookie", userACookie)
        .expect(201);

      expect(updated.body.status).toBe("APPLIED");
    });
  });

  // ==================================================
  // 7. SECURITY & MULTI-TENANT ISOLATION TESTS
  // ==================================================

  describe("7. Security & Tenant Isolation", () => {
    it("should prevent Org B from reading Org A customer", async () => {
      await request(app.getHttpServer())
        .get(`/customers/${customerAId}`)
        .set("Cookie", userBCookie)
        .expect(404);
    });

    it("should prevent Org B from creating quotation using Org A customer", async () => {
      await request(app.getHttpServer())
        .post("/quotations")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerAId,
          warehouseId: whBId,
          items: [{ productId: prodBId, quantity: 1, unitPrice: 100 }],
        })
        .expect(400);
    });

    it("should prevent Org B from creating SO using Org A product", async () => {
      await request(app.getHttpServer())
        .post("/sales-orders")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerBId,
          warehouseId: whBId,
          items: [{ productId: prodAId, orderedQty: 1, unitPrice: 100 }],
        })
        .expect(400);
    });

    it("should prevent Org B from delivering against Org A SO", async () => {
      await request(app.getHttpServer())
        .post("/delivery-notes")
        .set("Cookie", userBCookie)
        .send({
          salesOrderId: soAId,
          customerId: customerBId,
          warehouseId: whBId,
          items: [
            {
              salesOrderItemId: soItemAId,
              productId: prodBId,
              locationId: locBId,
              quantity: 1,
            },
          ],
        })
        .expect(400);
    });

    it("should prevent Org B from creating invoice for Org A customer", async () => {
      await request(app.getHttpServer())
        .post("/sales-invoices")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerAId,
          dueDate: new Date().toISOString(),
          items: [{ productId: prodBId, quantity: 1, unitPrice: 100 }],
        })
        .expect(400);
    });

    it("should prevent Org B from creating payment against Org A invoice", async () => {
      await request(app.getHttpServer())
        .post("/customer-payments")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerBId,
          salesInvoiceId: invoiceAId,
          amount: 50,
        })
        .expect(400);
    });

    it("should prevent Org B from returning Org A sale", async () => {
      await request(app.getHttpServer())
        .post("/sales-returns")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerBId,
          salesOrderId: soAId,
          warehouseId: whBId,
          items: [
            {
              productId: prodBId,
              locationId: locBId,
              originalQty: 10,
              returnedQty: 1,
              refundAmount: 50,
            },
          ],
        })
        .expect(400);
    });

    it("should prevent Org B from creating credit note for Org A invoice", async () => {
      await request(app.getHttpServer())
        .post("/sales-credit-notes")
        .set("Cookie", userBCookie)
        .send({
          customerId: customerBId,
          salesInvoiceId: invoiceAId,
          amount: 50,
        })
        .expect(400);
    });
  });
});
