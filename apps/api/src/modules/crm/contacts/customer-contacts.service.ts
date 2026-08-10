import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  CreateCustomerContactDto,
  UpdateCustomerContactDto,
} from "./dto/contact.dtos";

@Injectable()
export class CustomerContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async getContactsByCustomer(customerId: string, organizationId: string) {
    const cust = await this.prisma.customer.findFirst({
      where: { id: customerId, organizationId, deletedAt: null },
    });
    if (!cust) throw new NotFoundException("Customer not found");

    return this.prisma.customerContact.findMany({
      where: { customerId, organizationId, deletedAt: null },
      orderBy: { isPrimary: "desc" },
    });
  }

  async createContact(organizationId: string, dto: CreateCustomerContactDto) {
    const cust = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, deletedAt: null },
    });
    if (!cust)
      throw new BadRequestException("Invalid or cross-tenant customer");

    if (dto.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: { customerId: dto.customerId, organizationId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerContact.create({
      data: {
        organizationId,
        customerId: dto.customerId,
        name: dto.name,
        role: dto.role,
        email: dto.email,
        phone: dto.phone,
        isPrimary: dto.isPrimary || false,
        notes: dto.notes,
      },
    });
  }

  async updateContact(
    id: string,
    organizationId: string,
    dto: UpdateCustomerContactDto,
  ) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException("Contact not found");

    if (dto.isPrimary) {
      await this.prisma.customerContact.updateMany({
        where: { customerId: contact.customerId, organizationId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.customerContact.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.role,
        email: dto.email,
        phone: dto.phone,
        isPrimary: dto.isPrimary,
        notes: dto.notes,
      },
    });
  }

  async deleteContact(id: string, organizationId: string) {
    const contact = await this.prisma.customerContact.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    if (!contact) throw new NotFoundException("Contact not found");

    return this.prisma.customerContact.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
