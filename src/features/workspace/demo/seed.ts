import {
  entityId,
  entityReference,
  isoTimestamp,
  revisionToken,
  schemaVersion,
} from "@/domain/identity";

import { hashStrategy } from "./hash";
import type {
  BenchmarkObservationRecord,
  DecisionRecord,
  DraftCheckpointRecord,
  EvaluationEventRecord,
  EvaluationRecord,
  FillRecord,
  OrderRecord,
  PortfolioAccountSnapshotRecord,
  PortfolioRunRecord,
  PositionRecord,
  SourceArtifactRecord,
  StructuredStrategy,
  WorkspaceScenario,
} from "./types";

export const WORKSPACE_DEMO_SEED_VERSION = 4;
export const WORKSPACE_DEMO_SCHEMA_VERSION = schemaVersion(
  "workspace-demo-scenario/v4"
);
const STRATEGY_SCHEMA_VERSION = schemaVersion("structured-strategy/v1");
const SEEDED_AT = isoTimestamp("2026-07-15T17:37:00.000Z");

export const WORKSPACE_DEMO_IDS = {
  scenario: entityId("workspace-scenario", "scenario_workspace_demo"),
  user: entityId("user", "user_demo_founder"),
  mara: {
    champion: entityId("champion", "champion_mara"),
    lineage: entityId("strategy-lineage", "lineage_mara"),
    draftV1: entityId("draft", "draft_mara_v1"),
    checkpointV11: entityId("draft-checkpoint", "checkpoint_mara_v1_1"),
    checkpointV12: entityId("draft-checkpoint", "checkpoint_mara_v1_2"),
    benchmark: entityId("benchmark", "benchmark_sp500_total_return"),
    evaluation: entityId("evaluation", "evaluation_mara_v1_2"),
    source: entityId("source-artifact", "source_mara_2026_06_30"),
  },
  iris: {
    champion: entityId("champion", "champion_iris"),
    lineage: entityId("strategy-lineage", "lineage_iris"),
    draftV1: entityId("draft", "draft_iris_v1"),
    draftV2: entityId("draft", "draft_iris_v2"),
    checkpointV11: entityId("draft-checkpoint", "checkpoint_iris_v1_1"),
    checkpointV20: entityId("draft-checkpoint", "checkpoint_iris_v2_0"),
    strategyV1: entityId("immutable-strategy", "strategy_iris_v1"),
    portfolio: entityId("paper-portfolio", "portfolio_iris_income"),
    deployment: entityId("deployment", "deployment_iris_income_v1"),
    schedule: entityId("schedule", "schedule_iris_monthly_v1"),
    benchmark: entityId("benchmark", "benchmark_russell_1000_value_tr"),
    evaluation: entityId("evaluation", "evaluation_iris_v1_1"),
    source: entityId("source-artifact", "source_iris_2026_01_15"),
    launchAccountSnapshot: entityId(
      "portfolio-account-snapshot",
      "account_iris_launch"
    ),
    currentAccountSnapshot: entityId(
      "portfolio-account-snapshot",
      "account_iris_2026_07"
    ),
  },
} as const;

