# Graph Report - C:\Users\pc\valgrow_Business_os (2026-08-09)

## Corpus Check

- Corpus is ~43,430 words - fits in a single context window. You may not need a graph.

## Summary

- 1275 nodes · 2275 edges · 115 communities (65 shown, 50 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)

- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110

## God Nodes (most connected - your core abstractions)

1. `cn()` - 90 edges
2. `CurrentOrg` - 36 edges
3. `PrismaService` - 35 edges
4. `apiClient()` - 32 edges
5. `FileRoutesByPath` - 29 edges
6. `Button` - 27 edges
7. `RequirePermissions()` - 24 edges
8. `compilerOptions` - 22 edges
9. `CurrentUser` - 19 edges
10. `compilerOptions` - 19 edges

## Surprising Connections (you probably didn't know these)

- `HealthBadge()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/dashboard/module-card.tsx → apps/web/src/lib/utils.ts
- `AvatarStack()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/dashboard/module-card.tsx → apps/web/src/lib/utils.ts
- `WorkflowPipeline()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/dashboard/module-card.tsx → apps/web/src/lib/utils.ts
- `Brand()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/layout/app-shell.tsx → apps/web/src/lib/utils.ts
- `PrimaryNavLinks()` --calls--> `cn()` [EXTRACTED]
  apps/web/src/components/layout/app-shell.tsx → apps/web/src/lib/utils.ts

## Import Cycles

- None detected.

## Communities (115 total, 50 thin omitted)

### Community 0 - "Community 0"

Cohesion: 0.07
Nodes (28): Public(), AuthController, Body, Controller, Get, Post, AuthService, Injectable (+20 more)

### Community 1 - "Community 1"

Cohesion: 0.04
Nodes (46): dependencies, bcrypt, class-transformer, class-validator, cookie-parser, @nestjs/common, @nestjs/config, @nestjs/core (+38 more)

### Community 2 - "Community 2"

Cohesion: 0.04
Nodes (45): devDependencies, eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+37 more)

### Community 3 - "Community 3"

Cohesion: 0.07
Nodes (26): BRAND_GLOW_COLORS, HeroCard(), orgStatus, revenueStats, avatarPalette, AvatarStack(), HealthBadge(), healthStyles (+18 more)

### Community 4 - "Community 4"

Cohesion: 0.07
Nodes (28): Brand(), PrimaryNavLinks(), SidebarNav(), ThemeSwitcher(), useTheme(), Avatar, AvatarFallback, AvatarImage (+20 more)

### Community 5 - "Community 5"

Cohesion: 0.06
Nodes (26): AppController, Controller, Get, AppModule, Module, IS_PUBLIC_KEY, PERMISSIONS_KEY, JwtAuthGuard (+18 more)

### Community 6 - "Community 6"

Cohesion: 0.05
Nodes (37): devDependencies, jest, @nestjs/cli, @nestjs/schematics, @nestjs/testing, prisma, source-map-support, supertest (+29 more)

### Community 7 - "Community 7"

Cohesion: 0.06
Nodes (33): ActivityRoute, AuditLogsRoute, BranchesRoute, DepartmentsRoute, FileRoutesByFullPath, FileRoutesByTo, FileRouteTypes, FilesRoute (+25 more)

### Community 8 - "Community 8"

Cohesion: 0.06
Nodes (31): compilerOptions, allowImportingTsExtensions, exactOptionalPropertyTypes, jsx, lib, module, moduleResolution, noEmit (+23 more)

### Community 9 - "Community 9"

Cohesion: 0.14
Nodes (17): Section(), StatCard(), CardSkeleton(), EmptyState(), ErrorState(), LoadingSkeleton(), AppShell(), Button (+9 more)

### Community 10 - "Community 10"

