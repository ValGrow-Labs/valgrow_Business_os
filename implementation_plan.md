# ValGrow Business OS — Foundation Architecture Implementation Plan

## Current State Analysis

The existing repository is a **frontend-only** application built with:

- **TanStack Start** (Vite + TanStack Router + Nitro SSR)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Shadcn UI** components
- **TanStack Query** (already wired via `QueryClientProvider`)
- All route pages contain **hardcoded placeholder data** — no backend, no API calls
- Beautiful, production-quality Foundation UI that must be preserved

**Key files:**

- [package.json](file:///c:/Users/pc/valgrow_Business_os/package.json) — TanStack Start/Vite project, no backend deps
- [vite.config.ts](file:///c:/Users/pc/valgrow_Business_os/vite.config.ts) — Vite + Nitro (Cloudflare preset for prod)
- [__root.tsx](file:///c:/Users/pc/valgrow_Business_os/src/routes/__root.tsx) — QueryClient + ThemeProvider already wired
- [nav.ts](file:///c:/Users/pc/valgrow_Business_os/src/lib/nav.ts) — hardcoded orgs, branches, notifications
- 22 route pages, all with static placeholder data

> [!IMPORTANT]
>
> ## Tech Stack Deviation Decision
>
> The user's spec requests **Next.js** frontend + **NestJS** backend in a monorepo.
>
> However, the existing UI is built on **TanStack Start** (Vite + TanStack Router), not Next.js. The entire Foundation UI — 47 Shadcn components, 22 route pages, `AppShell`, `AuthLayout`, dashboard components — is TanStack-native code using `createFileRoute`, `createRootRouteWithContext`, TanStack Router `<Link>`, etc.
>
> **Migrating to Next.js would require rewriting every route, layout, and component** — directly violating the requirement to "not redesign the UI" and "not rewrite working code."
>
> ### Recommended approach: Keep TanStack Start for the frontend, build a standalone NestJS API backend.
>
> This gives us:
>
> - `apps/web/` → existing TanStack Start frontend (preserved as-is)
> - `apps/api/` → new NestJS backend
> - Both run independently, communicate via REST API
> - TanStack Query hooks on the frontend call the NestJS API
>
> **Please confirm this approach or instruct me to migrate to Next.js instead.**

---

## Proposed Changes

### Phase 1: Monorepo Restructure

#### [MODIFY] Root project structure

Restructure into a monorepo using npm workspaces:

```
valgrow_Business_os/
├── apps/
│   ├── web/          ← existing frontend (moved from root)
│   └── api/          ← new NestJS backend
├── packages/
│   ├── types/        ← shared TypeScript types
│   ├── config/       ← shared config (env validation, constants)
│   └── utils/        ← shared utilities
├── prisma/
│   └── schema.prisma ← database schema
├── docs/
│   ├── architecture/
│   ├── database/
│   └── api/
├── docker-compose.yml
├── .env.example
├── package.json      ← root workspace config
└── tsconfig.base.json
```

**What moves:**

- All existing files (`src/`, `public/`, `vite.config.ts`, etc.) move into `apps/web/`
- Root `package.json` becomes the workspace root
- A new `apps/web/package.json` is created with the existing dependencies
- Path aliases (`@/*`) continue to work inside `apps/web/`

**What does NOT change:**

- No UI files are modified
- No route files are changed (yet — API integration comes in Phase 8)
- All Shadcn components, layouts, and design remain identical

---

### Phase 2: Docker + PostgreSQL

#### [NEW] docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: valgrow_db
      POSTGRES_USER: valgrow
      POSTGRES_PASSWORD: valgrow_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

#### [NEW] .env.example

```env
DATABASE_URL=postgresql://valgrow:valgrow_dev@localhost:5432/valgrow_db
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
API_PORT=3001
API_URL=http://localhost:3001
WEB_URL=http://localhost:8080
BCRYPT_ROUNDS=12
```

---

### Phase 3: Prisma Schema

#### [NEW] prisma/schema.prisma

Foundation models with proper relationships:

| Model                    | Key Fields                                                  | Tenant Isolation                        |
| ------------------------ | ----------------------------------------------------------- | --------------------------------------- |
| **Organization**         | name, slug, logo, status, plan, settings                    | Root entity                             |
| **User**                 | firstName, lastName, email, passwordHash, status            | Belongs to org via `OrganizationMember` |
| **OrganizationMember**   | userId, organizationId, role                                | Join table (user ↔ org)                 |
| **Role**                 | name, description, isSystem, organizationId                 | Per-organization                        |
| **Permission**           | resource, action, description                               | Global catalog                          |
| **RolePermission**       | roleId, permissionId                                        | Join table                              |
| **Branch**               | name, code, address, phone, managerId, organizationId       | Per-organization                        |
| **Department**           | name, code, description, organizationId                     | Per-organization                        |
| **Team**                 | name, description, departmentId, organizationId             | Per-organization                        |
| **OrganizationSettings** | key, value, organizationId                                  | Per-organization                        |
| **UserSettings**         | key, value, userId                                          | Per-user                                |
| **Session**              | token, userId, ipAddress, userAgent, expiresAt              | Per-user                                |
| **Notification**         | title, body, type, channel, recipientId, organizationId     | Per-user + org                          |
| **ActivityLog**          | action, entity, entityId, actorId, organizationId, metadata | Per-organization                        |
| **File**                 | name, path, mimeType, size, uploaderId, organizationId      | Per-organization                        |

Key design decisions:

- UUIDs for all PKs via `@default(uuid())`
- Soft deletion via `deletedAt DateTime?` on User, Organization, Branch
- `OrganizationMember` join table allows future multi-org membership
- Indexes on `organizationId`, `email`, `slug`, `status`, `createdAt`
- `@@unique` constraints on [email], [slug], [organizationId + name] where appropriate

---

### Phase 4: NestJS API Backend

#### [NEW] apps/api/

```
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── permissions.guard.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── current-org.decorator.ts
│   │   │   └── require-permissions.decorator.ts
│   │   ├── interceptors/
│   │   │   └── tenant.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── dto/
│   │       └── pagination.dto.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── dto/
│   │   │       ├── register.dto.ts
│   │   │       ├── login.dto.ts
│   │   │       └── reset-password.dto.ts
│   │   ├── organizations/
│   │   │   ├── organizations.module.ts
│   │   │   ├── organizations.controller.ts
│   │   │   ├── organizations.service.ts
│   │   │   └── dto/
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   └── dto/
│   │   ├── roles/
│   │   │   ├── roles.module.ts
│   │   │   ├── roles.controller.ts
│   │   │   ├── roles.service.ts
│   │   │   └── dto/
│   │   ├── permissions/
│   │   │   ├── permissions.module.ts
│   │   │   ├── permissions.controller.ts
│   │   │   └── permissions.service.ts
│   │   ├── branches/
│   │   │   ├── branches.module.ts
│   │   │   ├── branches.controller.ts
│   │   │   ├── branches.service.ts
│   │   │   └── dto/
│   │   ├── departments/
│   │   │   ├── departments.module.ts
│   │   │   ├── departments.controller.ts
│   │   │   ├── departments.service.ts
│   │   │   └── dto/
│   │   ├── teams/
│   │   │   ├── teams.module.ts
│   │   │   ├── teams.controller.ts
│   │   │   ├── teams.service.ts
│   │   │   └── dto/
│   │   ├── settings/
│   │   │   ├── settings.module.ts
│   │   │   ├── settings.controller.ts
│   │   │   └── settings.service.ts
│   │   ├── notifications/
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── notifications.service.ts
│   │   ├── activity-logs/
│   │   │   ├── activity-logs.module.ts
│   │   │   ├── activity-logs.controller.ts
│   │   │   └── activity-logs.service.ts
│   │   ├── files/
│   │   │   ├── files.module.ts
│   │   │   ├── files.controller.ts
│   │   │   ├── files.service.ts
│   │   │   └── storage/
│   │   │       ├── storage.interface.ts
│   │   │       └── local-storage.adapter.ts
│   │   └── sessions/
│   │       ├── sessions.module.ts
│   │       └── sessions.service.ts
│   └── seed/
│       └── seed.ts
├── test/
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── organizations.e2e-spec.ts
│   └── tenant-isolation.e2e-spec.ts
├── package.json
├── tsconfig.json
└── nest-cli.json
```

#### API Endpoints

| Method | Path                      | Auth          | Description                |
| ------ | ------------------------- | ------------- | -------------------------- |
| POST   | `/auth/register`          | Public        | Register user + create org |
| POST   | `/auth/login`             | Public        | Login, return tokens       |
| POST   | `/auth/logout`            | JWT           | Invalidate session         |
| GET    | `/auth/me`                | JWT           | Current user profile       |
| POST   | `/auth/forgot-password`   | Public        | Request password reset     |
| POST   | `/auth/reset-password`    | Public        | Reset password with token  |
| POST   | `/auth/refresh`           | Refresh token | New access token           |
| GET    | `/organizations`          | JWT           | List user's orgs           |
| POST   | `/organizations`          | JWT           | Create organization        |
| GET    | `/organizations/:id`      | JWT + Org     | Get org details            |
| PATCH  | `/organizations/:id`      | JWT + Perm    | Update org                 |
| GET    | `/branches`               | JWT + Org     | List branches              |
| POST   | `/branches`               | JWT + Perm    | Create branch              |
| GET    | `/branches/:id`           | JWT + Org     | Get branch                 |
| PATCH  | `/branches/:id`           | JWT + Perm    | Update branch              |
| GET    | `/users`                  | JWT + Org     | List org members           |
| POST   | `/users`                  | JWT + Perm    | Create/invite user         |
| GET    | `/users/:id`              | JWT + Org     | Get user                   |
| PATCH  | `/users/:id`              | JWT + Perm    | Update user                |
| GET    | `/roles`                  | JWT + Org     | List roles                 |
| POST   | `/roles`                  | JWT + Perm    | Create role                |
| PATCH  | `/roles/:id`              | JWT + Perm    | Update role                |
| GET    | `/permissions`            | JWT + Org     | List permissions           |
| GET    | `/departments`            | JWT + Org     | List departments           |
| POST   | `/departments`            | JWT + Perm    | Create department          |
| PATCH  | `/departments/:id`        | JWT + Perm    | Update department          |
| GET    | `/teams`                  | JWT + Org     | List teams                 |
| POST   | `/teams`                  | JWT + Perm    | Create team                |
| PATCH  | `/teams/:id`              | JWT + Perm    | Update team                |
| GET    | `/settings`               | JWT + Org     | Get org settings           |
| PATCH  | `/settings`               | JWT + Perm    | Update settings            |
| GET    | `/settings/user`          | JWT           | Get user settings          |
| PATCH  | `/settings/user`          | JWT           | Update user settings       |
| GET    | `/notifications`          | JWT           | List notifications         |
| PATCH  | `/notifications/:id/read` | JWT           | Mark as read               |
| PATCH  | `/notifications/read-all` | JWT           | Mark all read              |
| DELETE | `/notifications/:id`      | JWT           | Delete notification        |
| GET    | `/activity-logs`          | JWT + Org     | List activity logs         |
| POST   | `/files/upload`           | JWT + Perm    | Upload file                |
| GET    | `/files`                  | JWT + Org     | List files                 |
| DELETE | `/files/:id`              | JWT + Perm    | Delete file                |

---

### Phase 5: Shared Packages

#### [NEW] packages/types/

Shared TypeScript interfaces used by both `apps/web` and `apps/api`:

```typescript
// packages/types/src/auth.ts
export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { accessToken: string; refreshToken: string; user: UserProfile; }
export interface RegisterRequest { ... }

// packages/types/src/user.ts
export interface UserProfile { id: string; firstName: string; ... }

// packages/types/src/organization.ts
export interface Organization { id: string; name: string; slug: string; ... }

// etc.
```

#### [NEW] packages/config/

Environment validation using Zod, shared constants.

#### [NEW] packages/utils/

Shared utilities (date formatting, slug generation, etc.).

---

### Phase 6: Frontend API Integration

#### [NEW] apps/web/src/lib/api-client.ts

A thin `fetch` wrapper configured with the API base URL and JWT token management.

#### [NEW] apps/web/src/hooks/queries/

TanStack Query hooks replacing hardcoded data:

| Hook                 | Replaces                           |
| -------------------- | ---------------------------------- |
| `useCurrentUser()`   | Hardcoded "Alex Verma" in AppShell |
| `useOrganizations()` | `organizations` array in nav.ts    |
| `useBranches()`      | `branches` array in nav.ts         |
| `useNotifications()` | `notifications` array in nav.ts    |
| `useUsers()`         | Static rows in users.tsx           |
| `useRoles()`         | Static rows in roles.tsx           |
| `usePermissions()`   | Static rows in permissions.tsx     |
| `useBranchesList()`  | Static rows in branches.tsx        |
| `useDepartments()`   | Static rows in departments.tsx     |
| `useTeams()`         | Static rows in teams.tsx           |
| `useActivityLogs()`  | Static rows in activity.tsx        |

#### [MODIFY] Route pages

Each route page will be updated to call hooks instead of using static data. The **UI structure, styling, and components remain identical** — only the data source changes.

Example transformation for `users.tsx`:

```tsx
// Before: const rows = [{ name: "Alex Verma", ... }];
// After:  const { data: users, isLoading } = useUsers();
```

#### [MODIFY] Login/Register pages

Wire the existing form UI to real auth mutations (`useLogin()`, `useRegister()`).

---

### Phase 7: Security Implementation

- **Password hashing**: bcrypt with 12 rounds
- **JWT tokens**: short-lived access (15min) + long-lived refresh (7d)
- **Guards**: `JwtAuthGuard` on all protected routes, `PermissionsGuard` for RBAC
- **Tenant interceptor**: automatically scopes queries to the active organization
- **CORS**: configured for `WEB_URL` origin only
- **Helmet**: secure HTTP headers
- **Rate limiting**: foundation via `@nestjs/throttler`
- **Input validation**: `class-validator` + `class-transformer` on all DTOs
- **No secrets in Git**: `.env` in `.gitignore`, `.env.example` committed

---

### Phase 8: Seed Data

A seed script that creates:

- Default organization "ValGrow Holdings" with branches (Head Office, North Hub, West Hub, South Hub)
- Admin user "Alex Verma" with Owner role
- System roles: Owner, Administrator, Branch Manager, Viewer
- Default permissions catalog (users.read, users.create, etc.)
- Sample departments and teams
- Sample notifications and activity logs

This ensures the dashboard looks identical to the current placeholder UI after connecting to real data.

---

## Open Questions

> [!IMPORTANT]
> **1. Frontend framework**: The existing UI uses TanStack Start, not Next.js. Should I keep TanStack Start (recommended — avoids rewriting all routes) or migrate to Next.js (major effort, risk of breaking the UI)?

> [!IMPORTANT]
> **2. Monorepo tooling**: Should I use plain npm workspaces (simplest, zero new deps) or add Turborepo for build orchestration? I recommend npm workspaces to start and adding Turborepo later if needed.

> [!WARNING]
> **3. Authentication storage**: Should the frontend store JWT tokens in httpOnly cookies (more secure, requires cookie-based auth flow) or localStorage (simpler, but XSS-vulnerable)? I recommend httpOnly cookies.

---

## Verification Plan

### Automated Tests

```bash
# From apps/api/
npm run test          # Unit tests
npm run test:e2e      # E2E tests (auth, CRUD, tenant isolation)

# From root
npm run typecheck     # TypeScript across all workspaces
npm run lint          # ESLint across all workspaces
npm run build         # Production build of all apps
```

### Key Test Scenarios

- User registers → org created → can login → gets JWT → can access `/auth/me`
- User A creates org → User B cannot access User A's org data
- User without `users.create` permission cannot POST `/users`
- Branch CRUD within org scope
- Activity log created on user creation
- Notification created and marked as read
- Seed script runs successfully and dashboard renders with real data

### Manual Verification

- Run `docker compose up -d` → PostgreSQL starts
- Run `npx prisma migrate dev` → schema applied
- Run `npm run seed` → demo data created
- Run `npm run dev` → both web (8080) and api (3001) start
- Open http://localhost:8080 → dashboard renders with real API data
- Login/register flows work
- Org/branch selectors populate from API
- User management page shows real users
- Activity logs show real events
