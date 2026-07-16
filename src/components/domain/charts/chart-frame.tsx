"use client";

import { useId, type ReactNode } from "react";

import {
  describeFreshness,
  formatTimestamp,
} from "@/lib/charts/accessible-summary";
import type {
  ChartFreshness,
  ChartIdentity,
  ChartLegendItem,
  ChartRange,
  ChartStatus,
  ChartSummary,
  ChartTableModel,
} from "@/lib/charts/contracts";
import { cn } from "@/lib/utils";

export interface ChartFrameProps {
  identity: ChartIdentity;
  range: ChartRange;
  availableRanges?: readonly ChartRange[];
  freshness: ChartFreshness;
  status: ChartStatus;
  summary: ChartSummary;
  table: ChartTableModel;
  legend?: readonly ChartLegendItem[];
  onRangeChange?: (rangeId: string) => void;
  children?: ReactNode;
  className?: string;
}

const statusLabels = {
  loading: "Loading",
  ready: "Ready",
  empty: "No data",
  failed: "Failed",
} as const;

const freshnessLabels = {
  current: "Current",
  stale: "Stale",
  delayed: "Delayed",
  estimated: "Estimated",
  disconnected: "Disconnected",
} as const;

const legendToneClasses = {
  primary: "border-teal-700 bg-teal-700",
  benchmark: "border-sky-700 bg-sky-700",
  risk: "border-rose-600 bg-rose-600",
  neutral: "border-zinc-500 bg-zinc-500",
} as const;

export function ChartFrame({
  identity,
  range,
  availableRanges,
  freshness,
  status,
  summary,
  table,
  legend,
  onRangeChange,
  children,
  className,
}: ChartFrameProps) {
  const reactId = useId();
  const titleId = `${identity.id}-${reactId}-title`;
  const summaryId = `${identity.id}-${reactId}-summary`;
  const statusId = `${identity.id}-${reactId}-status`;
  const tableId = `${identity.id}-${reactId}-table`;
  const freshnessText = describeFreshness(freshness, range.timeZone);
  const hasRenderableData = table.rows.length > 0;
  const showPlot = Boolean(children) && hasRenderableData && status.state !== "loading";

  return (
    <figure
      aria-labelledby={titleId}
      aria-describedby={`${summaryId} ${statusId}`}
      className={cn(
        "rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm",
        className,
      )}
      data-chart-id={identity.id}
      data-chart-state={status.state}
      data-freshness={freshness.state}
    >
      <figcaption className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {identity.metric} · {identity.entity}
          </p>
          <h2 id={titleId} className="mt-1 text-base font-semibold leading-tight">
            {identity.title}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            id={statusId}
            className={cn(
              "rounded-full border px-2 py-1 font-medium",
              status.state === "failed"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-border bg-muted text-foreground",
            )}
          >
            {status.message ?? statusLabels[status.state]}
          </span>
          <span className="rounded-full border border-border px-2 py-1 text-muted-foreground">
            {freshnessLabels[freshness.state]} ·{" "}
            <time dateTime={freshness.cutoff}>
              {formatTimestamp(freshness.cutoff, range.timeZone)}
            </time>
          </span>
        </div>
      </figcaption>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <RangeControl
          identity={identity}
          range={range}
          availableRanges={availableRanges}
          onRangeChange={onRangeChange}
        />
        {legend && legend.length > 0 ? <ChartLegend items={legend} /> : null}
      </div>

      <div id={summaryId} className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
        <p className="font-medium text-foreground">{summary.headline}</p>
        {summary.details.length > 0 ? (
          <ul className="mt-2 grid gap-1 text-muted-foreground">
            {summary.details.map((detail) => <li key={detail}>{detail}</li>)}
          </ul>
        ) : null}
        <span className="sr-only">{freshnessText}</span>
      </div>

      <div className="mt-4 min-h-48">
        {showPlot ? children : (
          <div
            className="flex min-h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground"
            data-chart-placeholder
          >
            {status.message ?? statusLabels[status.state]}
          </div>
        )}
      </div>

      <details id={tableId} className="mt-4 border-t border-border pt-3">
        <summary className="w-fit cursor-pointer rounded text-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          View accessible data table ({table.rows.length} observations)
        </summary>
        <div
          role="region"
          aria-label={`${identity.title} data table`}
          tabIndex={0}
          className="mt-3 max-h-80 overflow-auto rounded-lg border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <table className="w-full min-w-xl border-collapse text-left text-sm">
            <caption className="sr-only">{table.caption}</caption>
            <thead className="sticky top-0 bg-muted">
              <tr>
                {table.columns.map((column) => (
                  <th
                    key={column.id}
                    scope="col"
                    className={cn(
                      "border-b border-border px-3 py-2 font-medium",
                      column.align === "end" && "text-right",
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.id} className="border-b border-border/70 last:border-0">
                  {table.columns.map((column, index) => {
                    const Cell = index === 0 ? "th" : "td";
                    return (
                      <Cell
                        key={column.id}
                        {...(index === 0 ? { scope: "row" as const } : {})}
                        className={cn(
                          "whitespace-nowrap px-3 py-2 font-normal",
                          column.align === "end" && "text-right tabular-nums",
                        )}
                      >
                        {row.values[index] ?? "Unavailable"}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function RangeControl({
  identity,
  range,
  availableRanges,
  onRangeChange,
}: Pick<ChartFrameProps, "identity" | "range" | "availableRanges" | "onRangeChange">) {
  if (!availableRanges || availableRanges.length <= 1) {
    return <p className="text-sm text-muted-foreground">Range: {range.label}</p>;
  }

  return (
    <div role="group" aria-label={`Range for ${identity.title}`} className="flex gap-1 rounded-lg bg-muted p-1">
      {availableRanges.map((option) => {
        const selected = option.id === range.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onRangeChange?.(option.id)}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ChartLegend({ items }: { items: readonly ChartLegendItem[] }) {
  return (
    <ul aria-label="Chart legend" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-2.5 w-5 rounded-sm border",
              legendToneClasses[item.tone],
              item.style === "dashed" && "border-dashed bg-transparent",
              item.style === "marker" && "h-2.5 w-2.5 rounded-full",
            )}
          />
          <span>{item.label}</span>
          <span className="sr-only">, {item.description}</span>
        </li>
      ))}
    </ul>
  );
}
