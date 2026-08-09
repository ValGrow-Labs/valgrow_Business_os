import { Controller, Get, Delete, Param } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("sessions")
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@CurrentUser("id") userId: string) {
    return this.sessionsService.getUserSessions(userId);
  }

  @Delete(":id")
  async revokeSession(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
  ) {
    return this.sessionsService.revokeSession(id, userId);
  }
}