export async function createWorkspaceDemoSeed(): Promise<WorkspaceScenario> {
  const actor = entityReference("user", WORKSPACE_DEMO_IDS.user);
  const maraV11 = createMaraStrategy(10);
  const maraV12 = createMaraStrategy(8);
  const irisV11 = createIrisStrategy();
  const [maraV11Hash, maraV12Hash, irisV11Hash] = await Promise.all([
    hashStrategy(maraV11),
    hashStrategy(maraV12),
    hashStrategy(irisV11),
  ]);

  const maraCheckpoints: DraftCheckpointRecord[] = [
    {
      id: WORKSPACE_DEMO_IDS.mara.checkpointV11,
      championId: WORKSPACE_DEMO_IDS.mara.champion,
      draftId: WORKSPACE_DEMO_IDS.mara.draftV1,
      generation: 1,
      ordinal: 1,
      label: "V1.1",
      origin: { kind: "initial" },
      strategy: maraV11,
      strategyHash: maraV11Hash,
      createdBy: actor,
      createdAt: isoTimestamp("2026-07-14T19:51:00.000Z"),
      revision: revision(1),
    },
    {
      id: WORKSPACE_DEMO_IDS.mara.checkpointV12,
      championId: WORKSPACE_DEMO_IDS.mara.champion,
      draftId: WORKSPACE_DEMO_IDS.mara.draftV1,
      generation: 1,
      ordinal: 2,
      label: "V1.2",
      previousCheckpointId: WORKSPACE_DEMO_IDS.mara.checkpointV11,
      origin: { kind: "initial" },
      strategy: maraV12,
      strategyHash: maraV12Hash,
      createdBy: actor,
      createdAt: isoTimestamp("2026-07-14T20:20:00.000Z"),
      revision: revision(1),
    },
  ];

  const irisCheckpointV11: DraftCheckpointRecord = {
    id: WORKSPACE_DEMO_IDS.iris.checkpointV11,
    championId: WORKSPACE_DEMO_IDS.iris.champion,
    draftId: WORKSPACE_DEMO_IDS.iris.draftV1,
    generation: 1,
    ordinal: 1,
    label: "V1.1",
    origin: { kind: "initial" },
    strategy: irisV11,
    strategyHash: irisV11Hash,
    createdBy: actor,
    createdAt: isoTimestamp("2026-01-15T21:35:00.000Z"),
    revision: revision(1),
  };
  const sourceArtifacts = [
    {
      id: WORKSPACE_DEMO_IDS.mara.source,
      provider: "Demo consolidated market data",
      dataset: "U.S. large-cap total-return history",
      asOf: isoTimestamp("2026-06-30T20:00:00.000Z"),
      immutableLocator: "demo://market-data/mara/2026-06-30",
      revision: revision(1),
    },
    {
      id: WORKSPACE_DEMO_IDS.iris.source,
      provider: "Demo consolidated market data",
      dataset: "U.S. quality and dividend history",
      asOf: isoTimestamp("2026-01-15T21:00:00.000Z"),
      immutableLocator: "demo://market-data/iris/2026-01-15",
      revision: revision(1),
    },
  ] satisfies SourceArtifactRecord[];

  const { evaluations, events, decisions } = createSeedEvaluations({
    maraStrategy: maraV12,
    maraHash: maraV12Hash,
    irisStrategy: irisV11,
    irisHash: irisV11Hash,
  });
  const paperEvidence = createIrisMonthlyEvidence();

  return {
    id: WORKSPACE_DEMO_IDS.scenario,
    schemaVersion: WORKSPACE_DEMO_SCHEMA_VERSION,
    seedVersion: WORKSPACE_DEMO_SEED_VERSION,
    revision: revision(1),
    seededAt: SEEDED_AT,
    clock: SEEDED_AT,
    users: table([
      {
        id: WORKSPACE_DEMO_IDS.user,
        displayName: "Demo founder",
        revision: revision(1),
      },
    ]),
    champions: table([
      {
        id: WORKSPACE_DEMO_IDS.mara.champion,
        displayName: "Mara",
        initials: "MA",
        workspaceTitle: "Lower-volatility momentum",
        lineageId: WORKSPACE_DEMO_IDS.mara.lineage,
        currentDraftId: WORKSPACE_DEMO_IDS.mara.draftV1,
        revision: revision(1),
      },
      {
        id: WORKSPACE_DEMO_IDS.iris.champion,
        displayName: "Iris",
        initials: "IR",
        workspaceTitle: "Quality income compounders",
        lineageId: WORKSPACE_DEMO_IDS.iris.lineage,
        currentDraftId: WORKSPACE_DEMO_IDS.iris.draftV1,
        revision: revision(1),
      },
    ]),
    drafts: table([
      {
        id: WORKSPACE_DEMO_IDS.mara.draftV1,
        championId: WORKSPACE_DEMO_IDS.mara.champion,
        lineageId: WORKSPACE_DEMO_IDS.mara.lineage,
        generation: 1,
        status: "active",
        currentCheckpointId: WORKSPACE_DEMO_IDS.mara.checkpointV12,
        revision: revision(1),
        createdAt: isoTimestamp("2026-07-14T19:30:00.000Z"),
      },
      {
        id: WORKSPACE_DEMO_IDS.iris.draftV1,
        championId: WORKSPACE_DEMO_IDS.iris.champion,
        lineageId: WORKSPACE_DEMO_IDS.iris.lineage,
        generation: 1,
        status: "launched",
        currentCheckpointId: WORKSPACE_DEMO_IDS.iris.checkpointV11,
        revision: revision(2),
        createdAt: isoTimestamp("2026-01-10T15:00:00.000Z"),
      },
    ]),
    checkpoints: table([
      ...maraCheckpoints,
      irisCheckpointV11,
    ]),
    strategies: table([
      {
        id: WORKSPACE_DEMO_IDS.iris.strategyV1,
        championId: WORKSPACE_DEMO_IDS.iris.champion,
        lineageId: WORKSPACE_DEMO_IDS.iris.lineage,
        version: 1,
        label: "Strategy V1",
        sourceCheckpointId: WORKSPACE_DEMO_IDS.iris.checkpointV11,
        strategy: structuredClone(irisV11),
        strategyHash: irisV11Hash,
        createdAt: isoTimestamp("2026-01-16T14:00:00.000Z"),
        revision: revision(1),
      },
    ]),
    changeSets: {},
    evaluations: table(evaluations),
    evaluationEvents: table(events),
    sourceArtifacts: table(sourceArtifacts),
    decisions: table([...decisions, ...paperEvidence.decisions]),
    orders: table(paperEvidence.orders),
    fills: table(paperEvidence.fills),
    portfolios: table([
      {
        id: WORKSPACE_DEMO_IDS.iris.portfolio,
        championId: WORKSPACE_DEMO_IDS.iris.champion,
        displayName: "Quality income compounders · Paper 1",
        strategyId: WORKSPACE_DEMO_IDS.iris.strategyV1,
        sourceCheckpointId: WORKSPACE_DEMO_IDS.iris.checkpointV11,
        deploymentId: WORKSPACE_DEMO_IDS.iris.deployment,
        scheduleId: WORKSPACE_DEMO_IDS.iris.schedule,
        benchmarkId: WORKSPACE_DEMO_IDS.iris.benchmark,
        currentAccountSnapshotId:
          WORKSPACE_DEMO_IDS.iris.currentAccountSnapshot,
        state: "active",
        simulatedCapital: 100_000,
        launchedAt: isoTimestamp("2026-01-16T14:00:00.000Z"),
        revision: revision(1),
      },
    ]),
    accountSnapshots: table(paperEvidence.accountSnapshots),
    positions: table(paperEvidence.positions),
    deployments: table([
      {
        id: WORKSPACE_DEMO_IDS.iris.deployment,
        portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
        strategyId: WORKSPACE_DEMO_IDS.iris.strategyV1,
        scheduleId: WORKSPACE_DEMO_IDS.iris.schedule,
        state: "active",
        startedAt: isoTimestamp("2026-01-16T14:00:00.000Z"),
        revision: revision(1),
      },
    ]),
    schedules: table([
      {
        id: WORKSPACE_DEMO_IDS.iris.schedule,
        portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
        definition: structuredClone(irisV11.schedule),
        effectiveFrom: isoTimestamp("2026-01-16T14:00:00.000Z"),
        nextRunAt: isoTimestamp("2026-08-03T20:15:00.000Z"),
        revision: revision(1),
      },
    ]),
    benchmarks: table([
      {
        id: WORKSPACE_DEMO_IDS.mara.benchmark,
        symbol: "SP500TR",
        displayName: "S&P 500 Total Return",
        methodology:
          "Total-return index sampled at each completed evaluation cutoff.",
        revision: revision(1),
      },
      {
        id: WORKSPACE_DEMO_IDS.iris.benchmark,
        symbol: "R1000VTR",
        displayName: "Russell 1000 Value Total Return",
        methodology:
          "Russell 1000 Value total return sampled at every completed monthly run.",
        revision: revision(1),
      },
    ]),
    benchmarkObservations: table(paperEvidence.observations),
    runs: table(paperEvidence.runs),
    atlasExchanges: {},
    receipts: {},
  };
}

