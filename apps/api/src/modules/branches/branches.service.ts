import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async getBranches(organizationId: string) {
    return this.prisma.branch.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getBranchById(id: string, organizationId: string) {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException("Branch not found in this organization");
    }

    return branch;
  }

  async createBranch(organizationId: string, data: any) {
    return this.prisma.branch.create({
      data: {
        organizationId,
        name: data.name,
        code: data.code,
        city: data.city,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: data.status || "ACTIVE",
        managerId: data.managerId,
      },
    });
  }

  async updateBranch(id: string, organizationId: string, data: any) {
    await this.getBranchById(id, organizationId);

    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        city: data.city,
        address: data.address,
        phone: data.phone,
        email: data.email,
        status: data.status,
        managerId: data.managerId,
      },
    });
  }

  async deleteBranch(id: string, organizationId: string) {
    await this.getBranchById(id, organizationId);

    return this.prisma.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
