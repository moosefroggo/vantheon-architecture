"use client";

import { useId, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { AreaClosed, LinePath } from "@visx/shape";

import {
  formatChartValue,
  formatSpokenValue,
  formatTimestamp,
} from "@/lib/charts/accessible-summary";
import type { ChartUnit, DrawdownPoint } from "@/lib/charts/contracts";
import {
  nearestPointIndex,
  nextInspectionIndex,
  type InspectionKey,
} from "@/lib/charts/visx/interaction-model";

export interface AnalyticalEvidencePlotProps {
  points: readonly DrawdownPoint[];
  unit: ChartUnit;
  timeZone: string;
  width?: number;
  height?: number;
}

const margin = { top: 20, right: 24, bottom: 42, left: 68 };
const inspectionKeys = new Set<InspectionKey>([
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
]);

export function AnalyticalEvidencePlot({
  points,
  unit,
  timeZone,
  width = 760,
  height = 320,
}: AnalyticalEvidencePlotProps) {
  const descriptionId = useId();
  const [selectedTimestamp, setSelectedTimestamp] = useState<string | null>(null);
  const safeWidth = Math.max(width, 480);
  const safeHeight = Math.max(height, 240);
  const innerWidth = safeWidth - margin.left - margin.right;
  const innerHeight = safeHeight - margin.top - margin.bottom;
  const plotPoints = useMemo(() => [...points], [points]);

  const xDomain = useMemo<[number, number]>(() => {
    if (points.length === 0) {
      return [0, 1];
    }

    const first = Date.parse(points[0].timestamp);
    const last = Date.parse(points.at(-1)?.timestamp ?? points[0].timestamp);
    return first === last ? [first - 1, last + 1] : [first, last];
  }, [points]);
  const minimumValue = useMemo(
    () => Math.min(-1, ...points.flatMap((point) => point.value === null ? [] : [point.value])),
    [points],
  );
  const xScale = useMemo(
    () => scaleLinear<number>({
      domain: xDomain,
      range: [margin.left, safeWidth - margin.right],
    }),
    [safeWidth, xDomain],
  );
  const yScale = useMemo(
    () => scaleLinear<number>({
      domain: [minimumValue, 0],
      range: [safeHeight - margin.bottom, margin.top],
      nice: true,
    }),
    [minimumValue, safeHeight],
  );

  const selectedIndexFromState = selectedTimestamp
    ? points.findIndex((point) => point.timestamp === selectedTimestamp)
    : -1;
  const selectedIndex = selectedIndexFromState >= 0
    ? selectedIndexFromState
    : points.length - 1;
  const selectedPoint = selectedIndex >= 0 ? points[selectedIndex] : null;

  const inspectFromPointer = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = bounds.width === 0 ? 0 : (event.clientX - bounds.left) / bounds.width;
    const target = xScale.invert(margin.left + ratio * innerWidth);
    const index = nearestPointIndex(points, target);

    if (index >= 0) {
      setSelectedTimestamp(points[index].timestamp);
    }
  };

  const inspectFromKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!inspectionKeys.has(event.key as InspectionKey)) {
      return;
    }

    event.preventDefault();
    const index = nextInspectionIndex(
      selectedIndex,
      points.length,
      event.key as InspectionKey,
    );

    if (index >= 0) {
      setSelectedTimestamp(points[index].timestamp);
    }
  };

  return (
    <div
      role="group"
      tabIndex={0}
      aria-describedby={descriptionId}
      aria-label="Interactive drawdown evidence plot"
      className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      data-chart-engine="visx"
      data-point-count={points.length}
      onKeyDown={inspectFromKeyboard}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        className="block h-auto w-full overflow-visible"
        viewBox={`0 0 ${safeWidth} ${safeHeight}`}
      >
        <Group>
          <AreaClosed<DrawdownPoint>
            data={plotPoints}
            defined={(point) => point.value !== null}
            x={(point) => xScale(Date.parse(point.timestamp))}
            y={(point) => yScale(point.value ?? 0)}
            yScale={yScale}
            fill="rgba(225, 29, 72, 0.16)"
            stroke="transparent"
          />
          <LinePath<DrawdownPoint>
            data={plotPoints}
            defined={(point) => point.value !== null}
            x={(point) => xScale(Date.parse(point.timestamp))}
            y={(point) => yScale(point.value ?? 0)}
            stroke="#e11d48"
            strokeWidth={2}
          />
          {points.flatMap((point) =>
            point.value === null
              ? []
              : (point.evidence ?? []).map((marker) => (
                  <g key={marker.id}>
                    <line
                      x1={xScale(Date.parse(point.timestamp))}
                      x2={xScale(Date.parse(point.timestamp))}
                      y1={margin.top}
                      y2={safeHeight - margin.bottom}
                      stroke="#a16207"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={xScale(Date.parse(point.timestamp))}
                      cy={yScale(point.value ?? 0)}
                      r={4}
                      fill="#a16207"
                    />
                  </g>
                )),
          )}
          {selectedPoint?.value !== null && selectedPoint ? (
            <g>
              <line
                x1={xScale(Date.parse(selectedPoint.timestamp))}
                x2={xScale(Date.parse(selectedPoint.timestamp))}
                y1={margin.top}
                y2={safeHeight - margin.bottom}
                stroke="currentColor"
                strokeDasharray="2 3"
                opacity={0.55}
              />
              <circle
                cx={xScale(Date.parse(selectedPoint.timestamp))}
                cy={yScale(selectedPoint.value)}
                r={5}
                fill="#e11d48"
                stroke="white"
                strokeWidth={2}
              />
            </g>
          ) : null}
          <AxisLeft
            left={margin.left}
            scale={yScale}
            numTicks={5}
            tickFormat={(value) => formatChartValue(Number(value), unit)}
            stroke="#a1a1aa"
            tickStroke="#a1a1aa"
            tickLabelProps={{ fill: "currentColor", fontSize: 11, textAnchor: "end", dx: -4, dy: 3 }}
          />
          <AxisBottom
            top={safeHeight - margin.bottom}
            scale={xScale}
            numTicks={4}
            tickFormat={(value) => formatAxisDate(Number(value), timeZone)}
            stroke="#a1a1aa"
            tickStroke="#a1a1aa"
            tickLabelProps={{ fill: "currentColor", fontSize: 11, textAnchor: "middle", dy: 4 }}
          />
          <rect
            x={margin.left}
            y={margin.top}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onPointerMove={inspectFromPointer}
          />
        </Group>
      </svg>
      <p id={descriptionId} className="mt-2 text-sm text-muted-foreground">
        {selectedPoint
          ? describeSelectedPoint(selectedPoint, unit, timeZone)
          : "No observation is available. Use the accessible data table for details."}
      </p>
    </div>
  );
}

function describeSelectedPoint(
  point: DrawdownPoint,
  unit: ChartUnit,
  timeZone: string,
) {
  const value = point.value === null
    ? "missing"
    : formatSpokenValue(point.value, unit);
  const evidence = point.evidence?.map((marker) => marker.label).join("; ");
  return `${formatTimestamp(point.timestamp, timeZone)}: ${value}, ${point.quality}.${evidence ? ` Evidence: ${evidence}.` : ""} Use Left and Right Arrow, Home, or End to inspect; the table contains every bounded observation.`;
}

function formatAxisDate(timestamp: number, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone,
  }).format(timestamp);
}
