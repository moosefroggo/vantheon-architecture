import type {
  DrawdownEvidenceReadModel,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts";

export const portfolioEquityFixture: PortfolioEquityReadModel = {
  identity: {
    id: "paper-growth-equity",
    title: "Paper portfolio equity",
    metric: "Portfolio equity",
    entity: "Growth Champion · Growth Test · Strategy V5",
    unit: { kind: "currency", currency: "USD", fractionDigits: 2 },
  },
  range: {
    id: "1m",
    label: "1 month",
    start: "2026-06-15T20:00:00.000Z",
    end: "2026-07-14T20:00:00.000Z",
    timeZone: "America/Chicago",
  },
  availableRanges: [
    {
      id: "1w",
      label: "1 week",
      start: "2026-07-08T20:00:00.000Z",
      end: "2026-07-14T20:00:00.000Z",
      timeZone: "America/Chicago",
    },
    {
      id: "1m",
      label: "1 month",
      start: "2026-06-15T20:00:00.000Z",
      end: "2026-07-14T20:00:00.000Z",
      timeZone: "America/Chicago",
    },
    {
      id: "3m",
      label: "3 months",
      start: "2026-04-15T20:00:00.000Z",
      end: "2026-07-14T20:00:00.000Z",
      timeZone: "America/Chicago",
    },
  ],
  freshness: {
    state: "current",
    cutoff: "2026-07-14T20:00:00.000Z",
  },
  status: { state: "ready", message: "Paper data current" },
  maxPoints: 120,
  cadence: {
    kind: "completed-run",
    label: "Completed weekly runs",
    disclosure: "Each point is the portfolio value observed after a completed scheduled run; connecting segments do not represent intraday measurements.",
  },
  series: {
    id: "portfolio-equity",
    label: "Paper equity",
    points: [
      equityObservation("2026-06-15T20:00:00.000Z", 100_000, "run-1001", "Run 1"),
      equityObservation("2026-06-19T20:00:00.000Z", 101_400, "run-1002", "Run 2"),
      equityObservation("2026-06-24T20:00:00.000Z", 100_900, "run-1003", "Run 3"),
      equityObservation("2026-06-30T20:00:00.000Z", 103_250, "run-1004", "Run 4"),
      equityObservation("2026-07-03T20:00:00.000Z", null, "run-1005", "Run 5", "missing"),
      equityObservation("2026-07-07T20:00:00.000Z", 102_600, "run-1006", "Run 6"),
      equityObservation("2026-07-10T20:00:00.000Z", 104_150, "run-1007", "Run 7", "estimated"),
      equityObservation("2026-07-14T20:00:00.000Z", 105_200, "run-1008", "Run 8"),
    ],
  },
  benchmark: {
    id: "spy-normalized-equity",
    symbol: "SPY",
    label: "SPY",
    methodology: "SPY total return sampled at each completed-run cutoff and normalized to the portfolio launch value.",
    points: [
      benchmarkObservation("2026-06-15T20:00:00.000Z", 100_000),
      benchmarkObservation("2026-06-19T20:00:00.000Z", 100_800),
      benchmarkObservation("2026-06-24T20:00:00.000Z", 101_200),
      benchmarkObservation("2026-06-30T20:00:00.000Z", 102_000),
      benchmarkObservation("2026-07-03T20:00:00.000Z", null, "missing"),
      benchmarkObservation("2026-07-07T20:00:00.000Z", 102_700),
      benchmarkObservation("2026-07-10T20:00:00.000Z", 103_600, "estimated"),
      benchmarkObservation("2026-07-14T20:00:00.000Z", 104_100),
    ],
  },
};

function equityObservation(
  timestamp: string,
  value: number | null,
  id: string,
  label: string,
  quality: "confirmed" | "estimated" | "missing" = "confirmed",
) {
  return {
    timestamp,
    value,
    quality,
    reference: { kind: "run" as const, id, label },
  };
}

function benchmarkObservation(
  timestamp: string,
  value: number | null,
  quality: "confirmed" | "estimated" | "missing" = "confirmed",
) {
  return { timestamp, value, quality };
}

export const drawdownEvidenceFixture: DrawdownEvidenceReadModel = {
  identity: {
    id: "paper-growth-drawdown",
    title: "Drawdown and evidence",
    metric: "Drawdown",
    entity: "Growth Champion · Growth Test · Strategy V5",
    unit: { kind: "percent", fractionDigits: 2 },
  },
  range: portfolioEquityFixture.range,
  availableRanges: portfolioEquityFixture.availableRanges,
  freshness: {
    state: "current",
    cutoff: "2026-07-14T20:00:00.000Z",
  },
  status: { state: "ready", message: "Evidence current" },
  maxPoints: 120,
  points: [
    { timestamp: "2026-06-15T20:00:00.000Z", value: 0, quality: "confirmed" },
    { timestamp: "2026-06-19T20:00:00.000Z", value: 0, quality: "confirmed" },
    {
      timestamp: "2026-06-24T20:00:00.000Z",
      value: -0.49,
      quality: "confirmed",
      evidence: [
        {
          id: "decision-defensive-screen",
          label: "Defensive screen retained the position",
          reference: {
            kind: "decision",
            id: "decision-1042",
            label: "Decision 1042",
          },
        },
      ],
    },
    { timestamp: "2026-06-30T20:00:00.000Z", value: 0, quality: "confirmed" },
    { timestamp: "2026-07-03T20:00:00.000Z", value: null, quality: "missing" },
    {
      timestamp: "2026-07-07T20:00:00.000Z",
      value: -0.63,
      quality: "confirmed",
      evidence: [
        {
          id: "run-volatility-cap",
          label: "Volatility cap reduced exposure",
          reference: {
            kind: "run",
            id: "run-2088",
            label: "Paper run 2088",
          },
        },
      ],
    },
    { timestamp: "2026-07-10T20:00:00.000Z", value: 0, quality: "estimated" },
    { timestamp: "2026-07-14T20:00:00.000Z", value: 0, quality: "confirmed" },
  ],
};
