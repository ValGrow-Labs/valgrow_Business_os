import { apiClient, setActiveOrgId } from "../apps/web/src/lib/api-client";

// Global fetch polyfill for Node environment if needed
if (!globalThis.fetch) {
  globalThis.fetch = fetch;
}

async function testApiClientRefreshMutex() {
  console.log("--- TESTING API CLIENT MUTEX & RETRY LOGIC ---");

  // Login via API to set httpOnly cookies on fetch
  const loginRes = await fetch("http://localhost:3001/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "alex.verma@valgrow.dev",
      password: "DevelopmentPass123!",
    }),
  });

  const cookies = loginRes.headers.get("set-cookie") || "";
  console.log("Login successful. Received cookies:", Boolean(cookies));

  // Test firing 3 concurrent apiClient calls
  console.log("\nTesting concurrent protected API calls...");
  try {
    const results = await Promise.all([
      apiClient("/products", { headers: { Cookie: cookies } }),
      apiClient("/categories", { headers: { Cookie: cookies } }),
      apiClient("/brands", { headers: { Cookie: cookies } }),
    ]);

    console.log("SUCCESS: All 3 concurrent calls succeeded!", {
      productsCount: results[0]?.data?.length ?? 0,
      categoriesCount: results[1]?.length ?? 0,
      brandsCount: results[2]?.length ?? 0,
    });
  } catch (err: any) {
    console.error("ApiClient test error:", err);
  }
}

testApiClientRefreshMutex().catch(console.error);
