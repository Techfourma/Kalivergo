import { cn } from "@/lib/utils";

export default function PageBackground({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden bg-dark-50 dark:bg-dark-950",
        className
      )}
    >
      <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-primary-500/10 blur-[120px] dark:bg-primary-500/20" />
      <div className="absolute -bottom-40 -right-40 h-[28rem] w-[28rem] rounded-full bg-accent-500/10 blur-[120px] dark:bg-accent-500/20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.08)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)]" />
    </div>
  );
}