function createMaraStrategy(maximumPositions: number): StructuredStrategy {
  return createStrategy({
    title: "Lower-volatility momentum",
    objective:
      "Participate in durable U.S. equity momentum with controlled concentration.",
    schedule: {
      cadence: "weekly",
      weekday: 5,
      timezone: "America/New_York",
      localTime: "16:15",
      holidayPolicy: "next-business-day",
    },
    definitions: [
      [
        "universe",
        "Eligible assets",
        "40 liquid U.S. large-cap equities",
        "Long only · $50M minimum median daily value",
      ],
      [
        "selection",
        "Momentum rank",
        "Top quartile by 6-month momentum",
        "Price must remain above its 100-day average",
      ],
      [
        "exit",
        "Trend invalidation",
        "Exit on trend break or hard-risk breach",
        "Rules evaluated at every scheduled run",
      ],
      [
        "portfolio",
        "Position sizing",
        `Equal weight · ${maximumPositions} positions maximum`,
        "15% per asset · 10% minimum cash",
      ],
      [
        "risk",
        "Execution guardrails",
        "No leverage, shorts, or stale-data orders",
        "Block orders when price freshness fails",
      ],
      [
        "schedule",
        "Decision cadence",
        "Friday after market close",
        "Model orders at the next session open",
      ],
    ],
  });
}

