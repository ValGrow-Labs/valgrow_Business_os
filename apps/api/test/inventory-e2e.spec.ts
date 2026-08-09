import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

describe("ValGrow Business OS — Inventory Domain & Security E2E Tests", () => {
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

  // Master Data & Inventory IDs for Org A
  let prodA1Id: string;
  let prodA2Id: string;
  let variantA1Id: string;
  let whA1Id: string;
  let whA2Id: string;
  let locA1Id: string;
  let locA2Id: string;
  let batchAId: string;
  let serialAId: string;

  // Master Data & Inventory IDs for Org B
  let whBId: string;
  let locBId: string;
  let prodBId: string;

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
        email: { in: ["inv.user.a@inv-e2e.test", "inv.user.b@inv-e2e.test"] },
      },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: { in: ["inv-org-alpha", "inv-org-beta"] },
      },
    });

    // Register Tenant A
    const resA = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "inv.user.a@inv-e2e.test",
        password: "Password123!",
        firstName: "Inventory",
        lastName: "UserA",
        organizationName: "Inventory Alpha",
        organizationSlug: "inv-org-alpha",
      });
    userACookie = resA.headers["set-cookie"];
    userAToken = resA.body.tokens.accessToken;
    orgAId = resA.body.activeOrganization.id;

    // Register Tenant B
    const resB = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "inv.user.b@inv-e2e.test",
        password: "Password123!",
        firstName: "Inventory",
        lastName: "UserB",
        organizationName: "Inventory Beta",
        organizationSlug: "inv-org-beta",
      });
    userBCookie = resB.headers["set-cookie"];
    userBToken = resB.body.tokens.accessToken;
    orgBId = resB.body.activeOrganization.id;

    // Create Products in Org A & Org B
    const pA1 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Alpha Widget", sku: "ALPHA-WDG-01", costPrice: 100 });
    prodA1Id = pA1.body.id;

    const pA2 = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Alpha Shirt", sku: "ALPHA-SHIRT-01", hasVariants: true });
    prodA2Id = pA2.body.id;

    const vA1 = await request(app.getHttpServer())
      .post(`/products/${prodA2Id}/variants`)
      .set("Cookie", userACookie)
      .set("Authorization", `Bearer ${userAToken}`)
      .send({ name: "Medium / Red", sku: "ALPHA-SHIRT-M-RED" });
    variantA1Id = vA1.body.id;

    const pB = await request(app.getHttpServer())
      .post("/products")
      .set("Cookie", userBCookie)
      .set("Authorization", `Bearer ${userBToken}`)
      .send({ name: "Beta Gadget", sku: "BETA-GDG-01", costPrice: 50 });
    prodBId = pB.body.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: {
          email: { in: ["inv.user.a@inv-e2e.test", "inv.user.b@inv-e2e.test"] },
        },
      });
      await prisma.organization.deleteMany({
        where: { slug: { in: ["inv-org-alpha", "inv-org-beta"] } },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  }, 60000);

  describe("1. Warehouse & Location Management", () => {
    it("should create Warehouses in Org A and Org B", async () => {
      const resA1 = await request(app.getHttpServer())
        .post("/warehouses")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          name: "Main Depot",
          code: "DEPOT-01",
          city: "Bengaluru",
          isDefault: true,
        })
        .expect(201);
      whA1Id = resA1.body.id;

      const resA2 = await request(app.getHttpServer())
        .post("/warehouses")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Annex Hub", code: "HUB-02", city: "Mumbai" })
        .expect(201);
      whA2Id = resA2.body.id;

      const resB = await request(app.getHttpServer())
        .post("/warehouses")
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Beta Storage", code: "BETA-WH-01", city: "Delhi" })
        .expect(201);
      whBId = resB.body.id;
    });

    it("should create Locations within Warehouses", async () => {
      const locA1 = await request(app.getHttpServer())
        .post(`/warehouses/${whA1Id}/locations`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Shelf A1", code: "SH-A1", isDefault: true })
        .expect(201);
      locA1Id = locA1.body.id;

      const locA2 = await request(app.getHttpServer())
        .post(`/warehouses/${whA2Id}/locations`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Bin B2", code: "BIN-B2" })
        .expect(201);
      locA2Id = locA2.body.id;

      const locB = await request(app.getHttpServer())
        .post(`/warehouses/${whBId}/locations`)
        .set("Cookie", userBCookie)
        .set("Authorization", `Bearer ${userBToken}`)
        .send({ name: "Rack R1", code: "RACK-R1" })
        .expect(201);
      locBId = locB.body.id;
    });

    it("🔒 Reject Location creation for a Warehouse belonging to another Org", async () => {
      await request(app.getHttpServer())
        .post(`/warehouses/${whBId}/locations`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ name: "Hacked Loc", code: "HACK-01" })
        .expect(404);
    });
  });

  describe("2. Inventory Batches & Serial Numbers", () => {
    it("should create an Inventory Batch in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/inventory/batches")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          productId: prodA1Id,
          batchNumber: "BATCH-2026-A1",
          expiryDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          costPrice: 95.5,
        })
        .expect(201);

      expect(res.body.batchNumber).toBe("BATCH-2026-A1");
      batchAId = res.body.id;
    });

    it("🔒 Reject Batch creation with Product / Variant mismatch", async () => {
      await request(app.getHttpServer())
        .post("/inventory/batches")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          productId: prodA1Id, // Product A1
          variantId: variantA1Id, // Variant belongs to Product A2!
          batchNumber: "INVALID-BATCH",
          costPrice: 50,
        })
        .expect(400);
    });

    it("should create a Serial Number in Org A", async () => {
      const res = await request(app.getHttpServer())
        .post("/inventory/serial-numbers")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          productId: prodA1Id,
          locationId: locA1Id,
          serialNumber: "SN-ALPHA-001",
          status: "AVAILABLE",
        })
        .expect(201);

      expect(res.body.serialNumber).toBe("SN-ALPHA-001");
      serialAId = res.body.id;
    });

    it("🔒 Reject duplicate Serial Number within tenant", async () => {
      await request(app.getHttpServer())
        .post("/inventory/serial-numbers")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          productId: prodA1Id,
          locationId: locA1Id,
          serialNumber: "SN-ALPHA-001",
        })
        .expect(400);
    });
  });

  describe("3. Stock Movements & Atomic Transactions", () => {
    it("should post a PURCHASE_RECEIPT stock movement in Org A (Inbound)", async () => {
      const res = await request(app.getHttpServer())
        .post("/inventory/movements")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          warehouseId: whA1Id,
          locationId: locA1Id,
          productId: prodA1Id,
          batchId: batchAId,
          serialNumberId: serialAId,
          movementType: "PURCHASE_RECEIPT",
          quantity: 100,
          unitCost: 95.5,
          referenceType: "PO",
          referenceId: "PO-1001",
        })
        .expect(201);

      expect(res.body.movementType).toBe("PURCHASE_RECEIPT");
      expect(Number(res.body.quantity)).toBe(100);

      // Verify StockLevel snapshot was atomically updated (onHand = 100, reserved = 0, available = 100)
      const stockRes = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(stockRes.body.data[0].onHand).toBe(100);
      expect(stockRes.body.data[0].reserved).toBe(0);
      expect(stockRes.body.data[0].available).toBe(100);
    });

    it("🔒 Reject Outbound movement if available stock is insufficient", async () => {
      await request(app.getHttpServer())
        .post("/inventory/movements")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          warehouseId: whA1Id,
          locationId: locA1Id,
          productId: prodA1Id,
          batchId: batchAId,
          movementType: "SALE_SHIPMENT",
          quantity: -150, // Only 100 available!
          unitCost: 95.5,
        })
        .expect(400);

      // Verify transaction rolled back completely (onHand remains 100)
      const stockRes = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(stockRes.body.data[0].onHand).toBe(100);
    });
  });

  describe("4. Stock Reservations", () => {
    let resvId: string;

    it("should create an active StockReservation locking 20 units", async () => {
      const res = await request(app.getHttpServer())
        .post("/inventory/reservations")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          locationId: locA1Id,
          productId: prodA1Id,
          batchId: batchAId,
          quantity: 20,
          referenceType: "POS_CART",
          referenceId: "CART-99",
          expiresAt: new Date(Date.now() + 900000).toISOString(),
        })
        .expect(201);

      resvId = res.body.id;

      // Verify StockLevel snapshot: onHand = 100, reserved = 20, available = 80
      const stockRes = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(stockRes.body.data[0].onHand).toBe(100);
      expect(stockRes.body.data[0].reserved).toBe(20);
      expect(stockRes.body.data[0].available).toBe(80);
    });

    it("should fulfill reservation releasing reserved stock", async () => {
      await request(app.getHttpServer())
        .post(`/inventory/reservations/${resvId}/fulfill`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(201);

      // StockLevel reserved is now back to 0, available = 100
      const stockRes = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(stockRes.body.data[0].reserved).toBe(0);
      expect(stockRes.body.data[0].available).toBe(100);
    });
  });

  describe("5. Stock Transfers & Adjustments", () => {
    it("should post a StockTransfer between Warehouse A1 and Warehouse A2", async () => {
      const createRes = await request(app.getHttpServer())
        .post("/inventory/transfers")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          transferNumber: "TR-2026-001",
          sourceWarehouseId: whA1Id,
          destWarehouseId: whA2Id,
          items: [
            {
              productId: prodA1Id,
              batchId: batchAId,
              sourceLocationId: locA1Id,
              destLocationId: locA2Id,
              requestedQty: 30,
            },
          ],
        })
        .expect(201);

      const transferId = createRes.body.id;

      // Complete the transfer
      await request(app.getHttpServer())
        .patch(`/inventory/transfers/${transferId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ status: "COMPLETED" })
        .expect(200);

      // Verify Stock at Source (Loc A1 onHand = 70) and Destination (Loc A2 onHand = 30)
      const srcStock = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);
      expect(srcStock.body.data[0].onHand).toBe(70);

      const destStock = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA2Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);
      expect(destStock.body.data[0].onHand).toBe(30);
    });

    it("should post a StockAdjustment for damaged goods", async () => {
      await request(app.getHttpServer())
        .post("/inventory/adjustments")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          adjustmentNumber: "ADJ-DAMAGED-01",
          warehouseId: whA1Id,
          reason: "DAMAGED",
          items: [
            {
              locationId: locA1Id,
              productId: prodA1Id,
              batchId: batchAId,
              currentQty: 70,
              adjustedQty: -5,
              newQty: 65,
              unitCost: 95.5,
            },
          ],
        })
        .expect(201);

      // Loc A1 onHand is now 65
      const stockRes = await request(app.getHttpServer())
        .get(
          `/inventory/stock?locationId=${locA1Id}&productId=${prodA1Id}&batchId=${batchAId}`,
        )
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(stockRes.body.data[0].onHand).toBe(65);
    });
  });

  describe("6. Multi-Tenant Security Violations Isolation", () => {
    it("🔒 Org A cannot read Org B Stock Levels", async () => {
      const res = await request(app.getHttpServer())
        .get(`/inventory/stock?warehouseId=${whBId}`)
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });

    it("🔒 Org A cannot post Stock Movement to Org B Warehouse", async () => {
      await request(app.getHttpServer())
        .post("/inventory/movements")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          warehouseId: whBId, // Belongs to Org B!
          locationId: locBId,
          productId: prodA1Id,
          movementType: "OPENING_BALANCE",
          quantity: 10,
          unitCost: 100,
        })
        .expect(400);
    });

    it("🔒 Org A cannot create Stock Transfer referencing Org B Warehouse", async () => {
      await request(app.getHttpServer())
        .post("/inventory/transfers")
        .set("Cookie", userACookie)
        .set("Authorization", `Bearer ${userAToken}`)
        .send({
          transferNumber: "TR-HACK-01",
          sourceWarehouseId: whA1Id,
          destWarehouseId: whBId, // Belongs to Org B!
          items: [
            {
              productId: prodA1Id,
              sourceLocationId: locA1Id,
              destLocationId: locBId,
              requestedQty: 5,
            },
          ],
        })
        .expect(400);
    });
  });
});
