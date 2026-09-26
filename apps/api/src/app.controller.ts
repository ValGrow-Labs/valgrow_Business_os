import { Controller, Get } from "@nestjs/common";
import { Public } from "./common/decorators/public.decorator";

@Controller()
@Public()
export class AppController {
  @Get()
  getRoot() {
    return {
      message: "ValGrow Business OS API is running",
      health: "/health",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  checkHealth() {
    return {
      status: "ok",
      service: "ValGrow Business OS API",
      timestamp: new Date().toISOString(),
    };
  }
}

