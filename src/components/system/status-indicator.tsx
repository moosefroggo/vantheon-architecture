import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  active: "border-emerald-600/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
  paused: "border-amber-600/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  degraded: "border-orange-600/30 bg-orange-500/10 text-orange-800 dark:text-orange-300",
  disconnected: "border-muted-foreground/30 bg-muted text-muted-foreground",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
} as const;

type OperationalStatus = keyof typeof statusStyles;

type StatusIndicatorProps = {
  status: OperationalStatus;
  label?: string;
  className?: string;
};

export function StatusIndicator({
  status,
  label = status,
  className,
}: StatusIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", statusStyles[status], className)}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {label}
    </Badge>
  );
}
