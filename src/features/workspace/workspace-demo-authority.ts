import type {
  ConfirmedDraftRulePatch,
  DraftRuleChangeProposal,
  EvaluationBaselineMetricFixture,
  EvaluationMetricFixture,
  StrategyRuleFixture,
  WorkspaceEvaluationBaselineFixture,
  WorkspaceEvaluationFixture,
  WorkspaceEvaluationTemplate,
} from "./workspace-fixtures"
import { workspaceFixture } from "./workspace-fixtures"

export type DemoAuthorityDraftSnapshot = {
  checkpoint: string
  rules: StrategyRuleFixture[]
}

export type DemoAuthorityRuleConfirmation = {
  championId: string
  draft: DemoAuthorityDraftSnapshot
  confirmedPatch: ConfirmedDraftRulePatch
}

export type DemoAuthorityPaperLaunch = {
  championId: string
  paperSnapshot: {
    source: string
    rules: StrategyRuleFixture[]
  }
  nextDraft: DemoAuthorityDraftSnapshot
}

export type DemoAuthorityCheckpointFork = {
  championId: string
  draft: DemoAuthorityDraftSnapshot
  sourceCheckpoint: string
}

export type WorkspaceDemoAuthorityErrorCode =
  | "stale-checkpoint"
  | "rule-snapshot-mismatch"
  | "invalid-proposal"
  | "unknown-rule"
  | "unknown-checkpoint"
  | "checkpoint-not-evaluated"

export class WorkspaceDemoAuthorityError extends Error {
  constructor(
    readonly code: WorkspaceDemoAuthorityErrorCode,
    message: string
  ) {
    super(message)
    this.name = "WorkspaceDemoAuthorityError"
  }
}

export type WorkspaceDemoAuthority = ReturnType<
  typeof createWorkspaceDemoAuthority
>

export type WorkspaceAuthorityOperation =
  | "validating-rule"
  | "evaluating"
  | "launching-paper"
  | "forking-checkpoint"
  | null

/**
 * An intentionally in-memory, asynchronous stand-in for the backend contract.
 * Components can propose commands, but only responses from this facade may
 * update the client projection of Draft or evaluation state.
 */
