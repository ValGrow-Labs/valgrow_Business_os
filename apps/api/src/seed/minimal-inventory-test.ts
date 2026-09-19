import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runMinimalInventoryTest() {
  console.log("🚀 Initializing Minimal Test Dataset for Inventory Modules...\n");

  // 1. Get Organization
  const org = await prisma.organization.findFirst({
    where: { slug: "valgrow-holdings" },
  });

  if (!org) {
    throw new Error("Development Organization not found! Run npm run seed first.");
  }

  // 2. Create or Get Warehouse & Location
  let warehouse = await prisma.warehouse.findFirst({
    where: { organizationId: org.id, code: "WH-TEST" },
  });

  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        organizationId: org.id,
        name: "Test Warehouse",
        code: "WH-TEST",
        status: "ACTIVE",
      },
    });
  }

  let location = await prisma.location.findFirst({
    where: { organizationId: org.id, warehouseId: warehouse.id, code: "LOC-TEST" },
  });

  if (!location) {
    location = await prisma.location.create({
      data: {
        organizationId: org.id,
        warehouseId: warehouse.id,
        name: "Aisle 1 - Shelf A",
        code: "LOC-TEST",
        status: "ACTIVE",
      },
    });
  }

  // 3. Create Minimal Products
  // Product 1: Valuation & Purchase Suggestion Test Item
  let prodVal = await prisma.product.findFirst({
    where: { organizationId: org.id, sku: "PROD-VAL-01" },
  });

  if (!prodVal) {
    prodVal = await prisma.product.create({
      data: {
        organizationId: org.id,
        name: "Smart Laptop Pro",
        slug: "smart-laptop-pro",
        sku: "PROD-VAL-01",
        costPrice: 150.00,
        status: "ACTIVE",
      },
    });
  }

  // Product 2: Cycle Count Test Item
  let prodCyc = await prisma.product.findFirst({
    where: { organizationId: org.id, sku: "PROD-CYC-02" },
  });

  if (!prodCyc) {
    prodCyc = await prisma.product.create({
      data: {
        organizationId: org.id,
        name: "Wireless Ergonomic Mouse",
        slug: "wireless-ergonomic-mouse",
        sku: "PROD-CYC-02",
        costPrice: 20.00,
        status: "ACTIVE",
      },
    });
  }

  // Product 3: Dead Stock & Analytics Test Item
  let prodDead = await prisma.product.findFirst({
    where: { organizationId: org.id, sku: "PROD-DEAD-03" },
  });

  if (!prodDead) {
    prodDead = await prisma.product.create({
      data: {
        organizationId: org.id,
        name: "Legacy VGA Adapter Cable",
        slug: "legacy-vga-adapter-cable",
        sku: "PROD-DEAD-03",
        costPrice: 5.00,
        status: "ACTIVE",
      },
    });
  }

  // 4. Create Stock Levels
  // Item 1: OnHand = 20, ReorderLevel = 25 (Triggers purchase suggestion!)
  await prisma.stockLevel.upsert({
    where: {
      organizationId_locationId_productId_variantId_batchId: {
        organizationId: org.id,
        locationId: location.id,
        productId: prodVal.id,
        variantId: "",
        batchId: "",
      },
    },
    update: { onHand: 20, reserved: 0, reorderLevel: 25, reorderQuantity: 50 },
    create: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      locationId: location.id,
      productId: prodVal.id,
      onHand: 20,
      reserved: 0,
      reorderLevel: 25,
      reorderQuantity: 50,
    },
  });

  // Item 2: OnHand = 50, ReorderLevel = 10 (Sufficient stock)
  await prisma.stockLevel.upsert({
    where: {
      organizationId_locationId_productId_variantId_batchId: {
        organizationId: org.id,
        locationId: location.id,
        productId: prodCyc.id,
        variantId: "",
        batchId: "",
      },
    },
    update: { onHand: 50, reserved: 0, reorderLevel: 10, reorderQuantity: 20 },
    create: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      locationId: location.id,
      productId: prodCyc.id,
      onHand: 50,
      reserved: 0,
      reorderLevel: 10,
      reorderQuantity: 20,
    },
  });

  // Item 3: OnHand = 100, ReorderLevel = 10 (Dead stock)
  await prisma.stockLevel.upsert({
    where: {
      organizationId_locationId_productId_variantId_batchId: {
        organizationId: org.id,
        locationId: location.id,
        productId: prodDead.id,
        variantId: "",
        batchId: "",
      },
    },
    update: { onHand: 100, reserved: 0, reorderLevel: 10, reorderQuantity: 20 },
    create: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      locationId: location.id,
      productId: prodDead.id,
      onHand: 100,
      reserved: 0,
      reorderLevel: 10,
      reorderQuantity: 20,
    },
  });

  // 5. Create FIFO Cost Layers for Product 1 (Smart Laptop Pro)
  await prisma.inventoryCostLayer.deleteMany({
    where: { organizationId: org.id, productId: prodVal.id },
  });

  // Layer 1: 10 units @ $100
  await prisma.inventoryCostLayer.create({
    data: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      locationId: location.id,
      productId: prodVal.id,
      initialQty: 10,
      remainingQty: 10,
      unitCost: 100.00,
      baseUnitCost: 100.00,
      status: "ACTIVE",
    },
  });

  // Layer 2: 10 units @ $200
  await prisma.inventoryCostLayer.create({
    data: {
      organizationId: org.id,
      warehouseId: warehouse.id,
      locationId: location.id,
      productId: prodVal.id,
      initialQty: 10,
      remainingQty: 10,
      unitCost: 200.00,
      baseUnitCost: 200.00,
      status: "ACTIVE",
    },
  });

  console.log("✅ Minimal Test Dataset created successfully!");
  console.log("--------------------------------------------------");
  console.log(`Organization ID: ${org.id}`);
  console.log(`Warehouse ID: ${warehouse.id}`);
  console.log(`Location ID: ${location.id}`);
  console.log(`Product 1 (Smart Laptop): ${prodVal.id} (OnHand: 20, Layers: 10@$100 + 10@$200)`);
  console.log(`Product 2 (Wireless Mouse): ${prodCyc.id} (OnHand: 50)`);
  console.log(`Product 3 (Legacy Cables): ${prodDead.id} (OnHand: 100, Dead Stock)`);
  console.log("--------------------------------------------------\n");
}

runMinimalInventoryTest()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
