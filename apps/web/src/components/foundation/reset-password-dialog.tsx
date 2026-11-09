"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useResetUserPassword } from "@/hooks/queries/useUsers";
import { toast } from "sonner";
import {
  KeyRound,
  Link as LinkIcon,
  Copy,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface TargetMemberInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TargetMemberInfo | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  member,
}: ResetPasswordDialogProps) {
  const [activeTab, setActiveTab] = useState<"link" | "temporary">("link");
  const [tempPassword, setTempPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetMutation = useResetUserPassword();

  // Reset dialog state when opening with a new member
  React.useEffect(() => {
    if (open) {
      setTempPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setGeneratedUrl(null);
      setCopied(false);
      setErrorMsg(null);
      setActiveTab("link");
    }
  }, [open, member?.id]);

  if (!member) return null;

  const handleGenerateLink = async () => {
    setErrorMsg(null);
    try {
      const res = await resetMutation.mutateAsync({
        userId: member.id,
        action: "generate-link",
      });
      if (res.resetUrl) {
        setGeneratedUrl(res.resetUrl);
        toast.success("Password reset link generated successfully");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to generate reset link");
    }
  };

  const handleCopyLink = async () => {
    if (!generatedUrl) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Reset link copied to clipboard");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy link to clipboard");
    }
  };

  const handleSetTemporary = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (tempPassword.length < 8) {
      setErrorMsg("Temporary password must be at least 8 characters long.");
      return;
    }

    if (tempPassword !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    try {
      await resetMutation.mutateAsync({
        userId: member.id,
        action: "set-temporary",
        temporaryPassword: tempPassword,
      });
      toast.success("Temporary password set successfully. Active sessions revoked.");
      onOpenChange(false);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to set temporary password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Reset Member Password</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Manage credentials securely for workspace members.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Member Summary Card */}
        <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{member.name}</span>
            <Badge variant="outline" className="text-xs font-normal">
              {member.role}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{member.email}</div>
        </div>

        {errorMsg && (
          <Alert variant="destructive" className="py-2.5">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{errorMsg}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="link" className="text-xs gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Reset Link
            </TabsTrigger>
            <TabsTrigger value="temporary" className="text-xs gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Temporary Password
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERATE RESET LINK */}
          <TabsContent value="link" className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Generates a cryptographically signed, single-use reset URL. The link automatically expires after 1 hour.
            </p>

            {generatedUrl ? (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Single-Use Reset Link</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={generatedUrl}
                      className="font-mono text-xs bg-muted/50 select-all"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="shrink-0 gap-1.5"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-md p-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>Valid for 1 hour. Single use only — becomes invalid once submitted.</span>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <Button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={resetMutation.isPending}
                  className="w-full gap-2 text-xs h-9"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating link…
                    </>
                  ) : (
                    <>
                      <LinkIcon className="h-3.5 w-3.5" />
                      Generate Reset Link
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: SET TEMPORARY PASSWORD */}
          <TabsContent value="temporary" className="pt-2">
            <form onSubmit={handleSetTemporary} className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Assign a secure temporary password. All existing sessions for this member will be invalidated immediately.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="temp-password" className="text-xs font-medium">
                  Temporary Password *
                </Label>
                <div className="relative">
                  <Input
                    id="temp-password"
                    type={showPassword ? "text" : "password"}
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-9 pr-9 text-xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-xs font-medium">
                  Confirm Password *
                </Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat temporary password"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>The member must change this password after logging in.</span>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={resetMutation.isPending || !tempPassword || !confirmPassword}
                  className="w-full gap-2 text-xs h-9"
                >
                  {resetMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Setting password…
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Set Temporary Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