export function createWorkspaceDemoAuthority({
  championId = workspaceFixture.champion.id,
  initialDraft = {
    checkpoint: workspaceFixture.draft.checkpoint,
    rules: workspaceFixture.draft.rules,
  },
  evaluationTemplate = workspaceFixture.evaluation,
  latencyMs = 160,
}: {
  championId?: string
  initialDraft?: {
    checkpoint: string
    rules: readonly StrategyRuleFixture[]
  }
  evaluationTemplate?: WorkspaceEvaluationTemplate
  latencyMs?: number
} = {}) {
  const initialAuthoritativeDraft = cloneDraft(initialDraft)
  let authoritativeDraft = cloneDraft(initialDraft)
  let evaluations: WorkspaceEvaluationFixture[] = []
  const checkpointHistory = new Map<string, StrategyRuleFixture[]>([
    [initialDraft.checkpoint, cloneRules(initialDraft.rules)],
    [evaluationTemplate.baseline.checkpoint, cloneRules(initialDraft.rules)],
  ])

  async function confirmRuleChange(
    proposal: DraftRuleChangeProposal
  ): Promise<DemoAuthorityRuleConfirmation> {
    await waitForAuthority(latencyMs)

    assertCheckpoint(proposal.baseCheckpoint, authoritativeDraft.checkpoint)

    const proposedValue = proposal.proposedValue.trim()
    const motivation = proposal.motivation.trim()
    if (!proposedValue || !motivation) {
      throw new WorkspaceDemoAuthorityError(
        "invalid-proposal",
        "A semantic value and motivation are required."
      )
    }

    const rule = authoritativeDraft.rules.find(
      (candidate) => candidate.id === proposal.ruleId
    )
    if (!rule) {
      throw new WorkspaceDemoAuthorityError(
        "unknown-rule",
        `Rule ${proposal.ruleId} does not exist at ${authoritativeDraft.checkpoint}.`
      )
    }
    if (rule.value.trim() === proposedValue) {
      throw new WorkspaceDemoAuthorityError(
        "invalid-proposal",
        "The proposed value must change the rule semantics."
      )
    }

    const nextCheckpoint = incrementCheckpoint(authoritativeDraft.checkpoint)
    const confirmedPatch: ConfirmedDraftRulePatch = {
      ...proposal,
      proposedValue,
      motivation,
      checkpoint: nextCheckpoint,
      status: "server-confirmed",
      authority: "demo-authority",
    }

    authoritativeDraft = {
      checkpoint: nextCheckpoint,
      rules: authoritativeDraft.rules.map((candidate) =>
        candidate.id === proposal.ruleId
          ? { ...candidate, value: proposedValue }
          : { ...candidate }
      ),
    }
    checkpointHistory.set(nextCheckpoint, cloneRules(authoritativeDraft.rules))

    return {
      championId,
      draft: cloneDraft(authoritativeDraft),
      confirmedPatch: structuredClone(confirmedPatch),
    }
  }

  async function evaluateDraft(request: {
    checkpoint: string
    rules: readonly StrategyRuleFixture[]
  }): Promise<WorkspaceEvaluationFixture> {
    await waitForAuthority(latencyMs)

    assertCheckpoint(request.checkpoint, authoritativeDraft.checkpoint)
    assertRuleSnapshot(request.rules, authoritativeDraft.rules)

    const previousEvaluation = findMostRecentDifferentEvaluation(
      evaluations,
      request.checkpoint
    )
    const baseline = previousEvaluation
      ? baselineFromEvaluation(previousEvaluation)
      : structuredClone(evaluationTemplate.baseline)
    const metrics = buildMetrics(
      authoritativeDraft.rules,
      baseline.metrics,
      initialAuthoritativeDraft.rules,
      evaluationTemplate
    )
    const rules = cloneRules(authoritativeDraft.rules)

    const result: WorkspaceEvaluationFixture = {
      id: `${championId}-dry-run-${evaluations.length + 1}`,
      label: `Dry Run ${evaluations.length + 1}`,
      status: "completed",
      authority: "demo-authority",
      championId,
      checkpoint: request.checkpoint,
      ruleSnapshot: rules,
      completedAt: evaluationTemplate.completedAt,
      duration: evaluationTemplate.duration,
      eligibility: structuredClone(evaluationTemplate.eligibility),
      setup: structuredClone(evaluationTemplate.setup),
      metrics,
      baseline,
      decisions: buildDecisions(rules, evaluationTemplate),
    }

    evaluations = [...evaluations, structuredClone(result)]

    return structuredClone(result)
  }

  async function launchPaper(request: {
    draftLabel: string
    checkpoint: string
    rules: readonly StrategyRuleFixture[]
  }): Promise<DemoAuthorityPaperLaunch> {
    await waitForAuthority(latencyMs)

    assertCheckpoint(request.checkpoint, authoritativeDraft.checkpoint)
    assertRuleSnapshot(request.rules, authoritativeDraft.rules)

    const evaluated = evaluations.some(
      (evaluation) => evaluation.checkpoint === request.checkpoint
    )
    if (!evaluated) {
      throw new WorkspaceDemoAuthorityError(
        "checkpoint-not-evaluated",
        `${request.checkpoint} must have an authoritative evaluation before Paper launch.`
      )
    }

    const launchedRules = cloneRules(authoritativeDraft.rules)
    const paperSnapshot = {
      source: `${request.draftLabel} · checkpoint ${request.checkpoint}`,
      rules: cloneRules(launchedRules),
    }
    authoritativeDraft = {
      checkpoint: nextDraftCheckpoint(request.checkpoint),
      rules: cloneRules(launchedRules),
    }
    checkpointHistory.set(
      authoritativeDraft.checkpoint,
      cloneRules(authoritativeDraft.rules)
    )

    return {
      championId,
      paperSnapshot,
      nextDraft: cloneDraft(authoritativeDraft),
    }
  }

  async function forkCheckpoint(request: {
    sourceCheckpoint: string
    baseCheckpoint: string
  }): Promise<DemoAuthorityCheckpointFork> {
    await waitForAuthority(latencyMs)

    assertCheckpoint(request.baseCheckpoint, authoritativeDraft.checkpoint)
    if (request.sourceCheckpoint === authoritativeDraft.checkpoint) {
      throw new WorkspaceDemoAuthorityError(
        "invalid-proposal",
        `${request.sourceCheckpoint} is already the current checkpoint.`
      )
    }

    const sourceRules = checkpointHistory.get(request.sourceCheckpoint)
    if (!sourceRules) {
      throw new WorkspaceDemoAuthorityError(
        "unknown-checkpoint",
        `Checkpoint ${request.sourceCheckpoint} is not available in this Draft history.`
      )
    }

    authoritativeDraft = {
      checkpoint: incrementCheckpoint(authoritativeDraft.checkpoint),
      rules: cloneRules(sourceRules),
    }
    checkpointHistory.set(
      authoritativeDraft.checkpoint,
      cloneRules(authoritativeDraft.rules)
    )

    return {
      championId,
      draft: cloneDraft(authoritativeDraft),
      sourceCheckpoint: request.sourceCheckpoint,
    }
  }

  return {
    confirmRuleChange,
    evaluateDraft,
    forkCheckpoint,
    launchPaper,
  }
}

function assertCheckpoint(requested: string, authoritative: string) {
  if (requested === authoritative) return

  throw new WorkspaceDemoAuthorityError(
    "stale-checkpoint",
    `Expected base checkpoint ${authoritative}; received ${requested}.`
  )
}

function assertRuleSnapshot(
  requested: readonly StrategyRuleFixture[],
  authoritative: readonly StrategyRuleFixture[]
) {
  if (ruleSignature(requested) === ruleSignature(authoritative)) return

  throw new WorkspaceDemoAuthorityError(
    "rule-snapshot-mismatch",
    "The submitted rules do not match the authoritative Draft checkpoint."
  )
}

