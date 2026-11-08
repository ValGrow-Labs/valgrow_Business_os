import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";
import { BootstrapService } from "./bootstrap.service";

@Global()
@Module({
  providers: [PrismaService, BootstrapService],
  exports: [PrismaService, BootstrapService],
})
export class PrismaModule {}
