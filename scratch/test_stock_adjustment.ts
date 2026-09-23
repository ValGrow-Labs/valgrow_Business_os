import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "http://127.0.0.1:3001";

async function testStockAdjustment() {
  console.log("--- STARTING STOCK ADJUSTMENT END-TO-END TEST ---");

  // 1. Authenticate / get login cookie
  console.log("1. Authenticating user (alex.verma@valgrow.dev)...");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex.verma@valgrow.dev",
      password: "DevelopmentPass123!",
    }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const setCookie = loginRes.headers.get("set-cookie") || "";
  const headers = {
    "Content-Type": "application/json",
    Cookie: setCookie,
  };

  // 2. Find "test rice" product
  console.log("\n2. Finding 'test rice' product in database...");
  const testRice = await prisma.product.findFirst({
    where: { name: { contains: "test rice", mode: "insensitive" } },
  });

  if (!testRice) {
    console.error("Test Rice product not found in database!");
    process.exit(1);
  }
  console.log(`Found 'test rice': ID=${testRice.id}, SKU=${testRice.sku}`);

  // 3. Ensure a Warehouse and Location exist
  let warehouse = await prisma.warehouse.findFirst({
    where: { organizationId: testRice.organizationId, deletedAt: null },
    include: { locations: true },
  });

  if (!warehouse || warehouse.locations.length === 0) {
    console.log("No warehouse/location found. Creating default warehouse and location via API...");
    const whRes = await fetch(`${baseUrl}/warehouses`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Main Warehouse",
        code: `WH-MAIN-${Date.now().toString().slice(-4)}`,
        isDefault: true,
      }),
    });
    const newWh = await whRes.json();

    const locRes = await fetch(`${baseUrl}/warehouses/${newWh.id}/locations`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: "Default Bin",
        code: `LOC-MAIN-${Date.now().toString().slice(-4)}`,
        isDefault: true,
      }),
    });
    const newLoc = await locRes.json();

    warehouse = { ...newWh, locations: [newLoc] };
  }

  const activeWarehouse = warehouse!;
  const activeLocation = activeWarehouse.locations[0]!;
  console.log(`Active Warehouse: ${activeWarehouse.name} (${activeWarehouse.id})`);
  console.log(`Active Location: ${activeLocation.name} (${activeLocation.id})`);

  // 4. Perform Stock Adjustment: Increase Test Rice by 50 units
  console.log("\n3. Posting Stock Adjustment: Increasing 'test rice' stock by 50 units...");
  const adjPayload = {
    adjustmentNumber: `ADJ-TEST-${Date.now().toString().slice(-6)}`,
    warehouseId: activeWarehouse.id,
    reason: "OPENING_BALANCE",
    notes: "Initial stock addition for test rice verification",
    items: [
      {
        locationId: activeLocation.id,
        productId: testRice.id,
        currentQty: 0,
        adjustedQty: 50,
        newQty: 50,
        unitCost: Number(testRice.costPrice || 150),
      },
    ],
  };

  const adjRes = await fetch(`${baseUrl}/inventory/adjustments`, {
    method: "POST",
    headers,
    body: JSON.stringify(adjPayload),
  });

  if (!adjRes.ok) {
    console.error("Stock adjustment API failed:", adjRes.status, await adjRes.text());
    process.exit(1);
  }

  const adjData = await adjRes.json();
  console.log("Stock Adjustment posted successfully via API:", {
    adjustmentId: adjData.id,
    adjustmentNumber: adjData.adjustmentNumber,
  });

  // 5. Query GET /inventory/stock to verify stock level
  console.log("\n4. Verifying stock level via GET /inventory/stock...");
  const stockRes = await fetch(`${baseUrl}/inventory/stock?productId=${testRice.id}`, {
    headers,
  });

  if (!stockRes.ok) {
    console.error("GET /inventory/stock failed:", stockRes.status, await stockRes.text());
    process.exit(1);
  }

  const stockData = await stockRes.json();
  const riceStock = stockData.data?.find((s: any) => s.productId === testRice.id);

  console.log("Queried Stock Level for 'test rice':", {
    onHand: riceStock?.onHand,
    reserved: riceStock?.reserved,
    available: riceStock?.available,
  });

  if (riceStock && Number(riceStock.onHand) === 50 && Number(riceStock.available) === 50) {
    console.log("SUCCESS: Stock level is verified as exactly 50 units!");
  } else {
    console.error(`FAIL: Expected 50 units on hand, but got ${riceStock?.onHand}`);
    process.exit(1);
  }

  // 6. Verify persistence in PostgreSQL database
  console.log("\n5. Verifying StockLevel & StockMovement records directly in PostgreSQL DB...");
  const dbStockLevel = await prisma.stockLevel.findFirst({
    where: { productId: testRice.id, locationId: activeLocation.id },
  });

  console.log("PostgreSQL StockLevel record:", {
    id: dbStockLevel?.id,
    onHand: Number(dbStockLevel?.onHand),
    version: dbStockLevel?.version,
  });

  const dbMovement = await prisma.stockMovement.findFirst({
    where: { productId: testRice.id, referenceId: adjData.id },
  });

  console.log("PostgreSQL StockMovement record:", {
    id: dbMovement?.id,
    movementType: dbMovement?.movementType,
    quantity: Number(dbMovement?.quantity),
    unitCost: Number(dbMovement?.unitCost),
    referenceType: dbMovement?.referenceType,
    referenceId: dbMovement?.referenceId,
  });

  if (dbStockLevel && Number(dbStockLevel.onHand) === 50 && dbMovement && Number(dbMovement.quantity) === 50) {
    console.log("SUCCESS: Database persistence verified! StockLevel onHand is 50 and StockMovement record exists.");
  } else {
    console.error("FAIL: Database verification failed.");
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("\n--- ALL STOCK ADJUSTMENT TESTS PASSED SUCCESSFULLY! ---");
}

testStockAdjustment().catch((e) => {
  console.error(e);
  process.exit(1);
});
