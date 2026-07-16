"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

import { ChartFrame } from "@/components/domain/charts/chart-frame";
import {
  createDrawdownSummary,
  createDrawdownTable,
} from "@/lib/charts/accessible-summary";
import type { DrawdownEvidenceReadModel } from "@/lib/charts/contracts";
import { normalizeDrawdownPoints } from "@/lib/charts/normalization";

const AnalyticalEvidencePlot = dynamic(
  () => import("@/lib/charts/visx/analytical-evidence-plot").then(
    (module) => module.AnalyticalEvidencePlot,
  ),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="h-80 animate-pulse rounded-lg bg-muted" />,
  },
);

export interface DrawdownEvidenceChartProps {
  model: DrawdownEvidenceReadModel;
  height?: number;
  onRangeChange?: (rangeId: string) => void;
  className?: string;
}

export function DrawdownEvidenceChart({
  model,
  height = 320,
  onRangeChange,
  className,
}: DrawdownEvidenceChartProps) {
  const points = useMemo(
    () => normalizeDrawdownPoints(model.points, model.maxPoints),
    [model.maxPoints, model.points],
  );
  const summary = useMemo(
    () => createDrawdownSummary(
      points,
      model.identity,
      model.freshness,
      model.range.timeZone,
    ),
    [model.freshness, model.identity, model.range.timeZone, points],
  );
  const table = useMemo(
    () => createDrawdownTable(
      points,
      model.identity,
      model.range.timeZone,
    ),
    [model.identity, model.range.timeZone, points],
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
          id: "drawdown",
          label: "Drawdown",
          description: "Solid risk line with a shaded area",
          style: "area",
          tone: "risk",
        },
        {
          id: "evidence",
          label: "Evidence record",
          description: "Dashed vertical marker linked to a run or decision",
          style: "dashed",
          tone: "neutral",
        },
      ]}
    >
      <AnalyticalEvidencePlot
        points={points}
        unit={model.identity.unit}
        timeZone={model.range.timeZone}
        height={height}
      />
    </ChartFrame>
  );
}
