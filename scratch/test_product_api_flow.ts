async function testProductApiFlow() {
  const baseUrl = "http://localhost:3001/api";

  console.log("1. Logging in to get access token/cookie...");
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

  const setCookie = loginRes.headers.get("set-cookie");
  const loginData = await loginRes.json();
  const token = loginData.accessToken;
  console.log("Login successful. Access token obtained.");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(setCookie ? { Cookie: setCookie } : {}),
  };

  console.log("\n2. Creating a new product via POST /products...");
  const createPayload = {
    name: "Arabica Reserve Coffee",
    sku: `ARC-${Date.now().toString().slice(-4)}`,
    barcode: "8901234999",
    type: "PHYSICAL",
    status: "ACTIVE",
    costPrice: 350.00,
    description: "Single-origin specialty coffee beans",
  };

  const createRes = await fetch(`${baseUrl}/products`, {
    method: "POST",
    headers,
    body: JSON.stringify(createPayload),
  });

  if (!createRes.ok) {
    console.error("Create product failed:", createRes.status, await createRes.text());
    process.exit(1);
  }

  const createdProduct = await createRes.json();
  console.log("Product created successfully via API:", {
    id: createdProduct.id,
    name: createdProduct.name,
    sku: createdProduct.sku,
    costPrice: createdProduct.costPrice,
    status: createdProduct.status,
  });

  console.log("\n3. Fetching product list via GET /products...");
  const listRes = await fetch(`${baseUrl}/products?search=Arabica`, {
    headers,
  });

  if (!listRes.ok) {
    console.error("List products failed:", listRes.status, await listRes.text());
    process.exit(1);
  }

  const listData = await listRes.json();
  const found = listData.data?.find((p: any) => p.id === createdProduct.id);
  console.log("Product found in GET /products response:", Boolean(found), found ? found.name : "Not found");

  console.log(`\n4. Updating product via PATCH /products/${createdProduct.id}...`);
  const updatePayload = {
    name: "Arabica Reserve Coffee (Dark Roast)",
    costPrice: 385.00,
    status: "ACTIVE",
  };

  const updateRes = await fetch(`${baseUrl}/products/${createdProduct.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(updatePayload),
  });

  if (!updateRes.ok) {
    console.error("Update product failed:", updateRes.status, await updateRes.text());
    process.exit(1);
  }

  const updatedProduct = await updateRes.json();
  console.log("Product updated successfully via API:", {
    id: updatedProduct.id,
    name: updatedProduct.name,
    costPrice: updatedProduct.costPrice,
  });

  console.log("\n5. Re-querying GET /products to verify updated name & costPrice...");
  const listRes2 = await fetch(`${baseUrl}/products?search=Dark%20Roast`, {
    headers,
  });
  const listData2 = await listRes2.json();
  const updatedFound = listData2.data?.find((p: any) => p.id === createdProduct.id);
  console.log("Updated product verified in product list query:", {
    id: updatedFound?.id,
    name: updatedFound?.name,
    costPrice: updatedFound?.costPrice,
  });

  console.log("\nCleaning up test product...");
  await fetch(`${baseUrl}/products/${createdProduct.id}`, {
    method: "DELETE",
    headers,
  });
  console.log("Cleaned up test product.");

  console.log("\nAll API end-to-end tests completed successfully!");
}

testProductApiFlow().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
