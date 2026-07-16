import type {
  ChartFreshness,
  ChartIdentity,
  ChartPoint,
  ChartRange,
  ChartSeries,
  ChartSummary,
  ChartTableModel,
  ChartUnit,
  DrawdownPoint,
} from "@/lib/charts/contracts";

const locale = "en-US";

const qualityLabels = {
  confirmed: "Confirmed",
  estimated: "Estimated",
  missing: "Missing",
} as const;

const freshnessLabels = {
  current: "Current",
  stale: "Stale",
  delayed: "Delayed",
  estimated: "Includes estimated data",
  disconnected: "Disconnected",
} as const;

export function createChartAccessibleName(
  identity: ChartIdentity,
  range: ChartRange,
) {
  return `${identity.metric} for ${identity.entity}, ${range.label}, ${describeUnit(identity.unit)}`;
}

export function createPortfolioEquitySummary(
  points: readonly ChartPoint[],
  identity: ChartIdentity,
  freshness: ChartFreshness,
  timeZone: string,
  benchmark?: ChartSeries,
): ChartSummary {
  const available = points.filter(
    (point): point is ChartPoint & { value: number } => point.value !== null,
  );

  if (available.length === 0) {
    return withBenchmarkComparison({
      headline: `No portfolio equity observations are available for ${identity.entity}.`,
      details: [describeFreshness(freshness, timeZone), describeQuality(points)],
    }, points, benchmark);
  }

  if (available.length === 1) {
    const observation = available[0];

    return withBenchmarkComparison({
      headline: `One completed-run ${identity.metric.toLowerCase()} observation is available for ${identity.entity}.`,
      details: [
        `${formatSpokenValue(observation.value, identity.unit)} was observed on ${formatTimestamp(observation.timestamp, timeZone)} and links to ${describeReference(observation.reference)}.`,
        "One observation is evidence, but it is not a performance trend.",
        describeFreshness(freshness, timeZone),
        describeQuality(points),
      ],
    }, points, benchmark);
  }

  const first = available[0];
  const last = available.at(-1) ?? first;
  const high = available.reduce((current, point) =>
    point.value > current.value ? point : current,
  );
  const low = available.reduce((current, point) =>
    point.value < current.value ? point : current,
  );
  const changePercent = first.value === 0
    ? null
    : ((last.value - first.value) / Math.abs(first.value)) * 100;
  const direction = last.value > first.value
    ? "increased"
    : last.value < first.value
      ? "decreased"
      : "was unchanged";
  const change = changePercent === null
    ? "an unavailable percentage"
    : formatSpokenPercent(Math.abs(changePercent));
  const maximumDrawdown = calculateMaximumDrawdownPercent(available);

  return withBenchmarkComparison({
    headline: `${identity.metric} ${direction} by ${change}, from ${formatSpokenValue(first.value, identity.unit)} to ${formatSpokenValue(last.value, identity.unit)}.`,
    details: [
      `The high was ${formatSpokenValue(high.value, identity.unit)} and the low was ${formatSpokenValue(low.value, identity.unit)}.`,
      maximumDrawdown === null
        ? "Maximum peak-to-trough drawdown is unavailable."
        : `Maximum peak-to-trough drawdown was ${formatSpokenPercent(maximumDrawdown)}.`,
      describeFreshness(freshness, timeZone),
      describeQuality(points),
    ],
  }, points, benchmark);
}

export function createDrawdownSummary(
  points: readonly DrawdownPoint[],
  identity: ChartIdentity,
  freshness: ChartFreshness,
  timeZone: string,
): ChartSummary {
  const available = points.filter(
    (point): point is DrawdownPoint & { value: number } => point.value !== null,
  );

  if (available.length === 0) {
    return {
      headline: `No drawdown observations are available for ${identity.entity}.`,
      details: [describeFreshness(freshness, timeZone), describeQuality(points)],
    };
  }

  const maximum = available.reduce((current, point) =>
    point.value < current.value ? point : current,
  );
  const latest = available.at(-1) ?? maximum;
  const evidenceCount = points.reduce(
    (count, point) => count + (point.evidence?.length ?? 0),
    0,
  );

  return {
    headline: `Maximum drawdown was ${formatSpokenValue(maximum.value, identity.unit)} on ${formatTimestamp(maximum.timestamp, timeZone)}; the latest value is ${formatSpokenValue(latest.value, identity.unit)}.`,
    details: [
      `${evidenceCount} evidence ${evidenceCount === 1 ? "marker is" : "markers are"} linked to typed domain records.`,
      describeFreshness(freshness, timeZone),
      describeQuality(points),
    ],
  };
}

export function createPortfolioEquityTable(
  points: readonly ChartPoint[],
  identity: ChartIdentity,
  timeZone: string,
  benchmark?: ChartSeries,
): ChartTableModel {
  const benchmarkByTimestamp = new Map(
    benchmark?.points.map((point) => [point.timestamp, point]) ?? [],
  );

  return {
    caption: benchmark
      ? `${identity.metric} observations for ${identity.entity}, compared with ${benchmark.label}`
      : `${identity.metric} observations for ${identity.entity}`,
    columns: [
      { id: "timestamp", label: `Time (${timeZone})` },
      { id: "value", label: `${identity.metric} (${describeUnit(identity.unit)})`, align: "end" },
      ...(benchmark
        ? [{
            id: "benchmark",
            label: `${benchmark.label} normalized value (${describeUnit(identity.unit)})`,
            align: "end" as const,
          }]
        : []),
      { id: "quality", label: "Observation status" },
      { id: "reference", label: "Linked record" },
    ],
    rows: points.map((point) => {
      const benchmarkPoint = benchmarkByTimestamp.get(point.timestamp);
      return {
        id: point.timestamp,
        values: [
          formatTimestamp(point.timestamp, timeZone),
          point.value === null ? "Missing" : formatChartValue(point.value, identity.unit),
          ...(benchmark
            ? [
                benchmarkPoint?.value == null
                  ? "Missing"
                  : formatChartValue(benchmarkPoint.value, identity.unit),
              ]
            : []),
          qualityLabels[point.quality],
          describeReference(point.reference),
        ],
      };
    }),
  };
}

