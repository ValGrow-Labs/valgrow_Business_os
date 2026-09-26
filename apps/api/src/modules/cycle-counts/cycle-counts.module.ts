import { Module } from "@nestjs/common";
import { CycleCountsService } from "./cycle-counts.service";
import { CycleCountsController } from "./cycle-counts.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [CycleCountsController],
  providers: [CycleCountsService],
  exports: [CycleCountsService],
})
export class CycleCountsModule {}
