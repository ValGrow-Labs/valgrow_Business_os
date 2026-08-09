import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentMember = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const member = request.activeMember;
    return data ? member?.[data] : member;
  },
);
