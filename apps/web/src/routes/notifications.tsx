import { createFileRoute } from "@tanstack/react-router";
import { BellOff, CheckCheck } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { NotificationItem } from "@/components/foundation/notification-item";
import { EmptyState } from "@/components/foundation/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, useMarkAllNotificationsRead } from "@/hooks/queries/useNotifications";

const description = "One inbox for workspace, security and module notifications.";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Notification Center · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: NotificationCenterPage,
});

function NotificationCenterPage() {
  const { data: apiNotifications } = useNotifications();
  const markAllMutation = useMarkAllNotificationsRead();

  const list =
    apiNotifications && apiNotifications.length > 0
      ? apiNotifications.map((n) => ({
          id: n.id,
          title: n.title,
          body: n.body,
          time: new Date(n.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread: n.unread,
          kind: (n.kind.toLowerCase() === "error" ? "warning" : n.kind.toLowerCase()) as
            "info" | "success" | "warning",
        }))
      : [];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Workspace"
        title="Notification Center"
        description={description}
        actions={
          <>
            <Button variant="outline">
              <BellOff className="mr-2 h-4 w-4" /> Mute all
            </Button>
            <Button onClick={() => markAllMutation.mutate()}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
          </>
        }
      />

      <Section title="Inbox" description="Notifications grouped by state.">
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4 space-y-1">
            {list.length > 0 ? (
              list.map((n) => <NotificationItem key={n.id} {...n} />)
            ) : (
              <EmptyState title="No notifications yet" />
            )}
          </TabsContent>
          <TabsContent value="unread" className="mt-4 space-y-1">
            {list.filter((n) => n.unread).length > 0 ? (
              list.filter((n) => n.unread).map((n) => <NotificationItem key={n.id} {...n} />)
            ) : (
              <EmptyState title="No unread notifications" />
            )}
          </TabsContent>
          <TabsContent value="archived" className="mt-4">
            <EmptyState title="No archived notifications" />
          </TabsContent>
        </Tabs>
      </Section>
    </AppShell>
  );
}
