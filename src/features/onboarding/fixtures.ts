export type WorkspaceContext = "draft" | "paper" | "live"

export type WorkspaceContextFixture = {
  id: WorkspaceContext
  label: string
  stateLabel: string
  detail: string
}

export type StrategySectionFixture = {
  id: string
  label: string
  value: string
  explanation: string
}

export type ChampionActivityFixture = {
  id: string
  title: string
  detail: string
  status: "complete" | "active" | "pending"
  objectLabel: string
}

export const onboardingFixture = {
  champion: {
    name: "Mara",
    initials: "MA",
    specialty: "Systematic strategy Champion",
    availability: "available" as const,
    currentActivity: "Drafting V1 is ready for a Dry Run",
  },
  contexts: [
    {
      id: "draft",
      label: "Drafting V1",
      stateLabel: "Developing",
      detail: "Checkpoint 2",
    },
    {
      id: "paper",
      label: "Paper",
      stateLabel: "Not started",
      detail: "Simulated portfolio",
    },
    {
      id: "live",
      label: "Live",
      stateLabel: "Not configured",
      detail: "Real capital",
    },
  ] satisfies WorkspaceContextFixture[],
  draft: {
    label: "Drafting V1",
    checkpointLabel: "Checkpoint 2",
    validationLabel: "Coherent draft",
    intent:
      "Build a lower-volatility U.S. equity strategy that favors durable momentum, limits concentration, and does not trade more than once a week.",
    rationale:
      "The Draft favors repeatable weekly decisions and explicit risk limits so the first evidence is easier to interpret.",
    sections: [
      {
        id: "objective",
        label: "Objective",
        value: "Seek steadier equity participation with lower concentration",
        explanation:
          "Prefer durable six-month momentum while avoiding the most volatile names.",
      },
      {
        id: "universe",
        label: "Universe",
        value: "40 liquid U.S. large-cap equities",
        explanation:
          "Long-only; minimum 60-day median daily value traded of $50M.",
      },
      {
        id: "entry",
        label: "Entry behavior",
        value: "Top momentum candidates with a positive trend",
        explanation:
          "A candidate must rank in the top quartile and close above its 100-day average.",
      },
      {
        id: "exit",
        label: "Exit behavior",
        value: "Leave on trend break or risk-limit breach",
        explanation:
          "Positions are reviewed weekly; exits may occur sooner when a hard constraint fails.",
      },
      {
        id: "sizing",
        label: "Sizing & exposure",
        value: "Equal weight, 8 positions maximum",
        explanation:
          "No position above 15%; keep at least 10% in simulated cash.",
      },
      {
        id: "schedule",
        label: "Schedule",
        value: "Evaluate Fridays after market close",
        explanation:
          "Orders are modeled at the next session open with disclosed costs.",
      },
    ] satisfies StrategySectionFixture[],
    assumptions: [
      "Daily adjusted prices through June 30, 2026",
      "0.10% modeled cost per transaction",
      "$100,000 simulated starting capital",
      "No shorting, leverage, or fractional shares",
    ],
    exclusions: [
      "No trading during missing or stale price data",
      "No claim that historical behavior predicts future results",
    ],
  },
  evaluation: {
    label: "Dry Run",
    window: "January 2, 2019 – June 30, 2026",
    universe: "40-stock liquid large-cap universe",
    benchmark: "S&P 500 Total Return",
    capital: "$100,000 simulated",
    dataCutoff: "June 30, 2026 · 4:00 PM ET",
    limitation:
      "Daily bars cannot model intraday path or real-world fill uncertainty.",
    result: {
      decisions: "390 weekly decisions evaluated",
      actions: "31 modeled rebalances",
      rejections: "7 candidates rejected by exposure or liquidity rules",
      risk: "8.4% maximum modeled drawdown",
      observation:
        "The volatility filter reduced concentration during two sharp market declines, but also delayed three recoveries.",
    },
  },
  paper: {
    label: "Paper",
    strategyLabel: "Strategy V1",
    sourceLabel: "Drafting V1 · Checkpoint 2",
    statusLabel: "Running",
    capital: "$100,000 simulated capital",
    nextRun: "Wednesday, July 15 · 4:15 PM ET",
  },
  activity: [
    {
      id: "activity-intent",
      title: "Intent translated",
      detail: "Material defaults are disclosed in the Draft.",
      status: "complete",
      objectLabel: "Intent brief",
    },
    {
      id: "activity-draft",
      title: "Drafting V1 created",
      detail: "Six structured sections saved at Checkpoint 2.",
      status: "complete",
      objectLabel: "Drafting V1",
    },
    {
      id: "activity-evaluation",
      title: "Evaluation ready",
      detail: "Waiting for you to confirm the disclosed test conditions.",
      status: "active",
      objectLabel: "Evaluation setup",
    },
  ] satisfies ChampionActivityFixture[],
  conversation: {
    summary:
      "I shaped your brief into explicit weekly rules. The remaining decision is whether these evaluation assumptions are suitable for your first evidence.",
    suggestions: [
      "Why these risk limits?",
      "Explain the entry rule",
      "What could this test miss?",
    ],
    references: [
      { id: "draft-v1", label: "Drafting V1 · Checkpoint 2" },
      { id: "evaluation-setup", label: "Evaluation setup" },
    ],
  },
} as const
