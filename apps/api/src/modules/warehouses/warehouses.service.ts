import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  private async validateBranch(organizationId: string, branchId?: string) {
    if (branchId) {
      const branch = await this.prisma.branch.findFirst({
        where: { id: branchId, organizationId, deletedAt: null },
      });
      if (!branch) {
        throw new BadRequestException(
          "Branch does not exist in this organization",
        );
      }
    }
  }

  async getWarehouses(organizationId: string) {
    return this.prisma.warehouse.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true, city: true } },
        _count: { select: { locations: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getWarehouseById(id: string, organizationId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true, city: true } },
        locations: { where: { deletedAt: null } },
      },
    });

    if (!warehouse) {
      throw new NotFoundException("Warehouse not found in this organization");
    }

    return warehouse;
  }

  async createWarehouse(organizationId: string, dto: CreateWarehouseDto) {
    await this.validateBranch(organizationId, dto.branchId);

    const existingCode = await this.prisma.warehouse.findFirst({
      where: { organizationId, code: dto.code, deletedAt: null },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Warehouse code '${dto.code}' is already in use in this organization`,
      );
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        branchId: dto.branchId,
        address: dto.address,
        city: dto.city,
        isDefault: dto.isDefault ?? false,
        status: dto.status || "ACTIVE",
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async updateWarehouse(
    id: string,
    organizationId: string,
    dto: UpdateWarehouseDto,
  ) {
    await this.getWarehouseById(id, organizationId);
    await this.validateBranch(organizationId, dto.branchId);

    if (dto.code) {
      const existingCode = await this.prisma.warehouse.findFirst({
        where: {
          organizationId,
          code: dto.code,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Warehouse code '${dto.code}' is already in use in this organization`,
        );
      }
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: dto,
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteWarehouse(id: string, organizationId: string) {
    await this.getWarehouseById(id, organizationId);

    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
