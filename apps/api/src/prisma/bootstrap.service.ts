import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.bootstrap();
  }

  async bootstrap() {
    try {
      this.logger.log("Running idempotent database bootstrap...");
      await this.ensureNotificationMetadataColumn();
      await this.ensureCatalogPermissions();
      await this.ensureDefaultRolesAndAccounts();
      this.logger.log("Database bootstrap completed successfully.");
    } catch (err: any) {
      this.logger.error(`Database bootstrap encountered error: ${err.message}`, err.stack);
    }
  }

  /**
   * Ensures the Notification table has the metadata JSONB column.
   * Safe and idempotent across all PostgreSQL instances (local, Render, Neon, Supabase).
   */
  async ensureNotificationMetadataColumn() {
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`
      );
      this.logger.log("✓ Verified Notification.metadata column exists.");
    } catch (err: any) {
      this.logger.warn(`Could not alter Notification table: ${err.message}`);
    }
  }

  /**
   * Ensures POS and system catalog permissions exist in the database.
   */
  async ensureCatalogPermissions() {
    const permissions = [
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
        description: "Cancel, void, or return carts and items",
      },
    ];

    for (const p of permissions) {
      await this.prisma.permission.upsert({
        where: { key: p.key },
        update: {
          resource: p.resource,
          action: p.action,
          description: p.description,
        },
        create: p,
      });
    }
    this.logger.log("✓ POS catalog permissions verified.");
  }

  /**
   * Ensures standard roles (Salesperson, Billing Staff, Cashier) and dev accounts
   * are provisioned for all workspaces, with POS test accounts in valgrow-holdings.
   */
  async ensureDefaultRolesAndAccounts() {
    // 1. Fetch all permissions for role mapping
    const allPerms = await this.prisma.permission.findMany();
    const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

    // 2. Define Standard Roles to ensure across organizations
    const rolesConfig = [
      {
        name: "Salesperson",
        description: "POS Floor Salesperson: scan products, build carts, select customers, send to billing",
        perms: ["pos.create", "pos.read", "sales.read", "inventory.read", "branches.read"],
      },
      {
        name: "Billing Staff",
        description: "POS Billing Desk: claim tickets, verify cart items, return/cancel, send to cashier",
        perms: ["pos.billing", "pos.cancel", "pos.create", "pos.read", "inventory.read", "branches.read"],
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

    const orgs = await this.prisma.organization.findMany();
    const valgrowHoldingsRolesMap = new Map<string, string>();

    for (const org of orgs) {
      for (const rDef of rolesConfig) {
        let role = await this.prisma.role.findFirst({
          where: { organizationId: org.id, name: rDef.name },
        });

        if (!role) {
          role = await this.prisma.role.create({
            data: {
              organizationId: org.id,
              name: rDef.name,
              description: rDef.description,
              isSystem: false,
              scope: "Organization",
            },
          });
          this.logger.log(`+ Created role '${rDef.name}' for ${org.name}`);
        }

        if (org.slug === "valgrow-holdings" || org.id === "6802cddd-0fa5-40c2-b17b-6ed28f553740") {
          valgrowHoldingsRolesMap.set(rDef.name, role.id);
        }

        // Link permissions
        for (const pKey of rDef.perms) {
          const pId = permMap.get(pKey);
          if (pId) {
            await this.prisma.rolePermission.upsert({
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
      }
    }

    // 3. Resolve Primary Organization (valgrow-holdings) for POS accounts
    const primaryOrg = orgs.find(
      (o) => o.slug === "valgrow-holdings" || o.id === "6802cddd-0fa5-40c2-b17b-6ed28f553740",
    );

    if (!primaryOrg) {
      this.logger.log("Primary organization 'valgrow-holdings' not found. Skipping POS accounts provisioning.");
      return;
    }

    // 4. Ensure Accounts for testing and POS workflow
    const defaultPassword = process.env.DEV_USER_PASSWORD || "DevelopmentPass123!";
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    const accounts = [
      {
        email: "salesperson1@valgrow.dev",
        firstName: "Salesperson",
        lastName: "One",
        jobTitle: "POS Floor Salesperson",
        roleName: "Salesperson",
      },
      {
        email: "billing1@valgrow.dev",
        firstName: "Billing",
        lastName: "Staff One",
        jobTitle: "POS Billing Specialist",
        roleName: "Billing Staff",
      },
      {
        email: "cashier1@valgrow.dev",
        firstName: "Cashier",
        lastName: "One",
        jobTitle: "POS Head Cashier",
        roleName: "Cashier",
      },
    ];

    for (const acc of accounts) {
      const roleId = valgrowHoldingsRolesMap.get(acc.roleName);
      if (!roleId) continue;

      let user = await this.prisma.user.findUnique({
        where: { email: acc.email },
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: acc.email,
            firstName: acc.firstName,
            lastName: acc.lastName,
            jobTitle: acc.jobTitle,
            passwordHash,
            status: "ACTIVE",
          },
        });
        this.logger.log(`+ Created user '${acc.email}'`);
      }

      const existingMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: primaryOrg.id,
            userId: user.id,
          },
        },
      });

      if (!existingMember) {
        await this.prisma.organizationMember.create({
          data: {
            organizationId: primaryOrg.id,
            userId: user.id,
            roleId,
            status: "ACTIVE",
          },
        });
        this.logger.log(`+ Linked member '${acc.email}' to ${primaryOrg.name}`);
      }
    }
  }
}
