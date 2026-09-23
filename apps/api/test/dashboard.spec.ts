import { Test, TestingModule } from "@nestjs/testing";
import { DashboardService } from "../src/modules/dashboard/dashboard.service";
import { DashboardController } from "../src/modules/dashboard/dashboard.controller";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Dashboard Module Unit Verification", () => {
  let dashboardService: DashboardService;
  let dashboardController: DashboardController;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockOrgId = "test-org-123-uuid";

  beforeEach(async () => {
    prismaService = {
      product: {
        count: jest.fn().mockResolvedValue(15),
      } as any,
      stockLevel: {
        findMany: jest.fn().mockResolvedValue([
          { productId: "p1", onHand: 5, reserved: 0, reorderLevel: 10 },
          { productId: "p2", onHand: 50, reserved: 5, reorderLevel: 10 },
          { productId: "p3", onHand: 2, reserved: 1, reorderLevel: 5 },
        ]),
      } as any,
      pOSSale: {
        aggregate: jest.fn().mockResolvedValue({
          _sum: { totalAmount: 4850.75 },
        }),
        count: jest.fn().mockResolvedValue(12),
      } as any,
      purchaseOrder: {
        count: jest.fn().mockResolvedValue(4),
      } as any,
      goodsReceipt: {
        count: jest.fn().mockResolvedValue(2),
      } as any,
      customer: {
        count: jest.fn().mockResolvedValue(38),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DashboardController],
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    dashboardService = module.get<DashboardService>(DashboardService);
    dashboardController = module.get<DashboardController>(DashboardController);
  });

  it("should calculate correct overview metrics scoped to active organization", async () => {
    const result = await dashboardService.getOverview(mockOrgId);

    expect(result).toBeDefined();
    expect(result.totalActiveProducts).toBe(15);
    // p1 available = 5 <= 10 (low), p2 available = 45 > 10 (normal), p3 available = 1 <= 5 (low) -> 2 unique products
    expect(result.lowStockProductCount).toBe(2);
    expect(result.todaysTotalPosSales).toBe(4850.75);
    expect(result.todaysOrderCount).toBe(12);
    expect(result.openPurchaseOrderCount).toBe(4);
    expect(result.pendingGoodsReceiptsCount).toBe(2);
    expect(result.activeCustomerCount).toBe(38);

    // Verify organizationId scoping across all database queries
    expect(prismaService.product?.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.stockLevel?.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.pOSSale?.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.pOSSale?.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.purchaseOrder?.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.goodsReceipt?.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
    expect(prismaService.customer?.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: mockOrgId }) }),
    );
  });

  it("controller should delegate overview request passing current organizationId", async () => {
    const result = await dashboardController.getOverview(mockOrgId);
    expect(result.todaysTotalPosSales).toBe(4850.75);
    expect(result.totalActiveProducts).toBe(15);
  });
});
