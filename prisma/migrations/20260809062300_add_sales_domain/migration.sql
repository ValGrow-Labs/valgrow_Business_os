-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'CONVERTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PROCESSING', 'PARTIALLY_DELIVERED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DeliveryNoteStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesInvoiceStatus" AS ENUM ('DRAFT', 'POSTED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CustomerPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT_CARD', 'UPI', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesReturnStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalesReturnReason" AS ENUM ('DAMAGED', 'DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGED_MIND', 'OTHER');

-- CreateEnum
CREATE TYPE "SalesCreditNoteStatus" AS ENUM ('DRAFT', 'ISSUED', 'APPLIED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT DEFAULT 'India',
    "taxIdNumber" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "creditLimit" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "paymentTerms" TEXT DEFAULT 'NET30',
    "notes" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "quotationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "exchangeRate" DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
    "subtotalAmount" DECIMAL(14,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "quotationId" TEXT,
    "branchId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "exchangeRate" DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
    "paymentTerms" TEXT DEFAULT 'NET30',
    "subtotalAmount" DECIMAL(14,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "orderedQty" DECIMAL(14,4) NOT NULL,
    "deliveredQty" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "salesOrderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "deliveredById" TEXT,
    "deliveryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "status" "DeliveryNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryNoteItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "deliveryNoteId" TEXT NOT NULL,
    "salesOrderItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "locationId" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "DeliveryNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "invoiceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "exchangeRate" DECIMAL(10,6) NOT NULL DEFAULT 1.000000,
    "subtotalAmount" DECIMAL(14,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "paidAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "status" "SalesInvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesInvoiceItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "salesInvoiceId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unitPrice" DECIMAL(12,4) NOT NULL,
    "discountAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "SalesInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesInvoiceId" TEXT,
    "amount" DECIMAL(14,4) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "CustomerPaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesOrderId" TEXT,
    "salesInvoiceId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalRefundAmount" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "status" "SalesReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "salesReturnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "locationId" TEXT NOT NULL,
    "originalQty" DECIMAL(14,4) NOT NULL,
    "returnedQty" DECIMAL(14,4) NOT NULL,
    "reason" "SalesReturnReason" NOT NULL DEFAULT 'OTHER',
    "condition" TEXT,
    "refundAmount" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "SalesReturnItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesCreditNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "creditNoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "salesInvoiceId" TEXT,
    "salesReturnId" TEXT,
    "creditDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(14,4) NOT NULL,
    "taxAmount" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(14,4) NOT NULL,
    "reason" TEXT,
    "status" "SalesCreditNoteStatus" NOT NULL DEFAULT 'ISSUED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesCreditNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_deletedAt_idx" ON "Customer"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_customerCode_key" ON "Customer"("organizationId", "customerCode");

-- CreateIndex
CREATE INDEX "Quotation_organizationId_idx" ON "Quotation"("organizationId");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_branchId_idx" ON "Quotation"("branchId");

-- CreateIndex
CREATE INDEX "Quotation_warehouseId_idx" ON "Quotation"("warehouseId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_organizationId_quotationNumber_key" ON "Quotation"("organizationId", "quotationNumber");

-- CreateIndex
CREATE INDEX "QuotationItem_organizationId_idx" ON "QuotationItem"("organizationId");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE INDEX "QuotationItem_productId_idx" ON "QuotationItem"("productId");

-- CreateIndex
CREATE INDEX "QuotationItem_variantId_idx" ON "QuotationItem"("variantId");

-- CreateIndex
CREATE INDEX "SalesOrder_organizationId_idx" ON "SalesOrder"("organizationId");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrder_quotationId_idx" ON "SalesOrder"("quotationId");

-- CreateIndex
CREATE INDEX "SalesOrder_branchId_idx" ON "SalesOrder"("branchId");

-- CreateIndex
CREATE INDEX "SalesOrder_warehouseId_idx" ON "SalesOrder"("warehouseId");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_organizationId_orderNumber_key" ON "SalesOrder"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "SalesOrderItem_organizationId_idx" ON "SalesOrderItem"("organizationId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_productId_idx" ON "SalesOrderItem"("productId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_variantId_idx" ON "SalesOrderItem"("variantId");

-- CreateIndex
CREATE INDEX "DeliveryNote_organizationId_idx" ON "DeliveryNote"("organizationId");

-- CreateIndex
CREATE INDEX "DeliveryNote_salesOrderId_idx" ON "DeliveryNote"("salesOrderId");

-- CreateIndex
CREATE INDEX "DeliveryNote_customerId_idx" ON "DeliveryNote"("customerId");

-- CreateIndex
CREATE INDEX "DeliveryNote_warehouseId_idx" ON "DeliveryNote"("warehouseId");

-- CreateIndex
CREATE INDEX "DeliveryNote_status_idx" ON "DeliveryNote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryNote_organizationId_deliveryNumber_key" ON "DeliveryNote"("organizationId", "deliveryNumber");

-- CreateIndex
CREATE INDEX "DeliveryNoteItem_organizationId_idx" ON "DeliveryNoteItem"("organizationId");

-- CreateIndex
CREATE INDEX "DeliveryNoteItem_deliveryNoteId_idx" ON "DeliveryNoteItem"("deliveryNoteId");

-- CreateIndex
CREATE INDEX "DeliveryNoteItem_salesOrderItemId_idx" ON "DeliveryNoteItem"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "DeliveryNoteItem_locationId_idx" ON "DeliveryNoteItem"("locationId");

-- CreateIndex
CREATE INDEX "SalesInvoice_organizationId_idx" ON "SalesInvoice"("organizationId");

-- CreateIndex
CREATE INDEX "SalesInvoice_customerId_idx" ON "SalesInvoice"("customerId");

-- CreateIndex
CREATE INDEX "SalesInvoice_salesOrderId_idx" ON "SalesInvoice"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesInvoice_status_idx" ON "SalesInvoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_organizationId_invoiceNumber_key" ON "SalesInvoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_organizationId_idx" ON "SalesInvoiceItem"("organizationId");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_salesInvoiceId_idx" ON "SalesInvoiceItem"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_productId_idx" ON "SalesInvoiceItem"("productId");

-- CreateIndex
CREATE INDEX "SalesInvoiceItem_variantId_idx" ON "SalesInvoiceItem"("variantId");

-- CreateIndex
CREATE INDEX "CustomerPayment_organizationId_idx" ON "CustomerPayment"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_idx" ON "CustomerPayment"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPayment_salesInvoiceId_idx" ON "CustomerPayment"("salesInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerPayment_organizationId_paymentNumber_key" ON "CustomerPayment"("organizationId", "paymentNumber");

-- CreateIndex
CREATE INDEX "SalesReturn_organizationId_idx" ON "SalesReturn"("organizationId");

-- CreateIndex
CREATE INDEX "SalesReturn_customerId_idx" ON "SalesReturn"("customerId");

-- CreateIndex
CREATE INDEX "SalesReturn_salesOrderId_idx" ON "SalesReturn"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesReturn_salesInvoiceId_idx" ON "SalesReturn"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "SalesReturn_warehouseId_idx" ON "SalesReturn"("warehouseId");

-- CreateIndex
CREATE INDEX "SalesReturn_status_idx" ON "SalesReturn"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturn_organizationId_returnNumber_key" ON "SalesReturn"("organizationId", "returnNumber");

-- CreateIndex
CREATE INDEX "SalesReturnItem_organizationId_idx" ON "SalesReturnItem"("organizationId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_salesReturnId_idx" ON "SalesReturnItem"("salesReturnId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_productId_idx" ON "SalesReturnItem"("productId");

-- CreateIndex
CREATE INDEX "SalesReturnItem_locationId_idx" ON "SalesReturnItem"("locationId");

-- CreateIndex
CREATE INDEX "SalesCreditNote_organizationId_idx" ON "SalesCreditNote"("organizationId");

-- CreateIndex
CREATE INDEX "SalesCreditNote_customerId_idx" ON "SalesCreditNote"("customerId");

-- CreateIndex
CREATE INDEX "SalesCreditNote_salesInvoiceId_idx" ON "SalesCreditNote"("salesInvoiceId");

-- CreateIndex
CREATE INDEX "SalesCreditNote_salesReturnId_idx" ON "SalesCreditNote"("salesReturnId");

-- CreateIndex
CREATE INDEX "SalesCreditNote_status_idx" ON "SalesCreditNote"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalesCreditNote_organizationId_creditNoteNumber_key" ON "SalesCreditNote"("organizationId", "creditNoteNumber");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNote" ADD CONSTRAINT "DeliveryNote_deliveredById_fkey" FOREIGN KEY ("deliveredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_deliveryNoteId_fkey" FOREIGN KEY ("deliveryNoteId") REFERENCES "DeliveryNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryNoteItem" ADD CONSTRAINT "DeliveryNoteItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoiceItem" ADD CONSTRAINT "SalesInvoiceItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnItem" ADD CONSTRAINT "SalesReturnItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCreditNote" ADD CONSTRAINT "SalesCreditNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCreditNote" ADD CONSTRAINT "SalesCreditNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCreditNote" ADD CONSTRAINT "SalesCreditNote_salesInvoiceId_fkey" FOREIGN KEY ("salesInvoiceId") REFERENCES "SalesInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesCreditNote" ADD CONSTRAINT "SalesCreditNote_salesReturnId_fkey" FOREIGN KEY ("salesReturnId") REFERENCES "SalesReturn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

