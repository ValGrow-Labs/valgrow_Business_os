import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async getCustomers(
    organizationId: string,
    queryOrStatus?: string | { status?: string; search?: string },
  ) {
    const where: Prisma.CustomerWhereInput = { organizationId, deletedAt: null };

    if (typeof queryOrStatus === "string") {
      if (queryOrStatus) where.status = queryOrStatus as any;
    } else if (queryOrStatus) {
      if (queryOrStatus.status) where.status = queryOrStatus.status as any;
      if (queryOrStatus.search) {
        const term = queryOrStatus.search.trim();
        if (term) {
          where.OR = [
            { name: { contains: term, mode: "insensitive" } },
            { customerCode: { contains: term, mode: "insensitive" } },
            { phone: { contains: term, mode: "insensitive" } },
            { email: { contains: term, mode: "insensitive" } },
          ];
        }
      }
    }

    return this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  async getCustomerById(id: string, organizationId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException("Customer not found");
    return customer;
  }

  async createCustomer(organizationId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: {
        organizationId,
        customerCode: dto.customerCode,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        `Customer code '${dto.customerCode}' is already in use in this organization`,
      );
    }

    return this.prisma.customer.create({
      data: {
        organizationId,
        customerCode: dto.customerCode,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country || "India",
        taxIdNumber: dto.taxIdNumber,
        currency: dto.currency || "INR",
        creditLimit:
          dto.creditLimit !== undefined
            ? new Prisma.Decimal(dto.creditLimit)
            : new Prisma.Decimal(0),
        paymentTerms: dto.paymentTerms || "NET30",
        notes: dto.notes,
        status: dto.status || "ACTIVE",
      },
    });
  }

  async updateCustomer(
    id: string,
    organizationId: string,
    dto: UpdateCustomerDto,
  ) {
    await this.getCustomerById(id, organizationId);

    if (dto.customerCode) {
      const existing = await this.prisma.customer.findFirst({
        where: {
          organizationId,
          customerCode: dto.customerCode,
          deletedAt: null,
          NOT: { id },
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Customer code '${dto.customerCode}' is already in use`,
        );
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        customerCode: dto.customerCode,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        taxIdNumber: dto.taxIdNumber,
        currency: dto.currency,
        creditLimit:
          dto.creditLimit !== undefined
            ? new Prisma.Decimal(dto.creditLimit)
            : undefined,
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        status: dto.status,
      },
    });
  }

  async deleteCustomer(id: string, organizationId: string) {
    await this.getCustomerById(id, organizationId);
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
