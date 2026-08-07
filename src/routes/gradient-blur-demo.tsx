import { createFileRoute } from "@tanstack/react-router";
import { GradientBlur } from "@/components/ui/gradient-blur";

export const Route = createFileRoute("/gradient-blur-demo")({
  head: () => ({
    meta: [{ title: "Gradient Blur Demo · ValGrow Business OS" }],
  }),
  component: GradientBlurDemo,
});

function GradientBlurDemo() {
  return (
    <div className="relative h-screen w-full cursor-move overflow-hidden bg-background">
      <GradientBlur />
      <h4 className="pointer-events-none absolute top-2/5 left-0 w-full text-center text-6xl text-foreground">
        Gradient Blur
      </h4>
    </div>
  );
}
