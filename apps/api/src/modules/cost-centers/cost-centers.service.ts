import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { UpdateCostCenterDto } from "./dto/update-cost-center.dto";

@Injectable()
export class CostCentersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCostCenters(orgId: string) {
    return this.prisma.costCenter.findMany({
      where: { organizationId: orgId },
      orderBy: { code: "asc" },
    });
  }

  async getCostCenter(id: string, orgId: string) {
    const cc = await this.prisma.costCenter.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cc) throw new NotFoundException("Cost Center not found");
    return cc;
  }

  async createCostCenter(orgId: string, dto: CreateCostCenterDto) {
    const existing = await this.prisma.costCenter.findUnique({
      where: { organizationId_code: { organizationId: orgId, code: dto.code } },
    });
    if (existing) throw new BadRequestException(`Cost Center code ${dto.code} already exists`);

    return this.prisma.costCenter.create({
      data: {
        organizationId: orgId,
        code: dto.code,
        name: dto.name,
        description: dto.description || null,
      },
    });
  }

  async updateCostCenter(id: string, orgId: string, dto: UpdateCostCenterDto) {
    const cc = await this.getCostCenter(id, orgId);

    if (dto.code && dto.code !== cc.code) {
      const existing = await this.prisma.costCenter.findUnique({
        where: { organizationId_code: { organizationId: orgId, code: dto.code } },
      });
      if (existing) throw new BadRequestException(`Cost Center code ${dto.code} already exists`);
    }

    return this.prisma.costCenter.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code } : {}),
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async deleteCostCenter(id: string, orgId: string) {
    await this.getCostCenter(id, orgId);
    return this.prisma.costCenter.delete({
      where: { id },
    });
  }
}
