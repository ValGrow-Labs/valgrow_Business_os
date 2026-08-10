import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateFiscalYearDto } from "./dto/create-fiscal-year.dto";

@Injectable()
export class FiscalYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFiscalYears(orgId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { organizationId: orgId },
      include: {
        periods: { orderBy: { periodNumber: "asc" } },
      },
      orderBy: { startDate: "desc" },
    });
  }

  async getFiscalYear(id: string, orgId: string) {
    const fy = await this.prisma.fiscalYear.findFirst({
      where: { id, organizationId: orgId },
      include: {
        periods: { orderBy: { periodNumber: "asc" } },
      },
    });
    if (!fy) throw new NotFoundException("Fiscal year not found");
    return fy;
  }

  async createFiscalYear(orgId: string, dto: CreateFiscalYearDto) {
    const existing = await this.prisma.fiscalYear.findUnique({
      where: { organizationId_name: { organizationId: orgId, name: dto.name } },
    });
    if (existing) throw new BadRequestException(`Fiscal Year ${dto.name} already exists`);

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException("End date must be after start date");
    }

    const fy = await this.prisma.fiscalYear.create({
      data: {
        organizationId: orgId,
        name: dto.name,
        startDate,
        endDate,
      },
    });

    // Auto generate 12 monthly accounting periods
    for (let month = 0; month < 12; month++) {
      const pNumber = month + 1;
      const pStart = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth() + month, 1));
      const pEnd = new Date(Date.UTC(startDate.getFullYear(), startDate.getMonth() + month + 1, 0, 23, 59, 59, 999));
      const pName = `${startDate.getFullYear()}-M${String(pNumber).padStart(2, "0")}`;

      await this.prisma.accountingPeriod.create({
        data: {
          organizationId: orgId,
          fiscalYearId: fy.id,
          periodName: pName,
          periodNumber: pNumber,
          startDate: pStart,
          endDate: pEnd,
          status: "OPEN",
        },
      });
    }

    return this.getFiscalYear(fy.id, orgId);
  }

  async closeFiscalYear(id: string, orgId: string) {
    const fy = await this.getFiscalYear(id, orgId);

    // Ensure all periods are closed or locked
    const openPeriods = fy.periods.filter((p: any) => p.status === "OPEN");
    if (openPeriods.length > 0) {
      throw new BadRequestException("Cannot close fiscal year with OPEN accounting periods. Close all periods first.");
    }

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: true },
    });
  }
}