function findMostRecentDifferentEvaluation(
  evaluations: readonly WorkspaceEvaluationFixture[],
  checkpoint: string
) {
  return evaluations.findLast(
    (evaluation) => evaluation.checkpoint !== checkpoint
  )
}

function baselineFromEvaluation(
  evaluation: WorkspaceEvaluationFixture
): WorkspaceEvaluationBaselineFixture {
  return {
    checkpoint: evaluation.checkpoint,
    label: "Most recent tested checkpoint",
    completedAt: evaluation.completedAt,
    metrics: evaluation.metrics.map(({ id, label, value }) => ({
      id,
      label,
      value,
    })),
  }
}

function buildMetrics(
  rules: readonly StrategyRuleFixture[],
  baseline: readonly EvaluationBaselineMetricFixture[],
  initialRules: readonly StrategyRuleFixture[],
  evaluationTemplate: WorkspaceEvaluationTemplate
): EvaluationMetricFixture[] {
  const values: Record<string, string> =
    ruleSignature(rules) === ruleSignature(initialRules)
      ? Object.fromEntries(
          evaluationTemplate.metrics.map((metric) => [
            metric.id,
            metric.value,
          ])
        )
      : metricValuesFromRules(rules, evaluationTemplate)

  return evaluationTemplate.metrics.map((definition) => {
    const value = values[definition.id] ?? definition.value
    const baselineValue =
      baseline.find((metric) => metric.id === definition.id)?.value ?? value

    return {
      id: definition.id,
      label: definition.label,
      value,
      delta: metricDelta(definition.id, value, baselineValue),
    }
  })
}

function metricValuesFromRules(
  rules: readonly StrategyRuleFixture[],
  evaluationTemplate: WorkspaceEvaluationTemplate
) {
  const seed = hashString(ruleSignature(rules))
  return {
    ...Object.fromEntries(
      evaluationTemplate.metrics.map((metric) => [metric.id, metric.value])
    ),
    rebalances: String(28 + (seed % 7)),
    "max-drawdown": `${(7.8 + ((seed >>> 4) % 15) / 10).toFixed(1)}%`,
    "risk-rejections": String(4 + ((seed >>> 8) % 6)),
  }
}

function metricDelta(
  metricId: string,
  value: string,
  baselineValue: string
): EvaluationMetricFixture["delta"] {
  const difference = numericMetricValue(value) - numericMetricValue(baselineValue)
  const direction = difference > 0 ? "up" : difference < 0 ? "down" : "flat"

  if (metricId === "max-drawdown") {
    return {
      direction,
      value: difference === 0 ? "0 pp" : `${signed(difference.toFixed(1))} pp`,
    }
  }

  return {
    direction,
    value: difference === 0 ? "0" : signed(String(Math.round(difference))),
  }
}

function buildDecisions(
  rules: readonly StrategyRuleFixture[],
  evaluationTemplate: WorkspaceEvaluationTemplate
): WorkspaceEvaluationFixture["decisions"] {
  const allocationRule = rules.find((rule) => rule.id === "allocation")
  const positionCap = allocationRule?.constraint.match(/(\d+)% per asset/)?.[1]

  return evaluationTemplate.decisions.map((decision) =>
    decision.id === "decision-rejection" && positionCap
      ? {
          ...decision,
          evidence: `Position cap would exceed ${positionCap}%`,
          ruleIds: [...decision.ruleIds],
        }
      : { ...decision, ruleIds: [...decision.ruleIds] }
  )
}

function numericMetricValue(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ""))
  return Number.isFinite(parsed) ? parsed : 0
}

function signed(value: string) {
  return value.startsWith("-") ? `−${value.slice(1)}` : `+${value}`
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function ruleSignature(rules: readonly StrategyRuleFixture[]) {
  return JSON.stringify(
    rules.map(({ id, group, name, value, constraint }) => ({
      id,
      group,
      name,
      value,
      constraint,
    }))
  )
}

function cloneDraft(draft: {
  checkpoint: string
  rules: readonly StrategyRuleFixture[]
}): DemoAuthorityDraftSnapshot {
  return {
    checkpoint: draft.checkpoint,
    rules: cloneRules(draft.rules),
  }
}

function cloneRules(rules: readonly StrategyRuleFixture[]) {
  return rules.map((rule) => ({ ...rule }))
}

function incrementCheckpoint(checkpoint: string) {
  const match = /^V(\d+)\.(\d+)$/.exec(checkpoint)
  if (!match) {
    throw new Error(`Unsupported Draft checkpoint: ${checkpoint}`)
  }

  return `V${match[1]}.${Number(match[2]) + 1}`
}

function nextDraftCheckpoint(checkpoint: string) {
  const match = /^V(\d+)\.\d+$/.exec(checkpoint)
  if (!match) {
    throw new Error(`Unsupported Draft checkpoint: ${checkpoint}`)
  }

  return `V${Number(match[1]) + 1}.0`
}

async function waitForAuthority(latencyMs: number) {
  if (latencyMs <= 0) return
  await new Promise<void>((resolve) => globalThis.setTimeout(resolve, latencyMs))
}
