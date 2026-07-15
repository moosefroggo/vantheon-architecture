"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  LineSeries,
  LineStyle,
  createChart,
  type AreaData,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
  type UTCTimestamp,
  type WhitespaceData,
} from "lightweight-charts";

import { formatChartValue } from "@/lib/charts/accessible-summary";
import type {
  ChartPoint,
  ChartUnit,
  FinancialPointSubscription,
} from "@/lib/charts/contracts";
import { BoundedSeriesController } from "@/lib/charts/lightweight/series-controller";

export interface StreamingFinancialPlotProps {
  points: readonly ChartPoint[];
  benchmarkPoints?: readonly ChartPoint[];
  unit: ChartUnit;
  height?: number;
  maxPoints?: number;
  presentation?: "continuous" | "completed-run-observations";
  subscribe?: FinancialPointSubscription;
  instrumentationId?: string;
}

type LightweightPoint = AreaData<Time> | WhitespaceData<Time>;

export function StreamingFinancialPlot({
  points,
  benchmarkPoints = [],
  unit,
  height = 320,
  maxPoints = 500,
  presentation = "continuous",
  subscribe,
  instrumentationId,
}: StreamingFinancialPlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const benchmarkSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const controllerRef = useRef<BoundedSeriesController | null>(null);
  const hasFitContentRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = createChart(container, {
      width: Math.max(container.clientWidth, 320),
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(113, 113, 122, 0.14)" },
        horzLines: { color: "rgba(113, 113, 122, 0.14)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      localization: {
        priceFormatter: (value: number) => formatChartValue(value, unit),
      },
      rightPriceScale: { borderVisible: false },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
    });
    const showsCompletedRuns = presentation === "completed-run-observations";
    const series = chart.addSeries(AreaSeries, {
      lineColor: showsCompletedRuns ? "#52525b" : "#0f766e",
      lineWidth: showsCompletedRuns ? 1 : 2,
      lineStyle: showsCompletedRuns ? LineStyle.Dashed : LineStyle.Solid,
      topColor: showsCompletedRuns
        ? "rgba(82, 82, 91, 0.06)"
        : "rgba(13, 148, 136, 0.30)",
      bottomColor: showsCompletedRuns
        ? "rgba(82, 82, 91, 0.00)"
        : "rgba(13, 148, 136, 0.02)",
      pointMarkersVisible: showsCompletedRuns,
      pointMarkersRadius: showsCompletedRuns ? 4 : undefined,
      priceLineVisible: false,
    });
    const benchmarkSeries = chart.addSeries(LineSeries, {
      color: "#0369a1",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      pointMarkersVisible: showsCompletedRuns,
      pointMarkersRadius: showsCompletedRuns ? 3 : undefined,
      priceLineVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    benchmarkSeriesRef.current = benchmarkSeries;
    controllerRef.current = new BoundedSeriesController(maxPoints);

    const resize = () => {
      chart.applyOptions({
        width: Math.max(container.clientWidth, 320),
        height,
      });
    };
    const observer = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(resize);

    observer?.observe(container);
    window.addEventListener("resize", resize);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      chartRef.current = null;
      seriesRef.current = null;
      benchmarkSeriesRef.current = null;
      controllerRef.current = null;
      hasFitContentRef.current = false;
      chart.remove();
    };
  }, [height, maxPoints, presentation, unit]);

  useEffect(() => {
    const series = seriesRef.current;
    const benchmarkSeries = benchmarkSeriesRef.current;
    const chart = chartRef.current;
    const controller = controllerRef.current;

    if (!chart || !series || !benchmarkSeries || !controller) {
      return;
    }

    controller.replace(points);
    series.setData(toLightweightSeriesData(controller.points));
    benchmarkSeries.setData(toLightweightLineSeriesData(benchmarkPoints));

    if (!hasFitContentRef.current && controller.points.length > 0) {
      chart.timeScale().fitContent();
      hasFitContentRef.current = true;
    }

    markDraw(instrumentationId);
  }, [benchmarkPoints, instrumentationId, points]);

  useEffect(() => {
    if (!subscribe) {
      return;
    }

    const pending: ChartPoint[] = [];
    let frame = 0;

    const flush = () => {
      frame = 0;
      const series = seriesRef.current;
      const controller = controllerRef.current;

      if (!series || !controller) {
        pending.length = 0;
        return;
      }

      for (const point of pending.splice(0)) {
        const mutation = controller.apply(point);

        if (!mutation) {
          continue;
        }

        if (mutation.kind === "update") {
          series.update(toLightweightPoint(mutation.point));
        } else {
          series.setData(toLightweightSeriesData(mutation.points));
        }
      }

      markDraw(instrumentationId);
    };

    const unsubscribe = subscribe((point) => {
      pending.push(point);

      if (frame === 0) {
        frame = window.requestAnimationFrame(flush);
      }
    });

    return () => {
      unsubscribe();

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [instrumentationId, subscribe]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="w-full overflow-hidden"
      data-chart-engine="lightweight-charts"
      data-chart-presentation={presentation}
      data-point-count={Math.min(points.length, maxPoints)}
      data-benchmark-point-count={Math.min(benchmarkPoints.length, maxPoints)}
      style={{ height }}
    />
  );
}

function toLightweightLineSeriesData(points: readonly ChartPoint[]) {
  const pointsBySecond = new Map<number, LineData<Time> | WhitespaceData<Time>>();

  for (const point of points) {
    const converted = toLightweightLinePoint(point);
    pointsBySecond.set(converted.time as number, converted);
  }

  return [...pointsBySecond.values()].sort(
    (left, right) => (left.time as number) - (right.time as number),
  );
}

function toLightweightLinePoint(
  point: ChartPoint,
): LineData<Time> | WhitespaceData<Time> {
  const time = Math.floor(Date.parse(point.timestamp) / 1_000) as UTCTimestamp;
  return point.value === null ? { time } : { time, value: point.value };
}

function toLightweightSeriesData(points: readonly ChartPoint[]) {
  const pointsBySecond = new Map<number, LightweightPoint>();

  for (const point of points) {
    const converted = toLightweightPoint(point);
    pointsBySecond.set(converted.time as number, converted);
  }

  return [...pointsBySecond.values()].sort(
    (left, right) => (left.time as number) - (right.time as number),
  );
}

function toLightweightPoint(point: ChartPoint): LightweightPoint {
  const time = Math.floor(Date.parse(point.timestamp) / 1_000) as UTCTimestamp;
  return point.value === null ? { time } : { time, value: point.value };
}

function markDraw(instrumentationId?: string) {
  if (!instrumentationId || typeof performance.mark !== "function") {
    return;
  }

  performance.mark(`${instrumentationId}:draw`);
  window.requestAnimationFrame(() => {
    performance.mark(`${instrumentationId}:next-frame`);
  });
}
