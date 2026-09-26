import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SalesReportFilters {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  customerId?: string | undefined;
  branchId?: string | undefined;
  paymentMethod?: string | undefined;
  status?: string | undefined;
  search?: string | undefined;
}

export interface SalesReportResult {
  summary: {
    totalSales: number;
    orderCount: number;
    totalTax: number;
    totalDiscount: number;
    totalPaid: number;
    outstandingAmount: number;
  };
  breakdowns: {
    salesByCustomer: Array<{ customerId: string; customerName: string; totalSales: number; orderCount: number }>;
    salesByProduct: Array<{ productId: string; productName: string; quantitySold: number; totalSales: number }>;
    salesByPaymentMethod: Array<{ paymentMethod: string; totalAmount: number; count: number }>;
    salesByBranch: Array<{ branchId: string; branchName: string; totalSales: number; orderCount: number }>;
    salesByDate: Array<{ date: string; totalSales: number; orderCount: number }>;
  };
  records: Array<{
    id: string;
    type: string;
    number: string;
    date: string;
    customerId: string | null;
    customerName: string;
    branchName: string;
    warehouseName: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paid: number;
    status: string;
    paymentMethods: string;
  }>;
}

export interface CustomerReportFilters {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  customerId?: string | undefined;
  branchId?: string | undefined;
  search?: string | undefined;
}

export interface CustomerReportResult {
  summary: {
    totalCustomers: number;
    totalOrders: number;
    totalPurchases: number;
    totalPaid: number;
    totalOutstanding: number;
  };
  customers: Array<{
    id: string;
    customerCode: string;
    name: string;
    email: string;
    phone: string;
    city: string;
    status: string;
    totalOrders: number;
    totalPurchases: number;
    totalPaid: number;
    outstandingAmount: number;
    lastPurchaseDate: string | null;
  }>;
}

export interface StockMovementReportFilters {
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  productId?: string | undefined;
  warehouseId?: string | undefined;
  locationId?: string | undefined;
  movementType?: string | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
}

export interface StockMovementReportResult {
  summary: {
    totalMovements: number;
    totalInboundQty: number;
    totalOutboundQty: number;
    netQtyChange: number;
  };
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  records: Array<{
    id: string;
    createdAt: string;
    productName: string;
    productSku: string;
    variantName: string | null;
    warehouseName: string;
    locationName: string;
    movementType: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    referenceType: string;
    referenceId: string;
    performedBy: string;
    notes: string;
    isOutbound: boolean;
  }>;
}

function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== "" && val !== "ALL") {
      queryParams.set(key, String(val));
    }
  });
  const str = queryParams.toString();
  return str ? `?${str}` : "";
}

export function useSalesReport(filters: SalesReportFilters = {}) {
  const queryStr = buildQueryString(filters);
  return useQuery<SalesReportResult>({
    queryKey: ["reports", "sales", filters],
    queryFn: () => apiClient<SalesReportResult>(`/reports/sales${queryStr}`),
  });
}

export function useCustomerReport(filters: CustomerReportFilters = {}) {
  const queryStr = buildQueryString(filters);
  return useQuery<CustomerReportResult>({
    queryKey: ["reports", "customers", filters],
    queryFn: () => apiClient<CustomerReportResult>(`/reports/customers${queryStr}`),
  });
}

export function useInventoryMovementReport(filters: StockMovementReportFilters = {}) {
  const queryStr = buildQueryString(filters);
  return useQuery<StockMovementReportResult>({
    queryKey: ["reports", "inventory-movements", filters],
    queryFn: () => apiClient<StockMovementReportResult>(`/reports/inventory-movements${queryStr}`),
  });
}

/**
 * Client-side Export Utility respecting currently applied filters
 */
export function exportReportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
