import { describe, expect, it } from "vitest"

import {
  createWorkspaceDemoAuthority,
} from "./workspace-demo-authority"
import { workspaceFixture, workspaceFixtures } from "./workspace-fixtures"

describe("workspace demo authority", () => {
  it("rejects a stale rule command instead of fabricating a confirmed patch", async () => {
    const authority = createWorkspaceDemoAuthority({ latencyMs: 0 })

    await expect(
      authority.confirmRuleChange({
        ruleId: "universe",
        proposedValue: "30 liquid U.S. large-cap equities",
        motivation: "Narrow the candidate set.",
        baseCheckpoint: "V1.1",
      })
    ).rejects.toMatchObject({
      code: "stale-checkpoint",
    })
  })

  it("keys evaluations to the exact authoritative checkpoint and rules", async () => {
    const authority = createWorkspaceDemoAuthority({ latencyMs: 0 })
    const initialRules = workspaceFixture.draft.rules.map((rule) => ({ ...rule }))

    const result = await authority.evaluateDraft({
      checkpoint: "V1.2",
      rules: initialRules,
    })

    expect(result.authority).toBe("demo-authority")
    expect(result.checkpoint).toBe("V1.2")
    expect(result.ruleSnapshot).toEqual(initialRules)
    expect(result.baseline.checkpoint).toBe("V1.1")
    expect(result).not.toHaveProperty("eligibility")

    const mismatchedRules = initialRules.map((rule) =>
      rule.id === "universe" ? { ...rule, value: "Unconfirmed value" } : rule
    )
    await expect(
      authority.evaluateDraft({ checkpoint: "V1.2", rules: mismatchedRules })
    ).rejects.toMatchObject({
      code: "rule-snapshot-mismatch",
    })
  })

  it("uses the most recent actually evaluated checkpoint as the baseline", async () => {
    const authority = createWorkspaceDemoAuthority({ latencyMs: 0 })

    await authority.evaluateDraft({
      checkpoint: "V1.2",
      rules: workspaceFixture.draft.rules,
    })
    const firstChange = await authority.confirmRuleChange({
      ruleId: "universe",
      proposedValue: "30 liquid U.S. large-cap equities",
      motivation: "Narrow the candidate set.",
      baseCheckpoint: "V1.2",
    })
    const secondChange = await authority.confirmRuleChange({
      ruleId: "entry",
      proposedValue: "Top quintile by 6-month momentum",
      motivation: "Test a stricter selection threshold.",
      baseCheckpoint: firstChange.draft.checkpoint,
    })

    const result = await authority.evaluateDraft(secondChange.draft)

    expect(secondChange.draft.checkpoint).toBe("V1.4")
    expect(result.baseline.checkpoint).toBe("V1.2")
    expect(result.baseline.checkpoint).not.toBe("V1.3")
  })

  it("returns separate immutable projections for Paper and the next Draft", async () => {
    const authority = createWorkspaceDemoAuthority({ latencyMs: 0 })

    await authority.evaluateDraft({
      checkpoint: "V1.2",
      rules: workspaceFixture.draft.rules,
    })
    const launch = await authority.launchPaper({
      draftLabel: "Draft V1",
      checkpoint: "V1.2",
      rules: workspaceFixture.draft.rules,
    })
    const launchedValue = launch.paperSnapshot.rules[0].value

    launch.nextDraft.rules[0].value = "A later local projection"

    expect(launch.paperSnapshot.rules[0].value).toBe(launchedValue)
    expect(launch.nextDraft.checkpoint).toBe("V2.0")
  })

  it("forks a historical checkpoint into a new append-only current checkpoint", async () => {
    const authority = createWorkspaceDemoAuthority({ latencyMs: 0 })
    const changed = await authority.confirmRuleChange({
      ruleId: "universe",
      proposedValue: "30 liquid U.S. large-cap equities",
      motivation: "Test a narrower universe before restoring prior work.",
      baseCheckpoint: "V1.2",
    })

    const fork = await authority.forkCheckpoint({
      sourceCheckpoint: "V1.1",
      baseCheckpoint: changed.draft.checkpoint,
    })

    expect(changed.draft.checkpoint).toBe("V1.3")
    expect(fork.sourceCheckpoint).toBe("V1.1")
    expect(fork.draft.checkpoint).toBe("V1.4")
    expect(fork.draft.rules).toEqual(workspaceFixture.draft.rules)
  })

  it("returns Champion-scoped results from the selected fixture authority", async () => {
    const iris = workspaceFixtures.find(
      (fixture) => fixture.champion.id === "iris"
    )!
    const authority = createWorkspaceDemoAuthority({
      championId: iris.champion.id,
      initialDraft: iris.draft,
      evaluationTemplate: iris.evaluation,
      latencyMs: 0,
    })

    const evaluation = await authority.evaluateDraft({
      checkpoint: iris.draft.checkpoint,
      rules: iris.draft.rules,
    })
    const confirmation = await authority.confirmRuleChange({
      ruleId: "universe",
      proposedValue: "45 profitable U.S. dividend-paying companies",
      motivation: "Test a smaller quality universe.",
      baseCheckpoint: iris.draft.checkpoint,
    })

    expect(evaluation.championId).toBe("iris")
    expect(evaluation.baseline.checkpoint).toBe("V1.0")
    expect(evaluation.metrics[0]).toMatchObject({
      label: "Monthly decisions",
      value: "150",
    })
    expect(evaluation.decisions[0].symbol).toBe("PG")
    expect(confirmation.championId).toBe("iris")
    expect(confirmation.draft.checkpoint).toBe("V1.2")
  })
})
