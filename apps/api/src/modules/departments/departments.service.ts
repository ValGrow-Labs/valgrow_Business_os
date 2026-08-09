import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDepartments(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: {
        branch: { select: { id: true, name: true } },
        head: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { teams: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createDepartment(organizationId: string, data: any) {
    return this.prisma.department.create({
      data: {
        organizationId,
        branchId: data.branchId,
        name: data.name,
        code: data.code,
        description: data.description,
        headId: data.headId,
      },
    });
  }

  async updateDepartment(id: string, organizationId: string, data: any) {
    const department = await this.prisma.department.findFirst({
      where: { id, organizationId },
    });

    if (!department) throw new NotFoundException("Department not found");

    return this.prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        branchId: data.branchId,
        headId: data.headId,
      },
    });
  }
}
