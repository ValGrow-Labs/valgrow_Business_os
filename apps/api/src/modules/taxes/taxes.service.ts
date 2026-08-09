import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateTaxDto } from "./dto/create-tax.dto";
import { UpdateTaxDto } from "./dto/update-tax.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class TaxesService {
  constructor(private readonly prisma: PrismaService) {}

  async getTaxes(organizationId: string) {
    return this.prisma.tax.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTaxById(id: string, organizationId: string) {
    const tax = await this.prisma.tax.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!tax) {
      throw new NotFoundException("Tax rate not found in this organization");
    }

    return tax;
  }

  async createTax(organizationId: string, dto: CreateTaxDto) {
    return this.prisma.tax.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        rate: new Prisma.Decimal(dto.rate),
        type: dto.type || "GST",
        isInclusive: dto.isInclusive ?? false,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateTax(id: string, organizationId: string, dto: UpdateTaxDto) {
    await this.getTaxById(id, organizationId);

    const updateData: any = { ...dto };
    if (dto.rate !== undefined) {
      updateData.rate = new Prisma.Decimal(dto.rate);
    }

    return this.prisma.tax.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTax(id: string, organizationId: string) {
    await this.getTaxById(id, organizationId);

    return this.prisma.tax.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