function createIrisStrategy(): StructuredStrategy {
  return createStrategy({
    title: "Quality income compounders",
    objective:
      "Build durable income from profitable U.S. companies without reaching for leverage or distressed yield.",
    schedule: {
      cadence: "monthly-first-business-day",
      timezone: "America/New_York",
      localTime: "16:15",
      holidayPolicy: "next-business-day",
    },
    definitions: [
      [
        "universe",
        "Eligible assets",
        "60 profitable U.S. dividend-paying companies",
        "Long only · five years of uninterrupted dividends",
      ],
      [
        "selection",
        "Quality rank",
        "Top third by return on invested capital",
        "Free-cash-flow payout ratio must remain below 70%",
      ],
      [
        "exit",
        "Quality invalidation",
        "Exit after a dividend cut or two failed quality reviews",
        "Rules evaluated at every scheduled run",
      ],
      [
        "portfolio",
        "Position sizing",
        "Quality weighted · 12 positions maximum",
        "10% per asset · 8% minimum cash",
      ],
      [
        "risk",
        "Income guardrails",
        "No leverage, options, or uncovered currency exposure",
        "Reject candidates with unresolved accounting flags",
      ],
      [
        "schedule",
        "Decision cadence",
        "First business day of each month",
        "Model orders at the following session open",
      ],
    ],
  });
}

function createStrategy({
  title,
  objective,
  schedule,
  definitions,
}: {
  title: string;
  objective: string;
  schedule: StructuredStrategy["schedule"];
  definitions: Array<
    readonly [
      "universe" | "selection" | "exit" | "portfolio" | "risk" | "schedule",
      string,
      string,
      string,
    ]
  >;
}): StructuredStrategy {
  return {
    schemaVersion: STRATEGY_SCHEMA_VERSION,
    title,
    objective,
    sections: definitions.map(([kind, label, value, constraint]) => ({
      id: `section-${kind}`,
      kind,
      title: kind[0].toUpperCase() + kind.slice(1),
      rules: [
        {
          id: entityId("strategy-rule", `rule_${kind}`),
          semanticKey: kind,
          label,
          value,
          constraint,
          dataRequirementIds:
            kind === "schedule" ? [] : [`capability_${kind}`],
        },
      ],
    })),
    assumptions: ["Long-only U.S. equities", "No real capital is connected"],
    exclusions: ["Leverage", "Short selling"],
    schedule,
  };
}

