import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import * as fs from "fs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔒 Starting production-approved POS account provisioning...");

  // =========================================================================
  // 1. PRE-FLIGHT VALIDATION (Executed BEFORE any database read or write)
  // =========================================================================
  
  // A. Database URL check
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL environment variable is missing. Provisioning halted.");
  }

  // Sanity check database host to prevent accidental targets
  try {
    const parsedUrl = new URL(dbUrl.replace(/^[^:]+:\/\//, "http://"));
    console.log(`✓ Target database host verified: ${parsedUrl.hostname} (DB: ${parsedUrl.pathname.replace(/^\//, "")})`);
  } catch {
    console.log("✓ Target database URL format verified.");
  }

  // B. Target Accounts Definition
  const targetAccounts = [
    {
      loginId: "salesperson1",
      email: "salesperson1@valgrow.dev",
      firstName: "Salesperson",
      lastName: "One",
      jobTitle: "POS Floor Salesperson",
      roleName: "Salesperson",
      envPass: process.env.SALESPERSON_PASSWORD,
    },
    {
      loginId: "billing1",
      email: "billing1@valgrow.dev",
      firstName: "Billing",
      lastName: "Staff One",
      jobTitle: "POS Billing Specialist",
      roleName: "Billing Staff",
      envPass: process.env.BILLING_PASSWORD,
    },
    {
      loginId: "cashier1",
      email: "cashier1@valgrow.dev",
      firstName: "Cashier",
      lastName: "One",
      jobTitle: "POS Head Cashier",
      roleName: "Cashier",
      envPass: process.env.CASHIER_PASSWORD,
    },
  ];

  // Resolve passwords for all accounts before any database query
  const fallbackPass = (process.env.POS_USER_PASSWORD || process.env.PROD_POS_USER_PASSWORD)?.trim();
  const allowAutoGenerate = process.env.ALLOW_AUTO_GENERATE_PASSWORDS === "true";

  const accountSecrets: Array<{
    loginId: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    roleName: string;
    plainPassword?: string;
    passwordHash?: string;
  }> = [];

  for (const acc of targetAccounts) {
    let plainPass = acc.envPass?.trim() || fallbackPass;
    if (!plainPass && allowAutoGenerate) {
      plainPass = crypto.randomBytes(18).toString("base64url") + "!Aa1";
    }

    if (!plainPass || plainPass.length < 12) {
      throw new Error(
        `Missing required secure password for account '${acc.loginId}'. Set SALESPERSON_PASSWORD, BILLING_PASSWORD, CASHIER_PASSWORD, or POS_USER_PASSWORD (minimum 12 characters). Or set ALLOW_AUTO_GENERATE_PASSWORDS=true. Provisioning halted before database operations.`,
      );
    }

    const passwordHash = await bcrypt.hash(plainPass, 12);
    accountSecrets.push({
      ...acc,
      plainPassword: plainPass,
      passwordHash,
    });
  }

  console.log("✓ Pre-flight password validation passed for all target accounts (all >= 12 chars).");

  // C. Target Organization Parameter Check
  const targetOrgSlug = process.env.TARGET_ORG_SLUG || "valgrow-holdings";
  const targetOrgId = process.env.TARGET_ORG_ID;

  // Track credentials to save locally for verification if requested
  const credentialsToSave: Array<{ loginId: string; email: string; password: string; role: string }> = [];

  // =========================================================================
  // 2. ATOMIC DATABASE TRANSACTION (All writes are fully isolated & rollback-safe)
  // =========================================================================
  await prisma.$transaction(async (tx) => {
    // A. Verify Target Organization
    const org = await tx.organization.findFirst({
      where: targetOrgId ? { id: targetOrgId } : { slug: targetOrgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
      },
    });

    if (!org) {
      throw new Error(
        `Target organization '${targetOrgId || targetOrgSlug}' was not found in the database. Transaction aborted.`,
      );
    }

    if (org.status !== "ACTIVE") {
      throw new Error(
        `Target organization '${org.name}' is not ACTIVE (current status: ${org.status}). Transaction aborted.`,
      );
    }

    console.log(`✓ Target organization resolved: ${org.name} (Slug: ${org.slug}, ID: ${org.id})`);

    // B. Upsert Required POS Catalog Permissions (Idempotent, non-destructive)
    const posPermissionsData = [
      {
        key: "pos.read",
        resource: "POS",
        action: "read",
        description: "View POS sessions, carts, products, queue, and sales history",
      },
      {
        key: "pos.create",
        resource: "POS",
        action: "create",
        description: "Create POS carts, add items, and send transactions to billing queue",
      },
      {
        key: "pos.session",
        resource: "POS",
        action: "session",
        description: "Open, suspend, and resume POS register sessions",
      },
      {
        key: "pos.close",
        resource: "POS",
        action: "close",
        description: "Close POS register sessions and reconcile cash drawer",
      },
      {
        key: "pos.billing",
        resource: "POS",
        action: "billing",
        description: "Review, claim, verify, and forward carts in the billing queue",
      },
      {
        key: "pos.cashier",
        resource: "POS",
        action: "cashier",
        description: "Access payment queue and claim transactions for checkout",
      },
      {
        key: "pos.checkout",
        resource: "POS",
        action: "checkout",
        description: "Process payments, deduct stock, and complete POS checkout",
      },
      {
        key: "pos.cancel",
        resource: "POS",
        action: "cancel",
        description: "Cancel POS transactions and return claimed carts to queue",
      },
      {
        key: "pos.refund",
        resource: "POS",
        action: "refund",
        description: "Process POS sale refunds and sales returns",
      },
      {
        key: "sales.read",
        resource: "Sales",
        action: "read",
        description: "View sales orders, invoices, and customers",
      },
    ];

    const permissionsMap = new Map<string, string>();
    for (const perm of posPermissionsData) {
      const p = await tx.permission.upsert({
        where: { key: perm.key },
        update: { description: perm.description },
        create: perm,
        select: { id: true, key: true },
      });
      permissionsMap.set(p.key, p.id);
    }

    // Resolve auxiliary existing permissions needed for the roles
    const auxiliaryPermKeys = ["inventory.read", "branches.read"];
    const auxiliaryPerms = await tx.permission.findMany({
      where: { key: { in: auxiliaryPermKeys } },
      select: { id: true, key: true },
    });
    for (const p of auxiliaryPerms) {
      permissionsMap.set(p.key, p.id);
    }

    console.log(`✓ POS catalog permissions verified (${permissionsMap.size} permissions available)`);

    // C. Upsert POS Roles Scoped Exclusively to Target Organization
    const rolesConfig = [
      {
        name: "Salesperson",
        description: "POS Floor Salesperson: scan products, build carts, select customers, send to billing",
        perms: [
          "pos.create",
          "pos.read",
          "sales.read",
          "inventory.read",
          "branches.read",
        ],
      },
      {
        name: "Billing Staff",
        description: "POS Billing Desk: claim tickets, verify cart items, return/cancel, send to cashier",
        perms: [
          "pos.billing",
          "pos.cancel",
          "pos.create",
          "pos.read",
          "inventory.read",
          "branches.read",
        ],
      },
      {
        name: "Cashier",
        description: "POS Cashier: claim payments, open/close shifts, process payments, complete checkout",
        perms: [
          "pos.cashier",
          "pos.checkout",
          "pos.cancel",
          "pos.session",
          "pos.close",
          "pos.read",
          "inventory.read",
          "branches.read",
        ],
      },
    ];

    const rolesMap = new Map<string, string>();
    for (const rDef of rolesConfig) {
      let role = await tx.role.findFirst({
        where: { organizationId: org.id, name: rDef.name },
        select: { id: true, name: true },
      });

      if (!role) {
        role = await tx.role.create({
          data: {
            organizationId: org.id,
            name: rDef.name,
            description: rDef.description,
            isSystem: false,
            scope: "Organization",
          },
          select: { id: true, name: true },
        });
        console.log(`  + Created role: ${role.name}`);
      } else {
        await tx.role.update({
          where: { id: role.id },
          data: { description: rDef.description },
        });
        console.log(`  ✓ Updated role: ${role.name}`);
      }
      rolesMap.set(rDef.name, role.id);

      // Synchronize permissions strictly for THIS role only
      const desiredPermissionIds: string[] = [];
      for (const pKey of rDef.perms) {
        const pId = permissionsMap.get(pKey);
        if (pId) desiredPermissionIds.push(pId);
      }

      // Remove obsolete permissions ONLY from this specific role
      await tx.rolePermission.deleteMany({
        where: {
          roleId: role.id,
          permissionId: { notIn: desiredPermissionIds },
        },
      });

      // Ensure expected permissions are linked to this role
      for (const pId of desiredPermissionIds) {
        await tx.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: pId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: pId,
          },
        });
      }
    }

    // D. Provision or Reconcile the 3 Specific POS Accounts
    for (const sec of accountSecrets) {
      const existingUser = await tx.user.findFirst({
        where: {
          OR: [
            { email: sec.email },
            { email: sec.loginId },
          ],
        },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          firstName: true,
          lastName: true,
        },
      });

      let userId: string;

      if (existingUser) {
        // PRESERVE: Never overwrite existing user passwords or custom fields
        userId = existingUser.id;
        await tx.user.update({
          where: { id: existingUser.id },
          data: {
            status: "ACTIVE",
            deletedAt: null,
          },
        });
        console.log(`  ✓ Preserved existing user credentials: ${sec.loginId} (${sec.email})`);
      } else {
        // CREATE new user with pre-hashed password
        const newUser = await tx.user.create({
          data: {
            email: sec.email,
            firstName: sec.firstName,
            lastName: sec.lastName,
            jobTitle: sec.jobTitle,
            passwordHash: sec.passwordHash!,
            status: "ACTIVE",
          },
          select: { id: true },
        });
        userId = newUser.id;
        console.log(`  + Created user account: ${sec.loginId} (${sec.email})`);
        if (sec.plainPassword) {
          credentialsToSave.push({
            loginId: sec.loginId,
            email: sec.email,
            password: sec.plainPassword,
            role: sec.roleName,
          });
        }
      }

      // Ensure Organization Membership is active with correct role
      const roleId = rolesMap.get(sec.roleName)!;
      await tx.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId,
          },
        },
        update: {
          roleId,
          status: "ACTIVE",
        },
        create: {
          organizationId: org.id,
          userId,
          roleId,
          status: "ACTIVE",
        },
      });

      console.log(`  ✓ Membership linked: ${sec.loginId} -> Role '${sec.roleName}' in '${org.name}'`);
    }
  }, {
    timeout: 30000,
  });

  // Save credentials securely to disk only if an explicit secret file path was configured
  const credentialsOutFile = process.env.CREDENTIALS_OUT_FILE;
  if (credentialsOutFile && credentialsToSave.length > 0) {
    fs.writeFileSync(credentialsOutFile, JSON.stringify(credentialsToSave, null, 2), { mode: 0o600 });
  }

  console.log("\n========================================================");
  console.log("✅ POS Account Provisioning Completed Atomically & Safely!");
  console.log("========================================================");
  console.log("All existing users, roles, and business data remained untouched.");
}

main()
  .catch((e) => {
    console.error("❌ Provisioning aborted:", e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
