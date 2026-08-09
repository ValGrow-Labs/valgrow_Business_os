import { Module } from "@nestjs/common";
import { CustomerPaymentsService } from "./customer-payments.service";
import { CustomerPaymentsController } from "./customer-payments.controller";

@Module({
  controllers: [CustomerPaymentsController],
  providers: [CustomerPaymentsService],
  exports: [CustomerPaymentsService],
})
export class CustomerPaymentsModule {}
