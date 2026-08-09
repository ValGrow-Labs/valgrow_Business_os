import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class AppController {
  @Get()
  checkHealth() {
    return {
      status: "ok",
      service: "ValGrow Business OS API",
      timestamp: new Date().toISOString(),
    };
  }
}
