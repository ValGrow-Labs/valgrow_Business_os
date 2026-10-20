import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { seedDefaultChartOfAccounts } from "../accounts/default-accounts.seed";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async createOrganization(userId: string, data: CreateOrganizationDto) {
    const trimmedName = data.name?.trim();
    if (!trimmedName) {
      throw new BadRequestException("Organization name is required");
    }

    // Check if user already has an active organization with this name
    const existingMembership = await this.prisma.organizationMember.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        organization: {
          name: {
            equals: trimmedName,
            mode: "insensitive",
          },
          deletedAt: null,
        },
      },
    });

    if (existingMembership) {
      throw new BadRequestException(
        "An organization with this name already exists in your account",
      );
    }

    // 1. Validate branch setup
    const shouldCreateBranch = data.createBranch !== false;
    let branchName = "Head Office";
    let branchCode = "HQ";
    let branchCity = data.city?.trim() || "Bengaluru";
    let branchAddress: string | null = null;
    let branchPhone: string | null = null;
    let branchEmail: string | null = null;

    if (data.createBranch) {
      if (!data.branch?.name?.trim()) {
        throw new BadRequestException(
          "Branch name is required when creating a branch",
        );
      }
      branchName = data.branch.name.trim();
      branchCode = data.branch.code?.trim() || "HQ";
      branchCity = data.branch.city?.trim() || data.city?.trim() || "Bengaluru";
      branchAddress = data.branch.address?.trim() || null;
      branchPhone = data.branch.phone?.trim() || null;
      branchEmail = data.branch.email?.trim() || null;
    } else if (data.branch?.name?.trim()) {
      branchName = data.branch.name.trim();
      branchCode = data.branch.code?.trim() || "HQ";
      branchCity = data.branch.city?.trim() || data.city?.trim() || "Bengaluru";
    }

    // 2. Validate warehouse setup
    const shouldCreateWarehouse = Boolean(data.createWarehouse);
    if (shouldCreateWarehouse) {
      if (!data.warehouse?.name?.trim()) {
        throw new BadRequestException(
          "Warehouse name is required when creating a warehouse",
        );
      }
      if (!data.warehouse?.code?.trim()) {
        throw new BadRequestException(
          "Warehouse code is required when creating a warehouse",
        );
      }
      if (data.warehouse?.associateWithBranch && !shouldCreateBranch) {
        throw new BadRequestException(
          "Cannot associate warehouse with branch when branch creation is disabled",
        );
      }
    }

    const baseSlug =
      data.slug?.trim() ||
      this.generateSlug(trimmedName) ||
      `org-${Date.now()}`;

    // Ensure unique slug
    let finalSlug = baseSlug;
    const existingOrgWithSlug = await this.prisma.organization.findUnique({
      where: { slug: finalSlug },
    });

    if (existingOrgWithSlug) {
      finalSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: trimmedName,
          legalName: data.legalName?.trim() || null,
          slug: finalSlug,
          currency: data.currency || "INR",
          timezone: data.timezone || "Asia/Kolkata",
          fiscalYearStart: data.fiscalYearStart || "April",
          plan: "Starter",
          status: "ACTIVE",
        },
      });

      // 2. Save Country if provided in organization settings
      const countryToSave = data.country?.trim() || "India";
      await tx.organizationSettings.create({
        data: {
          organizationId: org.id,
          key: "country",
          value: countryToSave,
          scope: "Global",
        },
      });

      // 3. Create Owner Role
      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: "Owner",
          description: "Workspace owner with full access",
          isSystem: true,
          scope: "Organization",
        },
      });

      // 4. Create Organization Member
      await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId,
          roleId: ownerRole.id,
          status: "ACTIVE",
        },
      });

      // 5. Create Branch if enabled
      let createdBranch: any = null;
      if (shouldCreateBranch) {
        createdBranch = await tx.branch.create({
          data: {
            organizationId: org.id,
            name: branchName,
            code: branchCode,
            city: branchCity,
            address: branchAddress,
            phone: branchPhone,
            email: branchEmail,
            status: "ACTIVE",
            managerId: userId,
          },
        });
      }

      // 6. Create Warehouse if enabled
      let createdWarehouse: any = null;
      if (shouldCreateWarehouse && data.warehouse) {
        const whName = data.warehouse.name.trim();
        const whCode = data.warehouse.code.trim();
        const associateBranch =
          data.warehouse.associateWithBranch !== false &&
          Boolean(createdBranch);

        createdWarehouse = await tx.warehouse.create({
          data: {
            organizationId: org.id,
            branchId: associateBranch ? createdBranch.id : null,
            name: whName,
            code: whCode,
            address: data.warehouse.address?.trim() || null,
            city:
              data.warehouse.city?.trim() ||
              (createdBranch ? createdBranch.city : branchCity),
            isDefault: true,
            status: "ACTIVE",
          },
        });
      }

      // 7. Seed Default Chart of Accounts & Fiscal Year
      await seedDefaultChartOfAccounts(tx as any, org.id);

      return {
        ...org,
        country: countryToSave,
        role: ownerRole.name,
        branch: createdBranch
          ? {
              id: createdBranch.id,
              name: createdBranch.name,
              code: createdBranch.code,
              city: createdBranch.city,
            }
          : null,
        warehouse: createdWarehouse
          ? {
              id: createdWarehouse.id,
              name: createdWarehouse.name,
              code: createdWarehouse.code,
              branchId: createdWarehouse.branchId,
            }
          : null,
      };
    });
  }

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        organization: {
          include: {
            settings: true,
          },
        },
        role: true,
      },
    });

    return memberships.map((m) => {
      const countrySetting = m.organization.settings?.find(
        (s) => s.key === "country",
      );
      return {
        ...m.organization,
        country: countrySetting?.value || "India",
        role: m.role.name,
      };
    });
  }

  async getOrganizationById(id: string, userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: id,
          userId,
        },
      },
      include: {
        organization: {
          include: {
            settings: true,
          },
        },
        role: true,
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new ForbiddenException("Access denied to this organization");
    }

    const countrySetting = membership.organization.settings?.find(
      (s) => s.key === "country",
    );

    return {
      ...membership.organization,
      country: countrySetting?.value || "India",
      role: membership.role.name,
    };
  }

  async updateOrganization(id: string, activeOrgId: string, data: any) {
    if (id !== activeOrgId) {
      throw new ForbiddenException(
        "Cannot update an organization outside your active context",
      );
    }

    if (data.country !== undefined) {
      const countryVal =
        typeof data.country === "string" ? data.country.trim() : "";
      if (countryVal) {
        await this.prisma.organizationSettings.upsert({
          where: {
            organizationId_key: {
              organizationId: id,
              key: "country",
            },
          },
          update: {
            value: countryVal,
          },
          create: {
            organizationId: id,
            key: "country",
            value: countryVal,
            scope: "Global",
          },
        });
      } else {
        await this.prisma.organizationSettings.deleteMany({
          where: {
            organizationId: id,
            key: "country",
          },
        });
      }
    }

    const updated = await this.prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
        legalName: data.legalName,
        currency: data.currency,
        timezone: data.timezone,
        fiscalYearStart: data.fiscalYearStart,
        plan: data.plan,
      },
    });

    const countrySetting = await this.prisma.organizationSettings.findUnique({
      where: {
        organizationId_key: {
          organizationId: id,
          key: "country",
        },
      },
    });

    return {
      ...updated,
      country: countrySetting?.value || "India",
    };
  }
}
