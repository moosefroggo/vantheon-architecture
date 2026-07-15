import type { ChartPoint } from "@/lib/charts/contracts";

export type InspectionKey = "ArrowLeft" | "ArrowRight" | "Home" | "End";

export function nextInspectionIndex(
  currentIndex: number,
  pointCount: number,
  key: InspectionKey,
) {
  if (pointCount <= 0) {
    return -1;
  }

  const safeIndex = Math.min(Math.max(currentIndex, 0), pointCount - 1);

  switch (key) {
    case "ArrowLeft":
      return Math.max(0, safeIndex - 1);
    case "ArrowRight":
      return Math.min(pointCount - 1, safeIndex + 1);
    case "Home":
      return 0;
    case "End":
      return pointCount - 1;
  }
}

export function nearestPointIndex(
  points: readonly ChartPoint[],
  targetTimestamp: number,
) {
  if (points.length === 0 || !Number.isFinite(targetTimestamp)) {
    return -1;
  }

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  points.forEach((point, index) => {
    const timestamp = Date.parse(point.timestamp);
    const distance = Math.abs(timestamp - targetTimestamp);

    if (Number.isFinite(distance) && distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}
