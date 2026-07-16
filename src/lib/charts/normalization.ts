import {
  DEFAULT_MAX_CHART_POINTS,
  type ChartPoint,
  type DrawdownPoint,
} from "@/lib/charts/contracts";

export function normalizeMaxPoints(maxPoints = DEFAULT_MAX_CHART_POINTS) {
  if (!Number.isFinite(maxPoints)) {
    return DEFAULT_MAX_CHART_POINTS;
  }

  return Math.max(2, Math.floor(maxPoints));
}

export function normalizeChartPoints<TPoint extends ChartPoint>(
  points: readonly TPoint[],
  maxPoints = DEFAULT_MAX_CHART_POINTS,
): TPoint[] {
  return normalizePoints(points, maxPoints, (point, timestamp) => ({
    ...point,
    timestamp,
    value: normalizeValue(point.value),
    quality: point.value === null || !Number.isFinite(point.value)
      ? "missing"
      : point.quality,
  }));
}

export function normalizeDrawdownPoints(
  points: readonly DrawdownPoint[],
  maxPoints = DEFAULT_MAX_CHART_POINTS,
): DrawdownPoint[] {
  return normalizePoints(points, maxPoints, (point, timestamp) => ({
    ...point,
    timestamp,
    value: normalizeValue(point.value),
    quality: point.value === null || !Number.isFinite(point.value)
      ? "missing"
      : point.quality,
    evidence: point.evidence ? [...point.evidence] : undefined,
  }));
}

function normalizePoints<TPoint extends ChartPoint>(
  points: readonly TPoint[],
  maxPoints: number,
  normalizePoint: (point: TPoint, timestamp: string) => TPoint,
) {
  const pointsByTimestamp = new Map<string, TPoint>();

  for (const point of points) {
    const milliseconds = Date.parse(point.timestamp);

    if (!Number.isFinite(milliseconds)) {
      continue;
    }

    const timestamp = new Date(milliseconds).toISOString();
    pointsByTimestamp.set(timestamp, normalizePoint(point, timestamp));
  }

  return [...pointsByTimestamp.values()]
    .sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp))
    .slice(-normalizeMaxPoints(maxPoints));
}

function normalizeValue(value: number | null) {
  return value !== null && Number.isFinite(value) ? value : null;
}
