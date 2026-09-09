import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { StatCard } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PieChart,
  TrendingUp,
  AlertOctagon,
  Clock,
  ArrowLeft,
  Flame,
  Snowflake,
  ShieldAlert,
  BarChart3,
  DollarSign,
  Package,
} from "lucide-react";
import {
  useAbcAnalysis,
  useMovementVelocity,
  useDeadStock,
  useStockForecast,
  type AbcItem,
  type VelocityItem,
  type DeadStockItem,
  type ForecastItem,
} from "@/hooks/queries/useInventoryAnalytics";

const title = "Inventory Analytics & Intelligence";
const description =
  "ABC classification, movement velocity tracking, dead stock detection, and stockout risk forecasting.";

export const Route = createFileRoute("/inventory-analytics")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: InventoryAnalyticsPage,
});

function ClassBadge({ classification }: { classification: "A" | "B" | "C" }) {
  if (classification === "A") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold px-2.5">
        Class A (Top 80%)
      </Badge>
    );
  }
  if (classification === "B") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium px-2.5">
        Class B (Next 15%)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground px-2.5">
      Class C (Bottom 5%)
    </Badge>
  );
}

function RiskBadge({ status }: { status: "CRITICAL" | "WARNING" | "SAFE" }) {
  if (status === "CRITICAL") {
    return (
      <Badge variant="destructive" className="font-bold px-2">
        CRITICAL (&lt; 7 Days)
      </Badge>
    );
  }
  if (status === "WARNING") {
    return (
      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-medium px-2">
        WARNING (7-30 Days)
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium px-2">
      SAFE (&gt; 30 Days)
    </Badge>
  );
}

function InventoryAnalyticsPage() {
  const [velocityDays, setVelocityDays] = useState(30);
  const [deadStockDays, setDeadStockDays] = useState(90);
  const [forecastDays, setForecastDays] = useState(30);

  const { data: abcData } = useAbcAnalysis();
  const { data: velocityData } = useMovementVelocity(velocityDays);
  const { data: deadStockData } = useDeadStock(deadStockDays);
  const { data: forecastData } = useStockForecast(forecastDays);

  const abcSummary = abcData?.summary;
  const deadStockSummary = deadStockData?.summary;
  const forecastSummary = forecastData?.summary;

  const stats = [
    {
      label: "Total Inventory Value",
      value: abcSummary?.grandTotalValue
        ? `₹${abcSummary.grandTotalValue.toLocaleString()}`
        : "₹0",
      hint: `${abcSummary?.totalProducts || 0} unique product SKUs`,
    },
    {
      label: "Class A Inventory Value",
      value: abcSummary?.classA?.value
        ? `₹${abcSummary.classA.value.toLocaleString()}`
        : "₹0",
      hint: `${abcSummary?.classA?.count || 0} top revenue-generating SKUs`,
    },
    {
      label: "Dead Stock Tied Capital",
      value: deadStockSummary?.totalTiedUpCapital
        ? `₹${deadStockSummary.totalTiedUpCapital.toLocaleString()}`
        : "₹0",
      hint: `${deadStockSummary?.totalDeadStockItems || 0} dormant items (> ${deadStockDays} days)`,
    },
    {
      label: "Critical Stockout Risks",
      value: `${forecastSummary?.criticalCount || 0} Products`,
      hint: `${forecastSummary?.warningCount || 0} additional at-risk items`,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        eyebrow="Inventory"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/inventory">
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Live Stock
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            {...(s.hint ? { hint: s.hint } : {})}
            tone={i === 2 && (deadStockSummary?.totalDeadStockItems || 0) > 0 ? "brand" : i === 0 ? "brand" : "default"}
          />
        ))}
      </div>

      <Tabs defaultValue="abc" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="abc" className="flex items-center gap-1.5">
            <PieChart className="h-4 w-4" />
            ABC Analysis
          </TabsTrigger>
          <TabsTrigger value="velocity" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            Fast / Slow Moving
          </TabsTrigger>
          <TabsTrigger value="deadstock" className="flex items-center gap-1.5">
            <AlertOctagon className="h-4 w-4" />
            Dead Stock ({deadStockSummary?.totalDeadStockItems || 0})
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Stock Forecast
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: ABC ANALYSIS ────────────────────────────────────────── */}
        <TabsContent value="abc" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                  <span>Class A Products</span>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-600">80% Value</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {abcSummary?.classA?.count || 0} Items
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valued at ₹{(abcSummary?.classA?.value || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                  <span>Class B Products</span>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-600">15% Value</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {abcSummary?.classB?.count || 0} Items
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valued at ₹{(abcSummary?.classB?.value || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-500/30 bg-slate-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Class C Products</span>
                  <Badge variant="outline">5% Value</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {abcSummary?.classC?.count || 0} Items
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Valued at ₹{(abcSummary?.classC?.value || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="panel overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-base">ABC Product Valuation Breakdown</h3>
              <p className="text-xs text-muted-foreground">
                Products sorted by total inventory value contribution to target high-priority controls on Class A stock.
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product & SKU</TableHead>
                    <TableHead>On Hand Stock</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Total Value</TableHead>
                    <TableHead>% Share of Value</TableHead>
                    <TableHead>Cumulative %</TableHead>
                    <TableHead>Classification</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!abcData?.data || abcData.data.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No product stock levels recorded.
                      </TableCell>
                    </TableRow>
                  ) : (
                    abcData.data.map((item: AbcItem) => (
                      <TableRow key={item.productId}>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.productSku}</div>
                        </TableCell>
                        <TableCell className="font-mono">{item.totalOnHand} Units</TableCell>
                        <TableCell className="font-mono">₹{item.unitCost.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-bold text-foreground">
                          ₹{item.totalStockValue.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-mono">{item.shareOfTotalValue}%</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{item.cumulativePercentage}%</TableCell>
                        <TableCell>
                          <ClassBadge classification={item.classification} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 2: MOVEMENT VELOCITY ───────────────────────────────────── */}
        <TabsContent value="velocity" className="space-y-4">
          <div className="flex items-center justify-between p-4 panel">
            <div>
              <h3 className="font-semibold text-base">Inventory Movement Velocity</h3>
              <p className="text-xs text-muted-foreground">
                Outbound consumption rates and daily turnover velocity per SKU.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Lookback Period:</span>
              <Select value={String(velocityDays)} onValueChange={(val) => setVelocityDays(Number(val))}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                  <SelectItem value="90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Flame className="h-4 w-4" />
                  Fast-Moving Products ({velocityData?.summary?.fastMovingCount || 0})
                </CardTitle>
                <CardDescription className="text-xs">
                  Products with high daily turnover (&ge; 1.0 units/day)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Outbound Qty</TableHead>
                      <TableHead>Velocity (Units/Day)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!velocityData?.data || velocityData.data.filter((i) => i.dailyVelocity >= 1).length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                          No fast-moving products detected in this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      velocityData.data
                        .filter((i) => i.dailyVelocity >= 1)
                        .map((item: VelocityItem) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div className="font-medium text-xs">{item.productName}</div>
                              <div className="text-[11px] text-muted-foreground">{item.productSku}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.outboundQty} Units</TableCell>
                            <TableCell className="font-mono font-bold text-xs text-emerald-600">
                              🔥 {item.dailyVelocity}/day
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-slate-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-500">
                  <Snowflake className="h-4 w-4" />
                  Slow / Stagnant Products ({velocityData?.summary?.slowMovingCount || 0})
                </CardTitle>
                <CardDescription className="text-xs">
                  Products with minimal or zero outbound movement
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Outbound Qty</TableHead>
                      <TableHead>Velocity (Units/Day)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!velocityData?.data || velocityData.data.filter((i) => i.dailyVelocity < 1).length === 0) ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                          No slow-moving products.
                        </TableCell>
                      </TableRow>
                    ) : (
                      velocityData.data
                        .filter((i) => i.dailyVelocity < 1)
                        .slice(0, 10)
                        .map((item: VelocityItem) => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <div className="font-medium text-xs">{item.productName}</div>
                              <div className="text-[11px] text-muted-foreground">{item.productSku}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{item.outboundQty} Units</TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              ❄️ {item.dailyVelocity}/day
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ─── TAB 3: DEAD STOCK ──────────────────────────────────────────── */}
        <TabsContent value="deadstock" className="space-y-4">
          <div className="flex items-center justify-between p-4 panel">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-destructive" />
                Dead Stock Detection &amp; Capital Audit
              </h3>
              <p className="text-xs text-muted-foreground">
                Products holding positive on-hand inventory with zero ledger activity over the selected period.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Inactivity Window:</span>
              <Select value={String(deadStockDays)} onValueChange={(val) => setDeadStockDays(Number(val))}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="90 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30+ Days Inactive</SelectItem>
                  <SelectItem value="60">60+ Days Inactive</SelectItem>
                  <SelectItem value="90">90+ Days Inactive</SelectItem>
                  <SelectItem value="180">180+ Days Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product &amp; SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Dormant On-Hand Qty</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Tied-Up Capital (₹)</TableHead>
                    <TableHead>Inactivity Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!deadStockData?.data || deadStockData.data.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="mx-auto h-8 w-8 text-emerald-500/50 mb-2" />
                        No dead stock detected! All stocked products have recent activity.
                      </TableCell>
                    </TableRow>
                  ) : (
                    deadStockData.data.map((item: DeadStockItem) => (
                      <TableRow key={item.stockLevelId}>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.productSku}</div>
                        </TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell className="font-mono text-destructive font-semibold">
                          {item.onHand} Units
                        </TableCell>
                        <TableCell className="font-mono">₹{item.unitCost.toLocaleString()}</TableCell>
                        <TableCell className="font-mono font-bold text-foreground">
                          ₹{item.tiedUpCapital.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
                            {item.lastActivity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                            <Link to="/adjustments">Write Off / Adjust</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* ─── TAB 4: STOCK FORECAST ──────────────────────────────────────── */}
        <TabsContent value="forecast" className="space-y-4">
          <div className="flex items-center justify-between p-4 panel">
            <div>
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Clock className="h-5 w-5 text-brand" />
                Stockout Risk &amp; Depletion Forecast
              </h3>
              <p className="text-xs text-muted-foreground">
                Predicts estimated days remaining before inventory depletion based on historical daily consumption rate.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Historical Baseline:</span>
              <Select value={String(forecastDays)} onValueChange={(val) => setForecastDays(Number(val))}>
                <SelectTrigger className="w-36 h-8">
                  <SelectValue placeholder="30 Days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="14">Last 14 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="60">Last 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product &amp; SKU</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Available Stock</TableHead>
                    <TableHead>Avg Daily Sales Rate</TableHead>
                    <TableHead>Est. Days to Stockout</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!forecastData?.data || forecastData.data.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No forecast records available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    forecastData.data.map((item: ForecastItem) => (
                      <TableRow key={item.stockLevelId}>
                        <TableCell>
                          <div className="font-medium text-foreground">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.productSku}</div>
                        </TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell className="font-mono font-semibold">{item.available} Units</TableCell>
                        <TableCell className="font-mono">
                          {item.avgDailyConsumption > 0 ? `${item.avgDailyConsumption} / day` : "No movement"}
                        </TableCell>
                        <TableCell className="font-mono font-bold">
                          {item.daysUntilStockout !== null ? (
                            <span className={item.daysUntilStockout <= 7 ? "text-destructive font-extrabold" : ""}>
                              {item.daysUntilStockout} Days
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic text-xs">Indefinite</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <RiskBadge status={item.riskStatus} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
