import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListPage, StatusBadge, NameCell, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useUsers, type UserItem } from "@/hooks/queries/useUsers";
import { useRoles } from "@/hooks/queries/useRoles";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { InviteUserDialog } from "@/components/foundation/invite-user-dialog";
import { AppShell } from "@/components/layout/app-shell";
import { exportToCsv, getExportFilename } from "@/lib/exportCsv";
import { toast } from "sonner";
import {
  ResetPasswordDialog,
  type TargetMemberInfo,
} from "@/components/foundation/reset-password-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, KeyRound, ShieldAlert, ArrowLeft, RotateCcw } from "lucide-react";

const title = "User Management";
const description = "Invite members, assign roles and manage workspace access.";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: `${title} · ValGrow Business OS` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · ValGrow Business OS` },
      { property: "og:description", content: description },
    ],
  }),
  component: UserManagementPage,
});

function UserManagementPage() {
  const { data: currentUser, isLoading: isLoadingMe } = useCurrentUser();
  const isOwner = currentUser?.role?.name?.toLowerCase() === "owner";
  const permissions = currentUser?.permissions || [];
  const canReadUsers = isOwner || permissions.includes("users.read");
  const canCreateUsers = isOwner || permissions.includes("users.create");
  const canManageUsers = isOwner || permissions.includes("users.write");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  const hasActiveFilters = Boolean(
    search.trim() || statusFilter !== "ALL" || roleFilter !== "ALL",
  );

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setRoleFilter("ALL");
  };

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TargetMemberInfo | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: usersData,
    isLoading: isLoadingUsers,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useUsers();
  const { data: rolesData } = useRoles();

  const handleOpenReset = (member: TargetMemberInfo) => {
    setResetMember(member);
    setIsResetOpen(true);
  };

  // Distinct roles for dropdown
  const allRoles = useMemo(() => {
    const roleSet = new Set<string>();
    if (rolesData) {
      rolesData.forEach((r) => roleSet.add(r.name));
    }
    if (usersData) {
      usersData.forEach((u) => {
        if (u.role) roleSet.add(u.role);
      });
    }
    return Array.from(roleSet).sort();
  }, [rolesData, usersData]);

  // Client-side smooth instantaneous filtering and relevance ranking
  const displayUsers = useMemo(() => {
    if (!usersData) return [];

    let filtered = [...usersData];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((u) => {
        const uStatus = (u.status || "").toUpperCase();
        if (statusFilter === "ACTIVE") return uStatus === "ACTIVE";
        if (statusFilter === "PENDING") return uStatus === "PENDING";
        if (statusFilter === "REVOKED") {
          return (
            uStatus === "SUSPENDED" ||
            uStatus === "DEACTIVATED" ||
            uStatus === "REVOKED"
          );
        }
        return uStatus === statusFilter;
      });
    }

    // Role filter
    if (roleFilter !== "ALL") {
      filtered = filtered.filter(
        (u) => (u.role || "").toLowerCase() === roleFilter.toLowerCase(),
      );
    }

    const query = search.trim();
    if (!query) {
      return filtered;
    }

    const qLower = query.toLowerCase();
    const qClean = qLower.replace(/[^a-z0-9]/g, "");

    const getRelevance = (u: UserItem) => {
      const firstName = (u.firstName || "").toLowerCase();
      const lastName = (u.lastName || "").toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      const jobTitle = (u.jobTitle || "").toLowerCase();

      const nameClean = fullName.replace(/[^a-z0-9]/g, "");
      const emailClean = email.replace(/[^a-z0-9]/g, "");
      const emailUser = email.split("@")[0] || "";

      let score = 0;

      // 1. Exact Match (Top Priority: 1500+)
      if (fullName === qLower || nameClean === qClean) {
        score += 1500;
      } else if (email === qLower || emailClean === qClean || emailUser === qLower) {
        score += 1400;
      } else if (role === qLower) {
        score += 1200;
      }

      // 2. Starts With Full Name, Email, First/Last Name (Priority: 700-1000)
      if (fullName.startsWith(qLower) || nameClean.startsWith(qClean)) {
        score += 900;
      } else if (email.startsWith(qLower) || emailUser.startsWith(qLower)) {
        score += 850;
      } else if (firstName.startsWith(qLower)) {
        score += 800;
      } else if (lastName.startsWith(qLower)) {
        score += 750;
      } else if (role.startsWith(qLower)) {
        score += 700;
      }

      // 3. Word boundary match (e.g. searching "one" matches "Cashier One")
      const words = fullName.split(/\s+/);
      if (words.some((w) => w.startsWith(qLower))) {
        score += 600;
      }

      // 4. Substring Match (Priority: 100-300)
      if (fullName.includes(qLower)) {
        score += 300;
      }
      if (email.includes(qLower)) {
        score += 250;
      }
      if (role.includes(qLower)) {
        score += 200;
      }
      if (jobTitle.includes(qLower)) {
        score += 100;
      }

      return score;
    };

    return filtered
      .map((u) => ({ user: u, score: getRelevance(u) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return `${a.user.firstName} ${a.user.lastName}`.localeCompare(
          `${b.user.firstName} ${b.user.lastName}`,
        );
      })
      .map((item) => item.user);
  }, [usersData, search, statusFilter, roleFilter]);

  const handleExport = () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const dataToExport = displayUsers || [];
      if (dataToExport.length === 0) {
        toast.error("No users found to export.");
        return;
      }
      exportToCsv({
        filename: getExportFilename("valgrow-users"),
        columns: [
          {
            header: "Member Name",
            accessor: (u) => `${u.firstName} ${u.lastName}`.trim(),
          },
          { header: "Email", accessor: (u) => u.email },
          { header: "Role", accessor: (u) => u.role },
          {
            header: "Status",
            accessor: (u) =>
              u.status === "ACTIVE"
                ? "Active"
                : u.status === "PENDING"
                  ? "Pending"
                  : u.status === "SUSPENDED"
                    ? "Suspended"
                    : u.status === "DEACTIVATED"
                      ? "Deactivated"
                      : "Revoked",
          },
          { header: "Job Title", accessor: (u) => u.jobTitle || "" },
          { header: "Phone", accessor: (u) => u.phone || "" },
          {
            header: "Member Since",
            accessor: (u) =>
              u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "",
          },
        ],
        data: dataToExport,
      });
      toast.success(
        `Exported ${dataToExport.length} user record${dataToExport.length === 1 ? "" : "s"} successfully.`,
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to export user records.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns: Column<ListRow>[] = [
    {
      key: "name",
      header: "Member",
      render: (r: ListRow) => {
        const user = displayUsers.find((u) => u.id === r["id"]);
        return (
          <NameCell
            value={String(r["name"])}
            {...(user?.jobTitle ? { sub: user.jobTitle } : {})}
          />
        );
      },
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
    },
    ...(canManageUsers
      ? [
          {
            key: "actions",
            header: "",
            className: "w-10 text-right",
            render: (r: ListRow) => {
              const targetIsOwner = String(r["role"]).toLowerCase() === "owner";
              if (targetIsOwner && !isOwner) {
                return null;
              }
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Actions for ${r["name"]}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      onClick={() =>
                        handleOpenReset({
                          id: String(r["id"]),
                          name: String(r["name"]),
                          email: String(r["email"]),
                          role: String(r["role"]),
                        })
                      }
                      className="gap-2 cursor-pointer text-xs"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
                      Reset password
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            },
          },
        ]
      : []),
  ];

  const rows: ListRow[] = useMemo(() => {
    return displayUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role,
      status:
        u.status === "ACTIVE"
          ? "Active"
          : u.status === "PENDING"
            ? "Pending"
            : u.status === "SUSPENDED"
              ? "Suspended"
              : u.status === "DEACTIVATED"
                ? "Deactivated"
                : "Revoked",
    }));
  }, [displayUsers]);

  const stats = useMemo(
    () => [
      { label: "Members", value: String(usersData?.length || 0), hint: "Seats in use" },
      {
        label: "Active",
        value: String(usersData?.filter((u) => u.status === "ACTIVE").length || 0),
      },
      {
        label: "Admins",
        value: String(
          usersData?.filter(
            (u) => u.role === "Owner" || u.role === "Administrator",
          ).length || 0,
        ),
      },
      {
        label: "Pending",
        value: String(usersData?.filter((u) => u.status === "PENDING").length || 0),
      },
    ],
    [usersData],
  );

  const filterContent = (
    <div className="flex flex-wrap items-center gap-2.5 w-full">
      {/* Role Filter */}
      <div className="w-44">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {allRoles.map((role) => (
              <SelectItem key={role} value={role}>
                {role}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-36">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="REVOKED">Revoked / Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reset Action */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Reset filters
        </Button>
      )}
    </div>
  );

  if (!isLoadingMe && !canReadUsers) {
    return (
      <AppShell>
        <div className="mx-auto flex max-w-md flex-col items-center justify-center py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive-soft text-destructive">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-tight">Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view or manage organization members. Contact your workspace Owner for access.
          </p>
          <Button asChild variant="outline" className="mt-6 gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Access"
        {...(canCreateUsers
          ? { actionLabel: "Invite user", onAction: () => setIsInviteOpen(true) }
          : {})}
        onExport={handleExport}
        isExporting={isExporting}
        isLoading={isLoadingMe || (isLoadingUsers && !usersData)}
        isError={isUsersError}
        onRetry={() => refetchUsers()}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search members by name, email, or role…"
        filterContent={filterContent}
        hasActiveFilters={hasActiveFilters}
        stats={stats}
        columns={columns}
        rows={rows}
      />
      <InviteUserDialog
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        existingEmails={usersData?.map((u) => u.email) ?? []}
      />
      <ResetPasswordDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        member={resetMember}
      />
    </>
  );
}