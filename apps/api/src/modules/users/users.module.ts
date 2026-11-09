import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { NotificationsModule } from "../notifications/notifications.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [NotificationsModule, AuthModule, ConfigModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
