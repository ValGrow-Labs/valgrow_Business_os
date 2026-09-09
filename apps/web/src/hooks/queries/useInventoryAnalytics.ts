import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface AbcItem {
  productId: string;
  productName: string;
  productSku: string;
  totalOnHand: number;
  unitCost: number;
  totalStockValue: number;
  warehouses: string[];
  shareOfTotalValue: number;
  cumulativePercentage: number;
  classification: "A" | "B" | "C";
}

export interface AbcAnalysisResponse {
  data: AbcItem[];
  summary: {
    grandTotalValue: number;
    totalProducts: number;
    classA: { count: number; value: number };
    classB: { count: number; value: number };
    classC: { count: number; value: number };
  };
}

export interface VelocityItem {
  productId: string;
  productName: string;
  productSku: string;
  outboundQty: number;
  inboundQty: number;
  totalMovements: number;
  dailyVelocity: number;
}

export interface MovementVelocityResponse {
  periodDays: number;
  data: VelocityItem[];
  summary: {
    totalTrackedProducts: number;
    fastMovingCount: number;
    moderateMovingCount: number;
    slowMovingCount: number;
  };
}

export interface DeadStockItem {
  stockLevelId: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId: string;
  warehouseName: string;
  onHand: number;
  unitCost: number;
  tiedUpCapital: number;
  inactiveDays: number;
  lastActivity: string;
}

export interface DeadStockResponse {
  inactiveDaysThreshold: number;
  data: DeadStockItem[];
  summary: {
    totalDeadStockItems: number;
    totalTiedUpCapital: number;
  };
}

export interface ForecastItem {
  stockLevelId: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseName: string;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number | null;
  avgDailyConsumption: number;
  daysUntilStockout: number | null;
  riskStatus: "CRITICAL" | "WARNING" | "SAFE";
}

export interface StockForecastResponse {
  lookbackDays: number;
  data: ForecastItem[];
  summary: {
    totalRecords: number;
    criticalCount: number;
    warningCount: number;
    safeCount: number;
  };
}

export function useAbcAnalysis() {
  return useQuery<AbcAnalysisResponse>({
    queryKey: ["abcAnalysis"],
    queryFn: () => apiClient<AbcAnalysisResponse>("/inventory/analytics/abc"),
    staleTime: 60_000,
  });
}

export function useMovementVelocity(days = 30) {
  return useQuery<MovementVelocityResponse>({
    queryKey: ["movementVelocity", days],
    queryFn: () => apiClient<MovementVelocityResponse>(`/inventory/analytics/movement-velocity?days=${days}`),
    staleTime: 60_000,
  });
}

export function useDeadStock(inactiveDays = 90) {
  return useQuery<DeadStockResponse>({
    queryKey: ["deadStock", inactiveDays],
    queryFn: () => apiClient<DeadStockResponse>(`/inventory/analytics/dead-stock?inactiveDays=${inactiveDays}`),
    staleTime: 60_000,
  });
}

export function useStockForecast(lookbackDays = 30) {
  return useQuery<StockForecastResponse>({
    queryKey: ["stockForecast", lookbackDays],
    queryFn: () => apiClient<StockForecastResponse>(`/inventory/analytics/forecast?lookbackDays=${lookbackDays}`),
    staleTime: 60_000,
  });
}
