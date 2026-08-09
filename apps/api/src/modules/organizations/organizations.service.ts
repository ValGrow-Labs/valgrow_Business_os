import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, status: "ACTIVE" },
      include: {
        organization: true,
        role: true,
      },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role.name,
    }));
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
        organization: true,
        role: true,
      },
    });

    if (!membership || membership.status !== "ACTIVE") {
      throw new ForbiddenException("Access denied to this organization");
    }

    return {
      ...membership.organization,
      role: membership.role.name,
    };
  }

  async updateOrganization(id: string, activeOrgId: string, data: any) {
    if (id !== activeOrgId) {
      throw new ForbiddenException(
        "Cannot update an organization outside your active context",
      );
    }

    return this.prisma.organization.update({
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
  }
}
