import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { UsersModule } from "./modules/users/users.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ActivityLogsModule } from "./modules/activity-logs/activity-logs.module";
import { FilesModule } from "./modules/files/files.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { TaxesModule } from "./modules/taxes/taxes.module";
import { UnitsModule } from "./modules/units/units.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { ProductVariantsModule } from "./modules/product-variants/product-variants.module";
import { ProductPricesModule } from "./modules/product-prices/product-prices.module";
import { WarehousesModule } from "./modules/warehouses/warehouses.module";
import { LocationsModule } from "./modules/locations/locations.module";
import { InventoryBatchesModule } from "./modules/inventory-batches/inventory-batches.module";
import { InventorySerialNumbersModule } from "./modules/inventory-serial-numbers/inventory-serial-numbers.module";
import { InventoryMovementsModule } from "./modules/inventory-movements/inventory-movements.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { InventoryTransfersModule } from "./modules/inventory-transfers/inventory-transfers.module";
import { InventoryAdjustmentsModule } from "./modules/inventory-adjustments/inventory-adjustments.module";
import { InventoryReservationsModule } from "./modules/inventory-reservations/inventory-reservations.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    PrismaModule,
    AuthModule,
    OrganizationsModule,
    BranchesModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    TeamsModule,
    SettingsModule,
    NotificationsModule,
    ActivityLogsModule,
    FilesModule,
    SessionsModule,
    TaxesModule,
    UnitsModule,
    BrandsModule,
    CategoriesModule,
    ProductsModule,
    ProductVariantsModule,
    ProductPricesModule,
    WarehousesModule,
    LocationsModule,
    InventoryBatchesModule,
    InventorySerialNumbersModule,
    InventoryMovementsModule,
    InventoryModule,
    InventoryTransfersModule,
    InventoryAdjustmentsModule,
    InventoryReservationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
