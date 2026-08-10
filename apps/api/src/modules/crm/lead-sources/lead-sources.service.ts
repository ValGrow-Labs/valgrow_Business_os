import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateLeadSourceDto } from "./dto/create-lead-source.dto";

@Injectable()
export class LeadSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeadSources(organizationId: string) {
    return this.prisma.leadSource.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { name: "asc" },
    });
  }

  async createLeadSource(organizationId: string, dto: CreateLeadSourceDto) {
    const existing = await this.prisma.leadSource.findFirst({
      where: { organizationId, name: dto.name, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(
        `Lead source '${dto.name}' already exists in this organization`,
      );
    }

    return this.prisma.leadSource.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
      },
    });
  }

  async deleteLeadSource(id: string, organizationId: string) {
    const source = await this.prisma.leadSource.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!source) {
      throw new NotFoundException("Lead source not found");
    }

    return this.prisma.leadSource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
