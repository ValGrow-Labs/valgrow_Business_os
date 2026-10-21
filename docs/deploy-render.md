# Deploying ValGrow Business OS with Render (API) and Vercel (Web)

This guide walks you through deploying the **NestJS API on Render** and connecting it to your **frontend on Vercel**.

---

## Architecture

```
Browser ──► https://valgrow-business-os-t6x9-nine.vercel.app (Vercel)
               │
               ├── /api/* (Proxied by Vercel Nitro)
               ▼
            https://valgrow-api.onrender.com (Render API)
               ▼
            PostgreSQL (Render Postgres, Neon, Supabase, or Coolify)
```

By routing `/api/*` requests through Vercel's proxy to Render:
- Cookies remain first-party (`sameSite: lax`).
- You avoid cross-origin cookie blockers in Chrome/Safari.
- No CORS errors occur.

---

## Root Cause of the Errors

1. **`Cannot POST /organizations` (404)**:
   The frontend unified organization setup sends a `POST /api/organizations` request. The previously deployed API was running an older build that lacked the `@Post()` endpoint on `OrganizationsController` (added in commit `c2ec27a`). Deploying the updated codebase to Render resolves this.

2. **`Invalid email or password` (401)**:
   This occurs when attempting to sign in with credentials that do not exist or do not match in the active database. Once the database is seeded or an account is created via registration, authentication succeeds.

---

## Step 1: Deploy the API on Render

### Option A: Using Render Blueprints (Recommended - 1 Click)

1. Open [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Connect your GitHub repository (`valgrow_Business_os`).
4. Render will detect `render.yaml`.
5. Enter the required environment variables when prompted:
   - `DATABASE_URL`: Your PostgreSQL connection string (from Render Postgres, Neon, Supabase, etc.).
   - `WEB_URL`: Your Vercel frontend URL, e.g. `https://valgrow-business-os-t6x9-nine.vercel.app`.
6. Click **Apply**. Render will build and deploy the web service.

---

### Option B: Manual Web Service Setup on Render

If you prefer setting up the Web Service manually:

1. In Render Dashboard, click **New +** → **Web Service**.
2. Select your repository `valgrow_Business_os`, branch `main`.
3. Configure the settings:
   - **Name:** `valgrow-api`
   - **Region:** `Singapore` (or region closest to your users)
   - **Runtime:** `Node`
   - **Build Command:**
     ```bash
     npm ci && npx prisma generate && npm run build --workspace=apps/api
     ```
   - **Start Command:**
     ```bash
     npx prisma migrate deploy && node apps/api/dist/src/main.js
     ```
   - **Plan:** `Free`

4. Add the following **Environment Variables**:

   | Key | Value | Notes |
   |---|---|---|
   | `NODE_ENV` | `production` | Production mode |
   | `API_PORT` | `10000` | Port Render listens on |
   | `DATABASE_URL` | `postgresql://...` | Connection string to PostgreSQL |
   | `WEB_URL` | `https://valgrow-business-os-t6x9-nine.vercel.app` | Exact Vercel URL (no trailing slash) |
   | `JWT_SECRET` | *(64-character random string)* | Auth signing key |
   | `JWT_REFRESH_SECRET` | *(different 64-char random string)* | Refresh token key |
   | `JWT_EXPIRY` | `15m` | Token expiry |
   | `JWT_REFRESH_EXPIRY` | `7d` | Refresh expiry |
   | `BCRYPT_ROUNDS` | `12` | Password hashing work factor |
   | `COOKIE_SAME_SITE` | `lax` | Set to `lax` when using Vercel proxy |

5. Under **Advanced**, set **Health Check Path** to `/health`.
6. Click **Create Web Service**.

---

## Step 2: Seed the Database (Initial Setup)

Once the service status is **Live**:

1. In the Render service page, navigate to the **Shell** tab.
2. Run the production seed script:
   ```bash
   node apps/api/dist/src/seed/seed.js
   ```
3. This creates the system permissions, development organization (`valgrow-holdings`), roles, and the initial user:
   - **Email:** `alex.verma@valgrow.dev`
   - **Password:** `DevelopmentPass123!`

*(Note: If you are setting up your own company, you can also register a brand new workspace directly from the registration flow).*

---

## Step 3: Connect Vercel Frontend to Render API

1. Go to your [Vercel Dashboard](https://vercel.com) → open your project.
2. Navigate to **Settings** → **Environment Variables**.
3. Set or update:
   - `VITE_API_URL`: `/api`
   - `API_PROXY_TARGET`: Your Render API URL (e.g. `https://valgrow-api.onrender.com` — **no trailing slash**).
   - `NITRO_PRESET`: `vercel`
4. **Important:** Trigger a **Redeploy** on Vercel (Deployments → Three Dots on latest deployment → Redeploy) because `API_PROXY_TARGET` is baked into the server proxy rules at build time.

---

## Step 4: Verification Checklist

1. **Verify API Health:**
   Visit `https://valgrow-api.onrender.com/health` in your browser.
   Expected response:
   ```json
   {"status":"ok","service":"ValGrow Business OS API","timestamp":"..."}
   ```

2. **Verify Vercel Proxy:**
   Visit `https://valgrow-business-os-t6x9-nine.vercel.app/api/health`.
   It should return the exact same health JSON response.

3. **Verify Login:**
   Open `https://valgrow-business-os-t6x9-nine.vercel.app/login`.
   Enter:
   - Email: `alex.verma@valgrow.dev`
   - Password: `DevelopmentPass123!`
   Click **Sign in**. The application will authenticate and transition to the dashboard.

4. **Verify Organization Creation:**
   Navigate to the Organization Setup modal (`/organization`), enter your organization details, and click **Create Organization**.
   The request `POST /api/organizations` will now succeed with HTTP 201 instead of 404 `Cannot POST /organizations`.
