import { Controller, Get, Patch, Param } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser("id") userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch("read-all")
  async markAllAsRead(@CurrentUser("id") userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
