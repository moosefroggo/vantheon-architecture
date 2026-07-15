export const DEFAULT_MAX_CHART_POINTS = 500;

export type ChartUnit =
  | {
      kind: "currency";
      currency: string;
      fractionDigits?: number;
    }
  | {
      kind: "percent";
      fractionDigits?: number;
    }
  | {
      kind: "number";
      label: string;
      fractionDigits?: number;
    };

export type ChartObservationQuality = "confirmed" | "estimated" | "missing";

export type DomainObjectKind =
  | "strategy"
  | "run"
  | "decision"
  | "order"
  | "message"
  | "deployment";

export interface DomainObjectReference {
  kind: DomainObjectKind;
  id: string;
  label?: string;
}

export interface ChartPoint {
  timestamp: string;
  value: number | null;
  quality: ChartObservationQuality;
  reference?: DomainObjectReference;
}

export interface EvidenceMarker {
  id: string;
  label: string;
  reference: DomainObjectReference;
}

export interface DrawdownPoint extends ChartPoint {
  evidence?: readonly EvidenceMarker[];
}

export interface ChartIdentity {
  id: string;
  title: string;
  metric: string;
  entity: string;
  unit: ChartUnit;
}

export interface ChartRange {
  id: string;
  label: string;
  start: string;
  end: string;
  timeZone: string;
}

export type ChartFreshnessState =
  | "current"
  | "stale"
  | "delayed"
  | "estimated"
  | "disconnected";

export interface ChartFreshness {
  state: ChartFreshnessState;
  cutoff: string;
  message?: string;
}

export type ChartLoadState = "loading" | "ready" | "empty" | "failed";

export interface ChartStatus {
  state: ChartLoadState;
  message?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  points: readonly ChartPoint[];
}

export type RunDomainObjectReference = DomainObjectReference & {
  kind: "run";
};

export type DecisionDomainObjectReference = DomainObjectReference & {
  kind: "decision";
};

export interface PortfolioEquityObservation extends ChartPoint {
  reference: RunDomainObjectReference;
  decisionReferences?: readonly DecisionDomainObjectReference[];
}

export interface PortfolioObservationCadence {
  kind: "completed-run";
  label: string;
  disclosure: string;
}

export interface PortfolioBenchmarkSeries extends ChartSeries {
  symbol: string;
  methodology: string;
}

export interface ChartReadModelBase {
  identity: ChartIdentity;
  range: ChartRange;
  availableRanges?: readonly ChartRange[];
  freshness: ChartFreshness;
  status: ChartStatus;
  maxPoints?: number;
}

export interface PortfolioEquityReadModel extends ChartReadModelBase {
  cadence: PortfolioObservationCadence;
  series: Omit<ChartSeries, "points"> & {
    points: readonly PortfolioEquityObservation[];
  };
  benchmark?: PortfolioBenchmarkSeries;
}

export interface DrawdownEvidenceReadModel extends ChartReadModelBase {
  points: readonly DrawdownPoint[];
}

export interface ChartSummary {
  headline: string;
  details: readonly string[];
}

export interface ChartTableColumn {
  id: string;
  label: string;
  align?: "start" | "end";
}

export interface ChartTableRow {
  id: string;
  values: readonly string[];
}

export interface ChartTableModel {
  caption: string;
  columns: readonly ChartTableColumn[];
  rows: readonly ChartTableRow[];
}

export type ChartLegendStyle = "solid" | "dashed" | "area" | "marker";
export type ChartLegendTone = "primary" | "benchmark" | "risk" | "neutral";

export interface ChartLegendItem {
  id: string;
  label: string;
  description: string;
  style: ChartLegendStyle;
  tone: ChartLegendTone;
}

export type FinancialPointListener = (point: ChartPoint) => void;
export type FinancialPointSubscription = (
  listener: FinancialPointListener,
) => () => void;
