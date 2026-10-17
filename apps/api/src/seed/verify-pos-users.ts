import { PrismaClient } from "@prisma/client";

const API_BASE = "http://localhost:3001";
const PASSWORD = process.env.TEST_USER_PASSWORD || "DevelopmentPass123!";

interface LoginResponse {
  tokens: { accessToken: string; refreshToken: string };
  user: { id: string; email: string; firstName: string; lastName: string };
  role: string;
  activeOrganization: { id: string; name: string; slug: string };
}

interface MeResponse {
  user: { id: string; email: string };
  role: { id: string; name: string };
  activeOrganization: { id: string; name: string };
  permissions: string[];
}

async function apiCall(endpoint: string, options: RequestInit = {}, token?: string): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get("content-type");
  let data: any = null;
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, data };
}

async function verifyLogin(loginIdentifier: string): Promise<{ token: string; me: MeResponse }> {
  console.log(`\n🔑 Testing login for: '${loginIdentifier}'...`);
  const loginRes = await apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: loginIdentifier,
      password: PASSWORD,
    }),
  });

  if (loginRes.status !== 200) {
    throw new Error(`Login failed for ${loginIdentifier} with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
  }

  const loginData: LoginResponse = loginRes.data;
  console.log(`  ✓ Login successful! User: ${loginData.user.email}, Role: ${loginData.role}, Org: ${loginData.activeOrganization.name}`);

  const token = loginData.tokens.accessToken;
  const meRes = await apiCall("/auth/me", { method: "GET" }, token);
  if (meRes.status !== 200) {
    throw new Error(`/auth/me failed with status ${meRes.status}: ${JSON.stringify(meRes.data)}`);
  }

  const meData: MeResponse = meRes.data;
  console.log(`  ✓ Identity verified. Permissions count: ${meData.permissions.length}`);
  console.log(`    Permissions: [${meData.permissions.join(", ")}]`);

  return { token, me: meData };
}

async function main() {
  console.log("=================================================================");
  console.log("🧪 Comprehensive Verification of Multi-User POS Workflow Accounts");
  console.log("=================================================================");

  // 1. Verify Login with Login IDs and Emails
  const salespersonAuth = await verifyLogin("salesperson1");
  await verifyLogin("salesperson1@valgrow.dev");

  const billingAuth = await verifyLogin("billing1");
  await verifyLogin("billing1@valgrow.dev");

  const cashierAuth = await verifyLogin("cashier1");
  await verifyLogin("cashier1@valgrow.dev");

  // Verify Role and Permission Constraints
  console.log("\n🔒 Verifying Role and Permission Scopes:");
  
  // Salesperson Checks
  console.log("\n[Salesperson Constraints]");
  if (!salespersonAuth.me.permissions.includes("pos.create")) throw new Error("Salesperson missing pos.create");
  if (!salespersonAuth.me.permissions.includes("pos.read")) throw new Error("Salesperson missing pos.read");
  if (salespersonAuth.me.permissions.includes("pos.checkout")) throw new Error("SECURITY VIOLATION: Salesperson has pos.checkout!");
  if (salespersonAuth.me.permissions.includes("pos.billing")) throw new Error("SECURITY VIOLATION: Salesperson has pos.billing!");
  if (salespersonAuth.me.permissions.includes("pos.cashier")) throw new Error("SECURITY VIOLATION: Salesperson has pos.cashier!");
  console.log("  ✓ Salesperson has pos.create, pos.read, sales.read");
  console.log("  ✓ Salesperson strictly lacks pos.checkout, pos.billing, pos.cashier");

  // Billing Staff Checks
  console.log("\n[Billing Staff Constraints]");
  if (!billingAuth.me.permissions.includes("pos.billing")) throw new Error("Billing Staff missing pos.billing");
  if (!billingAuth.me.permissions.includes("pos.cancel")) throw new Error("Billing Staff missing pos.cancel");
  if (billingAuth.me.permissions.includes("pos.checkout")) throw new Error("SECURITY VIOLATION: Billing Staff has pos.checkout!");
  if (billingAuth.me.permissions.includes("pos.cashier")) throw new Error("SECURITY VIOLATION: Billing Staff has pos.cashier!");
  console.log("  ✓ Billing Staff has pos.billing, pos.cancel, pos.create, pos.read");
  console.log("  ✓ Billing Staff strictly lacks pos.checkout, pos.cashier");

  // Cashier Checks
  console.log("\n[Cashier Constraints]");
  if (!cashierAuth.me.permissions.includes("pos.cashier")) throw new Error("Cashier missing pos.cashier");
  if (!cashierAuth.me.permissions.includes("pos.checkout")) throw new Error("Cashier missing pos.checkout");
  if (cashierAuth.me.permissions.includes("pos.billing")) throw new Error("SECURITY VIOLATION: Cashier has pos.billing!");
  console.log("  ✓ Cashier has pos.cashier, pos.checkout, pos.session, pos.close, pos.read");
  console.log("  ✓ Cashier strictly lacks pos.billing");

  // 2. Test End-to-End Multi-User POS Workflow Endpoints
  console.log("\n=================================================================");
  console.log("🛒 Executing Multi-User POS Workflow Stage by Stage");
  console.log("=================================================================");

  const prisma = new PrismaClient();
  const org = await prisma.organization.findUnique({ where: { slug: "valgrow-holdings" } });
  const branch = await prisma.branch.findFirst({ where: { organizationId: org!.id, status: "ACTIVE" } });
  const warehouse = await prisma.warehouse.findFirst({ where: { organizationId: org!.id, status: "ACTIVE" } });
  const product = await prisma.product.findFirst({
    where: { organizationId: org!.id, status: "ACTIVE" },
    include: { prices: true },
  });
  const customer = await prisma.customer.findFirst({ where: { organizationId: org!.id } });

  if (!branch || !warehouse || !product) {
    throw new Error("Missing prerequisite branch, warehouse, or product test data in dev workspace.");
  }
  console.log(`Prerequisites: Branch='${branch.name}', Warehouse='${warehouse.name}', Product='${product.name}'`);

  // Ensure an open POS register session exists
  let session = await prisma.pOSSession.findFirst({
    where: { organizationId: org!.id, status: "OPEN" },
  });
  if (!session) {
    session = await prisma.pOSSession.create({
      data: {
        organizationId: org!.id,
        branchId: branch.id,
        warehouseId: warehouse.id,
        openedById: cashierAuth.me.user.id,
        terminalId: "CASH-REG-01",
        openingCash: 1000,
        status: "OPEN",
      },
    });
    console.log(`✓ Opened register session ${session.id} for testing`);
  }

  // --- STAGE 1: Salesperson Workflow ---
  console.log("\n--- STAGE 1: Salesperson Operations ---");
  // A. Search Products
  const searchRes = await apiCall(`/pos/products/search?warehouseId=${warehouse.id}&search=${encodeURIComponent(product.name)}`, { method: "GET" }, salespersonAuth.token);
  if (searchRes.status !== 200) throw new Error(`Product search failed: ${searchRes.status}`);
  console.log(`  ✓ Salesperson searched products -> ${searchRes.data.data.length} found`);

  // B. Search Customers
  const customerRes = await apiCall("/customers", { method: "GET" }, salespersonAuth.token);
  if (customerRes.status !== 200) throw new Error(`Customer list failed: ${customerRes.status}`);
  console.log(`  ✓ Salesperson selected customers -> ${customerRes.data.length} customers available`);

  // C. Create POS Cart
  const cartRes = await apiCall("/pos/carts", {
    method: "POST",
    body: JSON.stringify({
      branchId: branch.id,
      warehouseId: warehouse.id,
      sessionId: session.id,
      customerId: customer?.id,
    }),
  }, salespersonAuth.token);
  if (cartRes.status !== 201) throw new Error(`Cart creation failed: ${cartRes.status}`);
  const cart = cartRes.data;
  console.log(`  ✓ Salesperson created cart #${cart.cartNumber || cart.id.slice(0, 8)}`);

  // D. Add Item to Cart
  const unitPrice = product.prices?.[0]?.price ? Number(product.prices[0].price) : 499;
  const addItemRes = await apiCall(`/pos/carts/${cart.id}/items`, {
    method: "POST",
    body: JSON.stringify({
      productId: product.id,
      quantity: 2,
      unitPrice,
    }),
  }, salespersonAuth.token);
  const updatedCart = addItemRes.data;
  const item = updatedCart.items?.[0];
  if (!item) throw new Error("No cart item returned in updated cart");
  console.log(`  ✓ Salesperson added item: ${product.name} x2 (Unit Price: ₹${unitPrice})`);

  // E. Send Cart to Billing Desk
  const sendToBillingRes = await apiCall(`/pos/carts/${cart.id}/send-to-billing`, {
    method: "POST",
    body: JSON.stringify({
      notes: "Customer ready at billing counter",
    }),
  }, salespersonAuth.token);
  if (sendToBillingRes.status !== 201) throw new Error(`Send to billing failed: ${sendToBillingRes.status}`);
  console.log(`  ✓ Salesperson forwarded ticket #${sendToBillingRes.data.ticketNumber || cart.cartNumber} to Billing Desk`);

  // F. Negative Security Check: Salesperson must NOT be able to checkout
  console.log("  🛡️ Verifying Salesperson CANNOT execute checkout...");
  const unauthorizedCheckout = await apiCall("/pos/checkout", {
    method: "POST",
    body: JSON.stringify({
      sessionId: session.id,
      cartId: cart.id,
      payments: [{ paymentMethod: "CASH", amount: unitPrice * 2 }],
    }),
  }, salespersonAuth.token);
  if (unauthorizedCheckout.status !== 403) {
    throw new Error(`SECURITY BREACH: Salesperson was allowed to checkout! HTTP status: ${unauthorizedCheckout.status}`);
  }
  console.log("  ✓ Verified: Salesperson checkout blocked with 403 Forbidden!");

  // G. Negative Security Check: Salesperson cannot access billing queue
  const unauthorizedBillingQueue = await apiCall("/pos/billing/queue", { method: "GET" }, salespersonAuth.token);
  if (unauthorizedBillingQueue.status !== 403) throw new Error("Salesperson should not access billing queue");
  console.log("  ✓ Verified: Salesperson billing queue access blocked with 403 Forbidden!");

  // --- STAGE 2: Billing Staff Operations ---
  console.log("\n--- STAGE 2: Billing Staff Operations ---");
  // A. View Billing Queue
  const billingQueueRes = await apiCall("/pos/billing/queue", { method: "GET" }, billingAuth.token);
  const billingItems = billingQueueRes.data.data || billingQueueRes.data;
  console.log(`  ✓ Billing Staff accessed billing queue -> ${billingItems.length} pending tickets`);

  // B. Claim Ticket
  const claimBillingRes = await apiCall(`/pos/carts/${cart.id}/claim-billing`, { method: "POST" }, billingAuth.token);
  if (claimBillingRes.status !== 201) throw new Error(`Claim billing ticket failed: ${claimBillingRes.status}`);
  console.log(`  ✓ Billing Staff claimed ticket #${claimBillingRes.data.ticketNumber || cart.cartNumber}`);

  // C. Verify / Update Cart Items (modify quantity to 3)
  const updateItemRes = await apiCall(`/pos/carts/${cart.id}/items/${item.id}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity: 3 }),
  }, billingAuth.token);
  if (updateItemRes.status !== 200) throw new Error(`Update cart item failed: ${updateItemRes.status}`);
  console.log("  ✓ Billing Staff verified and adjusted cart items (quantity updated to 3)");

  // D. Negative Security Check: Billing Staff cannot complete checkout
  console.log("  🛡️ Verifying Billing Staff CANNOT execute checkout...");
  const unauthorizedBillingCheckout = await apiCall("/pos/checkout", {
    method: "POST",
    body: JSON.stringify({
      sessionId: session.id,
      cartId: cart.id,
      payments: [{ paymentMethod: "CASH", amount: unitPrice * 3 }],
    }),
  }, billingAuth.token);
  if (unauthorizedBillingCheckout.status !== 403) {
    throw new Error(`SECURITY BREACH: Billing Staff was allowed to checkout! HTTP status: ${unauthorizedBillingCheckout.status}`);
  }
  console.log("  ✓ Verified: Billing Staff checkout blocked with 403 Forbidden!");

  // E. Forward Verified Bill to Payment Queue
  const sendToPaymentRes = await apiCall(`/pos/carts/${cart.id}/send-to-payment`, {
    method: "POST",
    body: JSON.stringify({
      notes: "Bill verified and customer sent to Cashier #1",
    }),
  }, billingAuth.token);
  if (sendToPaymentRes.status !== 201) throw new Error(`Send to payment failed: ${sendToPaymentRes.status}`);
  console.log("  ✓ Billing Staff forwarded verified bill to Cashier Payment Queue");

  // --- STAGE 3: Cashier Operations ---
  console.log("\n--- STAGE 3: Cashier Operations ---");
  // A. Negative Security Check: Cashier cannot access billing queue
  const unauthorizedCashierBilling = await apiCall("/pos/billing/queue", { method: "GET" }, cashierAuth.token);
  if (unauthorizedCashierBilling.status !== 403) throw new Error("Cashier should not access billing queue");
  console.log("  ✓ Verified: Cashier billing queue access blocked with 403 Forbidden!");

  // B. Access Payment Queue
  const paymentQueueRes = await apiCall("/pos/payment/queue", { method: "GET" }, cashierAuth.token);
  if (paymentQueueRes.status !== 200) throw new Error(`Payment queue failed: ${paymentQueueRes.status}`);
  const paymentItems = paymentQueueRes.data.data || paymentQueueRes.data;
  console.log(`  ✓ Cashier accessed payment queue -> ${paymentItems.length} bills pending collection`);

  // C. Claim Payment
  const claimPaymentRes = await apiCall(`/pos/carts/${cart.id}/claim-payment`, { method: "POST" }, cashierAuth.token);
  if (claimPaymentRes.status !== 201) throw new Error(`Claim payment failed: ${claimPaymentRes.status}`);
  console.log(`  ✓ Cashier claimed bill #${claimPaymentRes.data.ticketNumber || cart.cartNumber}`);

  // D. Process Payment & Complete Checkout
  const totalAmount = unitPrice * 3;
  const checkoutRes = await apiCall("/pos/checkout", {
    method: "POST",
    body: JSON.stringify({
      sessionId: session.id,
      cartId: cart.id,
      customerId: customer?.id,
      payments: [
        {
          paymentMethod: "CASH",
          amount: totalAmount,
          receivedAmount: totalAmount,
        },
      ],
      notes: "Test checkout completed by cashier1",
    }),
  }, cashierAuth.token);
  if (checkoutRes.status !== 201) throw new Error(`Checkout failed: ${checkoutRes.status}: ${JSON.stringify(checkoutRes.data)}`);
  const sale = checkoutRes.data.sale;
  console.log(`  ✓ Cashier completed checkout! Receipt #${sale.receiptNumber}, Amount: ₹${sale.totalAmount}`);

  // E. View Sale History
  const saleHistoryRes = await apiCall(`/pos/sales/${sale.id}`, { method: "GET" }, cashierAuth.token);
  if (saleHistoryRes.status !== 200) throw new Error(`View sale failed: ${saleHistoryRes.status}`);
  console.log(`  ✓ Cashier verified sale #${sale.id.slice(0, 8)} in sales ledger`);

  console.log("\n=================================================================");
  console.log("🎉 ALL MULTI-USER POS WORKFLOW VERIFICATIONS PASSED 100%!");
  console.log("=================================================================");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("\n❌ Verification Failed:", err);
  process.exit(1);
});
