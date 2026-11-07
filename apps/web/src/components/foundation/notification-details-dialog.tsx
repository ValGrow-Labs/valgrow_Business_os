import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  UserPlus,
  TriangleAlert,
  Bell,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Building2,
  Mail,
  Clock,
} from "lucide-react";

export interface NotificationMetadata {
  type?: string;
  roleId?: string;
  roleName?: string;
  permissionsAdded?: string[];
  permissionsRemoved?: string[];
  memberId?: string;
  userId?: string;
  email?: string;
  status?: string;
  branchId?: string;
  branchName?: string;
  reviewScope?: string;
}

export interface NotificationDetailItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  kind?: "info" | "success" | "warning";
  metadata?: NotificationMetadata | Record<string, any> | null | undefined;
}

export type NotificationCategory =
  | "MEMBER_INVITED"
  | "ROLE_UPDATED"
  | "SECURITY_REVIEW_DUE"
  | "GENERIC";

export function resolveNotificationCategory(
  notification: NotificationDetailItem,
): NotificationCategory {
  const metaType = notification.metadata?.["type"];
  if (metaType === "MEMBER_INVITED") return "MEMBER_INVITED";
  if (metaType === "ROLE_UPDATED") return "ROLE_UPDATED";
  if (metaType === "SECURITY_REVIEW_DUE") return "SECURITY_REVIEW_DUE";

  const titleLower = (notification.title || "").toLowerCase();
  if (titleLower.includes("member") || titleLower.includes("invite")) {
    return "MEMBER_INVITED";
  }
  if (titleLower.includes("role") || titleLower.includes("permission")) {
    return "ROLE_UPDATED";
  }
  if (
    titleLower.includes("security") ||
    titleLower.includes("review") ||
    titleLower.includes("audit")
  ) {
    return "SECURITY_REVIEW_DUE";
  }

  return "GENERIC";
}

interface NotificationDetailsDialogProps {
  notification: NotificationDetailItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationDetailsDialog({
  notification,
  open,
  onOpenChange,
}: NotificationDetailsDialogProps) {
  const navigate = useNavigate();

  if (!notification) return null;

  const category = resolveNotificationCategory(notification);
  const meta: NotificationMetadata =
    (notification.metadata as NotificationMetadata) || {};

  const handleNavigate = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  // Safe entity extraction tailored strictly per category
  // 1. Member Invited fields
  const invitedEmail =
    meta["email"] ||
    notification.body.match(
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/,
    )?.[1] ||
    "";
  const assignedRole =
    meta["roleName"] ||
    notification.body.match(/with\s+(?:the\s+)?"?([^".\n]+)"?\s+role/i)?.[1] ||
    "";
  const rawInviteStatus = meta["status"] || "Pending Acceptance";
  const isInviteActive = rawInviteStatus.toLowerCase().includes("active");

