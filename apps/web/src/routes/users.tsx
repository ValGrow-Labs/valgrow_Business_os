import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useUsers } from "@/hooks/queries/useUsers";
import { useCurrentUser } from "@/hooks/queries/useCurrentUser";
import { InviteUserDialog } from "@/components/foundation/invite-user-dialog";
import { AppShell } from "@/components/layout/app-shell";
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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, KeyRound, ShieldAlert, ArrowLeft } from "lucide-react";

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

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [resetMember, setResetMember] = useState<TargetMemberInfo | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const { data: usersData, isLoading: isLoadingUsers } = useUsers();

  const isLoading = isLoadingMe || isLoadingUsers;

  const handleOpenReset = (member: TargetMemberInfo) => {
    setResetMember(member);
    setIsResetOpen(true);
  };

  const columns: Column<ListRow>[] = [
    { key: "name", header: "Member" },
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

  const rows: ListRow[] = usersData
    ? usersData.map((u) => ({
        id: u.id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        status: u.status === "ACTIVE" ? "Active" : u.status === "PENDING" ? "Pending" : "Revoked",
      }))
    : [];

  const stats = [
    { label: "Members", value: String(usersData?.length || 0), hint: "Seats in use" },
    { label: "Active", value: String(usersData?.filter((u) => u.status === "ACTIVE").length || 0) },
    {
      label: "Admins",
      value: String(
        usersData?.filter((u) => u.role === "Owner" || u.role === "Administrator").length || 0,
      ),
    },
    {
      label: "Pending",
      value: String(usersData?.filter((u) => u.status === "PENDING").length || 0),
    },
  ];

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
        isLoading={isLoading}
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
