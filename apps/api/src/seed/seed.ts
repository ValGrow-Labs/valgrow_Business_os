import { PrismaClient, Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { seedDefaultChartOfAccounts } from "../modules/accounts/default-accounts.seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting ValGrow Business OS development seed...");

  // 1. Seed Permissions Catalog
  const permissionsData = [
    {
      key: "users.read",
      resource: "Users",
      action: "read",
      description: "View organization member profiles",
    },
    {
      key: "users.create",
      resource: "Users",
      action: "create",
      description: "Invite new organization members",
    },
    {
      key: "users.write",
      resource: "Users",
      action: "update",
      description: "Update member roles and details",
    },
    {
      key: "users.delete",
      resource: "Users",
      action: "delete",
      description: "Revoke or remove members",
    },
    {
      key: "branches.read",
      resource: "Branches",
      action: "read",
      description: "View organization branches",
    },
    {
      key: "branches.manage",
      resource: "Branches",
      action: "manage",
      description: "Create and edit branches",
    },
    {
      key: "departments.manage",
      resource: "Departments",
      action: "manage",
      description: "Manage departments",
    },
    {
      key: "teams.manage",
      resource: "Teams",
      action: "manage",
      description: "Manage teams",
    },
    {
      key: "roles.manage",
      resource: "Roles",
      action: "manage",
      description: "Create and edit custom roles",
    },
    {
      key: "settings.manage",
      resource: "Settings",
      action: "manage",
      description: "Update organization settings",
    },
    {
      key: "files.upload",
      resource: "Files",
      action: "upload",
      description: "Upload workspace files",
    },
    {
      key: "files.delete",
      resource: "Files",
      action: "delete",
      description: "Delete workspace files",
    },
    {
      key: "inventory.read",
      resource: "Inventory",
      action: "read",
      description: "View inventory stock levels and movements",
    },
    {
      key: "inventory.create",
      resource: "Inventory",
      action: "create",
      description: "Create warehouses, locations, and batches",
    },
    {
      key: "inventory.update",
      resource: "Inventory",
      action: "update",
      description: "Update warehouses, locations, and serial numbers",
    },
    {
      key: "inventory.delete",
      resource: "Inventory",
      action: "delete",
      description: "Delete or deactivate warehouses and locations",
    },
    {
      key: "inventory.adjust",
      resource: "Inventory",
      action: "adjust",
      description: "Post inventory stock adjustments",
    },
    {
      key: "inventory.transfer",
      resource: "Inventory",
      action: "transfer",
      description: "Create and process stock transfers",
    },
    {
      key: "inventory.reserve",
      resource: "Inventory",
      action: "reserve",
      description: "Create and fulfill stock reservations",
    },
    {
      key: "crm.read",
      resource: "CRM",
      action: "read",
      description:
        "View CRM leads, opportunities, activities, and customer 360",
    },
    {
      key: "crm.create",
      resource: "CRM",
      action: "create",
      description:
        "Create CRM leads, opportunities, activities, tasks, notes, and contacts",
    },
    {
      key: "crm.update",
      resource: "CRM",
      action: "update",
      description: "Update CRM leads, opportunities, activities, and tasks",
    },
    {
      key: "crm.delete",
      resource: "CRM",
      action: "delete",
      description: "Delete CRM records",
    },
    {
      key: "crm.assign",
      resource: "CRM",
      action: "assign",
      description: "Assign leads and opportunities to users",
    },
    {
      key: "crm.convert",
      resource: "CRM",
      action: "convert",
      description: "Convert leads into Customers and Opportunities",
    },
    {
      key: "crm.manage_pipeline",
      resource: "CRM",
      action: "manage_pipeline",
      description: "Manage CRM pipelines and stages",
    },
    {
      key: "crm.manage_tags",
      resource: "CRM",
      action: "manage_tags",
      description: "Manage CRM tags and assignments",
    },
    {
      key: "crm.manage_sources",
      resource: "CRM",
      action: "manage_sources",
      description: "Manage CRM lead sources",
    },
    {
      key: "accounting.read",
      resource: "Accounting",
      action: "read",
      description: "View GL accounts, journal entries, and financial reports",
    },
    {
      key: "accounting.create",
      resource: "Accounting",
      action: "create",
      description: "Create manual journal entries and bank accounts",
    },
    {
      key: "accounting.update",
      resource: "Accounting",
      action: "update",
      description: "Edit draft journal entries and account details",
    },
    {
      key: "accounting.delete",
      resource: "Accounting",
      action: "delete",
      description: "Delete draft journal entries",
    },
    {
      key: "accounting.post",
      resource: "Accounting",
      action: "post",
      description: "Post journal entries to the General Ledger",
    },
    {
      key: "accounting.reverse",
      resource: "Accounting",
      action: "reverse",
      description: "Post journal entry reversals",
    },
    {
      key: "accounting.close_period",
      resource: "Accounting",
      action: "close_period",
      description: "Close or lock accounting periods and fiscal years",
    },
    {
      key: "accounting.reconcile",
      resource: "Accounting",
      action: "reconcile",
      description: "Perform bank and cash reconciliations",
    },
    {
      key: "accounting.manage_accounts",
      resource: "Accounting",
      action: "manage_accounts",
      description: "Manage Chart of Accounts and GL mappings",
    },
    {
      key: "accounting.manage_tax",
      resource: "Accounting",
      action: "manage_tax",
      description: "Manage tax accounting settings and rates",
    },
    {
      key: "accounting.manage_bank",
      resource: "Accounting",
      action: "manage_bank",
      description: "Create and configure bank accounts",
    },
  ];

  const permissionsMap = new Map<string, string>();
  for (const perm of permissionsData) {
    const p = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: perm,
    });
    permissionsMap.set(p.key, p.id);
  }
  console.log(`✓ Seeded ${permissionsData.length} permissions`);

  // 2. Seed Development Organization
  const org = await prisma.organization.upsert({
    where: { slug: "valgrow-holdings" },
    update: { name: "ValGrow Holdings [Dev Workspace]" },
    create: {
      name: "ValGrow Holdings [Dev Workspace]",
      legalName: "ValGrow Holdings Private Limited (Development)",
      slug: "valgrow-holdings",
      plan: "Enterprise",
      currency: "INR",
      timezone: "Asia/Kolkata",
      fiscalYearStart: "April",
      status: "ACTIVE",
    },
  });
  console.log(`✓ Seeded development organization: ${org.name} (${org.id})`);

  // 3. Seed System Roles for Organization
  const rolesData = [
    {
      name: "Owner",
      description: "System role: full control",
      isSystem: true,
      perms: Array.from(permissionsMap.keys()),
    },
    {
      name: "Administrator",
      description: "System role: admin access",
      isSystem: true,
      perms: [
        "users.read",
        "users.create",
        "users.write",
        "branches.read",
        "branches.manage",
        "departments.manage",
        "teams.manage",
        "roles.manage",
        "settings.manage",
        "files.upload",
        "files.delete",
        "inventory.read",
        "inventory.create",
        "inventory.update",
        "inventory.delete",
        "inventory.adjust",
        "inventory.transfer",
        "inventory.reserve",
      ],
    },
    {
      name: "Branch Manager",
      description: "System role: branch operations",
      isSystem: true,
      perms: [
        "users.read",
        "branches.read",
        "departments.manage",
        "teams.manage",
        "files.upload",
        "inventory.read",
        "inventory.create",
        "inventory.update",
        "inventory.adjust",
        "inventory.transfer",
      ],
    },
    {
      name: "Viewer",
      description: "System role: read-only access",
      isSystem: true,
      perms: ["users.read", "branches.read", "inventory.read"],
    },
  ];

  const rolesMap = new Map<string, string>();
  for (const roleDef of rolesData) {
    let role = await prisma.role.findFirst({
      where: { organizationId: org.id, name: roleDef.name },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          organizationId: org.id,
          name: roleDef.name,
          description: roleDef.description,
          isSystem: roleDef.isSystem,
          scope: "Organization",
        },
      });
    }

    rolesMap.set(roleDef.name, role.id);

    // Link permissions
    for (const pKey of roleDef.perms) {
      const pId = permissionsMap.get(pKey);
      if (pId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: pId,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: pId,
          },
        });
      }
    }
  }
  console.log(`✓ Seeded ${rolesData.length} roles with permissions`);

  // 4. Seed Development Users
  const passwordHash = await bcrypt.hash("DevelopmentPass123!", 12);
  const usersData = [
    {
      email: "alex.verma@valgrow.dev",
      firstName: "Alex",
      lastName: "Verma",
      jobTitle: "Workspace owner",
      roleName: "Owner",
    },
    {
      email: "riya.placeholder@valgrow.dev",
      firstName: "Riya",
      lastName: "Placeholder",
      jobTitle: "Operations Admin",
      roleName: "Administrator",
    },
    {
      email: "sam.placeholder@valgrow.dev",
      firstName: "Sam",
      lastName: "Placeholder",
      jobTitle: "Branch Manager",
      roleName: "Branch Manager",
    },
    {
      email: "dev.placeholder@valgrow.dev",
      firstName: "Dev",
      lastName: "Placeholder",
      jobTitle: "Viewer Member",
      roleName: "Viewer",
    },
  ];

  const createdUsers = [];
  for (const uDef of usersData) {
    const user = await prisma.user.upsert({
      where: { email: uDef.email },
      update: { firstName: uDef.firstName, lastName: uDef.lastName },
      create: {
        email: uDef.email,
        firstName: uDef.firstName,
        lastName: uDef.lastName,
        jobTitle: uDef.jobTitle,
        passwordHash,
        status: "ACTIVE",
      },
    });

    const roleId = rolesMap.get(uDef.roleName)!;
    await prisma.organizationMember.upsert({
      where: {
        organizationId_userId: {
          organizationId: org.id,
          userId: user.id,
        },
      },
      update: { roleId, status: "ACTIVE" },
      create: {
        organizationId: org.id,
        userId: user.id,
        roleId,
        status: "ACTIVE",
      },
    });

    createdUsers.push(user);
  }
  console.log(
    `✓ Seeded ${createdUsers.length} development users (Password: DevelopmentPass123!)`,
  );

  // 5. Seed Master Data: Taxes
  const taxesData = [
    {
      name: "GST 0%",
      code: "GST0",
      rate: new Prisma.Decimal(0.0),
      type: "GST" as const,
      isInclusive: false,
    },
    {
      name: "GST 5%",
      code: "GST5",
      rate: new Prisma.Decimal(5.0),
      type: "GST" as const,
      isInclusive: false,
    },
    {
      name: "GST 12%",
      code: "GST12",
      rate: new Prisma.Decimal(12.0),
      type: "GST" as const,
      isInclusive: false,
    },
    {
      name: "GST 18%",
      code: "GST18",
      rate: new Prisma.Decimal(18.0),
      type: "GST" as const,
      isInclusive: false,
    },
  ];
  const taxesMap = new Map<string, string>();
  for (const tDef of taxesData) {
    const t = await prisma.tax.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: tDef.name },
      },
      update: { rate: tDef.rate, code: tDef.code },
      create: {
        organizationId: org.id,
        name: tDef.name,
        code: tDef.code,
        rate: tDef.rate,
        type: tDef.type,
        isInclusive: tDef.isInclusive,
        status: "ACTIVE",
      },
    });
    taxesMap.set(tDef.name, t.id);
  }
  console.log(`✓ Seeded ${taxesData.length} taxes`);

  // 6. Seed Master Data: Units
  const unitsData = [
    { name: "Piece", code: "PCS", allowDecimals: false },
    { name: "Box", code: "BOX", allowDecimals: false },
    { name: "Kilogram", code: "KG", allowDecimals: true },
    { name: "Liter", code: "LTR", allowDecimals: true },
  ];
  const unitsMap = new Map<string, string>();
  for (const uDef of unitsData) {
    const u = await prisma.unit.upsert({
      where: {
        organizationId_code: { organizationId: org.id, code: uDef.code },
      },
      update: { name: uDef.name, allowDecimals: uDef.allowDecimals },
      create: {
        organizationId: org.id,
        name: uDef.name,
        code: uDef.code,
        allowDecimals: uDef.allowDecimals,
        status: "ACTIVE",
      },
    });
    unitsMap.set(uDef.code, u.id);
  }
  console.log(`✓ Seeded ${unitsData.length} units of measure`);

  // 7. Seed Master Data: Brands
  const brandsData = [
    { name: "Dell", slug: "dell", description: "Dell Technologies Hardware" },
    {
      name: "HP",
      slug: "hp",
      description: "Hewlett-Packard Laptops & Printers",
    },
    {
      name: "Lenovo",
      slug: "lenovo",
      description: "Lenovo ThinkPad & IdeaPad Line",
    },
    {
      name: "Logitech",
      slug: "logitech",
      description: "Logitech Computer Accessories",
    },
  ];
  const brandsMap = new Map<string, string>();
  for (const bDef of brandsData) {
    const b = await prisma.brand.upsert({
      where: {
        organizationId_slug: { organizationId: org.id, slug: bDef.slug },
      },
      update: { name: bDef.name, description: bDef.description },
      create: {
        organizationId: org.id,
        name: bDef.name,
        slug: bDef.slug,
        description: bDef.description,
        status: "ACTIVE",
      },
    });
    brandsMap.set(bDef.name, b.id);
  }
  console.log(`✓ Seeded ${brandsData.length} brands`);

  // 8. Seed Master Data: Categories (Hierarchical)
  const electronicsCat = await prisma.category.upsert({
    where: {
      organizationId_slug: { organizationId: org.id, slug: "electronics" },
    },
    update: {},
    create: {
      organizationId: org.id,
      name: "Electronics",
      slug: "electronics",
      description: "Electronic hardware & gadgets",
      status: "ACTIVE",
    },
  });

  const subCategoriesData = [
    { name: "Computers", slug: "computers", parentId: electronicsCat.id },
    { name: "Accessories", slug: "accessories", parentId: electronicsCat.id },
    { name: "Office Supplies", slug: "office-supplies", parentId: null },
  ];
  const categoriesMap = new Map<string, string>();
  categoriesMap.set("Electronics", electronicsCat.id);

  for (const cDef of subCategoriesData) {
    const c = await prisma.category.upsert({
      where: {
        organizationId_slug: { organizationId: org.id, slug: cDef.slug },
      },
      update: { parentId: cDef.parentId },
      create: {
        organizationId: org.id,
        name: cDef.name,
        slug: cDef.slug,
        parentId: cDef.parentId,
        status: "ACTIVE",
      },
    });
    categoriesMap.set(cDef.name, c.id);
  }
  console.log(
    `✓ Seeded ${subCategoriesData.length + 1} hierarchical categories`,
  );

  // 9. Seed Master Data: Products, Variants & ProductPrices
  const pcsUnitId = unitsMap.get("PCS")!;
  const gst18TaxId = taxesMap.get("GST 18%")!;

  const productsData = [
    {
      name: "Dell XPS 15 Laptop",
      slug: "dell-xps-15-laptop",
      sku: "DELL-XPS-15-01",
      barcode: "884116382001",
      description:
        "High-performance 15-inch laptop with Intel i9 and OLED display.",
      brandId: brandsMap.get("Dell"),
      categoryId: categoriesMap.get("Computers"),
      unitId: pcsUnitId,
      taxId: gst18TaxId,
      costPrice: new Prisma.Decimal(120000.0),
      retailPrice: new Prisma.Decimal(145000.0),
      wholesalePrice: new Prisma.Decimal(135000.0),
      hasVariants: false,
    },
    {
      name: "HP Spectre x360",
      slug: "hp-spectre-x360",
      sku: "HP-SPEC-360-01",
      barcode: "196188204002",
      description: "2-in-1 convertible touchscreen laptop.",
      brandId: brandsMap.get("HP"),
      categoryId: categoriesMap.get("Computers"),
      unitId: pcsUnitId,
      taxId: gst18TaxId,
      costPrice: new Prisma.Decimal(95000.0),
      retailPrice: new Prisma.Decimal(118000.0),
      wholesalePrice: new Prisma.Decimal(108000.0),
      hasVariants: false,
    },
    {
      name: "Logitech MX Master 3S Mouse",
      slug: "logitech-mx-master-3s-mouse",
      sku: "LOGI-MX3S-01",
      barcode: "097855171003",
      description: "Performance wireless ergonomic mouse with quiet clicks.",
      brandId: brandsMap.get("Logitech"),
      categoryId: categoriesMap.get("Accessories"),
      unitId: pcsUnitId,
      taxId: gst18TaxId,
      costPrice: new Prisma.Decimal(6500.0),
      retailPrice: new Prisma.Decimal(8995.0),
      wholesalePrice: new Prisma.Decimal(7800.0),
      hasVariants: false,
    },
    {
      name: "ValGrow Tech T-Shirt",
      slug: "valgrow-tech-tshirt",
      sku: "VG-TSHIRT-BASE",
      barcode: "990000001004",
      description: "Premium cotton tech event apparel.",
      brandId: brandsMap.get("Logitech"),
      categoryId: categoriesMap.get("Office Supplies"),
      unitId: pcsUnitId,
      taxId: taxesMap.get("GST 5%")!,
      costPrice: new Prisma.Decimal(350.0),
      retailPrice: new Prisma.Decimal(799.0),
      wholesalePrice: new Prisma.Decimal(550.0),
      hasVariants: true,
      variants: [
        {
          name: "Small / Red",
          sku: "VG-TSHIRT-RED-S",
          barcode: "990000001101",
          attributes: { size: "S", color: "Red" },
          retail: new Prisma.Decimal(799.0),
          wholesale: new Prisma.Decimal(550.0),
        },
        {
          name: "Medium / Red",
          sku: "VG-TSHIRT-RED-M",
          barcode: "990000001102",
          attributes: { size: "M", color: "Red" },
          retail: new Prisma.Decimal(799.0),
          wholesale: new Prisma.Decimal(550.0),
        },
        {
          name: "Large / Red",
          sku: "VG-TSHIRT-RED-L",
          barcode: "990000001103",
          attributes: { size: "L", color: "Red" },
          retail: new Prisma.Decimal(849.0),
          wholesale: new Prisma.Decimal(580.0),
        },
        {
          name: "Small / Blue",
          sku: "VG-TSHIRT-BLU-S",
          barcode: "990000001201",
          attributes: { size: "S", color: "Blue" },
          retail: new Prisma.Decimal(799.0),
          wholesale: new Prisma.Decimal(550.0),
        },
        {
          name: "Medium / Blue",
          sku: "VG-TSHIRT-BLU-M",
          barcode: "990000001202",
          attributes: { size: "M", color: "Blue" },
          retail: new Prisma.Decimal(799.0),
          wholesale: new Prisma.Decimal(550.0),
        },
      ],
    },
  ];

  for (const pDef of productsData) {
    const product = await prisma.product.upsert({
      where: {
        organizationId_slug: { organizationId: org.id, slug: pDef.slug },
      },
      update: { costPrice: pDef.costPrice, hasVariants: pDef.hasVariants },
      create: {
        organizationId: org.id,
        name: pDef.name,
        slug: pDef.slug,
        sku: pDef.sku,
        barcode: pDef.barcode,
        description: pDef.description,
        brandId: pDef.brandId,
        categoryId: pDef.categoryId,
        unitId: pDef.unitId,
        taxId: pDef.taxId,
        costPrice: pDef.costPrice,
        hasVariants: pDef.hasVariants,
        status: "ACTIVE",
      },
    });

    // Base Product Price Levels
    await prisma.productPrice.upsert({
      where: {
        organizationId_productId_variantId_tier_minQuantity: {
          organizationId: org.id,
          productId: product.id,
          variantId: "",
          tier: "RETAIL",
          minQuantity: 1,
        },
      },
      update: { price: pDef.retailPrice },
      create: {
        organizationId: org.id,
        productId: product.id,
        tier: "RETAIL",
        price: pDef.retailPrice,
        minQuantity: 1,
      },
    });

    await prisma.productPrice.upsert({
      where: {
        organizationId_productId_variantId_tier_minQuantity: {
          organizationId: org.id,
          productId: product.id,
          variantId: "",
          tier: "WHOLESALE",
          minQuantity: 10,
        },
      },
      update: { price: pDef.wholesalePrice },
      create: {
        organizationId: org.id,
        productId: product.id,
        tier: "WHOLESALE",
        price: pDef.wholesalePrice,
        minQuantity: 10,
      },
    });

    // Seed Variants if defined
    if (pDef.variants) {
      for (const vDef of pDef.variants) {
        const variant = await prisma.productVariant.upsert({
          where: {
            organizationId_sku: { organizationId: org.id, sku: vDef.sku },
          },
          update: { barcode: vDef.barcode },
          create: {
            organizationId: org.id,
            productId: product.id,
            name: vDef.name,
            sku: vDef.sku,
            barcode: vDef.barcode,
            attributes: vDef.attributes,
            status: "ACTIVE",
          },
        });

        // Variant-Specific Retail & Wholesale Prices
        await prisma.productPrice.upsert({
          where: {
            organizationId_productId_variantId_tier_minQuantity: {
              organizationId: org.id,
              productId: product.id,
              variantId: variant.id,
              tier: "RETAIL",
              minQuantity: 1,
            },
          },
          update: { price: vDef.retail },
          create: {
            organizationId: org.id,
            productId: product.id,
            variantId: variant.id,
            tier: "RETAIL",
            price: vDef.retail,
            minQuantity: 1,
          },
        });

        await prisma.productPrice.upsert({
          where: {
            organizationId_productId_variantId_tier_minQuantity: {
              organizationId: org.id,
              productId: product.id,
              variantId: variant.id,
              tier: "WHOLESALE",
              minQuantity: 10,
            },
          },
          update: { price: vDef.wholesale },
          create: {
            organizationId: org.id,
            productId: product.id,
            variantId: variant.id,
            tier: "WHOLESALE",
            price: vDef.wholesale,
            minQuantity: 10,
          },
        });
      }
    }
  }

  console.log(
    `✓ Seeded ${productsData.length} development products with variants and tier pricing`,
  );

  // 4. Seed CRM Master Data & Demo Data
  const leadSourcesData = [
    { name: "Website", description: "Inbound website lead form" },
    { name: "Referral", description: "Existing client or partner referral" },
    { name: "Cold Call", description: "Outbound sales call" },
    { name: "Social Media", description: "LinkedIn / Meta campaigns" },
    { name: "Walk-in", description: "Direct showroom walk-in" },
  ];

  for (const src of leadSourcesData) {
    await prisma.leadSource.upsert({
      where: {
        organizationId_name: { organizationId: org.id, name: src.name },
      },
      update: { description: src.description },
      create: {
        organizationId: org.id,
        name: src.name,
        description: src.description,
      },
    });
  }
  console.log(`✓ Seeded ${leadSourcesData.length} CRM Lead Sources`);

  const pipeline = await prisma.crmPipeline.upsert({
    where: {
      organizationId_name_type: {
        organizationId: org.id,
        name: "Standard Sales Pipeline",
        type: "OPPORTUNITY",
      },
    },
    update: { isDefault: true },
    create: {
      organizationId: org.id,
      name: "Standard Sales Pipeline",
      type: "OPPORTUNITY",
      isDefault: true,
      stages: {
        create: [
          {
            organizationId: org.id,
            name: "New / Qualification",
            position: 1,
            probability: 10,
            color: "#3B82F6",
          },
          {
            organizationId: org.id,
            name: "Needs Analysis",
            position: 2,
            probability: 30,
            color: "#8B5CF6",
          },
          {
            organizationId: org.id,
            name: "Value Proposition",
            position: 3,
            probability: 50,
            color: "#F59E0B",
          },
          {
            organizationId: org.id,
            name: "Proposal / Negotiation",
            position: 4,
            probability: 80,
            color: "#EC4899",
          },
          {
            organizationId: org.id,
            name: "Closed Won",
            position: 5,
            probability: 100,
            color: "#10B981",
          },
          {
            organizationId: org.id,
            name: "Closed Lost",
            position: 6,
            probability: 0,
            color: "#EF4444",
          },
        ],
      },
    },
    include: { stages: true },
  });
  console.log(
    `✓ Seeded default CRM Sales Pipeline with ${pipeline.stages.length} stages`,
  );

  const tagsData = [
    { name: "VIP", color: "#EF4444" },
    { name: "Enterprise", color: "#3B82F6" },
    { name: "High Value", color: "#10B981" },
    { name: "Follow-up Required", color: "#F59E0B" },
  ];
  for (const t of tagsData) {
    await prisma.crmTag.upsert({
      where: { organizationId_name: { organizationId: org.id, name: t.name } },
      update: { color: t.color },
      create: { organizationId: org.id, name: t.name, color: t.color },
    });
  }
  console.log(`✓ Seeded ${tagsData.length} CRM Tags`);

  // Seed Default Chart of Accounts & Mappings
  await seedDefaultChartOfAccounts(prisma, org.id);
  console.log(`✓ Seeded default Chart of Accounts and GL Mappings for ${org.name}`);

  console.log("✅ Master Data Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
