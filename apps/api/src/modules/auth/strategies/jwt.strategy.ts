import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { PrismaService } from "../../../prisma/prisma.service";

export interface JwtPayload {
  sub: string;
  email: string;
  type?: "access" | "refresh";
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.["access_token"] || null;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        "JWT_SECRET",
        "valgrow-dev-jwt-secret-key-change-in-production-32bytes",
      ),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    if (payload.type && payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type for authorization");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
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

    if (!user || user.status !== "ACTIVE" || user.deletedAt) {
      throw new UnauthorizedException("User is not active or has been deleted");
    }

    if (!user.memberships || user.memberships.length === 0) {
      throw new UnauthorizedException(
        "User does not belong to any active organization",
      );
    }

    // STEP 8: Safe Organization Context Resolution
    const requestedOrgId = req.headers["x-organization-id"] as string;
    let activeMember = user.memberships.find(
      (m) => m.organizationId === requestedOrgId,
    );

    if (!activeMember) {
      activeMember = user.memberships[0];
    }

    if (!activeMember) {
      throw new UnauthorizedException(
        "Failed to resolve active organization context",
      );
    }

    // Attach verified organization context to request object
    (req as any).activeOrganization = activeMember.organization;
    (req as any).activeMember = activeMember;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
