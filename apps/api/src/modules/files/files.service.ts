import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFiles(organizationId: string) {
    return this.prisma.file.findMany({
      where: { organizationId },
      include: {
        uploader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async createFileRecord(
    organizationId: string,
    uploaderId: string,
    data: {
      name: string;
      path: string;
      mimeType: string;
      size: number;
      scope?: string;
    },
  ) {
    return this.prisma.file.create({
      data: {
        organizationId,
        uploaderId,
        name: data.name,
        path: data.path,
        mimeType: data.mimeType,
        size: data.size,
        scope: data.scope || "Workspace",
      },
    });
  }

  async deleteFile(id: string, organizationId: string) {
    const file = await this.prisma.file.findFirst({
      where: { id, organizationId },
    });

    if (!file) throw new NotFoundException("File not found");

    return this.prisma.file.delete({
      where: { id },
    });
  }
}