function withBenchmarkComparison(
  summary: ChartSummary,
  portfolioPoints: readonly ChartPoint[],
  benchmark?: ChartSeries,
): ChartSummary {
  if (!benchmark) return summary;

  const portfolioByTimestamp = new Map(
    portfolioPoints
      .filter((point): point is ChartPoint & { value: number } => point.value !== null)
      .map((point) => [point.timestamp, point.value]),
  );
  const common = benchmark.points.flatMap((point) => {
    const portfolioValue = portfolioByTimestamp.get(point.timestamp);
    return point.value === null || portfolioValue === undefined
      ? []
      : [{ portfolioValue, benchmarkValue: point.value }];
  });

  if (common.length < 2) {
    return {
      ...summary,
      details: [
        ...summary.details,
        `${benchmark.label} is sampled at the same completed-run cutoff; at least two common observations are required for a return comparison.`,
      ],
    };
  }

  const first = common[0];
  const last = common.at(-1) ?? first;
  const portfolioReturn = percentChange(first.portfolioValue, last.portfolioValue);
  const benchmarkReturn = percentChange(first.benchmarkValue, last.benchmarkValue);

  if (portfolioReturn === null || benchmarkReturn === null) return summary;

  const difference = portfolioReturn - benchmarkReturn;
  return {
    ...summary,
    details: [
      ...summary.details,
      `Over ${common.length} common completed-run observations, portfolio return was ${formatSpokenPercent(portfolioReturn)} and ${benchmark.label} return was ${formatSpokenPercent(benchmarkReturn)}; portfolio minus benchmark was ${formatSpokenPercent(difference)}.`,
    ],
  };
}

function percentChange(first: number, last: number) {
  return first === 0 ? null : ((last - first) / Math.abs(first)) * 100;
}

export function createDrawdownTable(
  points: readonly DrawdownPoint[],
  identity: ChartIdentity,
  timeZone: string,
): ChartTableModel {
  return {
    caption: `${identity.metric} evidence for ${identity.entity}`,
    columns: [
      { id: "timestamp", label: `Time (${timeZone})` },
      { id: "value", label: `${identity.metric} (${describeUnit(identity.unit)})`, align: "end" },
      { id: "quality", label: "Observation status" },
      { id: "evidence", label: "Evidence" },
    ],
    rows: points.map((point) => ({
      id: point.timestamp,
      values: [
        formatTimestamp(point.timestamp, timeZone),
        point.value === null ? "Missing" : formatChartValue(point.value, identity.unit),
        qualityLabels[point.quality],
        point.evidence?.map((marker) => marker.label).join("; ") || "None",
      ],
    })),
  };
}

export function describeFreshness(
  freshness: ChartFreshness,
  timeZone: string,
) {
  const prefix = freshness.message ?? freshnessLabels[freshness.state];
  return `${prefix} as of ${formatTimestamp(freshness.cutoff, timeZone)}.`;
}

export function formatChartValue(value: number, unit: ChartUnit) {
  const fractionDigits = unit.fractionDigits ?? 2;

  if (unit.kind === "currency") {
    const formatted = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: unit.currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
    return `${formatted} ${unit.currency}`;
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);

  return unit.kind === "percent" ? `${formatted}%` : `${formatted} ${unit.label}`;
}

export function formatSpokenValue(value: number, unit: ChartUnit) {
  if (unit.kind === "percent") {
    return formatSpokenPercent(value, unit.fractionDigits);
  }

  const sign = value < 0 ? "negative " : "";
  const absolute = formatChartValue(Math.abs(value), unit);
  return `${sign}${absolute}`;
}

export function formatTimestamp(timestamp: string, timeZone: string) {
  const milliseconds = Date.parse(timestamp);

  if (!Number.isFinite(milliseconds)) {
    return "Unavailable time";
  }

  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(milliseconds);
}

export function describeUnit(unit: ChartUnit) {
  if (unit.kind === "currency") {
    return unit.currency;
  }

  return unit.kind === "percent" ? "percent" : unit.label;
}

function calculateMaximumDrawdownPercent(
  points: readonly (ChartPoint & { value: number })[],
) {
  let peak: number | null = null;
  let maximumDrawdown = 0;

  for (const point of points) {
    if (peak === null || point.value > peak) {
      peak = point.value;
    }

    if (peak === 0) {
      continue;
    }

    maximumDrawdown = Math.min(
      maximumDrawdown,
      ((point.value - peak) / Math.abs(peak)) * 100,
    );
  }

  return peak === null ? null : maximumDrawdown;
}

function formatSpokenPercent(value: number, fractionDigits = 2) {
  const sign = value < 0 ? "negative " : "";
  const absolute = new Intl.NumberFormat(locale, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(value));
  return `${sign}${absolute} percent`;
}

function describeQuality(points: readonly ChartPoint[]) {
  const counts = points.reduce(
    (result, point) => ({
      ...result,
      [point.quality]: result[point.quality] + 1,
    }),
    { confirmed: 0, estimated: 0, missing: 0 },
  );

  return `${counts.confirmed} confirmed, ${counts.estimated} estimated, and ${counts.missing} missing observations.`;
}

function describeReference(reference: ChartPoint["reference"]) {
  if (!reference) {
    return "None";
  }

  return reference.label ?? `${reference.kind} ${reference.id}`;
}
