import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeams(organizationId: string) {
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        department: { select: { id: true, name: true } },
        lead: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createTeam(organizationId: string, data: any) {
    return this.prisma.team.create({
      data: {
        organizationId,
        departmentId: data.departmentId,
        name: data.name,
        description: data.description,
        leadId: data.leadId,
      },
    });
  }

  async updateTeam(id: string, organizationId: string, data: any) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
    });

    if (!team) throw new NotFoundException("Team not found");

    return this.prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        departmentId: data.departmentId,
        leadId: data.leadId,
      },
    });
  }
}
