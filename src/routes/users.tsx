import { createFileRoute } from "@tanstack/react-router";
import { ListPage, StatusBadge, type ListRow } from "@/components/foundation/list-page";
import type { Column } from "@/components/foundation/data-table";

const columns: Column<ListRow>[] = [
  { key: "name", header: "Member" },
  { key: "email", header: "Email" },
  { key: "role", header: "Role" },
  { key: "status", header: "Status", render: (r) => <StatusBadge value={String(r["status"] ?? "")} /> },
];

const rows: ListRow[] = [
  { name: "Alex Verma", email: "placeholder1@example.com", role: "Owner", status: "Active" },
  { name: "Riya Placeholder", email: "placeholder2@example.com", role: "Admin", status: "Active" },
  { name: "Sam Placeholder", email: "placeholder3@example.com", role: "Manager", status: "Pending" },
  { name: "Dev Placeholder", email: "placeholder4@example.com", role: "Viewer", status: "Revoked" },
];

const stats = [
  { label: "Members", value: "128", hint: "Seats in use" },
  { label: "Invites pending", value: "6" },
  { label: "Admins", value: "4" },
  { label: "Suspended", value: "2" },
];

const title = "User Management";
const description = "Invite members, assign roles and manage workspace access placeholders.";

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
  return (
    <ListPage
      title={title}
      description={description}
      eyebrow="Access"
      actionLabel="Invite user"
      stats={stats}
      columns={columns}
      rows={rows}
    />
  );
}
