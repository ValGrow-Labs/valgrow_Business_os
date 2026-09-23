import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkInventorySetup() {
  const org = await prisma.organization.findFirst();
  console.log("Org:", org?.name, org?.id);

  const warehouses = await prisma.warehouse.findMany({
    include: { locations: true },
  });
  console.log("Warehouses found:", warehouses.length);
  for (const w of warehouses) {
    console.log(` - Warehouse: ${w.name} (${w.id}), Code: ${w.code}, Locations: ${w.locations.length}`);
    for (const l of w.locations) {
      console.log(`    * Location: ${l.name} (${l.id}), Code: ${l.code}`);
    }
  }

  const products = await prisma.product.findMany();
  console.log("\nProducts found:", products.length);
  for (const p of products) {
    console.log(` - Product: ${p.name} (${p.id}), SKU: ${p.sku}`);
  }

  const stockLevels = await prisma.stockLevel.findMany({
    include: { product: true, warehouse: true, location: true },
  });
  console.log("\nStockLevels found:", stockLevels.length);
  for (const s of stockLevels) {
    console.log(` - StockLevel: Product=${s.product?.name}, Warehouse=${s.warehouse?.name}, Location=${s.location?.name}, OnHand=${s.onHand}`);
  }

  await prisma.$disconnect();
}

checkInventorySetup().catch(console.error);
