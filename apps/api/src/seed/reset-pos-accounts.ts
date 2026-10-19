import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to reset test accounts in production environment!");
    process.exit(1);
  }

  const devPassword =
    process.env.DEV_USER_PASSWORD ||
    process.env.TEST_USER_PASSWORD ||
    "DevelopmentPass123!";

  console.log("🔒 Safely resetting POS development test accounts...");

  const org = await prisma.organization.findUnique({
    where: { slug: "valgrow-holdings" },
  });

  if (!org) {
    throw new Error("Development organization 'valgrow-holdings' not found in database.");
  }

  const accounts = [
    {
      loginId: "salesperson1",
      email: "salesperson1@valgrow.dev",
      roleName: "Salesperson",
      firstName: "Salesperson",
      lastName: "One",
    },
    {
      loginId: "billing1",
      email: "billing1@valgrow.dev",
      roleName: "Billing Staff",
      firstName: "Billing",
      lastName: "Staff One",
    },
    {
      loginId: "cashier1",
      email: "cashier1@valgrow.dev",
      roleName: "Cashier",
      firstName: "Cashier",
      lastName: "One",
    },
  ];

  for (const acc of accounts) {
    const role = await prisma.role.findFirst({
      where: { organizationId: org.id, name: acc.roleName },
    });

    if (!role) {
      throw new Error(`Role '${acc.roleName}' not found in organization '${org.name}'.`);
    }

    // Hash password with 12 rounds
    const passwordHash = await bcrypt.hash(devPassword, 12);

    // Upsert User record
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {
        firstName: acc.firstName,
        lastName: acc.lastName,
        passwordHash,
        status: "ACTIVE",
        deletedAt: null,
      },
      create: {
        email: acc.email,
        firstName: acc.firstName,
        lastName: acc.lastName,
        passwordHash,
        status: "ACTIVE",
      },
    });

    // Ensure Organization Membership is active
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: {
        roleId: role.id,
        status: "ACTIVE",
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId: role.id,
        status: "ACTIVE",
      },
    });

    // Invalidate stale sessions
    await prisma.session.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    // Verify password hash comparison
    const verificationMatch = await bcrypt.compare(devPassword, user.passwordHash);
    if (!verificationMatch) {
      throw new Error(`Self-check failed: Password hash verification mismatch for ${acc.email}`);
    }

    console.log(`  ✓ Account reset & verified: ${acc.loginId} (${acc.email}) -> Role: ${acc.roleName}`);
  }

  console.log("✓ All 3 test accounts successfully reset to the configured development credentials.");
}

main()
  .catch((e) => {
    console.error("Failed to reset test accounts:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
