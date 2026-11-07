import { Controller, Get, Patch, Post, Param, Body } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") organizationId?: string,
  ) {
    return this.notificationsService.getUserNotifications(userId, organizationId);
  }

  @Patch("read-all")
  async markAllAsRead(
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") organizationId?: string,
  ) {
    return this.notificationsService.markAllAsRead(userId, organizationId);
  }

  @Patch(":id/read")
  async markAsRead(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") organizationId?: string,
  ) {
    return this.notificationsService.markAsRead(id, userId, organizationId);
  }

  @RequirePermissions("settings.manage")
  @Post("security-review-due")
  async triggerSecurityReview(
    @CurrentUser("id") userId: string,
    @CurrentOrg("id") organizationId: string,
    @Body() body: { branchId?: string; branchName?: string; reviewScope?: string },
  ) {
    return this.notificationsService.notifySecurityReviewDue({
      organizationId,
      branchId: body.branchId,
      branchName: body.branchName,
      reviewScope: body.reviewScope,
      actorId: userId,
    });
  }
}
