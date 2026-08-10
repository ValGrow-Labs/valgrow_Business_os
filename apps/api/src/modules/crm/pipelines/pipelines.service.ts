import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreatePipelineDto,
  UpdatePipelineDto,
  CreateStageDto,
  UpdateStageDto,
} from "./dto/pipeline.dtos";

@Injectable()
export class PipelinesService {
  constructor(private readonly prisma: PrismaService) {}

  async getPipelines(organizationId: string) {
    return this.prisma.crmPipeline.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        stages: {
          orderBy: { position: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getPipelineById(id: string, organizationId: string) {
    const pipeline = await this.prisma.crmPipeline.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        stages: {
          orderBy: { position: "asc" },
        },
      },
    });
    if (!pipeline) throw new NotFoundException("Pipeline not found");
    return pipeline;
  }

  async createPipeline(organizationId: string, dto: CreatePipelineDto) {
    const existing = await this.prisma.crmPipeline.findFirst({
      where: {
        organizationId,
        name: dto.name,
        type: dto.type || "OPPORTUNITY",
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Pipeline '${dto.name}' already exists in this organization`,
      );
    }

    if (dto.isDefault) {
      await this.prisma.crmPipeline.updateMany({
        where: { organizationId, type: dto.type || "OPPORTUNITY" },
        data: { isDefault: false },
      });
    }

    return this.prisma.crmPipeline.create({
      data: {
        organizationId,
        name: dto.name,
        type: dto.type || "OPPORTUNITY",
        isDefault: dto.isDefault || false,
        stages: {
          create: [
            {
              organizationId,
              name: "New / Discovery",
              position: 1,
              probability: 10,
              color: "#3B82F6",
            },
            {
              organizationId,
              name: "Qualification",
              position: 2,
              probability: 30,
              color: "#8B5CF6",
            },
            {
              organizationId,
              name: "Proposal / Demo",
              position: 3,
              probability: 60,
              color: "#F59E0B",
            },
            {
              organizationId,
              name: "Negotiation",
              position: 4,
              probability: 80,
              color: "#EC4899",
            },
            {
              organizationId,
              name: "Won",
              position: 5,
              probability: 100,
              color: "#10B981",
            },
            {
              organizationId,
              name: "Lost",
              position: 6,
              probability: 0,
              color: "#EF4444",
            },
          ],
        },
      },
      include: { stages: { orderBy: { position: "asc" } } },
    });
  }

  async updatePipeline(
    id: string,
    organizationId: string,
    dto: UpdatePipelineDto,
  ) {
    await this.getPipelineById(id, organizationId);
    if (dto.isDefault) {
      const pipeline = await this.prisma.crmPipeline.findUnique({
        where: { id },
      });
      if (pipeline) {
        await this.prisma.crmPipeline.updateMany({
          where: { organizationId, type: pipeline.type },
          data: { isDefault: false },
        });
      }
    }

    return this.prisma.crmPipeline.update({
      where: { id },
      data: {
        name: dto.name,
        isDefault: dto.isDefault,
      },
      include: { stages: { orderBy: { position: "asc" } } },
    });
  }

  async deletePipeline(id: string, organizationId: string) {
    await this.getPipelineById(id, organizationId);
    return this.prisma.crmPipeline.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async addStage(
    pipelineId: string,
    organizationId: string,
    dto: CreateStageDto,
  ) {
    const pipeline = await this.getPipelineById(pipelineId, organizationId);
    const pos = dto.position ?? pipeline.stages.length + 1;

    return this.prisma.crmPipelineStage.create({
      data: {
        organizationId,
        pipelineId,
        name: dto.name,
        position: pos,
        probability: dto.probability ?? 10,
        color: dto.color || "#3B82F6",
      },
    });
  }

  async updateStage(
    stageId: string,
    organizationId: string,
    dto: UpdateStageDto,
  ) {
    const stage = await this.prisma.crmPipelineStage.findFirst({
      where: { id: stageId, organizationId },
    });
    if (!stage) throw new NotFoundException("Stage not found");

    return this.prisma.crmPipelineStage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        position: dto.position,
        probability: dto.probability,
        color: dto.color,
      },
    });
  }

  async deleteStage(stageId: string, organizationId: string) {
    const stage = await this.prisma.crmPipelineStage.findFirst({
      where: { id: stageId, organizationId },
    });
    if (!stage) throw new NotFoundException("Stage not found");

    return this.prisma.crmPipelineStage.delete({
      where: { id: stageId },
    });
  }
}
