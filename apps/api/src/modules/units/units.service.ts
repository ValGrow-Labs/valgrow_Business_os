import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUnits(organizationId: string) {
    return this.prisma.unit.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getUnitById(id: string, organizationId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException(
        "Unit of measure not found in this organization",
      );
    }

    return unit;
  }

  async createUnit(organizationId: string, dto: CreateUnitDto) {
    return this.prisma.unit.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        allowDecimals: dto.allowDecimals ?? false,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateUnit(id: string, organizationId: string, dto: UpdateUnitDto) {
    await this.getUnitById(id, organizationId);

    const updateData: any = { ...dto };
    if (dto.code) {
      updateData.code = dto.code.toUpperCase();
    }

    return this.prisma.unit.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUnit(id: string, organizationId: string) {
    await this.getUnitById(id, organizationId);

    return this.prisma.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
