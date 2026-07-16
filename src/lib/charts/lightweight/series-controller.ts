import type { ChartPoint } from "@/lib/charts/contracts";
import {
  normalizeChartPoints,
  normalizeMaxPoints,
} from "@/lib/charts/normalization";

export type SeriesMutation =
  | { kind: "update"; point: ChartPoint }
  | { kind: "replace"; points: readonly ChartPoint[] };

export class BoundedSeriesController {
  readonly #maxPoints: number;
  #points: ChartPoint[] = [];

  constructor(maxPoints: number) {
    this.#maxPoints = normalizeMaxPoints(maxPoints);
  }

  get points(): readonly ChartPoint[] {
    return this.#points;
  }

  replace(points: readonly ChartPoint[]): SeriesMutation {
    this.#points = normalizeChartPoints(points, this.#maxPoints);
    return { kind: "replace", points: this.#points };
  }

  apply(point: ChartPoint): SeriesMutation | null {
    const normalized = normalizeChartPoints([point], 2)[0];

    if (!normalized) {
      return null;
    }

    const existingIndex = this.#points.findIndex(
      (candidate) => candidate.timestamp === normalized.timestamp,
    );
    const lastIndex = this.#points.length - 1;

    if (existingIndex === lastIndex) {
      this.#points[lastIndex] = normalized;
      return { kind: "update", point: normalized };
    }

    if (existingIndex >= 0) {
      this.#points[existingIndex] = normalized;
      return { kind: "replace", points: this.#points };
    }

    const last = this.#points.at(-1);
    const previousLength = this.#points.length;
    const isAppend = !last || normalized.timestamp > last.timestamp;

    this.#points = normalizeChartPoints(
      [...this.#points, normalized],
      this.#maxPoints,
    );

    if (isAppend && previousLength < this.#maxPoints) {
      return { kind: "update", point: normalized };
    }

    return { kind: "replace", points: this.#points };
  }
}
