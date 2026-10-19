import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as readline from "readline";

const prisma = new PrismaClient();

async function promptPassword(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const identifierArg = args[0];
  const passwordArg = args[1];

  if (!identifierArg) {
    console.error("Usage: npx ts-node src/seed/set-user-password.ts <email-or-loginId> [newPassword]");
    console.error("Or: NEW_PASSWORD=\"...\" npx ts-node src/seed/set-user-password.ts <email-or-loginId>");
    process.exit(1);
  }

  const input = identifierArg.trim().toLowerCase();
  const candidateEmails = new Set<string>([input]);
  if (!input.includes("@")) {
    candidateEmails.add(`${input}@valgrow.dev`);
    if (input === "salesperson") candidateEmails.add("salesperson1@valgrow.dev");
    if (input === "billing") candidateEmails.add("billing1@valgrow.dev");
    if (input === "cashier") candidateEmails.add("cashier1@valgrow.dev");
  } else {
    if (input === "salesperson@valgrow.dev") candidateEmails.add("salesperson1@valgrow.dev");
    if (input === "billing@valgrow.dev") candidateEmails.add("billing1@valgrow.dev");
    if (input === "cashier@valgrow.dev") candidateEmails.add("cashier1@valgrow.dev");
  }

  const user = await prisma.user.findFirst({
    where: { email: { in: Array.from(candidateEmails) } },
  });

  if (!user) {
    console.error(`❌ User not found with identifier '${identifierArg}'`);
    process.exit(1);
  }

  let newPassword = passwordArg || process.env.NEW_PASSWORD || process.env.TEST_USER_PASSWORD;
  if (!newPassword) {
    newPassword = await promptPassword("Enter new password: ");
  }

  if (!newPassword || newPassword.length < 8) {
    console.error("❌ Password must be at least 8 characters long.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  // Invalidate previous sessions
  await prisma.session.updateMany({
    where: { userId: user.id, isRevoked: false },
    data: { isRevoked: true },
  });

  console.log(`✓ Password updated successfully for user: ${user.email} (ID: ${user.id})`);
}

main()
  .catch((e) => {
    console.error("Failed to update password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
