import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentOrg = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const org = request.activeOrganization;
    return data ? org?.[data] : org;
  },
);
