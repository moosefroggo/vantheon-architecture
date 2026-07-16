import { Badge } from "@/components/ui/badge";

type Freshness = "current" | "delayed" | "stale";

type FreshnessIndicatorProps = {
  freshness: Freshness;
  asOf: Date | string | number;
};

const labels: Record<Freshness, string> = {
  current: "Current",
  delayed: "Delayed",
  stale: "Stale",
};

export function FreshnessIndicator({
  freshness,
  asOf,
}: FreshnessIndicatorProps) {
  const date = asOf instanceof Date ? asOf : new Date(asOf);
  const valid = !Number.isNaN(date.getTime());
  const asOfLabel = valid
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      }).format(date)
    : "unknown";

  return (
    <Badge variant={freshness === "current" ? "secondary" : "outline"}>
      {labels[freshness]} · as of {asOfLabel}
    </Badge>
  );
}