Cohesion: 0.11
Nodes (22): ButtonProps, buttonVariants, Calendar(), CalendarDayButton(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader() (+14 more)

### Community 11 - "Community 11"

Cohesion: 0.07
Nodes (26): Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent (+18 more)

### Community 12 - "Community 12"

Cohesion: 0.14
Nodes (17): Column, ListPage(), ListRow, StatusBadge(), ActivityLogItem, useActivityLogs(), usePermissions(), ActivityLogsPage() (+9 more)

### Community 13 - "Community 13"

Cohesion: 0.16
Nodes (17): useLoginMutation(), useLogoutMutation(), useRegisterMutation(), useCurrentUser(), UserMeResponse, NotificationItemData, useMarkAllNotificationsRead(), useMarkNotificationRead() (+9 more)

### Community 14 - "Community 14"

Cohesion: 0.15
Nodes (11): CurrentOrg, BranchesController, Body, Controller, Delete, Get, Param, Patch (+3 more)

### Community 15 - "Community 15"

Cohesion: 0.14
Nodes (9): SettingsController, Body, Controller, Get, Patch, SettingsModule, Module, SettingsService (+1 more)

### Community 16 - "Community 16"

Cohesion: 0.10
Nodes (14): icons, NotificationItem(), HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, ScrollArea (+6 more)

### Community 17 - "Community 17"

Cohesion: 0.15
Nodes (9): DepartmentsController, Body, Controller, Get, Param, Patch, Post, DepartmentsService (+1 more)

### Community 18 - "Community 18"

Cohesion: 0.12
Nodes (11): FilesController, Body, Controller, Delete, Get, Param, Post, FilesModule (+3 more)

### Community 19 - "Community 19"

Cohesion: 0.15
Nodes (9): RolesController, Body, Controller, Get, Param, Patch, Post, RolesService (+1 more)

### Community 20 - "Community 20"

Cohesion: 0.15
Nodes (9): TeamsController, Body, Controller, Get, Param, Patch, Post, TeamsService (+1 more)

### Community 21 - "Community 21"

Cohesion: 0.15
Nodes (9): Body, Controller, Get, Param, Patch, Post, UsersController, Injectable (+1 more)

### Community 22 - "Community 22"

Cohesion: 0.10
Nodes (19): compilerOptions, allowSyntheticDefaultImports, baseUrl, declaration, emitDecoratorMetadata, experimentalDecorators, forceConsistentCasingInFileNames, incremental (+11 more)

### Community 23 - "Community 23"

Cohesion: 0.14
Nodes (10): OrganizationsController, Body, Controller, Get, Param, Patch, OrganizationsModule, Module (+2 more)

### Community 24 - "Community 24"

Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 25 - "Community 25"

Cohesion: 0.15
Nodes (16): CommandPalette(), Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+8 more)

### Community 26 - "Community 26"

Cohesion: 0.17
Nodes (13): consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch(), getServerEntry() (+5 more)

### Community 27 - "Community 27"

Cohesion: 0.11
Nodes (19): Route, Route, Route, Route, Route, Route, Route, Route (+11 more)

### Community 28 - "Community 28"

Cohesion: 0.14
Nodes (9): NotificationsController, Controller, Get, Param, Patch, NotificationsModule, Module, NotificationsService (+1 more)

### Community 29 - "Community 29"

Cohesion: 0.16
Nodes (9): SessionsController, Controller, Delete, Get, Param, SessionsModule, Module, SessionsService (+1 more)

### Community 30 - "Community 30"

Cohesion: 0.11
Nodes (17): devDependencies, prettier, prettier, name, private, scripts, build:api, build:web (+9 more)

### Community 31 - "Community 31"

Cohesion: 0.18
Nodes (5): JwtPayload, JwtStrategy, Injectable, PrismaService, Injectable

### Community 32 - "Community 32"

Cohesion: 0.16
Nodes (10): demoFiles, iconFor(), UploadZone(), AuthLayout(), highlights, Checkbox, Progress, LoginPage() (+2 more)

### Community 33 - "Community 33"

Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 34 - "Community 34"

Cohesion: 0.19
Nodes (7): ActivityLogsController, Controller, Get, ActivityLogsModule, Module, ActivityLogsService, Injectable

### Community 35 - "Community 35"

Cohesion: 0.24
Nodes (8): PageHeader(), Breadcrumbs(), labelize(), AccordionContent, AccordionItem, AccordionTrigger, faqs, policies

### Community 36 - "Community 36"