  // 2. Role Updated fields
  const roleName =
    meta["roleName"] ||
    notification.body.match(/(?:The\s+)?"?([^"]+)"?\s+role/i)?.[1] ||
    "";
  const permissionsAdded = Array.isArray(meta["permissionsAdded"])
    ? meta["permissionsAdded"]
    : [];
  const permissionsRemoved = Array.isArray(meta["permissionsRemoved"])
    ? meta["permissionsRemoved"]
    : [];

  // 3. Security Review fields
  const facilityName =
    meta["branchName"] ||
    notification.body.match(/for\s+([^,.]+?)\s+is pending/i)?.[1] ||
    "";
  const reviewScope =
    meta["reviewScope"] ||
    notification.body.replace(/\s+for\s+[^,.]+?\s+is pending/i, "").trim() ||
    "";
  const reviewStatus = meta["status"] || "Action Pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85vh] flex flex-col p-6 overflow-hidden rounded-xl bg-card border shadow-xl">
        {/* Header */}
        <DialogHeader className="text-left space-y-2 pr-8 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {category === "ROLE_UPDATED" ? (
                  <Shield className="h-4 w-4" />
                ) : category === "MEMBER_INVITED" ? (
                  <UserPlus className="h-4 w-4" />
                ) : category === "SECURITY_REVIEW_DUE" ? (
                  <TriangleAlert className="h-4 w-4 text-warning" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </span>
              <Badge variant="outline" className="text-xs uppercase tracking-wide">
                {notification.kind || "Notification"}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{notification.time}</span>
            </div>
          </div>
          <DialogTitle className="text-base sm:text-lg font-semibold text-foreground break-words">
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground break-words leading-relaxed">
            {notification.body}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {/* CATEGORY 1: NEW MEMBER INVITED */}
          {category === "MEMBER_INVITED" && (
            <div className="rounded-lg border bg-muted/40 p-3.5 sm:p-4 space-y-2.5 text-xs sm:text-sm">
              {invitedEmail ? (
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <span className="text-muted-foreground shrink-0">Invited Member</span>
                  <span className="font-semibold text-foreground truncate min-w-0 flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{invitedEmail}</span>
                  </span>
                </div>
              ) : null}

              {assignedRole ? (
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <span className="text-muted-foreground shrink-0">Assigned Role</span>
                  <span className="font-medium text-foreground truncate min-w-0">
                    {assignedRole}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Invitation Status</span>
                <Badge
                  variant="outline"
                  className={
                    isInviteActive
                      ? "border-success/40 bg-success-soft text-success shrink-0"
                      : "border-warning/40 bg-warning-soft text-warning shrink-0"
                  }
                >
                  {rawInviteStatus}
                </Badge>
              </div>
            </div>
          )}

          {/* CATEGORY 2: ROLE UPDATED */}
          {category === "ROLE_UPDATED" && (
            <div className="rounded-lg border bg-muted/40 p-3.5 sm:p-4 space-y-3 text-xs sm:text-sm">
              {roleName ? (
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <span className="text-muted-foreground shrink-0">Affected Role</span>
                  <span className="font-semibold text-foreground truncate min-w-0">
                    {roleName}
                  </span>
                </div>
              ) : null}

              {permissionsAdded.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-medium text-muted-foreground">
                    Permissions Granted ({permissionsAdded.length}):
                  </span>
                  <ul className="space-y-1 pt-1 max-h-40 overflow-y-auto pr-1">
                    {permissionsAdded.map((perm) => (
                      <li key={perm} className="flex items-center gap-2 text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                        <span className="font-medium truncate">{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permissionsRemoved.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t">
                  <span className="font-medium text-muted-foreground">
                    Permissions Revoked ({permissionsRemoved.length}):
                  </span>
                  <ul className="space-y-1 pt-1 max-h-40 overflow-y-auto pr-1">
                    {permissionsRemoved.map((perm) => (
                      <li key={perm} className="flex items-center gap-2 text-foreground">
                        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        <span className="line-through text-muted-foreground truncate">{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {permissionsAdded.length === 0 && permissionsRemoved.length === 0 && (
                <div className="text-muted-foreground text-xs">
                  Role configuration and permissions updated.
                </div>
              )}
            </div>
          )}

          {/* CATEGORY 3: SECURITY REVIEW DUE */}
          {category === "SECURITY_REVIEW_DUE" && (
            <div className="rounded-lg border bg-muted/40 p-3.5 sm:p-4 space-y-2.5 text-xs sm:text-sm">
              {facilityName ? (
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <span className="text-muted-foreground shrink-0">Target Facility</span>
                  <span className="font-semibold text-foreground truncate min-w-0 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{facilityName}</span>
                  </span>
                </div>
              ) : null}

              {reviewScope ? (
                <div className="flex items-center justify-between gap-3 border-b pb-2">
                  <span className="text-muted-foreground shrink-0">Review Scope</span>
                  <span className="font-medium text-foreground text-right truncate min-w-0">
                    {reviewScope}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground shrink-0">Review Status</span>
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive-soft text-destructive shrink-0"
                >
                  {reviewStatus}
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="mt-3 pt-3 border-t shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto h-9"
          >
            Dismiss
          </Button>

          {category === "ROLE_UPDATED" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNavigate("/permissions")}
                className="w-full sm:w-auto h-9"
              >
                Permissions
              </Button>
              <Button
                type="button"
                onClick={() => handleNavigate("/roles")}
                className="w-full sm:w-auto h-9 gap-1.5"
              >
                Role Management <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {category === "MEMBER_INVITED" && (
            <Button
              type="button"
              onClick={() => handleNavigate("/users")}
              className="w-full sm:w-auto h-9 gap-1.5"
            >
              User Management <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {category === "SECURITY_REVIEW_DUE" && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNavigate("/branches")}
                className="w-full sm:w-auto h-9"
              >
                View Branches
              </Button>
              <Button
                type="button"
                onClick={() => handleNavigate("/audit-logs")}
                className="w-full sm:w-auto h-9 gap-1.5"
              >
                Open Audit Logs <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {category === "GENERIC" && (
            <Button
              type="button"
              onClick={() => handleNavigate("/notifications")}
              className="w-full sm:w-auto h-9"
            >
              Go to Notifications
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
