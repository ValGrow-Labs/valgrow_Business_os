import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";
import { PrismaService } from "./prisma/prisma.service";

@Controller()
@Public()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getRoot() {
    return {
      message: "ValGrow Business OS API is running",
      health: "/health",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  async checkHealth() {
    let dbStatus = "ok";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = "error";
    }

    return {
      status: "ok",
      service: "ValGrow Business OS API",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      commit: process.env.RENDER_GIT_COMMIT || "local",
    };
  }
}