function createSeedEvaluations({
  maraStrategy,
  maraHash,
  irisStrategy,
  irisHash,
}: {
  maraStrategy: StructuredStrategy;
  maraHash: Awaited<ReturnType<typeof hashStrategy>>;
  irisStrategy: StructuredStrategy;
  irisHash: Awaited<ReturnType<typeof hashStrategy>>;
}) {
  const maraDecisionIds = [
    entityId("decision", "decision_mara_msft"),
    entityId("decision", "decision_mara_tsm"),
  ];
  const irisDecisionIds = [
    entityId("decision", "decision_iris_pg"),
    entityId("decision", "decision_iris_vz"),
  ];
  const maraEventIds = [
    entityId("evaluation-event", "event_mara_preflight"),
    entityId("evaluation-event", "event_mara_complete"),
  ];
  const irisEventIds = [
    entityId("evaluation-event", "event_iris_preflight"),
    entityId("evaluation-event", "event_iris_complete"),
  ];
  const maraCompleted = isoTimestamp("2026-07-14T20:26:18.000Z");
  const irisCompleted = isoTimestamp("2026-01-15T21:31:21.000Z");

  const evaluations: EvaluationRecord[] = [
    {
      id: WORKSPACE_DEMO_IDS.mara.evaluation,
      championId: WORKSPACE_DEMO_IDS.mara.champion,
      draftId: WORKSPACE_DEMO_IDS.mara.draftV1,
      checkpointId: WORKSPACE_DEMO_IDS.mara.checkpointV12,
      strategyHash: maraHash,
      setup: {
        window: { start: "2019-01-01", end: "2026-06-30" },
        benchmarkId: WORKSPACE_DEMO_IDS.mara.benchmark,
        startingCapital: 100_000,
        transactionCostBps: 10,
        fillModel: "next-session-open",
        dataCutoff: isoTimestamp("2026-06-30T20:00:00.000Z"),
        timezone: "America/New_York",
        source: {
          provider: "Demo consolidated market data",
          dataset: "U.S. large-cap total-return history",
        },
      },
      status: "completed",
      ruleEvaluations: ruleResults(maraStrategy, WORKSPACE_DEMO_IDS.mara.source),
      decisionIds: maraDecisionIds,
      orderIds: [],
      eventIds: maraEventIds,
      sourceArtifactIds: [WORKSPACE_DEMO_IDS.mara.source],
      summary: {
        decisions: 2,
        proposedOrders: 0,
        submittedOrders: 0,
        nearMisses: 1,
      },
      startedAt: isoTimestamp("2026-07-14T20:26:00.000Z"),
      completedAt: maraCompleted,
      revision: revision(1),
    },
    {
      id: WORKSPACE_DEMO_IDS.iris.evaluation,
      championId: WORKSPACE_DEMO_IDS.iris.champion,
      draftId: WORKSPACE_DEMO_IDS.iris.draftV1,
      checkpointId: WORKSPACE_DEMO_IDS.iris.checkpointV11,
      strategyHash: irisHash,
      setup: {
        window: { start: "2014-01-01", end: "2025-12-31" },
        benchmarkId: WORKSPACE_DEMO_IDS.iris.benchmark,
        startingCapital: 100_000,
        transactionCostBps: 8,
        fillModel: "next-session-open",
        dataCutoff: isoTimestamp("2026-01-15T21:00:00.000Z"),
        timezone: "America/New_York",
        source: {
          provider: "Demo consolidated market data",
          dataset: "U.S. quality and dividend history",
        },
      },
      status: "completed",
      ruleEvaluations: ruleResults(irisStrategy, WORKSPACE_DEMO_IDS.iris.source),
      decisionIds: irisDecisionIds,
      orderIds: [],
      eventIds: irisEventIds,
      sourceArtifactIds: [WORKSPACE_DEMO_IDS.iris.source],
      summary: {
        decisions: 2,
        proposedOrders: 0,
        submittedOrders: 0,
        nearMisses: 1,
      },
      startedAt: isoTimestamp("2026-01-15T21:31:00.000Z"),
      completedAt: irisCompleted,
      revision: revision(1),
    },
  ];

  const events: EvaluationEventRecord[] = [
    ...eventPair(
      WORKSPACE_DEMO_IDS.mara.evaluation,
      maraEventIds,
      isoTimestamp("2026-07-14T20:26:00.000Z"),
      maraCompleted
    ),
    ...eventPair(
      WORKSPACE_DEMO_IDS.iris.evaluation,
      irisEventIds,
      isoTimestamp("2026-01-15T21:31:00.000Z"),
      irisCompleted
    ),
  ];

  const decisions: DecisionRecord[] = [
    {
      id: maraDecisionIds[0],
      evaluationId: WORKSPACE_DEMO_IDS.mara.evaluation,
      symbol: "MSFT",
      outcome: "eligible",
      evidence: "Momentum and trend rules passed; no order was submitted.",
      ruleIds: [entityId("strategy-rule", "rule_universe"), entityId("strategy-rule", "rule_selection")],
      createdAt: maraCompleted,
      revision: revision(1),
    },
    {
      id: maraDecisionIds[1],
      evaluationId: WORKSPACE_DEMO_IDS.mara.evaluation,
      symbol: "TSM",
      outcome: "rejected",
      evidence: "Position-cap constraint rejected the candidate.",
      ruleIds: [entityId("strategy-rule", "rule_portfolio")],
      createdAt: maraCompleted,
      revision: revision(1),
    },
    {
      id: irisDecisionIds[0],
      evaluationId: WORKSPACE_DEMO_IDS.iris.evaluation,
      symbol: "PG",
      outcome: "eligible",
      evidence: "Quality and payout-coverage rules passed; no order was submitted.",
      ruleIds: [entityId("strategy-rule", "rule_universe"), entityId("strategy-rule", "rule_selection")],
      createdAt: irisCompleted,
      revision: revision(1),
    },
    {
      id: irisDecisionIds[1],
      evaluationId: WORKSPACE_DEMO_IDS.iris.evaluation,
      symbol: "VZ",
      outcome: "rejected",
      evidence: "Position-cap constraint rejected the candidate.",
      ruleIds: [entityId("strategy-rule", "rule_portfolio")],
      createdAt: irisCompleted,
      revision: revision(1),
    },
  ];

  return { evaluations, events, decisions };
}

