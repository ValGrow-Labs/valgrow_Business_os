import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "http://localhost:3001";

async function testAuthRefreshFlow() {
  console.log("--- STARTING AUTH REFRESH FLOW VERIFICATION ---");

  // 1. Get test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in DB!");
    process.exit(1);
  }
  console.log(`Test user: ${user.email}`);

  // 2. Perform Login to get valid refresh_token cookie
  console.log("1. Logging in via POST /auth/login...");
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      password: "DevelopmentPass123!",
    }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const setCookieHeader = loginRes.headers.get("set-cookie") || "";
  console.log("Set-Cookie header received from login:", Boolean(setCookieHeader));

  // Extract cookies
  const cookies = setCookieHeader.split(/,(?=[^;]+;)/).map((c) => c.trim());
  const refreshTokenCookie = cookies.find((c) => c.startsWith("refresh_token="));
  const accessTokenCookie = cookies.find((c) => c.startsWith("access_token="));

  console.log("Access Token Cookie present:", Boolean(accessTokenCookie));
  console.log("Refresh Token Cookie present:", Boolean(refreshTokenCookie));

  if (!refreshTokenCookie) {
    console.error("No refresh token cookie received!");
    process.exit(1);
  }

  // 3. Test simulating an expired access token by sending ONLY the refresh_token cookie to a protected endpoint
  console.log("\n2. Testing protected endpoint GET /products with ONLY refresh_token (simulating expired access_token)...");
  const protectedRes = await fetch(`${baseUrl}/products`, {
    headers: {
      Cookie: refreshTokenCookie, // No access_token included!
    },
  });

  console.log(`GET /products response status without access_token: ${protectedRes.status}`);
  if (protectedRes.status === 401) {
    console.log("SUCCESS: Protected endpoint correctly rejected request without access_token (401 Unauthorized).");
  } else {
    console.error("FAIL: Expected 401 status.");
    process.exit(1);
  }

  // 4. Test calling POST /auth/refresh with the refresh_token cookie
  console.log("\n3. Testing POST /auth/refresh with refresh_token cookie...");
  const refreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: refreshTokenCookie,
    },
  });

  console.log(`POST /auth/refresh status: ${refreshRes.status}`);
  if (refreshRes.ok) {
    const refreshSetCookie = refreshRes.headers.get("set-cookie") || "";
    console.log("SUCCESS: Refresh succeeded! New cookies set:", Boolean(refreshSetCookie));

    const newCookies = refreshSetCookie.split(/,(?=[^;]+;)/).map((c) => c.trim());
    const newAccessToken = newCookies.find((c) => c.startsWith("access_token="));
    const newRefreshToken = newCookies.find((c) => c.startsWith("refresh_token="));

    console.log("New Access Token Cookie present:", Boolean(newAccessToken));
    console.log("New Refresh Token Cookie present:", Boolean(newRefreshToken));

    // 5. Test making protected request with the NEW access_token cookie
    console.log("\n4. Retrying GET /products with newly refreshed access_token...");
    const retryRes = await fetch(`${baseUrl}/products`, {
      headers: {
        Cookie: `${newAccessToken}; ${newRefreshToken}`,
      },
    });

    console.log(`GET /products status after refresh: ${retryRes.status}`);
    if (retryRes.ok) {
      console.log("SUCCESS: Protected request retry succeeded after token refresh!");
    } else {
      console.error("FAIL: Retried request failed with status:", retryRes.status);
      process.exit(1);
    }
  } else {
    console.error("FAIL: Token refresh failed:", refreshRes.status, await refreshRes.text());
    process.exit(1);
  }

  // 6. Test invalid refresh token (should return 401)
  console.log("\n5. Testing POST /auth/refresh with invalid refresh_token...");
  const invalidRefreshRes = await fetch(`${baseUrl}/auth/refresh`, {
    method: "POST",
    headers: {
      Cookie: "refresh_token=invalid_token_string",
    },
  });

  console.log(`POST /auth/refresh with invalid token status: ${invalidRefreshRes.status}`);
  if (invalidRefreshRes.status === 401) {
    console.log("SUCCESS: Invalid refresh token correctly rejected (401 Unauthorized).");
  } else {
    console.error("FAIL: Expected 401 for invalid refresh token.");
    process.exit(1);
  }

  await prisma.$disconnect();
  console.log("\n--- ALL AUTH REFRESH TESTS PASSED SUCCESSFULLY! ---");
}

testAuthRefreshFlow().catch((e) => {
  console.error(e);
  process.exit(1);
});
