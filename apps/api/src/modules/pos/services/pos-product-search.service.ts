import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class PosProductSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchProducts(
    organizationId: string,
    query: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      warehouseId?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 20);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      organizationId,
      status: "ACTIVE",
      deletedAt: null,
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.brandId) where.brandId = query.brandId;

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
        { barcode: { contains: q, mode: "insensitive" } },
        {
          variants: {
            some: {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { barcode: { contains: q, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true } },
          unit: { select: { id: true, name: true, code: true } },
          tax: {
            select: { id: true, name: true, rate: true, isInclusive: true },
          },
          variants: {
            where: { status: "ACTIVE", deletedAt: null },
            include: {
              prices: {
                where: { organizationId, tier: "RETAIL" },
              },
            },
          },
          prices: {
            where: { organizationId, tier: "RETAIL" },
          },
          stockLevels: query.warehouseId
            ? { where: { organizationId, warehouseId: query.warehouseId } }
            : { where: { organizationId } },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    // Map server-derived prices and total available stock
    const mappedProducts = products.map((prod) => {
      const defaultRetailPrice =
        prod.prices.find((p) => !p.variantId && p.tier === "RETAIL")?.price ||
        prod.costPrice;

      const totalOnHand = prod.stockLevels.reduce(
        (sum, s) => sum.add(s.onHand),
        new Prisma.Decimal(0),
      );
      const totalReserved = prod.stockLevels.reduce(
        (sum, s) => sum.add(s.reserved),
        new Prisma.Decimal(0),
      );
      const totalAvailable = totalOnHand.sub(totalReserved);

      return {
        ...prod,
        retailPrice: defaultRetailPrice,
        availableStock: Math.max(0, Number(totalAvailable)),
      };
    });

    return {
      data: mappedProducts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByBarcode(organizationId: string, barcode: string) {
    if (!barcode || !barcode.trim()) {
      throw new BadRequestException("Barcode query cannot be empty");
    }

    const cleanBarcode = barcode.trim();

    // Check direct product barcode/SKU
    const product = await this.prisma.product.findFirst({
      where: {
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
        OR: [{ barcode: cleanBarcode }, { sku: cleanBarcode }],
      },
      include: {
        unit: true,
        tax: true,
        prices: { where: { organizationId, tier: "RETAIL" } },
        variants: true,
      },
    });

    if (product) {
      const price =
        product.prices.find((p) => p.tier === "RETAIL")?.price ||
        product.costPrice;
      return { product, variant: null, price: Number(price) };
    }

    // Check variant barcode/SKU
    const variant = await this.prisma.productVariant.findFirst({
      where: {
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
        OR: [{ barcode: cleanBarcode }, { sku: cleanBarcode }],
      },
      include: {
        product: {
          include: { unit: true, tax: true },
        },
        prices: { where: { organizationId, tier: "RETAIL" } },
      },
    });

    if (variant) {
      const price =
        variant.prices.find((p) => p.tier === "RETAIL")?.price ||
        variant.product.costPrice;
      return { product: variant.product, variant, price: Number(price) };
    }

    return null;
  }
}
