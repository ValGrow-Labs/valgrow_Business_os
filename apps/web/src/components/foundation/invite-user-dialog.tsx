"use client";

import * as React from "react";
import { useState, useId } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRoles } from "@/hooks/queries/useRoles";
import { useBranches } from "@/hooks/queries/useBranches";
import { useCreateUser } from "@/hooks/queries/useUsers";
import { toast } from "sonner";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingEmails?: string[];
}

export function InviteUserDialog({
  open,
  onOpenChange,
  existingEmails = [],
}: InviteUserDialogProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const roleSelectId = useId();
  const branchSelectId = useId();
  const jobTitleId = useId();
  const noteId = useId();

  const { data: roles = [], isLoading: isLoadingRoles } = useRoles();
  const { data: branches = [], isLoading: isLoadingBranches } = useBranches();
  const createUserMutation = useCreateUser();

  // Distinct roles scoped to this organization, deduplicated by stable database ID and role name
  const distinctRoles = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();
    return roles.filter((role) => {
      if (!role?.id) return false;
      if (seenIds.has(role.id)) return false;
      const normalizedName = role.name.trim().toLowerCase();
      if (seenNames.has(normalizedName)) return false;
      seenIds.add(role.id);
      seenNames.add(normalizedName);
      return true;
    });
  }, [roles]);

  const isSubmitting = createUserMutation.isPending;

  // Reset form when dialog opens/closes
  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRoleId("");
    setBranchId("");
    setJobTitle("");
    setNote("");
    setFormError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setFormError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFirst) {
      setFormError("First name is required.");
      return;
    }
    if (!trimmedLast) {
      setFormError("Last name is required.");
      return;
    }
    if (!trimmedEmail) {
      setFormError("Work email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Please enter a valid work email address.");
      return;
    }

    if (existingEmails.some((e) => e.toLowerCase() === trimmedEmail)) {
      setFormError("A member with this email already belongs to this workspace.");
      return;
    }

    if (!roleId) {
      setFormError("Please select a workspace role for the new member.");
      return;
    }

    try {
      await createUserMutation.mutateAsync({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        roleId,
        ...(jobTitle.trim() ? { jobTitle: jobTitle.trim() } : {}),
      });

      toast.success(`Invitation successfully sent to ${trimmedEmail}`);
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to send member invitation. Please try again.";
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                Invite workspace member
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Grant access to ValGrow Business OS with assigned workspace permissions.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {formError && (
            <div className="p-3 text-xs sm:text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-md flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{formError}</span>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor={firstNameId} className="text-xs font-medium text-foreground">
                First name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={firstNameId}
                placeholder="Jane"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={isSubmitting}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={lastNameId} className="text-xs font-medium text-foreground">
                Last name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={lastNameId}
                placeholder="Doe"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (formError) setFormError(null);
                }}
                disabled={isSubmitting}
                required
                autoComplete="family-name"
              />
            </div>
          </div>

          {/* Work Email */}
          <div className="space-y-1.5">
            <Label htmlFor={emailId} className="text-xs font-medium text-foreground">
              Work email <span className="text-destructive">*</span>
            </Label>
            <Input
              id={emailId}
              type="email"
              placeholder="jane.doe@organization.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError(null);
              }}
              disabled={isSubmitting}
              required
              autoComplete="email"
            />
          </div>

          {/* Role Selection */}
          <div className="space-y-1.5">
            <Label htmlFor={roleSelectId} className="text-xs font-medium text-foreground">
              Role & Permissions <span className="text-destructive">*</span>
            </Label>
            <Select
              value={roleId}
              onValueChange={(val) => {
                setRoleId(val);
                if (formError) setFormError(null);
              }}
              disabled={isSubmitting || isLoadingRoles}
            >
              <SelectTrigger id={roleSelectId} className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingRoles ? "Loading roles..." : "Select workspace role"
                  }
                />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {distinctRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <div className="flex items-center justify-between w-full gap-4 py-0.5">
                      <span className="font-medium text-foreground">{role.name}</span>
                      {role.isSystem ? (
                        <span className="text-xs text-muted-foreground shrink-0 font-normal">
                          ({role.scope || "Organization"})
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Roles control access to operations, financial records, and administration.
            </p>
          </div>

          {/* Branch / Facility (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor={branchSelectId} className="text-xs font-medium text-foreground">
              Assigned Facility / Branch <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Select
              value={branchId}
              onValueChange={setBranchId}
              disabled={isSubmitting || isLoadingBranches}
            >
              <SelectTrigger id={branchSelectId} className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingBranches
                      ? "Loading facilities..."
                      : "All Facilities (Workspace Default)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Facilities (Workspace Default)</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} {branch.city ? `(${branch.city})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Job Title (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor={jobTitleId} className="text-xs font-medium text-foreground">
              Job title <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Input
              id={jobTitleId}
              placeholder="e.g. Operations Specialist"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {/* Invitation Message Note (Optional) */}
          <div className="space-y-1.5">
            <Label htmlFor={noteId} className="text-xs font-medium text-foreground">
              Personal note <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id={noteId}
              placeholder="Welcome to the workspace! You can access assigned operations immediately."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isSubmitting}
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border/40 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending invitation...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Send invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
