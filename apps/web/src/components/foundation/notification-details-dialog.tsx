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

  const meta: NotificationMetadata = (notification.metadata as NotificationMetadata) || {};

  const isRoleUpdated =
    meta.type === "ROLE_UPDATED" ||
    notification.title.toLowerCase().includes("role") ||
    notification.body.toLowerCase().includes("permission");

  const isMemberInvited =
    meta.type === "MEMBER_INVITED" ||
    notification.title.toLowerCase().includes("member") ||
    notification.title.toLowerCase().includes("invite") ||
    notification.body.toLowerCase().includes("invitation");

  const isSecurityReview =
    meta.type === "SECURITY_REVIEW_DUE" ||
    notification.title.toLowerCase().includes("security") ||
    notification.body.toLowerCase().includes("review") ||
    notification.body.toLowerCase().includes("audit");

  const handleNavigate = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  // Dynamic values derived from metadata or body
  const roleName = meta.roleName || "Configured Role";
  const permissionsAdded: string[] = Array.isArray(meta.permissionsAdded) ? meta.permissionsAdded : [];
  const permissionsRemoved: string[] = Array.isArray(meta.permissionsRemoved) ? meta.permissionsRemoved : [];

  const invitedEmail = meta.email || "Invited User";
  const assignedRole = meta.roleName || "Organization Member";
  const inviteStatus = meta.status || "Pending Acceptance";

  const facilityName = meta.branchName || "All Facilities";
  const reviewScope = meta.reviewScope || "Quarterly Access & Session Policy Audit";
  const reviewStatus = meta.status || "Action Pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between pr-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
                {isRoleUpdated ? (
                  <Shield className="h-4 w-4" />
                ) : isMemberInvited ? (
                  <UserPlus className="h-4 w-4" />
                ) : isSecurityReview ? (
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
              <Clock className="h-3.5 w-3.5" />
              <span>{notification.time}</span>
            </div>
          </div>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {notification.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {notification.body}
          </DialogDescription>
        </DialogHeader>

        {isRoleUpdated && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Affected Role</span>
              <span className="font-semibold text-foreground">{roleName}</span>
            </div>
            {permissionsAdded.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-medium text-muted-foreground">
                  Permissions Granted ({permissionsAdded.length}):
                </span>
                <ul className="space-y-1 pt-1">
                  {permissionsAdded.map((perm) => (
                    <li key={perm} className="flex items-center gap-2 text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <strong className="font-medium">{perm}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {permissionsRemoved.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="font-medium text-muted-foreground">
                  Permissions Revoked ({permissionsRemoved.length}):
                </span>
                <ul className="space-y-1 pt-1">
                  {permissionsRemoved.map((perm) => (
                    <li key={perm} className="flex items-center gap-2 text-foreground">
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span className="line-through text-muted-foreground">{perm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {permissionsAdded.length === 0 && permissionsRemoved.length === 0 && (
              <div className="text-muted-foreground">
                Role configuration and permissions updated.
              </div>
            )}
          </div>
        )}

        {isMemberInvited && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Invited Member</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                {invitedEmail}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Assigned Role</span>
              <span className="font-medium text-foreground">{assignedRole}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Invitation Status</span>
              <Badge
                variant="outline"
                className={
                  inviteStatus.toLowerCase().includes("active")
                    ? "border-success/40 bg-success-soft text-success"
                    : "border-warning/40 bg-warning-soft text-warning"
                }
              >
                {inviteStatus}
              </Badge>
            </div>
          </div>
        )}

        {isSecurityReview && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Target Facility</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                {facilityName}
              </span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-muted-foreground">Review Scope</span>
              <span className="font-medium text-foreground">
                {reviewScope}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Review Status</span>
              <Badge variant="outline" className="border-destructive/40 bg-destructive-soft text-destructive">
                {reviewStatus}
              </Badge>
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Dismiss
          </Button>

          {isRoleUpdated && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNavigate("/permissions")}
                className="w-full sm:w-auto"
              >
                Permissions
              </Button>
              <Button
                type="button"
                onClick={() => handleNavigate("/roles")}
                className="w-full sm:w-auto gap-1.5"
              >
                Role Management <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {isMemberInvited && (
            <Button
              type="button"
              onClick={() => handleNavigate("/users")}
              className="w-full sm:w-auto gap-1.5"
            >
              User Management <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}

          {isSecurityReview && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleNavigate("/branches")}
                className="w-full sm:w-auto"
              >
                View Branches
              </Button>
              <Button
                type="button"
                onClick={() => handleNavigate("/audit-logs")}
                className="w-full sm:w-auto gap-1.5"
              >
                Open Audit Logs <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}

          {!isRoleUpdated && !isMemberInvited && !isSecurityReview && (
            <Button
              type="button"
              onClick={() => handleNavigate("/notifications")}
              className="w-full sm:w-auto"
            >
              Go to Notifications
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
