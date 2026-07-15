export type StrategyRuleFixture = {
  id: string
  group: string
  name: string
  value: string
  constraint: string
}

export type WorkspaceDraftFixture = {
  label: string
  checkpoint: string
  title: string
  state: string
  objective: string
  rules: readonly StrategyRuleFixture[]
}

export type DraftRuleChangeProposal = {
  ruleId: string
  proposedValue: string
  motivation: string
  baseCheckpoint: string
}

export type ConfirmedDraftRulePatch = DraftRuleChangeProposal & {
  checkpoint: string
  status: "server-confirmed"
  authority: "demo-authority"
}

export type EvidenceDeltaDirection = "up" | "down" | "flat"

export type EvaluationMetricFixture = {
  id: string
  label: string
  value: string
  delta: {
    direction: EvidenceDeltaDirection
    value: string
  }
}

export type EvaluationBaselineMetricFixture = {
  id: string
  label: string
  value: string
}

export type WorkspaceEvaluationBaselineFixture = {
  checkpoint: string
  label: string
  completedAt: string
  metrics: readonly EvaluationBaselineMetricFixture[]
}

export type WorkspaceDecisionFixture = {
  id: string
  symbol: string
  outcome: string
  evidence: string
  ruleIds: readonly string[]
}

export type WorkspaceEvaluationFixture = {
  id: string
  label: string
  status: "completed"
  authority: "demo-authority"
  championId: string
  checkpoint: string
  ruleSnapshot: readonly StrategyRuleFixture[]
  completedAt: string
  duration: string
  eligibility: {
    paper: "eligible" | "ineligible" | "pending"
    label: string
  }
  setup: readonly {
    label: string
    value: string
  }[]
  metrics: readonly EvaluationMetricFixture[]
  baseline: WorkspaceEvaluationBaselineFixture
  decisions: readonly WorkspaceDecisionFixture[]
}

export type WorkspaceEvaluationTemplate = Omit<
  WorkspaceEvaluationFixture,
  "id" | "label" | "status" | "authority" | "championId" | "ruleSnapshot"
>

export type WorkspaceFixture = {
  initialPaper?: boolean
  champion: {
    id: string
    name: string
    initials: string
    workspace: string
  }
  draft: WorkspaceDraftFixture
  evaluation: WorkspaceEvaluationTemplate
  paper: {
    label: string
    status: string
    strategy: string
    source: string
    portfolioValue: number
    totalReturn: number
    dailyPnl: number
    buyingPower: number
    exposure: number
    maxDrawdown: number
    positions: number
    openOrders: number
    nextRun: string
    runCadence: string
    freshness: string
    benchmark?: {
      symbol: string
      label: string
      methodology: string
      history: readonly {
        timestamp: string
        value: number | null
        quality?: "confirmed" | "estimated"
      }[]
    }
    equityHistory?: readonly {
      timestamp: string
      value: number
      quality?: "confirmed" | "estimated"
      runId: string
      decisionIds?: readonly string[]
    }[]
    runs?: readonly {
      id: string
      label: string
      status: string
      completedAt: string
      decision: string
      evaluated?: number
      orders?: number
      duration?: string
      dataCutoff?: string
      decisions?: readonly {
        id: string
        label: string
        detail?: string
      }[]
      activity?: readonly {
        id: string
        time: string
        title: string
        detail: string
      }[]
    }[]
    positionRows?: readonly {
      symbol: string
      marketValue: number
      weight: number
      dailyPnl: number
    }[]
    orderRows?: readonly {
      id: string
      symbol: string
      side: string
      quantity: number
      status: string
    }[]
  }
}

export const marketSessionFixture = {
  state: "open",
  venue: "U.S. equities",
  asOf: "Jul 15 · 12:37 PM CT",
  nextTransition: "Closes today at 3:00 PM CT",
} as const

