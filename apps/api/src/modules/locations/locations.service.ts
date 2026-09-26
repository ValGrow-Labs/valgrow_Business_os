import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyWarehouse(warehouseId: string, organizationId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, deletedAt: null },
    });

    if (!warehouse) {
      throw new NotFoundException("Warehouse not found in this organization");
    }

    return warehouse;
  }

  async getLocations(warehouseId: string, organizationId: string) {
    await this.verifyWarehouse(warehouseId, organizationId);

    return this.prisma.location.findMany({
      where: { warehouseId, organizationId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  }

  async getLocationById(
    id: string,
    warehouseId: string,
    organizationId: string,
  ) {
    await this.verifyWarehouse(warehouseId, organizationId);

    const location = await this.prisma.location.findFirst({
      where: { id, warehouseId, organizationId, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundException("Location not found in this warehouse");
    }

    return location;
  }

  async createLocation(
    warehouseId: string,
    organizationId: string,
    dto: CreateLocationDto,
  ) {
    await this.verifyWarehouse(warehouseId, organizationId);

    const existingCode = await this.prisma.location.findFirst({
      where: { organizationId, warehouseId, code: dto.code, deletedAt: null },
    });
    if (existingCode) {
      throw new BadRequestException(
        `Location code '${dto.code}' already exists in this warehouse`,
      );
    }

    if (dto.isDefault) {
      await this.prisma.location.updateMany({
        where: { organizationId, warehouseId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.location.create({
      data: {
        organizationId,
        warehouseId,
        name: dto.name,
        code: dto.code,
        aisle: dto.aisle,
        rack: dto.rack,
        shelf: dto.shelf,
        bin: dto.bin,
        isDefault: dto.isDefault ?? false,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateLocation(
    id: string,
    warehouseId: string,
    organizationId: string,
    dto: UpdateLocationDto,
  ) {
    await this.getLocationById(id, warehouseId, organizationId);

    if (dto.code) {
      const existingCode = await this.prisma.location.findFirst({
        where: {
          organizationId,
          warehouseId,
          code: dto.code,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existingCode) {
        throw new BadRequestException(
          `Location code '${dto.code}' already exists in this warehouse`,
        );
      }
    }

    if (dto.isDefault) {
      await this.prisma.location.updateMany({
        where: {
          organizationId,
          warehouseId,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.location.update({
      where: { id },
      data: dto,
    });
  }

  async deleteLocation(
    id: string,
    warehouseId: string,
    organizationId: string,
  ) {
    await this.getLocationById(id, warehouseId, organizationId);

    return this.prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
