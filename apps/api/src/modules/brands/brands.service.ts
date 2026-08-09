import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateBrandDto } from "./dto/create-brand.dto";
import { UpdateBrandDto } from "./dto/update-brand.dto";

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async getBrands(organizationId: string) {
    return this.prisma.brand.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBrandById(id: string, organizationId: string) {
    const brand = await this.prisma.brand.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null,
      },
    });

    if (!brand) {
      throw new NotFoundException("Brand not found in this organization");
    }

    return brand;
  }

  async createBrand(organizationId: string, dto: CreateBrandDto) {
    const slug = dto.slug || this.slugify(dto.name);
    return this.prisma.brand.create({
      data: {
        organizationId,
        name: dto.name,
        slug,
        logo: dto.logo,
        description: dto.description,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateBrand(id: string, organizationId: string, dto: UpdateBrandDto) {
    await this.getBrandById(id, organizationId);

    const updateData: any = { ...dto };
    if (dto.name && !dto.slug) {
      updateData.slug = this.slugify(dto.name);
    }

    return this.prisma.brand.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteBrand(id: string, organizationId: string) {
    await this.getBrandById(id, organizationId);

    return this.prisma.brand.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
