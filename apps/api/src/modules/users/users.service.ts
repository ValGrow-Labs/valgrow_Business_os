import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import * as crypto from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  ResetUserPasswordDto,
  ResetPasswordAction,
} from "./dto/reset-user-password.dto";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async getOrganizationUsers(
    organizationId: string,
    query?: { search?: string; status?: string; role?: string },
  ) {
    const memberWhere: any = {
      organizationId,
    };

    if (query?.status && query.status !== "ALL") {
      memberWhere.status = query.status;
    }

    if (query?.role && query.role !== "ALL") {
      memberWhere.role = {
        name: { equals: query.role, mode: "insensitive" },
      };
    }

    if (query?.search?.trim()) {
      const term = query.search.trim();
      memberWhere.OR = [
        { user: { firstName: { contains: term, mode: "insensitive" } } },
        { user: { lastName: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
        { role: { name: { contains: term, mode: "insensitive" } } },
      ];
    }

    const members = await this.prisma.organizationMember.findMany({
      where: memberWhere,
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

  async createUser(organizationId: string, data: any, actorId?: string) {
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

    // Notify organization admins after member is successfully created
    await this.notificationsService.notifyMemberInvited({
      organizationId,
      memberId: member.id,
      userId: member.user.id,
      email: member.user.email,
      roleName: member.role.name,
      status: member.status === "ACTIVE" ? "Active Member" : "Pending Acceptance",
      actorId,
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

  async resetUserPassword(
    targetUserId: string,
    organizationId: string,
    actor: any,
    actorMember: any,
    dto: ResetUserPasswordDto,
    req?: any,
  ) {
    if (!actorMember || !actorMember.role) {
      throw new ForbiddenException("Unauthorized to perform password reset");
    }

    const actorRole = actorMember.role.name;
    const isOwner = actorRole === "Owner";
    const isAdmin = actorRole === "Administrator";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "Only workspace Owners and Administrators can initiate password resets",
      );
    }

    // Tenant check: target must belong to this organization
    const targetMember = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: targetUserId,
        },
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!targetMember || !targetMember.user || targetMember.user.deletedAt) {
      throw new NotFoundException(
        "User is not an active member of this organization",
      );
    }

    const targetUser = targetMember.user;
    const targetRole = targetMember.role.name;

    // Role hierarchy safeguard: non-owners cannot reset an Owner
    if (targetRole === "Owner" && !isOwner) {
      throw new ForbiddenException(
        "Only an Owner can reset an Owner's password",
      );
    }

    if (dto.action === ResetPasswordAction.GENERATE_LINK) {
      const jti = crypto.randomUUID();
      const resetToken = this.jwtService.sign(
        {
          sub: targetUser.id,
          email: targetUser.email,
          type: "reset",
          jti,
        },
        { expiresIn: "1h" },
      );

      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: {
          resetToken,
          resetTokenExpiresAt: expiresAt,
        },
      });

      let baseUrl =
        req?.headers?.origin ||
        req?.headers?.referer ||
        this.configService.get<string>("FRONTEND_URL") ||
        "https://valgrow-business-os-eosin.vercel.app";

      try {
        const parsed = new URL(baseUrl);
        baseUrl = parsed.origin;
      } catch {
        baseUrl = "https://valgrow-business-os-eosin.vercel.app";
      }

      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      return {
        success: true,
        action: "generate-link",
        resetUrl,
        resetToken,
        expiresAt: expiresAt.toISOString(),
        message: "Password reset link generated successfully",
      };
    }

    if (dto.action === ResetPasswordAction.SET_TEMPORARY) {
      if (!dto.temporaryPassword || dto.temporaryPassword.trim().length < 8) {
        throw new BadRequestException(
          "Temporary password must be at least 8 characters long",
        );
      }

      const bcryptRounds = parseInt(
        this.configService.get<string>("BCRYPT_ROUNDS", "12"),
        10,
      );
      const passwordHash = await bcrypt.hash(
        dto.temporaryPassword,
        bcryptRounds,
      );

      await this.prisma.user.update({
        where: { id: targetUser.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          resetToken: null,
          resetTokenExpiresAt: null,
        },
      });

      // Revoke all active sessions belonging to the target user
      await this.prisma.session.updateMany({
        where: { userId: targetUser.id, isRevoked: false },
        data: { isRevoked: true },
      });

      return {
        success: true,
        action: "set-temporary",
        message:
          "Temporary password set successfully. All active sessions have been revoked.",
      };
    }

    throw new BadRequestException("Invalid reset password action");
  }
}