const maraWorkspaceFixture = {
  champion: {
    id: "mara",
    name: "Mara",
    initials: "MA",
    workspace: "Lower-volatility momentum",
  },
  draft: {
    label: "Draft V1",
    checkpoint: "V1.2",
    title: "Lower-volatility momentum",
    state: "Saved",
    objective: "Participate in durable U.S. equity momentum with controlled concentration.",
    rules: [
      {
        id: "universe",
        group: "Universe",
        name: "Eligible assets",
        value: "40 liquid U.S. large-cap equities",
        constraint: "Long only · $50M minimum median daily value",
      },
      {
        id: "entry",
        group: "Selection",
        name: "Momentum rank",
        value: "Top quartile by 6-month momentum",
        constraint: "Price must remain above its 100-day average",
      },
      {
        id: "exit",
        group: "Exit",
        name: "Trend invalidation",
        value: "Exit on trend break or hard-risk breach",
        constraint: "Rules evaluated at every scheduled run",
      },
      {
        id: "allocation",
        group: "Portfolio",
        name: "Position sizing",
        value: "Equal weight · 8 positions maximum",
        constraint: "15% per asset · 10% minimum cash",
      },
      {
        id: "risk",
        group: "Risk",
        name: "Execution guardrails",
        value: "No leverage, shorts, or stale-data orders",
        constraint: "Block orders when price freshness fails",
      },
      {
        id: "schedule",
        group: "Schedule",
        name: "Decision cadence",
        value: "Friday after market close",
        constraint: "Model orders at the next session open",
      },
    ] satisfies StrategyRuleFixture[],
  } satisfies WorkspaceDraftFixture,
  evaluation: {
    checkpoint: "V1.2",
    completedAt: "Jul 14, 2026 · 3:26 PM CT",
    duration: "18s",
    eligibility: {
      paper: "eligible" as const,
      label: "Paper eligible",
    },
    setup: [
      { label: "Window", value: "Jan 2019 – Jun 2026" },
      { label: "Benchmark", value: "S&P 500 Total Return" },
      { label: "Capital", value: "$100,000 simulated" },
      { label: "Data cutoff", value: "Jun 30, 2026 · 4:00 PM ET" },
      {
        label: "Assumptions",
        value: "0.10% transaction cost · next-session open fills",
      },
    ],
    metrics: [
      {
        id: "weekly-decisions",
        label: "Weekly decisions",
        value: "390",
        delta: { direction: "flat", value: "0" },
      },
      {
        id: "rebalances",
        label: "Rebalances",
        value: "31",
        delta: { direction: "down", value: "−3" },
      },
      {
        id: "max-drawdown",
        label: "Max drawdown",
        value: "8.4%",
        delta: { direction: "down", value: "−0.7 pp" },
      },
      {
        id: "risk-rejections",
        label: "Risk rejections",
        value: "7",
        delta: { direction: "up", value: "+2" },
      },
    ] satisfies EvaluationMetricFixture[],
    baseline: {
      checkpoint: "V1.1",
      label: "Previous tested checkpoint",
      completedAt: "Jul 14, 2026 · 2:51 PM CT",
      metrics: [
        { id: "weekly-decisions", label: "Weekly decisions", value: "390" },
        { id: "rebalances", label: "Rebalances", value: "34" },
        { id: "max-drawdown", label: "Max drawdown", value: "9.1%" },
        { id: "risk-rejections", label: "Risk rejections", value: "5" },
      ] satisfies EvaluationBaselineMetricFixture[],
    },
    decisions: [
      {
        id: "decision-action",
        symbol: "MSFT",
        outcome: "Eligible",
        evidence: "Momentum rank 8 / 40 · trend passed",
        ruleIds: ["universe", "entry"],
      },
      {
        id: "decision-rejection",
        symbol: "TSM",
        outcome: "Rejected",
        evidence: "Position cap would exceed 15%",
        ruleIds: ["allocation"],
      },
    ] satisfies WorkspaceDecisionFixture[],
  } satisfies WorkspaceEvaluationTemplate,
  paper: {
    label: "Paper V1",
    status: "Running",
    strategy: "Strategy V1",
    source: "Draft V1 · checkpoint V1.2",
    portfolioValue: 100_000,
    totalReturn: 0,
    dailyPnl: 0,
    buyingPower: 100_000,
    exposure: 0,
    maxDrawdown: 0,
    positions: 0,
    openOrders: 0,
    nextRun: "Jul 17 · 4:15 PM ET",
    runCadence: "Friday after market close",
    freshness: "Current · Jul 14, 3:28 PM CT",
    benchmark: {
      symbol: "SPY",
      label: "SPY",
      methodology: "SPY total return sampled at each completed-run cutoff and normalized to the portfolio launch value.",
      history: [],
    },
  },
} as const satisfies WorkspaceFixture

