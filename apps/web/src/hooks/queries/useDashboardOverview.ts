import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface DashboardOverviewData {
  totalActiveProducts: number;
  lowStockProductCount: number;
  todaysTotalPosSales: number;
  todaysOrderCount: number;
  openPurchaseOrderCount: number;
  pendingGoodsReceiptsCount: number;
  activeCustomerCount: number;
}

export function useDashboardOverview() {
  return useQuery<DashboardOverviewData>({
    queryKey: ["dashboard", "overview"],
    queryFn: () => apiClient<DashboardOverviewData>("/dashboard/overview"),
  });
}