function ruleResults(
  strategy: StructuredStrategy,
  sourceArtifactId: SourceArtifactRecord["id"]
) {
  return strategy.sections.flatMap((section) =>
    section.rules.map((rule) => ({
      ruleId: rule.id,
      status: "passed" as const,
      observedValue: "Evaluated against the bounded demo window",
      sourceArtifactId,
    }))
  );
}

function eventPair(
  evaluationId: EvaluationRecord["id"],
  ids: EvaluationEventRecord["id"][],
  startedAt: EvaluationEventRecord["occurredAt"],
  completedAt: EvaluationEventRecord["occurredAt"]
): EvaluationEventRecord[] {
  return [
    {
      id: ids[0],
      evaluationId,
      sequence: 1,
      phase: "preflight",
      status: "completed",
      message: "Validated the exact checkpoint, strategy hash, and data cutoff.",
      occurredAt: startedAt,
      revision: revision(1),
    },
    {
      id: ids[1],
      evaluationId,
      sequence: 2,
      phase: "complete",
      status: "completed",
      message: "Recorded decisions separately from orders.",
      occurredAt: completedAt,
      revision: revision(1),
    },
  ];
}

function createIrisMonthlyEvidence() {
  const occurrences = [
    ["2026-02-02T21:15:00.000Z", "2026-02-02T21:24:00.000Z", 20_000, 80_000, 0, 0, 0, 100_000],
    ["2026-03-02T21:15:00.000Z", "2026-03-02T21:24:00.000Z", 20_100, 80_800, 100, 800, 900, 100_500],
    ["2026-04-01T20:15:00.000Z", "2026-04-01T20:24:00.000Z", 20_500, 81_300, 500, 1_300, 900, 101_100],
    ["2026-05-01T20:15:00.000Z", "2026-05-01T20:24:00.000Z", 21_000, 80_400, 1_000, 400, -400, 100_900],
    ["2026-06-01T20:15:00.000Z", "2026-06-01T20:24:00.000Z", 22_000, 80_700, 2_000, 700, 1_300, 102_100],
    ["2026-07-01T20:15:00.000Z", "2026-07-01T20:24:00.000Z", 22_800, 81_000, 2_800, 1_000, 1_100, 102_900],
  ] as const;
  const runs: PortfolioRunRecord[] = [];
  const observations: BenchmarkObservationRecord[] = [];
  const accountSnapshots: PortfolioAccountSnapshotRecord[] = [
    {
      id: WORKSPACE_DEMO_IDS.iris.launchAccountSnapshot,
      portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
      asOf: isoTimestamp("2026-01-16T14:00:00.000Z"),
      currency: "USD",
      cash: 100_000,
      reservedCash: 0,
      buyingPower: 100_000,
      positionsMarketValue: 0,
      grossExposureValue: 0,
      netExposureValue: 0,
      accountValue: 100_000,
      netContributions: 100_000,
      realizedPnl: 0,
      unrealizedPnl: 0,
      income: 0,
      fees: 0,
      dailyPnlExFlows: 0,
      cumulativeTimeWeightedReturn: 0,
      revision: revision(1),
    },
  ];
  const runIds = occurrences.map((_, index) =>
    entityId(
      "portfolio-run",
      `run_iris_2026_${String(index + 2).padStart(2, "0")}`
    )
  );
  const snapshotIds = occurrences.map((_, index) =>
    index === occurrences.length - 1
      ? WORKSPACE_DEMO_IDS.iris.currentAccountSnapshot
      : entityId(
          "portfolio-account-snapshot",
          `account_iris_2026_${String(index + 2).padStart(2, "0")}`
        )
  );
  const symbols = ["PG", "KO", "JNJ", "PEP"] as const;
  const quantities = [100, 250, 100, 200] as const;
  const fillPrices = [180, 75, 190, 121.25] as const;
  const decisionIds = symbols.map((symbol) =>
    entityId("decision", `decision_iris_run1_${symbol.toLowerCase()}`)
  );
  const orderIds = symbols.map((symbol) =>
    entityId("order", `order_iris_run1_${symbol.toLowerCase()}`)
  );
  const fillIds = symbols.map((symbol) =>
    entityId("fill", `fill_iris_run1_${symbol.toLowerCase()}`)
  );

  occurrences.forEach(
    (
      [
        scheduledFor,
        completedAt,
        cash,
        positionsMarketValue,
        income,
        unrealizedPnl,
        dailyPnlExFlows,
        benchmarkValue,
      ],
      index
    ) => {
      const sequence = index + 1;
      const runId = runIds[index];
      const observationId = entityId(
        "benchmark-observation",
        `benchmark_observation_iris_${sequence}`
      );
      const accountSnapshotId = snapshotIds[index];
      const accountValue = cash + positionsMarketValue;
      accountSnapshots.push({
        id: accountSnapshotId,
        portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
        asOf: isoTimestamp(completedAt),
        currency: "USD",
        cash,
        reservedCash: 0,
        buyingPower: cash,
        positionsMarketValue,
        grossExposureValue: positionsMarketValue,
        netExposureValue: positionsMarketValue,
        accountValue,
        netContributions: 100_000,
        realizedPnl: 0,
        unrealizedPnl,
        income,
        fees: 0,
        dailyPnlExFlows,
        cumulativeTimeWeightedReturn: (accountValue - 100_000) / 100_000,
        sourceRunId: runId,
        revision: revision(1),
      });
      runs.push({
        id: runId,
        portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
        deploymentId: WORKSPACE_DEMO_IDS.iris.deployment,
        strategyId: WORKSPACE_DEMO_IDS.iris.strategyV1,
        scheduleId: WORKSPACE_DEMO_IDS.iris.schedule,
        benchmarkId: WORKSPACE_DEMO_IDS.iris.benchmark,
        benchmarkObservationId: observationId,
        sequence,
        scheduledFor: isoTimestamp(scheduledFor),
        startedAt: isoTimestamp(scheduledFor),
        completedAt: isoTimestamp(completedAt),
        dataCutoff: isoTimestamp(scheduledFor.replace("15:00", "00:00")),
        status: "completed",
        evaluatedUniverseCount: 60,
        beforeAccountSnapshotId:
          index === 0
            ? WORKSPACE_DEMO_IDS.iris.launchAccountSnapshot
            : snapshotIds[index - 1],
        afterAccountSnapshotId: accountSnapshotId,
        decisionIds: index === 0 ? decisionIds : [],
        orderIds: index === 0 ? orderIds : [],
        revision: revision(1),
      });
      observations.push({
        id: observationId,
        benchmarkId: WORKSPACE_DEMO_IDS.iris.benchmark,
        runId,
        observedAt: isoTimestamp(completedAt),
        normalizedValue: benchmarkValue,
        revision: revision(1),
      });
    }
  );

  const decisions: DecisionRecord[] = symbols.map((symbol, index) => ({
    id: decisionIds[index],
    runId: runIds[0],
    symbol,
    outcome: "eligible",
    evidence: "Opening allocation satisfied the frozen Strategy V1 rules.",
    ruleIds: [entityId("strategy-rule", "rule_selection")],
    createdAt: isoTimestamp("2026-02-02T21:18:00.000Z"),
    revision: revision(1),
  }));
  const orders: OrderRecord[] = symbols.map((symbol, index) => ({
    id: orderIds[index],
    portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
    provenance: {
      kind: "portfolio-run",
      runId: runIds[0],
      decisionId: decisionIds[index],
    },
    symbol,
    side: "buy",
    orderType: "market",
    timeInForce: "day",
    requestedQuantity: quantities[index],
    filledQuantity: quantities[index],
    requestedPrice: fillPrices[index],
    averageFillPrice: fillPrices[index],
    status: "filled",
    createdAt: isoTimestamp("2026-02-02T21:18:00.000Z"),
    submittedAt: isoTimestamp("2026-02-02T21:18:02.000Z"),
    filledAt: isoTimestamp("2026-02-02T21:18:05.000Z"),
    lastUpdatedAt: isoTimestamp("2026-02-02T21:18:05.000Z"),
    revision: revision(1),
  }));
  const fills: FillRecord[] = symbols.map((_, index) => ({
    id: fillIds[index],
    orderId: orderIds[index],
    portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
    runId: runIds[0],
    quantity: quantities[index],
    price: fillPrices[index],
    fees: 0,
    executedAt: isoTimestamp("2026-02-02T21:18:05.000Z"),
    revision: revision(1),
  }));
  const currentAccountSnapshotId =
    WORKSPACE_DEMO_IDS.iris.currentAccountSnapshot;
  const positions: PositionRecord[] = [
    ["PG", "Procter & Gamble", 100, 180, 220, 74],
    ["KO", "Coca-Cola", 250, 75, 82, 42],
    ["JNJ", "Johnson & Johnson", 100, 190, 198, 61],
    ["PEP", "PepsiCo", 200, 121.25, 93.5, 43],
  ].map(([symbol, displayName, quantity, averageCost, markPrice, dailyPnl]) => {
    const numericQuantity = Number(quantity);
    const numericAverageCost = Number(averageCost);
    const numericMarkPrice = Number(markPrice);
    const marketValue = numericQuantity * numericMarkPrice;
    return {
      id: entityId("position", `position_iris_${String(symbol).toLowerCase()}`),
      portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
      accountSnapshotId: currentAccountSnapshotId,
      instrumentKey: `US:${symbol}`,
      symbol: String(symbol),
      displayName: String(displayName),
      quantity: numericQuantity,
      averageCost: numericAverageCost,
      markPrice: numericMarkPrice,
      marketValue,
      realizedPnl: 0,
      unrealizedPnl:
        marketValue - numericQuantity * numericAverageCost,
      weight: marketValue / 103_800,
      dailyPnl: Number(dailyPnl),
      availableToClose: numericQuantity,
      revision: revision(1),
    };
  });

  return {
    runs,
    observations,
    accountSnapshots,
    positions,
    decisions,
    orders,
    fills,
  };
}

function table<TRecord extends { id: string }>(records: TRecord[]) {
  return Object.fromEntries(records.map((record) => [record.id, record])) as Record<
    string,
    TRecord
  >;
}

function revision(value: number) {
  return revisionToken(`rev_${String(value).padStart(6, "0")}`);
}
