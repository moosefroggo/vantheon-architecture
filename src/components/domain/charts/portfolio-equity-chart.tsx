"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

import { ChartFrame } from "@/components/domain/charts/chart-frame";
import {
  createPortfolioEquitySummary,
  createPortfolioEquityTable,
  formatChartValue,
  formatTimestamp,
} from "@/lib/charts/accessible-summary";
import type {
  DomainObjectReference,
  PortfolioEquityObservation,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts";
import { normalizeChartPoints } from "@/lib/charts/normalization";

const StreamingFinancialPlot = dynamic(
  () => import("@/lib/charts/lightweight/streaming-financial-plot").then(
    (module) => module.StreamingFinancialPlot,
  ),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="h-80 animate-pulse rounded-lg bg-muted" />,
  },
);

export interface PortfolioEquityChartProps {
  model: PortfolioEquityReadModel;
  height?: number;
  onRangeChange?: (rangeId: string) => void;
  onOpenReference: (reference: DomainObjectReference) => void;
  className?: string;
}

export function PortfolioEquityChart({
  model,
  height = 320,
  onRangeChange,
  onOpenReference,
  className,
}: PortfolioEquityChartProps) {
  const points = useMemo(
    () => normalizeChartPoints(model.series.points, model.maxPoints),
    [model.maxPoints, model.series.points],
  );
  const benchmarkPoints = useMemo(
    () => normalizeChartPoints(model.benchmark?.points ?? [], model.maxPoints),
    [model.benchmark?.points, model.maxPoints],
  );
  const summary = useMemo(
    () => createPortfolioEquitySummary(
      points,
      model.identity,
      model.freshness,
      model.range.timeZone,
      model.benchmark
        ? { ...model.benchmark, points: benchmarkPoints }
        : undefined,
    ),
    [benchmarkPoints, model.benchmark, model.freshness, model.identity, model.range.timeZone, points],
  );
  const table = useMemo(
    () => createPortfolioEquityTable(
      points,
      model.identity,
      model.range.timeZone,
      model.benchmark
        ? { ...model.benchmark, points: benchmarkPoints }
        : undefined,
    ),
    [benchmarkPoints, model.benchmark, model.identity, model.range.timeZone, points],
  );

  return (
    <ChartFrame
      identity={model.identity}
      range={model.range}
      availableRanges={model.availableRanges}
      freshness={model.freshness}
      status={model.status}
      summary={summary}
      table={table}
      onRangeChange={onRangeChange}
      className={className}
      legend={[
        {
          id: model.series.id,
          label: model.series.label,
          description: "Neutral point linked to a completed run trace",
          style: "marker",
          tone: "neutral",
        },
        ...(model.benchmark
          ? [{
              id: model.benchmark.id,
              label: model.benchmark.label,
              description: model.benchmark.methodology,
              style: "solid" as const,
              tone: "benchmark" as const,
            }]
          : []),
      ]}
    >
      <div className="space-y-3">
        <div className="border-b border-border pb-3 text-xs">
          <p className="font-medium text-foreground">{model.cadence.label}</p>
          <p className="mt-1 text-muted-foreground">{model.cadence.disclosure}</p>
        </div>
        <StreamingFinancialPlot
          points={points}
          benchmarkPoints={benchmarkPoints}
          unit={model.identity.unit}
          height={height}
          maxPoints={model.maxPoints}
          presentation="completed-run-observations"
          instrumentationId={`${model.identity.id}:lightweight`}
        />
        <PortfolioEquityObservationIndex
          observations={points}
          model={model}
          onOpenReference={onOpenReference}
        />
      </div>
    </ChartFrame>
  );
}

export function PortfolioEquityObservationIndex({
  observations,
  model,
  onOpenReference,
}: {
  observations: readonly PortfolioEquityObservation[];
  model: PortfolioEquityReadModel;
  onOpenReference: (reference: DomainObjectReference) => void;
}) {
  return (
    <nav aria-label={`${model.identity.title} run traces`} className="border-t border-border pt-3">
      <p className="text-xs font-medium text-foreground">
        Run-linked observations ({observations.length})
      </p>
      <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {observations.map((observation) => {
          const runLabel = observation.reference.label ?? `Run ${observation.reference.id}`;
          const observedAt = formatTimestamp(observation.timestamp, model.range.timeZone);
          const value = observation.value === null
            ? "Missing value"
            : formatChartValue(observation.value, model.identity.unit);

          return (
            <li key={`${observation.timestamp}-${observation.reference.id}`} className="w-44 shrink-0">
              <button
                type="button"
                onClick={() => onOpenReference(observation.reference)}
                aria-label={`Open ${runLabel} trace. ${value} observed ${observedAt}.`}
                className="group flex w-full items-start gap-2 rounded-md border border-border bg-background px-2.5 py-2 text-left text-xs outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span aria-hidden="true" className="mt-1 size-2 rounded-full bg-zinc-500" />
                <span>
                  <span className="block font-medium text-foreground">{runLabel}</span>
                  <span className="mt-0.5 block text-muted-foreground">{value}</span>
                  {observation.decisionReferences?.length ? (
                    <span className="mt-0.5 block text-muted-foreground">
                      {observation.decisionReferences.length} linked {observation.decisionReferences.length === 1 ? "decision" : "decisions"}
                    </span>
                  ) : null}
                </span>
              </button>
              {observation.decisionReferences?.length ? (
                <ul aria-label={`Decisions from ${runLabel}`} className="mt-1 space-y-1 pl-4">
                  {observation.decisionReferences.map((decision) => {
                    const decisionLabel = decision.label ?? `Decision ${decision.id}`;

                    return (
                      <li key={decision.id}>
                        <button
                          type="button"
                          onClick={() => onOpenReference(decision)}
                          className="w-full truncate rounded px-1.5 py-1 text-left text-[0.6875rem] text-muted-foreground underline-offset-2 outline-none hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {decisionLabel}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
