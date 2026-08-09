import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { Response, Request } from "express";
import { PrismaService } from "../../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private get bcryptRounds(): number {
    return parseInt(this.configService.get<string>("BCRYPT_ROUNDS", "12"), 10);
  }

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = this.configService.get<string>("NODE_ENV") === "production";

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/" });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/[\s-]+/g, "-");
  }

  async register(dto: RegisterDto, res: Response) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    const slug =
      dto.organizationSlug || this.generateSlug(dto.organizationName);
    const existingOrg = await this.prisma.organization.findUnique({
      where: { slug },
    });

    const finalSlug = existingOrg
      ? `${slug}-${Date.now().toString().slice(-4)}`
      : slug;
    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug: finalSlug,
        },
      });

      // 2. Create Owner Role for Organization
      const ownerRole = await tx.role.create({
        data: {
          organizationId: org.id,
          name: "Owner",
          description: "Workspace owner with full access",
          isSystem: true,
          scope: "Organization",
        },
      });

      // 3. Create User
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          jobTitle: "Workspace owner",
        },
      });

      // 4. Create Organization Member
      const member = await tx.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      // 5. Create Default Branch (Head Office)
      await tx.branch.create({
        data: {
          organizationId: org.id,
          name: "Head Office",
          code: "HQ",
          city: "Bengaluru",
          status: "ACTIVE",
          managerId: user.id,
        },
      });

      return { user, org, member, ownerRole };
    });

    // Create session and set cookies
    const tokens = await this.createSessionAndTokens(result.user.id, res);

    const { passwordHash: _, ...userWithoutPassword } = result.user;
    return {
      message: "Registration successful",
      user: userWithoutPassword,
      activeOrganization: result.org,
      role: result.ownerRole.name,
      tokens,
    };
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            organization: true,
            role: true,
          },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("Account is not active");
    }

    if (!user.memberships || user.memberships.length === 0) {
      throw new UnauthorizedException(
        "User is not a member of any organization",
      );
    }

    const tokens = await this.createSessionAndTokens(user.id, res);
    const activeMember = user.memberships[0]!;

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      message: "Login successful",
      user: userWithoutPassword,
      activeOrganization: activeMember.organization,
      role: activeMember.role.name,
      tokens,
    };
  }

  async logout(userId: string, res: Response) {
    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    this.clearAuthCookies(res);
    return { message: "Logged out successfully" };
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = req.cookies?.["refresh_token"];
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token missing");
    }

    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>(
          "JWT_REFRESH_SECRET",
          "valgrow-dev-refresh-secret-key-change-in-production-32bytes",
        ),
      });

      const session = await this.prisma.session.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        throw new UnauthorizedException("Invalid or expired refresh session");
      }

      const tokens = await this.createSessionAndTokens(
        session.userId,
        res,
        session.id,
      );
      return { message: "Token refreshed successfully", tokens };
    } catch (e) {
      this.clearAuthCookies(res);
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async getMe(userId: string, activeOrgId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            organization: true,
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const activeMember =
      user.memberships.find((m) => m.organizationId === activeOrgId) ||
      user.memberships[0];

    const permissions =
      activeMember?.role?.permissions.map((rp) => rp.permission.key) || [];

    const { passwordHash: _, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      activeOrganization: activeMember?.organization || null,
      role: activeMember?.role || null,
      permissions,
      organizations: user.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        plan: m.organization.plan,
        role: m.role.name,
      })),
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      // Return generic success to prevent email enumeration
      return {
        message: "If an account exists, a password reset link has been sent.",
      };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: "reset" },
      { expiresIn: "1h" },
    );

    // In a full implementation, email service sends resetToken link
    return {
      message: "Password reset link generated successfully",
      resetToken, // Exposed in response for dev/testing foundation
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    try {
      const payload = this.jwtService.verify(dto.token);
      if (payload.type !== "reset") {
        throw new BadRequestException("Invalid reset token type");
      }

      const passwordHash = await bcrypt.hash(
        dto.newPassword,
        this.bcryptRounds,
      );
      await this.prisma.user.update({
        where: { id: payload.sub },
        data: { passwordHash },
      });

      await this.prisma.session.updateMany({
        where: { userId: payload.sub },
        data: { isRevoked: true },
      });

      return {
        message:
          "Password reset successfully. Please log in with your new password.",
      };
    } catch {
      throw new BadRequestException("Invalid or expired reset token");
    }
  }

  private async createSessionAndTokens(
    userId: string,
    res: Response,
    existingSessionId?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const jwtSecret = this.configService.get<string>(
      "JWT_SECRET",
      "valgrow-dev-jwt-secret-key-change-in-production-32bytes",
    );
    const refreshSecret = this.configService.get<string>(
      "JWT_REFRESH_SECRET",
      "valgrow-dev-refresh-secret-key-change-in-production-32bytes",
    );

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: "access" },
      { secret: jwtSecret, expiresIn: "15m" },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: "refresh",
        jti: crypto.randomUUID(),
      },
      { secret: refreshSecret, expiresIn: "7d" },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    if (existingSessionId) {
      await this.prisma.session.update({
        where: { id: existingSessionId },
        data: { token: refreshToken, expiresAt, isRevoked: false },
      });
    } else {
      await this.prisma.session.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt,
        },
      });
    }

    this.setAuthCookies(res, accessToken, refreshToken);
    return { accessToken, refreshToken };
  }
}
