import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const description = "Manage the profile details shown across the ValGrow workspace.";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "User Profile · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "User Profile · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <AppShell>
      <PageHeader
        eyebrow="Account"
        title="User Profile"
        description={description}
        actions={
          <>
            <Button variant="outline">Cancel</Button>
            <Button>Save changes</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Identity" description="Shown to other members of the workspace.">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/15 text-lg font-semibold text-primary">
                AV
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Upload avatar
              </Button>
              <p className="text-xs text-muted-foreground">PNG or JPG, up to 2 MB.</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Role</span>
              <Badge variant="secondary">Owner</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Branch</span>
              <span>Head Office</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Joined</span>
              <span>Placeholder date</span>
            </div>
          </div>
        </Section>

        <div className="lg:col-span-2">
          <Section title="Personal details" description="Placeholder form fields only.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first">First name</Label>
                <Input id="first" defaultValue="Alex" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last">Last name</Label>
                <Input id="last" defaultValue="Verma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="placeholder@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" defaultValue="+91 00000 00000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dept">Department</Label>
                <Select defaultValue="operations">
                  <SelectTrigger id="dept">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Job title</Label>
                <Input id="title" defaultValue="Workspace owner" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">About</Label>
                <Textarea id="bio" rows={4} defaultValue="Placeholder bio text." />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </AppShell>
  );
}