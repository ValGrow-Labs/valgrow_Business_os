import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testProductPersistence() {
  const org = await prisma.organization.findFirst();

  if (!org) {
    console.error("No organization found in database!");
    process.exit(1);
  }

  console.log(`Found organization: ${org.name} (${org.id})`);

  const testSku = `TEST-SKU-${Date.now()}`;
  console.log(`Creating product with SKU ${testSku}...`);

  const created = await prisma.product.create({
    data: {
      organizationId: org.id,
      name: "Test Organic Green Tea",
      slug: `test-organic-green-tea-${Date.now()}`,
      sku: testSku,
      barcode: "890000000001",
      type: "PHYSICAL",
      status: "ACTIVE",
      costPrice: 150.00,
      description: "Test product created for verification",
    },
  });

  console.log("Created product in PostgreSQL:", created.id, created.name, created.sku);

  console.log("Updating product in PostgreSQL...");
  const updated = await prisma.product.update({
    where: { id: created.id },
    data: {
      name: "Test Organic Green Tea (Updated)",
      costPrice: 175.50,
      status: "DRAFT",
    },
  });

  console.log("Updated product in PostgreSQL:", updated.id, updated.name, updated.costPrice, updated.status);

  // Clean up test product
  await prisma.product.delete({ where: { id: created.id } });
  console.log("Cleaned up test product.");

  await prisma.$disconnect();
}

testProductPersistence().catch((e) => {
  console.error(e);
  process.exit(1);
});
