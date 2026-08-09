import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationUsers(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            jobTitle: true,
            bio: true,
            status: true,
            createdAt: true,
          },
        },
        role: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return members.map((m) => ({
      ...m.user,
      role: m.role.name,
      roleId: m.roleId,
      memberStatus: m.status,
    }));
  }

  async createUser(organizationId: string, data: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    let userId: string;

    if (existingUser) {
      const existingMember = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        throw new ConflictException(
          "User is already a member of this organization",
        );
      }

      userId = existingUser.id;
    } else {
      const passwordHash = await bcrypt.hash(
        data.password || "ChangeMe123!",
        12,
      );
      const newUser = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          phone: data.phone,
          jobTitle: data.jobTitle,
          status: "ACTIVE",
        },
      });
      userId = newUser.id;
    }

    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        roleId: data.roleId,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            jobTitle: true,
            status: true,
            createdAt: true,
          },
        },
        role: true,
      },
    });

    return {
      ...member.user,
      role: member.role.name,
      roleId: member.roleId,
      memberStatus: member.status,
    };
  }

  async updateUser(id: string, organizationId: string, data: any) {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: id,
        },
      },
    });

    if (!member) {
      throw new NotFoundException("User is not a member of this organization");
    }

    if (data.roleId) {
      await this.prisma.organizationMember.update({
        where: { id: member.id },
        data: { roleId: data.roleId, status: data.status },
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        jobTitle: data.jobTitle,
        bio: data.bio,
        status: data.status,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        jobTitle: true,
        bio: true,
        status: true,
        createdAt: true,
      },
    });

    return updatedUser;
  }
}
