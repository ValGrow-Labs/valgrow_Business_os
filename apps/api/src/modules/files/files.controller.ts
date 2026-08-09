import { Controller, Get, Post, Delete, Param, Body } from "@nestjs/common";
import { FilesService } from "./files.service";
import { CurrentOrg } from "../../common/decorators/current-org.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";

@Controller("files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async getFiles(@CurrentOrg("id") organizationId: string) {
    return this.filesService.getFiles(organizationId);
  }

  @RequirePermissions("files.upload")
  @Post()
  async createFile(
    @CurrentOrg("id") organizationId: string,
    @CurrentUser("id") uploaderId: string,
    @Body() body: any,
  ) {
    return this.filesService.createFileRecord(organizationId, uploaderId, body);
  }

  @RequirePermissions("files.delete")
  @Delete(":id")
  async deleteFile(
    @Param("id") id: string,
    @CurrentOrg("id") organizationId: string,
  ) {
    return this.filesService.deleteFile(id, organizationId);
  }
}
