-- CreateEnum
CREATE TYPE "POSTransactionStatus" AS ENUM ('DRAFT', 'SENT_TO_BILLING', 'BILLING_IN_PROGRESS', 'READY_FOR_PAYMENT', 'PAYMENT_IN_PROGRESS', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "POSCart"
  ADD COLUMN "cartNumber" TEXT,
  ADD COLUMN "workflowStatus" "POSTransactionStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "salespersonId" TEXT,
  ADD COLUMN "billingStaffId" TEXT,
  ADD COLUMN "billingClaimedAt" TIMESTAMP(3),
  ADD COLUMN "cashierId" TEXT,
  ADD COLUMN "paymentClaimedAt" TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledById" TEXT,
  ADD COLUMN "cancelledAt" TIMESTAMP(3),
  ALTER COLUMN "sessionId" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "POSCart" DROP CONSTRAINT IF EXISTS "POSCart_sessionId_fkey";

-- AddForeignKey
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "POSSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_salespersonId_fkey" FOREIGN KEY ("salespersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_billingStaffId_fkey" FOREIGN KEY ("billingStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "POSCart_organizationId_cartNumber_key" ON "POSCart"("organizationId", "cartNumber");
CREATE INDEX "POSCart_workflowStatus_idx" ON "POSCart"("workflowStatus");
CREATE INDEX "POSCart_salespersonId_idx" ON "POSCart"("salespersonId");
CREATE INDEX "POSCart_billingStaffId_idx" ON "POSCart"("billingStaffId");
CREATE INDEX "POSCart_cashierId_idx" ON "POSCart"("cashierId");

-- CreateTable
CREATE TABLE "POSWorkflowTransition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "fromStatus" "POSTransactionStatus" NOT NULL,
    "toStatus" "POSTransactionStatus" NOT NULL,
    "actorId" TEXT NOT NULL,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POSWorkflowTransition_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "POSWorkflowTransition" ADD CONSTRAINT "POSWorkflowTransition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSWorkflowTransition" ADD CONSTRAINT "POSWorkflowTransition_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "POSCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSWorkflowTransition" ADD CONSTRAINT "POSWorkflowTransition_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "POSWorkflowTransition_organizationId_idx" ON "POSWorkflowTransition"("organizationId");
CREATE INDEX "POSWorkflowTransition_cartId_idx" ON "POSWorkflowTransition"("cartId");
CREATE INDEX "POSWorkflowTransition_actorId_idx" ON "POSWorkflowTransition"("actorId");
CREATE INDEX "POSWorkflowTransition_createdAt_idx" ON "POSWorkflowTransition"("createdAt");
