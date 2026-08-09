import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isRevoked: false },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        expiresAt: true,
        createdAt: true,
      },
    });
  }

  async revokeSession(id: string, userId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id, userId },
    });

    if (!session) throw new NotFoundException("Session not found");

    return this.prisma.session.update({
      where: { id },
      data: { isRevoked: true },
    });
  }
}
