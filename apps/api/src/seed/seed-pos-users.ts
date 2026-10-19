import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // 1. Production safety check
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to create test user accounts in production environment!");
    process.exit(1);
  }

  console.log("🌱 Starting POS test accounts configuration (development environment)...");

  // 2. Ensure Required Permissions Exist
  const requiredPermissionsData = [
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
    {
      key: "inventory.read",
      resource: "Inventory",
      action: "read",
      description: "View inventory stock levels and movements",
    },
    {
      key: "branches.read",
      resource: "Branches",
      action: "read",
      description: "View organization branches",
    },
  ];

  const permissionsMap = new Map<string, string>();
  for (const perm of requiredPermissionsData) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
    permissionsMap.set(p.key, p.id);
  }
  console.log(`✓ Verified ${requiredPermissionsData.length} permissions in catalog`);

  // 3. Resolve Development Organization
  const org = await prisma.organization.findUnique({
    where: { slug: "valgrow-holdings" },
  });

  if (!org) {
    throw new Error(
      "Development organization 'valgrow-holdings' not found. Please run base seed first.",
    );
  }
  console.log(`✓ Using organization: ${org.name} (${org.id})`);

  // 4. Configure Distinct Roles with Least-Privilege Scoped Permissions
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
      // Explicitly disallowed: pos.checkout, pos.billing, pos.cashier
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
      // Explicitly disallowed: pos.checkout, pos.cashier
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
      // Explicitly disallowed: pos.billing
    },
  ];

  const rolesMap = new Map<string, string>();
  for (const rDef of rolesConfig) {
    let role = await prisma.role.findFirst({
      where: { organizationId: org.id, name: rDef.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          organizationId: org.id,
          name: rDef.name,
          description: rDef.description,
          isSystem: false,
          scope: "Organization",
        },
      });
      console.log(`✓ Created role: ${role.name}`);
    } else {
      role = await prisma.role.update({
        where: { id: role.id },
        data: { description: rDef.description },
      });
      console.log(`✓ Updated role: ${role.name}`);
    }
    rolesMap.set(rDef.name, role.id);

    // Sync permissions strictly according to role specification
    const desiredPermissionIds: string[] = [];
    for (const pKey of rDef.perms) {
      const pId = permissionsMap.get(pKey);
      if (pId) desiredPermissionIds.push(pId);
    }

    // Remove any extra/unauthorized permissions
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: role.id,
        permissionId: { notIn: desiredPermissionIds },
      },
    });

    // Upsert expected permissions
    for (const pId of desiredPermissionIds) {
      await prisma.rolePermission.upsert({
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

  // 5. Configure Users Idempotently
  const envPassword =
    process.env.TEST_USER_PASSWORD ||
    process.env.DEV_USER_PASSWORD ||
    "DevelopmentPass123!";
  const defaultPasswordHash = await bcrypt.hash(envPassword, 12);

  const testAccounts = [
    {
      loginId: "salesperson1",
      email: "salesperson1@valgrow.dev",
      firstName: "Salesperson",
      lastName: "One",
      jobTitle: "Floor Sales Specialist",
      roleName: "Salesperson",
    },
    {
      loginId: "billing1",
      email: "billing1@valgrow.dev",
      firstName: "Billing",
      lastName: "Staff One",
      jobTitle: "Billing Desk Specialist",
      roleName: "Billing Staff",
    },
    {
      loginId: "cashier1",
      email: "cashier1@valgrow.dev",
      firstName: "Cashier",
      lastName: "One",
      jobTitle: "Head Cashier",
      roleName: "Cashier",
    },
  ];

  for (const acc of testAccounts) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: acc.email },
          { email: acc.loginId },
        ],
      },
    });

    let passwordHashToUse: string;
    if (defaultPasswordHash) {
      // Admin/developer provided a password explicitly via env
      passwordHashToUse = defaultPasswordHash;
    } else if (existingUser) {
      // Preserve existing user's credentials
      passwordHashToUse = existingUser.passwordHash;
    } else {
      // First-time generation without explicit env password
      const randomSecret = crypto.randomBytes(24).toString("hex") + "!Aa1";
      passwordHashToUse = await bcrypt.hash(randomSecret, 12);
    }

    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        firstName: acc.firstName,
        lastName: acc.lastName,
        jobTitle: acc.jobTitle,
        passwordHash: passwordHashToUse,
        status: "ACTIVE",
      },
      create: {
        email: acc.email,
        firstName: acc.firstName,
        lastName: acc.lastName,
        jobTitle: acc.jobTitle,
        passwordHash: passwordHashToUse,
        status: "ACTIVE",
      },
    });

    const roleId = rolesMap.get(acc.roleName)!;
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: {
        roleId,
        status: "ACTIVE",
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId,
        status: "ACTIVE",
      },
    });

    console.log(`✓ Configured account: ${acc.loginId} -> Role: ${acc.roleName}`);
  }

  console.log("\n========================================================");
  console.log("🎉 POS Test User Accounts Configured Successfully!");
  console.log("========================================================");
  console.log("Accounts created:");
  for (const acc of testAccounts) {
    console.log(`  - Login ID: ${acc.loginId} (${acc.email}) | Role: ${acc.roleName} | Org: ${org.name}`);
  }
  if (!envPassword) {
    console.log("\nℹ Password note: Set TEST_USER_PASSWORD in your .env or run:");
    console.log("  TEST_USER_PASSWORD=\"<secret>\" npm run seed:pos-users");
    console.log("  Or use: npm run set-password <loginId>");
  }
}

main()
  .catch((e) => {
    console.error("Error configuring POS test accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