const irisWorkspaceFixture = {
  initialPaper: true,
  champion: {
    id: "iris",
    name: "Iris",
    initials: "IR",
    workspace: "Quality income compounders",
  },
  draft: {
    label: "Draft V1",
    checkpoint: "V1.1",
    title: "Quality income compounders",
    state: "Saved",
    objective:
      "Build durable income from profitable U.S. companies without reaching for leverage or distressed yield.",
    rules: [
      {
        id: "universe",
        group: "Universe",
        name: "Eligible assets",
        value: "60 profitable U.S. dividend-paying companies",
        constraint: "Long only · five years of uninterrupted dividends",
      },
      {
        id: "entry",
        group: "Selection",
        name: "Quality rank",
        value: "Top third by return on invested capital",
        constraint: "Free-cash-flow payout ratio must remain below 70%",
      },
      {
        id: "exit",
        group: "Exit",
        name: "Quality invalidation",
        value: "Exit after a dividend cut or two failed quality reviews",
        constraint: "Rules evaluated at every scheduled run",
      },
      {
        id: "allocation",
        group: "Portfolio",
        name: "Position sizing",
        value: "Quality weighted · 12 positions maximum",
        constraint: "10% per asset · 8% minimum cash",
      },
      {
        id: "risk",
        group: "Risk",
        name: "Income guardrails",
        value: "No leverage, options, or uncovered currency exposure",
        constraint: "Reject candidates with unresolved accounting flags",
      },
      {
        id: "schedule",
        group: "Schedule",
        name: "Decision cadence",
        value: "First business day of each month",
        constraint: "Model orders at the following session open",
      },
    ] satisfies StrategyRuleFixture[],
  },
  evaluation: {
    checkpoint: "V1.1",
    completedAt: "Jul 14, 2026 · 3:31 PM CT",
    duration: "21s",
    eligibility: {
      paper: "eligible" as const,
      label: "Paper eligible",
    },
    setup: [
      { label: "Window", value: "Jan 2014 – Jun 2026" },
      { label: "Benchmark", value: "Russell 1000 Value Total Return" },
      { label: "Capital", value: "$100,000 simulated" },
      { label: "Data cutoff", value: "Jun 30, 2026 · 4:00 PM ET" },
      {
        label: "Assumptions",
        value: "0.08% transaction cost · next-session open fills",
      },
    ],
    metrics: [
      {
        id: "weekly-decisions",
        label: "Monthly decisions",
        value: "150",
        delta: { direction: "flat", value: "0" },
      },
      {
        id: "rebalances",
        label: "Rebalances",
        value: "22",
        delta: { direction: "down", value: "−2" },
      },
      {
        id: "max-drawdown",
        label: "Max drawdown",
        value: "10.6%",
        delta: { direction: "down", value: "−0.4 pp" },
      },
      {
        id: "risk-rejections",
        label: "Quality rejections",
        value: "11",
        delta: { direction: "up", value: "+3" },
      },
    ] satisfies EvaluationMetricFixture[],
    baseline: {
      checkpoint: "V1.0",
      label: "Previous tested checkpoint",
      completedAt: "Jul 14, 2026 · 2:44 PM CT",
      metrics: [
        { id: "weekly-decisions", label: "Monthly decisions", value: "150" },
        { id: "rebalances", label: "Rebalances", value: "24" },
        { id: "max-drawdown", label: "Max drawdown", value: "11.0%" },
        { id: "risk-rejections", label: "Quality rejections", value: "8" },
      ] satisfies EvaluationBaselineMetricFixture[],
    },
    decisions: [
      {
        id: "decision-action",
        symbol: "PG",
        outcome: "Eligible",
        evidence: "Quality rank 7 / 60 · payout coverage passed",
        ruleIds: ["universe", "entry"],
      },
      {
        id: "decision-rejection",
        symbol: "VZ",
        outcome: "Rejected",
        evidence: "Position cap would exceed 10%",
        ruleIds: ["allocation"],
      },
    ] satisfies WorkspaceDecisionFixture[],
  },
  paper: {
    label: "Paper V1",
    status: "Running",
    strategy: "Strategy V1",
    source: "Draft V1 · checkpoint V1.1",
    portfolioValue: 103_800,
    totalReturn: 0.038,
    dailyPnl: 220,
    buyingPower: 22_800,
    exposure: 0.78,
    maxDrawdown: -0.021,
    positions: 4,
    openOrders: 0,
    nextRun: "Aug 3 · 4:15 PM ET",
    runCadence: "First business day of each month",
    freshness: "Current · Jul 14, 3:31 PM CT",
    benchmark: {
      symbol: "SPY",
      label: "SPY",
      methodology: "SPY total return sampled at each completed-run cutoff and normalized to the portfolio launch value.",
      history: [
        { timestamp: "2026-06-01T20:15:00.000Z", value: 100_000 },
        { timestamp: "2026-06-08T20:15:00.000Z", value: 100_600 },
        { timestamp: "2026-06-15T20:15:00.000Z", value: 101_100 },
        { timestamp: "2026-06-22T20:15:00.000Z", value: 100_900 },
        { timestamp: "2026-06-29T20:15:00.000Z", value: 102_100 },
        { timestamp: "2026-07-06T20:15:00.000Z", value: 102_900 },
      ],
    },
    equityHistory: [
      { timestamp: "2026-06-01T20:15:00.000Z", value: 100_000, runId: "iris-run-1" },
      { timestamp: "2026-06-08T20:15:00.000Z", value: 101_200, runId: "iris-run-2" },
      { timestamp: "2026-06-15T20:15:00.000Z", value: 102_100, runId: "iris-run-3" },
      { timestamp: "2026-06-22T20:15:00.000Z", value: 101_500, runId: "iris-run-4" },
      { timestamp: "2026-06-29T20:15:00.000Z", value: 102_900, runId: "iris-run-5" },
      { timestamp: "2026-07-06T20:15:00.000Z", value: 103_800, runId: "iris-run-6" },
    ],
    runs: [
      { id: "iris-run-1", label: "Run 1", status: "Completed", completedAt: "Jun 1 · 4:15 PM ET", decision: "Opened positions", evaluated: 60, orders: 4 },
      { id: "iris-run-2", label: "Run 2", status: "Completed", completedAt: "Jun 8 · 4:15 PM ET", decision: "Held", evaluated: 60, orders: 0 },
      { id: "iris-run-3", label: "Run 3", status: "Completed", completedAt: "Jun 15 · 4:15 PM ET", decision: "Rebalanced", evaluated: 60, orders: 2 },
      { id: "iris-run-4", label: "Run 4", status: "Completed", completedAt: "Jun 22 · 4:15 PM ET", decision: "Held", evaluated: 60, orders: 0 },
      { id: "iris-run-5", label: "Run 5", status: "Completed", completedAt: "Jun 29 · 4:15 PM ET", decision: "Rebalanced", evaluated: 60, orders: 1 },
      {
        id: "iris-run-6",
        label: "Run 6",
        status: "Completed",
        completedAt: "Jul 6 · 4:15 PM ET",
        decision: "Held",
        evaluated: 60,
        orders: 0,
        duration: "8m 54s",
        dataCutoff: "Jul 6 · 4:00 PM ET",
        decisions: [
          {
            id: "iris-run-6-pg",
            label: "PG · Hold",
            detail: "Quality and payout coverage remained inside Strategy V1 limits.",
          },
          {
            id: "iris-run-6-vz",
            label: "VZ · Rejected",
            detail: "Quality rank passed, but the position cap blocked a new order.",
          },
        ],
        activity: [
          {
            id: "iris-run-6-started",
            time: "4:15:00 PM",
            title: "Run started",
            detail: "Loaded Strategy V1, current positions, buying power, and scheduled data cutoff.",
          },
          {
            id: "iris-run-6-screened",
            time: "4:17:12 PM",
            title: "Screened 60 companies",
            detail: "Applied dividend continuity, quality rank, and payout-coverage rules.",
          },
          {
            id: "iris-run-6-risk",
            time: "4:22:48 PM",
            title: "Applied portfolio constraints",
            detail: "The position cap blocked VZ; existing holdings remained within the risk envelope.",
          },
          {
            id: "iris-run-6-completed",
            time: "4:23:54 PM",
            title: "No orders created",
            detail: "The portfolio was held unchanged and the completed trace was recorded.",
          },
        ],
      },
    ],
    positionRows: [
      { symbol: "PG", marketValue: 22_000, weight: 0.212, dailyPnl: 74 },
      { symbol: "KO", marketValue: 20_500, weight: 0.197, dailyPnl: 42 },
      { symbol: "JNJ", marketValue: 19_800, weight: 0.191, dailyPnl: 61 },
      { symbol: "PEP", marketValue: 18_700, weight: 0.18, dailyPnl: 43 },
    ],
  },
} as const satisfies WorkspaceFixture

export const workspaceFixtures = [
  maraWorkspaceFixture,
  irisWorkspaceFixture,
] as const satisfies readonly WorkspaceFixture[]

/** Compatibility alias for focused single-Champion fixtures and authority tests. */
export const workspaceFixture = maraWorkspaceFixture
