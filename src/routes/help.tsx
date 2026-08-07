import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, LifeBuoy, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/foundation/page-header";
import { Section } from "@/components/foundation/stat-card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const description = "Guides, FAQs and support entry points for the ValGrow foundation workspace.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support · ValGrow Business OS" },
      { name: "description", content: description },
      { property: "og:title", content: "Help & Support · ValGrow Business OS" },
      { property: "og:description", content: description },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  ["What is included in the foundation?", "Reusable layouts, navigation, settings shells and shared UI components."],
  ["Where are the business modules?", "POS, Inventory, CRM, Accounting, HR and Analytics appear as coming soon in the sidebar."],
  ["Is any data real?", "No. Every page uses placeholder content to demonstrate layout and navigation."],
];

function HelpPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Support" title="Help & Support" description={description} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: BookOpen, title: "Documentation", body: "Foundation conventions and tokens." },
          { icon: MessageSquare, title: "Ask the team", body: "Placeholder support channel." },
          { icon: LifeBuoy, title: "Report an issue", body: "Track foundation feedback." },
        ].map((c) => (
          <div key={c.title} className="panel p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <c.icon className="h-4 w-4" />
            </span>
            <p className="mt-3 font-semibold">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.body}</p>
          </div>
        ))}
      </div>
      <Section
        title="FAQ"
        description="Common questions about the foundation."
        actions={
          <Button asChild variant="ghost" size="sm">
            <Link to="/components">Component library</Link>
          </Button>
        }
      >
        <Accordion type="single" collapsible>
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={q!}>
              <AccordionTrigger className="text-sm">{q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </AppShell>
  );
}
