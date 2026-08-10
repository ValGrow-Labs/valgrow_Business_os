import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { ActivityLogsModule } from "../activity-logs/activity-logs.module";
import { LeadSourcesController } from "./lead-sources/lead-sources.controller";
import { LeadSourcesService } from "./lead-sources/lead-sources.service";
import { PipelinesController } from "./pipelines/pipelines.controller";
import { PipelinesService } from "./pipelines/pipelines.service";
import { LeadsController } from "./leads/leads.controller";
import { LeadsService } from "./leads/leads.service";
import { OpportunitiesController } from "./opportunities/opportunities.controller";
import { OpportunitiesService } from "./opportunities/opportunities.service";
import { CustomerContactsController } from "./contacts/customer-contacts.controller";
import { CustomerContactsService } from "./contacts/customer-contacts.service";
import { CrmActivitiesController } from "./activities/crm-activities.controller";
import { CrmActivitiesService } from "./activities/crm-activities.service";
import { CrmTasksController } from "./tasks/crm-tasks.controller";
import { CrmTasksService } from "./tasks/crm-tasks.service";
import { CrmNotesController } from "./notes/crm-notes.controller";
import { CrmNotesService } from "./notes/crm-notes.service";
import { CrmTagsController } from "./tags/crm-tags.controller";
import { CrmTagsService } from "./tags/crm-tags.service";
import { CustomerSegmentsController } from "./segments/customer-segments.controller";
import { CustomerSegmentsService } from "./segments/customer-segments.service";
import { Customer360Controller } from "./customer-360/customer-360.controller";
import { Customer360Service } from "./customer-360/customer-360.service";

@Module({
  imports: [PrismaModule, ActivityLogsModule],
  controllers: [
    LeadSourcesController,
    PipelinesController,
    LeadsController,
    OpportunitiesController,
    CustomerContactsController,
    CrmActivitiesController,
    CrmTasksController,
    CrmNotesController,
    CrmTagsController,
    CustomerSegmentsController,
    Customer360Controller,
  ],
  providers: [
    LeadSourcesService,
    PipelinesService,
    LeadsService,
    OpportunitiesService,
    CustomerContactsService,
    CrmActivitiesService,
    CrmTasksService,
    CrmNotesService,
    CrmTagsService,
    CustomerSegmentsService,
    Customer360Service,
  ],
  exports: [
    LeadSourcesService,
    PipelinesService,
    LeadsService,
    OpportunitiesService,
    CustomerContactsService,
    CrmActivitiesService,
    CrmTasksService,
    CrmNotesService,
    CrmTagsService,
    CustomerSegmentsService,
    Customer360Service,
  ],
})
export class CrmModule {}
