import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AuditTrailItem {
  id: string;
  createdAt: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  productId: string;
  productName: string;
  productSku: string;
  variantName: string;
  warehouseName: string;
  locationName: string;
  batchNumber: string;
  performedBy: string;
}

export interface AuditTrailResponse {
  data: AuditTrailItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ValuationReportItem {
  productId: string;
  productName: string;
  sku: string;
  warehouseName: string;
  totalOnHand: number;
  unitCost: number;
  totalValue: number;
  layerCount: number;
}

export interface ValuationReportResponse {
  method: "FIFO" | "LIFO" | "WEIGHTED_AVERAGE";
  asOfDate: string;
  summary: {
    totalInventoryValue: number;
    totalUnitsOnHand: number;
    totalItems: number;
  };
  data: ValuationReportItem[];
}

export function useInventoryAuditTrail(params?: {
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  movementType?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}) {
  const queryStr = new URLSearchParams();
  if (params?.productId) queryStr.set("productId", params.productId);
  if (params?.warehouseId) queryStr.set("warehouseId", params.warehouseId);
  if (params?.locationId) queryStr.set("locationId", params.locationId);
  if (params?.movementType) queryStr.set("movementType", params.movementType);
  if (params?.dateFrom) queryStr.set("dateFrom", params.dateFrom);
  if (params?.dateTo) queryStr.set("dateTo", params.dateTo);
  if (params?.page) queryStr.set("page", String(params.page));
  if (params?.limit) queryStr.set("limit", String(params.limit));

  return useQuery<AuditTrailResponse>({
    queryKey: ["inventoryAuditTrail", params],
    queryFn: () => apiClient<AuditTrailResponse>(`/inventory/audit-trail?${queryStr.toString()}`),
  });
}

export function useInventoryValuationReport(params?: {
  warehouseId?: string | undefined;
  method?: "FIFO" | "LIFO" | "WEIGHTED_AVERAGE" | undefined;
}) {
  const queryStr = new URLSearchParams();
  if (params?.warehouseId) queryStr.set("warehouseId", params.warehouseId);
  if (params?.method) queryStr.set("method", params.method);

  return useQuery<ValuationReportResponse>({
    queryKey: ["inventoryValuationReport", params],
    queryFn: () => apiClient<ValuationReportResponse>(`/inventory/valuation-report?${queryStr.toString()}`),
  });
}