Cohesion: 0.24
Nodes (7): Label, labelVariants, RadioGroup, RadioGroupItem, Slider, Switch, toggles

### Community 37 - "Community 37"

Cohesion: 0.21
Nodes (7): PermissionsController, Controller, Get, PermissionsModule, Module, PermissionsService, Injectable

### Community 38 - "Community 38"

Cohesion: 0.27
Nodes (6): Alert, AlertDescription, AlertTitle, alertVariants, Input, flags

### Community 39 - "Community 39"

Cohesion: 0.15
Nodes (13): dependencies, @radix-ui/react-checkbox, @radix-ui/react-menubar, @radix-ui/react-navigation-menu, react-day-picker, sonner, @tanstack/react-query, @radix-ui/react-checkbox (+5 more)

### Community 40 - "Community 40"

Cohesion: 0.15
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 41 - "Community 41"

Cohesion: 0.21
Nodes (9): SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator, SelectTrigger, Textarea (+1 more)

### Community 42 - "Community 42"

Cohesion: 0.18
Nodes (6): Theme, ThemeContext, ThemeCtx, ThemeProvider(), Route, FileRoutesById

### Community 43 - "Community 43"

Cohesion: 0.29
Nodes (9): DataTable(), Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader (+1 more)

### Community 44 - "Community 44"

Cohesion: 0.18
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 46 - "Community 46"

Cohesion: 0.20
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 47 - "Community 47"

Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 48 - "Community 48"

Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 49 - "Community 49"

Cohesion: 0.22
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 50 - "Community 50"

Cohesion: 0.25
Nodes (7): react, useCarousel(), useChart(), useFormField(), useSidebar(), useIsMobile(), react

### Community 51 - "Community 51"

Cohesion: 0.32
Nodes (5): Badge(), BadgeProps, badgeVariants, searchTargets, Route

### Community 52 - "Community 52"

Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 53 - "Community 53"

Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 54 - "Community 54"

Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 55 - "Community 55"

Cohesion: 0.38
Nodes (5): BranchItem, useBranches(), useCreateBranch(), BranchManagementPage(), columns

### Community 56 - "Community 56"

Cohesion: 0.38
Nodes (5): DepartmentItem, useCreateDepartment(), useDepartments(), columns, DepartmentManagementPage()

### Community 57 - "Community 57"

Cohesion: 0.38
Nodes (5): RoleItem, useCreateRole(), useRoles(), columns, RolesPage()

### Community 58 - "Community 58"

Cohesion: 0.38
Nodes (5): TeamItem, useCreateTeam(), useTeams(), columns, TeamManagementPage()

### Community 59 - "Community 59"

Cohesion: 0.38
Nodes (5): useCreateUser(), UserItem, useUsers(), columns, UserManagementPage()

### Community 60 - "Community 60"

Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 61 - "Community 61"

Cohesion: 0.40
Nodes (4): getRouter(), Register, routeTree, startInstance

## Knowledge Gaps

- **422 isolated node(s):** `$schema`, `collection`, `sourceRoot`, `deleteOutDir`, `name` (+417 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 10` to `Community 3`, `Community 4`, `Community 9`, `Community 11`, `Community 16`, `Community 25`, `Community 32`, `Community 33`, `Community 35`, `Community 36`, `Community 38`, `Community 40`, `Community 41`, `Community 43`, `Community 44`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 51`, `Community 52`, `Community 53`, `Community 54`?**
  _High betweenness centrality (0.141) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 39` to `Community 2`, `Community 50`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`, `Community 82`, `Community 83`, `Community 84`, `Community 85`, `Community 86`, `Community 87`, `Community 88`, `Community 89`, `Community 90`, `Community 91`, `Community 92`, `Community 93`, `Community 94`, `Community 95`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 100`, `Community 101`, `Community 102`, `Community 103`, `Community 104`, `Community 105`, `Community 106`, `Community 107`, `Community 108`, `Community 109`, `Community 110`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `react` connect `Community 50` to `Community 10`, `Community 39`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **What connects `$schema`, `collection`, `sourceRoot` to the rest of the system?**
  _422 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.07402597402597402 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.043478260869565216 - nodes in this community are weakly interconnected._
