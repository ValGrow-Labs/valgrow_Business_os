import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { CreateSupplierContactDto } from "./dto/create-supplier-contact.dto";
import { UpdateSupplierContactDto } from "./dto/update-supplier-contact.dto";

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async getSuppliers(organizationId: string) {
    return this.prisma.supplier.findMany({
      where: { organizationId, deletedAt: null },
      include: {
        contacts: true,
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async getSupplierById(id: string, organizationId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: {
        contacts: true,
      },
    });
    if (!supplier) {
      throw new NotFoundException("Supplier not found in this organization");
    }
    return supplier;
  }

  async createSupplier(organizationId: string, dto: CreateSupplierDto) {
    const existing = await this.prisma.supplier.findFirst({
      where: { organizationId, code: dto.code, deletedAt: null },
    });
    if (existing) {
      throw new BadRequestException(
        `Supplier code '${dto.code}' is already in use in this organization`,
      );
    }

    return this.prisma.supplier.create({
      data: {
        organizationId,
        name: dto.name,
        code: dto.code,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        taxIdNumber: dto.taxIdNumber,
        currency: dto.currency || "INR",
        paymentTerms: dto.paymentTerms,
        notes: dto.notes,
        status: dto.status || "ACTIVE",
      },
      include: { contacts: true },
    });
  }

  async updateSupplier(
    id: string,
    organizationId: string,
    dto: UpdateSupplierDto,
  ) {
    await this.getSupplierById(id, organizationId);

    if (dto.code) {
      const existing = await this.prisma.supplier.findFirst({
        where: {
          organizationId,
          code: dto.code,
          id: { not: id },
          deletedAt: null,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Supplier code '${dto.code}' is already in use in this organization`,
        );
      }
    }

    return this.prisma.supplier.update({
      where: { id },
      data: dto,
      include: { contacts: true },
    });
  }

  async deleteSupplier(id: string, organizationId: string) {
    await this.getSupplierById(id, organizationId);
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- Contacts ---

  async getContacts(supplierId: string, organizationId: string) {
    await this.getSupplierById(supplierId, organizationId);
    return this.prisma.supplierContact.findMany({
      where: { supplierId, organizationId },
      orderBy: { createdAt: "asc" },
    });
  }

  async createContact(
    supplierId: string,
    organizationId: string,
    dto: CreateSupplierContactDto,
  ) {
    await this.getSupplierById(supplierId, organizationId);
    return this.prisma.supplierContact.create({
      data: {
        organizationId,
        supplierId,
        name: dto.name,
        role: dto.title,
        email: dto.email,
        phone: dto.phone,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async updateContact(
    supplierId: string,
    id: string,
    organizationId: string,
    dto: UpdateSupplierContactDto,
  ) {
    await this.getSupplierById(supplierId, organizationId);
    const contact = await this.prisma.supplierContact.findFirst({
      where: { id, supplierId, organizationId },
    });
    if (!contact) {
      throw new NotFoundException("Supplier contact not found");
    }
    return this.prisma.supplierContact.update({
      where: { id },
      data: {
        name: dto.name,
        role: dto.title,
        email: dto.email,
        phone: dto.phone,
        isPrimary: dto.isPrimary,
      },
    });
  }

  async deleteContact(supplierId: string, id: string, organizationId: string) {
    await this.getSupplierById(supplierId, organizationId);
    const contact = await this.prisma.supplierContact.findFirst({
      where: { id, supplierId, organizationId },
    });
    if (!contact) {
      throw new NotFoundException("Supplier contact not found");
    }
    return this.prisma.supplierContact.delete({
      where: { id },
    });
  }
}
