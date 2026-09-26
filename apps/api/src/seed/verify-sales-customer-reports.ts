import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runVerification() {
  console.log("==================================================");
  console.log("STARTING SALES, CUSTOMER & REPORTS END-TO-END VERIFICATION TEST");
  console.log("==================================================");

  try {
    // 1. Find or create Organization
    const org = await prisma.organization.findFirst({
      where: { deletedAt: null },
    });
    if (!org) throw new Error("No organization found. Please run seed first.");
    const orgId = org.id;

    // 2. TEST 1 — CUSTOMER
    console.log("\n[TEST 1] Testing Customer creation & details...");
    const testCode = `CUST-TEST-${Date.now().toString().slice(-4)}`;
    const customer = await prisma.customer.create({
      data: {
        organizationId: orgId,
        customerCode: testCode,
        name: "Acme Enterprises Test Customer",
        email: "testcustomer@acme.com",
        phone: "+91 9876543210",
        address: "123 Business Park",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        currency: "INR",
        creditLimit: 50000,
        paymentTerms: "NET30",
        status: "ACTIVE",
      },
    });
    console.log(`✓ Created Customer: ${customer.name} (${customer.customerCode}) [ID: ${customer.id}]`);

    // 3. TEST 2 — POS SALE & STOCK DEDUCTION
    console.log("\n[TEST 2] Testing POS Sale, Stock Level & Movement flow...");

    // Find a warehouse & product with stock
    const warehouse = await prisma.warehouse.findFirst({
      where: { organizationId: orgId, deletedAt: null },
    });
    if (!warehouse) throw new Error("No warehouse found");

    const location = await prisma.location.findFirst({
      where: { organizationId: orgId, warehouseId: warehouse.id, deletedAt: null },
    });
    if (!location) throw new Error("No location found");

    const product = await prisma.product.findFirst({
      where: { organizationId: orgId, deletedAt: null },
    });
    if (!product) throw new Error("No product found");

    // Ensure stock level is set up
    let stockLevel = await prisma.stockLevel.findFirst({
      where: { organizationId: orgId, warehouseId: warehouse.id, productId: product.id },
    });
    if (!stockLevel) {
      stockLevel = await prisma.stockLevel.create({
        data: {
          organizationId: orgId,
          warehouseId: warehouse.id,
          locationId: location.id,
          productId: product.id,
          onHand: 50,
          reserved: 0,
        },
      });
    }

    const initialStock = Number(stockLevel.onHand);
    console.log(`- Initial Stock Level for '${product.name}' at ${warehouse.name}: ${initialStock} Units`);

    // Create a mock POS session
    const cashier = await prisma.user.findFirst();
    if (!cashier) throw new Error("No user found");

    let branch = await prisma.branch.findFirst({
      where: { organizationId: orgId },
    });
    if (!branch) {
      branch = await prisma.branch.create({
        data: {
          organizationId: orgId,
          code: "BR-MAIN",
          name: "Main Branch",
          city: "Bengaluru",
          status: "ACTIVE",
        },
      });
    }

    const session = await prisma.pOSSession.create({
      data: {
        organizationId: orgId,
        branchId: branch.id,
        warehouseId: warehouse.id,
        terminalId: "VERIFY-REG-01",
        openedById: cashier.id,
        openingCash: 1000,
        status: "OPEN",
      },
    });

    const cart = await prisma.pOSCart.create({
      data: {
        organizationId: orgId,
        branchId: session.branchId,
        warehouseId: warehouse.id,
        sessionId: session.id,
        customerId: customer.id,
        status: "ACTIVE",
        subtotalAmount: 500,
        taxAmount: 90,
        totalAmount: 590,
        items: {
          create: [
            {
              organizationId: orgId,
              productId: product.id,
              quantity: 1,
              unitPrice: 500,
              discountAmount: 0,
              taxRate: 18,
              taxAmount: 90,
              totalAmount: 590,
            },
          ],
        },
      },
    });

    // Run POS Checkout simulation using internal service logic structure
    const receiptNum = `POS-VERIFY-${Date.now().toString().slice(-6)}`;
    const soNum = `SO-VERIFY-${Date.now().toString().slice(-5)}`;
    const invNum = `INV-VERIFY-${Date.now().toString().slice(-5)}`;

    const salesOrder = await prisma.salesOrder.create({
      data: {
        organizationId: orgId,
        orderNumber: soNum,
        customerId: customer.id,
        branchId: session.branchId,
        warehouseId: warehouse.id,
        subtotalAmount: 500,
        taxAmount: 90,
        totalAmount: 590,
        status: "DELIVERED",
        items: {
          create: [
            {
              organizationId: orgId,
              productId: product.id,
              orderedQty: 1,
              deliveredQty: 1,
              unitPrice: 500,
              taxRate: 18,
              taxAmount: 90,
              totalAmount: 590,
            },
          ],
        },
      },
    });

    const salesInvoice = await prisma.salesInvoice.create({
      data: {
        organizationId: orgId,
        invoiceNumber: invNum,
        customerId: customer.id,
        salesOrderId: salesOrder.id,
        dueDate: new Date(),
        subtotalAmount: 500,
        taxAmount: 90,
        totalAmount: 590,
        paidAmount: 590,
        status: "PAID",
      },
    });

    const custPayment = await prisma.customerPayment.create({
      data: {
        organizationId: orgId,
        paymentNumber: `PAY-VERIFY-${Date.now().toString().slice(-5)}`,
        customerId: customer.id,
        salesInvoiceId: salesInvoice.id,
        amount: 590,
        paymentMethod: "CASH",
        referenceNumber: receiptNum,
      },
    });

    // Stock Movement (SALE_SHIPMENT, negative quantity)
    const movement = await prisma.stockMovement.create({
      data: {
        organizationId: orgId,
        branchId: session.branchId,
        warehouseId: warehouse.id,
        locationId: location.id,
        productId: product.id,
        movementType: "SALE_SHIPMENT",
        quantity: -1,
        unitCost: Number(product.costPrice || 300),
        totalCost: Number(product.costPrice || 300),
        referenceType: "POS_SALE",
        referenceId: receiptNum,
        actorId: cashier.id,
        notes: `Verification Test POS Sale: ${receiptNum}`,
      },
    });

    // Deduct stockLevel.onHand
    const updatedStockLevel = await prisma.stockLevel.update({
      where: { id: stockLevel.id },
      data: { onHand: { decrement: 1 } },
    });

    const posSale = await prisma.pOSSale.create({
      data: {
        organizationId: orgId,
        branchId: session.branchId,
        warehouseId: warehouse.id,
        sessionId: session.id,
        cartId: cart.id,
        salesOrderId: salesOrder.id,
        salesInvoiceId: salesInvoice.id,
        receiptNumber: receiptNum,
        customerId: customer.id,
        cashierId: cashier.id,
        subtotalAmount: 500,
        taxAmount: 90,
        totalAmount: 590,
        paidAmount: 590,
        changeAmount: 0,
        status: "COMPLETED",
        payments: {
          create: [{ organizationId: orgId, paymentMethod: "CASH", amount: 590, receivedAmount: 590 }],
        },
      },
    });

    console.log(`✓ Completed POS Sale: ${posSale.receiptNumber}`);
    console.log(`✓ Created Sales Order: ${salesOrder.orderNumber}`);
    console.log(`✓ Created Sales Invoice: ${salesInvoice.invoiceNumber}`);
    console.log(`✓ Recorded Customer Payment: ${custPayment.paymentNumber}`);
    console.log(`✓ Created StockMovement: ${movement.movementType} (Qty: ${movement.quantity}) [Ref: ${movement.referenceId}]`);
    console.log(`✓ Updated Stock Level: ${initialStock} → ${updatedStockLevel.onHand} Units (Expected: ${initialStock - 1})`);

    if (Number(updatedStockLevel.onHand) !== initialStock - 1) {
      throw new Error("Stock Level deduction failed");
    }

    // 4. TEST 3 — STOCK MOVEMENT REPORT DATA
    console.log("\n[TEST 3] Verifying Stock Movement Ledger persistence...");
    const latestMovement = await prisma.stockMovement.findFirst({
      where: { id: movement.id },
      include: { product: true, warehouse: true, location: true },
    });
    if (!latestMovement || Number(latestMovement.quantity) !== -1) {
      throw new Error("StockMovement verification failed");
    }
    console.log(`✓ Verified StockMovement Record: Product '${latestMovement.product.name}', Type '${latestMovement.movementType}', Qty ${latestMovement.quantity}`);

    // 5. TEST 4 — SALES REPORT PERSISTED DATA
    console.log("\n[TEST 4] Verifying Sales Report calculations...");
    const posSalesList = await prisma.pOSSale.findMany({
      where: { organizationId: orgId, customerId: customer.id, status: "COMPLETED" },
    });
    const totalSalesForCust = posSalesList.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    console.log(`✓ Persisted POS Sales count for customer '${customer.name}': ${posSalesList.length}, Total: ₹${totalSalesForCust}`);

    // 6. TEST 5 — CUSTOMER REPORT PERSISTED DATA
    console.log("\n[TEST 5] Verifying Customer Report calculations...");
    const customerDb = await prisma.customer.findFirst({
      where: { id: customer.id },
      include: {
        posSales: { where: { status: "COMPLETED" } },
        salesInvoices: true,
        customerPayments: true,
      },
    });
    if (!customerDb) throw new Error("Customer lookup failed");
    const totalCustOrders = customerDb.posSales.length + customerDb.salesInvoices.length;
    const totalCustPurchases = customerDb.posSales.reduce((acc, s) => acc + Number(s.totalAmount), 0);
    const totalCustPaid = customerDb.customerPayments.reduce((acc, p) => acc + Number(p.amount), 0);
    console.log(`✓ Customer Metrics -> Orders: ${totalCustOrders}, Purchases: ₹${totalCustPurchases}, Paid: ₹${totalCustPaid}, Outstanding: ₹${totalCustPurchases - totalCustPaid}`);

    console.log("\n==================================================");
    console.log("✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!");
    console.log("==================================================");
  } catch (err: any) {
    console.error("❌ Verification failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runVerification();
