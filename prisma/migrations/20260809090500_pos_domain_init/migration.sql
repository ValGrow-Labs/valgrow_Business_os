-- CreateEnum
CREATE TYPE "POSSessionStatus" AS ENUM ('OPEN', 'CLOSED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "POSCartStatus" AS ENUM ('ACTIVE', 'HELD', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "POSSaleStatus" AS ENUM ('COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "POSSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(14,4),
    "expectedCash" DECIMAL(14,4),
    "cashDifference" DECIMAL(14,4),
    "notes" TEXT,
    "status" "POSSessionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSCart" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "customerId" TEXT,
    "subtotalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "status" "POSCartStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSCart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSCartItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "POSCartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSSale" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "cartId" TEXT,
    "salesOrderId" TEXT,
    "salesInvoiceId" TEXT,
    "receiptNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "cashierId" TEXT NOT NULL,
    "subtotalAmount" DECIMAL(14,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "paidAmount" DECIMAL(14,4) NOT NULL,
    "changeAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "status" "POSSaleStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "POSPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "posSaleId" TEXT NOT NULL,
    "paymentMethod" "CustomerPaymentMethod" NOT NULL DEFAULT 'CASH',
    "amount" DECIMAL(14,4) NOT NULL,
    "receivedAmount" DECIMAL(14,4),
    "changeAmount" DECIMAL(14,4),
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "POSPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "POSSession_organizationId_idx" ON "POSSession"("organizationId");
CREATE INDEX "POSSession_branchId_idx" ON "POSSession"("branchId");
CREATE INDEX "POSSession_warehouseId_idx" ON "POSSession"("warehouseId");
CREATE INDEX "POSSession_terminalId_idx" ON "POSSession"("terminalId");
CREATE INDEX "POSSession_status_idx" ON "POSSession"("status");

-- CreateIndex
CREATE INDEX "POSCart_organizationId_idx" ON "POSCart"("organizationId");
CREATE INDEX "POSCart_branchId_idx" ON "POSCart"("branchId");
CREATE INDEX "POSCart_warehouseId_idx" ON "POSCart"("warehouseId");
CREATE INDEX "POSCart_sessionId_idx" ON "POSCart"("sessionId");
CREATE INDEX "POSCart_customerId_idx" ON "POSCart"("customerId");
CREATE INDEX "POSCart_status_idx" ON "POSCart"("status");

-- CreateIndex
CREATE INDEX "POSCartItem_organizationId_idx" ON "POSCartItem"("organizationId");
CREATE INDEX "POSCartItem_cartId_idx" ON "POSCartItem"("cartId");
CREATE INDEX "POSCartItem_productId_idx" ON "POSCartItem"("productId");
CREATE INDEX "POSCartItem_variantId_idx" ON "POSCartItem"("variantId");

-- CreateIndex
CREATE INDEX "POSSale_organizationId_idx" ON "POSSale"("organizationId");
CREATE INDEX "POSSale_branchId_idx" ON "POSSale"("branchId");
CREATE INDEX "POSSale_warehouseId_idx" ON "POSSale"("warehouseId");
CREATE INDEX "POSSale_sessionId_idx" ON "POSSale"("sessionId");
CREATE INDEX "POSSale_salesOrderId_idx" ON "POSSale"("salesOrderId");
CREATE INDEX "POSSale_salesInvoiceId_idx" ON "POSSale"("salesInvoiceId");
CREATE INDEX "POSSale_customerId_idx" ON "POSSale"("customerId");
CREATE INDEX "POSSale_cashierId_idx" ON "POSSale"("cashierId");
CREATE INDEX "POSSale_status_idx" ON "POSSale"("status");
CREATE UNIQUE INDEX "POSSale_organizationId_receiptNumber_key" ON "POSSale"("organizationId", "receiptNumber");

-- CreateIndex
CREATE INDEX "POSPayment_organizationId_idx" ON "POSPayment"("organizationId");
CREATE INDEX "POSPayment_posSaleId_idx" ON "POSPayment"("posSaleId");
CREATE INDEX "POSPayment_paymentMethod_idx" ON "POSPayment"("paymentMethod");

-- AddForeignKey
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSession" ADD CONSTRAINT "POSSession_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "POSSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSCart" ADD CONSTRAINT "POSCart_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSCartItem" ADD CONSTRAINT "POSCartItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSCartItem" ADD CONSTRAINT "POSCartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "POSCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSCartItem" ADD CONSTRAINT "POSCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSCartItem" ADD CONSTRAINT "POSCartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "POSSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "POSCart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "POSSale" ADD CONSTRAINT "POSSale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "POSPayment" ADD CONSTRAINT "POSPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "POSPayment" ADD CONSTRAINT "POSPayment_posSaleId_fkey" FOREIGN KEY ("posSaleId") REFERENCES "POSSale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
