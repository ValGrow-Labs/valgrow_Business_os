import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";
import { useUsers } from "@/hooks/queries/useUsers";
import { InviteUserDialog } from "@/components/foundation/invite-user-dialog";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Member" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  {
    key: "status",
    header: "Status",
    render: (r) => <StatusBadge value={String(r["status"] ?? "")} />,
  },
];

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
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { data: usersData, isLoading } = useUsers();

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

  return (
    <>
      <ListPage
        title={title}
        description={description}
        eyebrow="Access"
        actionLabel="Invite user"
        onAction={() => setIsInviteOpen(true)}
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
    </>
  );
}
