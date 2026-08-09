import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrgSettings(organizationId: string) {
    return this.prisma.organizationSettings.findMany({
      where: { organizationId },
    });
  }

  async updateOrgSettings(
    organizationId: string,
    settings: Array<{ key: string; value: string; scope?: string }>,
  ) {
    const results = [];
    for (const item of settings) {
      const upserted = await this.prisma.organizationSettings.upsert({
        where: {
          organizationId_key: {
            organizationId,
            key: item.key,
          },
        },
        update: { value: item.value, scope: item.scope || "Global" },
        create: {
          organizationId,
          key: item.key,
          value: item.value,
          scope: item.scope || "Global",
        },
      });
      results.push(upserted);
    }
    return results;
  }

  async getUserSettings(userId: string) {
    return this.prisma.userSettings.findMany({
      where: { userId },
    });
  }

  async updateUserSettings(
    userId: string,
    settings: Array<{ key: string; value: string }>,
  ) {
    const results = [];
    for (const item of settings) {
      const upserted = await this.prisma.userSettings.upsert({
        where: {
          userId_key: {
            userId,
            key: item.key,
          },
        },
        update: { value: item.value },
        create: { userId, key: item.key, value: item.value },
      });
      results.push(upserted);
    }
    return results;
  }
}
