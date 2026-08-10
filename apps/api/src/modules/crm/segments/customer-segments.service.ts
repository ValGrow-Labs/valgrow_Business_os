import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateSegmentDto } from "./dto/create-segment.dto";

@Injectable()
export class CustomerSegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSegments(organizationId: string) {
    return this.prisma.customerSegment.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async getSegmentById(id: string, organizationId: string) {
    const segment = await this.prisma.customerSegment.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!segment) throw new NotFoundException("Segment not found");
    return segment;
  }

  async createSegment(organizationId: string, dto: CreateSegmentDto) {
    const existing = await this.prisma.customerSegment.findFirst({
      where: { organizationId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(`Segment '${dto.name}' already exists`);
    }

    return this.prisma.customerSegment.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        rules: dto.rules || {},
      },
    });
  }

  async deleteSegment(id: string, organizationId: string) {
    await this.getSegmentById(id, organizationId);
    return this.prisma.customerSegment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getSegmentCustomers(id: string, organizationId: string) {
    const segment = await this.getSegmentById(id, organizationId);
    const rules = (segment.rules as any) || {};

    const where: any = { organizationId, deletedAt: null };
    if (rules.city) where.city = { equals: rules.city, mode: "insensitive" };
    if (rules.state) where.state = { equals: rules.state, mode: "insensitive" };
    if (rules.status) where.status = rules.status;

    return this.prisma.customer.findMany({
      where,
      include: {
        contacts: true,
        tags: { include: { tag: true } },
      },
      orderBy: { name: "asc" },
    });
  }
}
