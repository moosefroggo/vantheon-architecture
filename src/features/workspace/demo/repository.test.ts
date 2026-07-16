import { describe, expect, it } from "vitest";

import {
  entityId,
  entityReference,
  idempotencyKey,
  isoTimestamp,
  type DomainObjectKind,
} from "@/domain/identity";

import { validateWorkspaceScenario } from "./invariants";
import {
  createInMemoryWorkspaceRepository,
  InMemoryWorkspaceScenarioStorage,
} from "./memory-repository";
import { WorkspaceAuthorityError } from "./repository";
import { createWorkspaceDemoSeed, WORKSPACE_DEMO_IDS } from "./seed";
import type {
  AcceptChangeCommand,
  ArchivePaperCommand,
  EvaluateDraftCommand,
  LaunchPaperCommand,
  ProposeChangeCommand,
  RejectChangeCommand,
  RestoreCheckpointCommand,
  StopPaperCommand,
  UnarchivePaperCommand,
  WorkspaceCommandType,
  WorkspaceDemoRepository,
  WorkspaceRuntime,
} from "./index";

describe("in-memory workspace authority", () => {
  it("returns isolated query projections", async () => {
    const { repository } = await createHarness();
    const champion = await repository.getChampion(
      WORKSPACE_DEMO_IDS.mara.champion
    );
    expect(champion).toBeDefined();
    champion!.displayName = "Tampered client projection";

    await expect(
      repository.getChampion(WORKSPACE_DEMO_IDS.mara.champion)
    ).resolves.toMatchObject({ displayName: "Mara" });
  });

  it("proposes without mutating strategy, replays idempotently, and accepts exactly one checkpoint", async () => {
    const { repository, commandBase } = await createHarness();
    const beforeDraft = await requiredCurrentDraft(repository, "mara");
    const beforeCheckpoint = await requiredCheckpoint(
      repository,
      beforeDraft.currentCheckpointId
    );
    const portfolioRule = rule(beforeCheckpoint.strategy, "portfolio");
    const propose = {
      ...commandBase("propose", 1),
      draftId: beforeDraft.id,
      expectedDraftRevision: beforeDraft.revision,
      baseCheckpointId: beforeCheckpoint.id,
      changes: [
        {
          ruleId: portfolioRule.id,
          expectedValue: portfolioRule.value,
          proposedValue: "Equal weight · 6 positions maximum",
        },
      ],
      motivation: "Reduce concentration.",
      evidenceRefs: ["evaluation:mara-v1.2"],
      expectedBenefit: "Lower single-name exposure.",
      downside: "May hold more cash.",
    } satisfies ProposeChangeCommand;

    const proposed = await repository.proposeDraftChange(propose);
    expect(proposed).toMatchObject({
      outcome: "applied",
      result: { kind: "change-set-created" },
    });
    expect(proposed.lifecycle.map((transition) => transition.state)).toEqual([
      "submitted",
      "accepted",
      "applied",
    ]);
    const replayed = await repository.propose(propose);
    expect(replayed).toEqual(proposed);

    const afterProposal = await requiredCurrentDraft(repository, "mara");
    expect(afterProposal.currentCheckpointId).toBe(beforeCheckpoint.id);
    expect(afterProposal.revision).not.toBe(beforeDraft.revision);
    expect(
      rule(
        (await requiredCheckpoint(repository, beforeCheckpoint.id)).strategy,
        "portfolio"
      ).value
    ).toBe(portfolioRule.value);
    expect(Object.values((await repository.readSnapshot()).receipts)).toHaveLength(
      1
    );

    const changeSetId = proposed.result!.changeSetId;
    const changeSet = (await repository.getChangeSet(changeSetId))!;
    const accepted = await repository.acceptChangeSet({
      ...commandBase("accept", 2),
      changeSetId,
      expectedChangeSetRevision: changeSet.revision,
      expectedDraftRevision: afterProposal.revision,
    } satisfies AcceptChangeCommand);
    expect(accepted.outcome).toBe("applied");

    const afterAccept = await requiredCurrentDraft(repository, "mara");
    const acceptedCheckpoint = await requiredCheckpoint(
      repository,
      afterAccept.currentCheckpointId
    );
    expect(acceptedCheckpoint).toMatchObject({
      label: "V1.3",
      previousCheckpointId: beforeCheckpoint.id,
      origin: { kind: "accepted-change-set", changeSetId },
    });
    expect(rule(acceptedCheckpoint.strategy, "portfolio").value).toBe(
      "Equal weight · 6 positions maximum"
    );
    expect(
      rule(
        (await requiredCheckpoint(repository, beforeCheckpoint.id)).strategy,
        "portfolio"
      ).value
    ).toBe(portfolioRule.value);
    expect((await repository.getChangeSet(changeSetId))?.status).toBe(
      "accepted"
    );
    await expect(
      validateWorkspaceScenario(await repository.readSnapshot())
    ).resolves.toEqual([]);
  });

  it("rejects a proposal without creating a checkpoint", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const checkpoint = await requiredCheckpoint(
      repository,
      draft.currentCheckpointId
    );
    const selectionRule = rule(checkpoint.strategy, "selection");
    const proposed = await repository.propose({
      ...commandBase("propose", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      baseCheckpointId: checkpoint.id,
      changes: [
        {
          ruleId: selectionRule.id,
          expectedValue: selectionRule.value,
          proposedValue: "Top decile by 6-month momentum",
        },
      ],
      motivation: "Test a narrower selection band.",
    });
    const changeSet = (await repository.getChangeSet(
      proposed.result!.changeSetId
    ))!;
    const rejected = await repository.rejectChangeSet({
      ...commandBase("reject", 2),
      changeSetId: changeSet.id,
      expectedChangeSetRevision: changeSet.revision,
      reason: "Downside is too large.",
    } satisfies RejectChangeCommand);

    expect(rejected.outcome).toBe("applied");
    const persistedChangeSet = (await repository.getChangeSet(changeSet.id))!;
    expect(persistedChangeSet).toMatchObject({
      status: "rejected",
      decisionReason: "Downside is too large.",
    });
    expect(persistedChangeSet.resultCheckpointId).toBeUndefined();
    expect((await requiredCurrentDraft(repository, "mara")).currentCheckpointId).toBe(
      checkpoint.id
    );
    expect(await repository.listCheckpoints(WORKSPACE_DEMO_IDS.mara.champion)).toHaveLength(
      2
    );
  });

  it("restores through a proposed semantic diff and appends history", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const current = await requiredCheckpoint(repository, draft.currentCheckpointId);
    const source = await requiredCheckpoint(
      repository,
      WORKSPACE_DEMO_IDS.mara.checkpointV11
    );
    const proposed = await repository.restoreCheckpoint({
      ...commandBase("restore", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      sourceCheckpointId: source.id,
      motivation: "Return to the prior concentration envelope.",
    } satisfies RestoreCheckpointCommand);
    const afterProposal = await requiredCurrentDraft(repository, "mara");
    expect(afterProposal.currentCheckpointId).toBe(current.id);
    const changeSet = (await repository.getChangeSet(
      proposed.result!.changeSetId
    ))!;
    expect(changeSet).toMatchObject({
      kind: "restore",
      status: "proposed",
      restoreSourceCheckpointId: source.id,
    });

    await repository.accept({
      ...commandBase("accept", 2),
      changeSetId: changeSet.id,
      expectedChangeSetRevision: changeSet.revision,
      expectedDraftRevision: afterProposal.revision,
    });
    const restoredDraft = await requiredCurrentDraft(repository, "mara");
    const restored = await requiredCheckpoint(
      repository,
      restoredDraft.currentCheckpointId
    );
    expect(restored.label).toBe("V1.3");
    expect(restored.id).not.toBe(source.id);
    expect(restored.strategyHash).toBe(source.strategyHash);
    expect(restored.strategy).toEqual(source.strategy);
    expect(await repository.listCheckpoints(WORKSPACE_DEMO_IDS.mara.champion)).toHaveLength(
      3
    );
  });

  it("records a bounded Evaluation with explicit rule, decision, order, event, and source semantics", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const checkpoint = await requiredCheckpoint(
      repository,
      draft.currentCheckpointId
    );
    const receipt = await repository.runEvaluation({
      ...commandBase("evaluate", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      checkpointId: checkpoint.id,
      setup: evaluationSetup("mara"),
    } satisfies EvaluateDraftCommand);

    expect(receipt.outcome).toBe("applied");
    const evaluation = (await repository.getEvaluation(
      receipt.result!.evaluationId
    ))!;
    expect(evaluation).toMatchObject({
      checkpointId: checkpoint.id,
      strategyHash: checkpoint.strategyHash,
      status: "completed",
      summary: {
        decisions: 2,
        proposedOrders: 0,
        submittedOrders: 0,
        nearMisses: 1,
      },
    });
    expect(evaluation.orderIds).toEqual([]);
    expect(new Set(evaluation.ruleEvaluations.map((result) => result.status))).toEqual(
      new Set(["passed"])
    );
    expect(evaluation.ruleEvaluations.every((result) => result.sourceArtifactId)).toBe(
      true
    );
    expect(evaluation.eventIds).toHaveLength(5);
    expect((await requiredCurrentDraft(repository, "mara")).currentCheckpointId).toBe(
      checkpoint.id
    );
    expect((await requiredCurrentDraft(repository, "mara")).revision).toBe(
      draft.revision
    );
  });

  it("launches atomically into immutable Paper and freezes the same Draft", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const checkpoint = await requiredCheckpoint(
      repository,
      draft.currentCheckpointId
    );
    const receipt = await repository.launchPaper({
      ...commandBase("launch", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      checkpointId: checkpoint.id,
      evaluationId: WORKSPACE_DEMO_IDS.mara.evaluation,
      portfolioName: "Mara momentum paper",
      simulatedCapital: 125_000,
    } satisfies LaunchPaperCommand);
    expect(receipt.outcome).toBe("applied");
    const result = receipt.result!;
    const snapshot = await repository.readSnapshot();
    const portfolio = snapshot.portfolios[result.portfolioId];
    const strategy = snapshot.strategies[result.strategyId];

    expect(portfolio).toMatchObject({
      displayName: "Mara momentum paper",
      sourceCheckpointId: checkpoint.id,
      benchmarkId: WORKSPACE_DEMO_IDS.mara.benchmark,
      state: "active",
      simulatedCapital: 125_000,
    });
    expect(strategy).toMatchObject({
      label: "Strategy V1",
      sourceCheckpointId: checkpoint.id,
      strategyHash: checkpoint.strategyHash,
    });
    expect(snapshot.accountSnapshots[result.initialAccountSnapshotId]).toMatchObject({
      portfolioId: portfolio.id,
      cash: 125_000,
      buyingPower: 125_000,
      positionsMarketValue: 0,
      accountValue: 125_000,
    });
    expect(portfolio.currentAccountSnapshotId).toBe(
      result.initialAccountSnapshotId
    );
    expect(snapshot.drafts[draft.id].status).toBe("launched");
    expect(snapshot.champions[draft.championId].currentDraftId).toBe(draft.id);
    expect(Object.values(snapshot.drafts).filter(
      (candidate) => candidate.championId === draft.championId
    )).toHaveLength(1);
    await expect(validateWorkspaceScenario(snapshot)).resolves.toEqual([]);
  });

  it("rejects a second Paper portfolio after the Strategy Draft is frozen", async () => {
    const { repository, commandBase } = await createHarness();
    const firstDraft = await requiredCurrentDraft(repository, "mara");
    const firstCheckpoint = await requiredCheckpoint(
      repository,
      firstDraft.currentCheckpointId
    );
    const first = await repository.launch({
      ...commandBase("launch", 1),
      draftId: firstDraft.id,
      expectedDraftRevision: firstDraft.revision,
      checkpointId: firstCheckpoint.id,
      evaluationId: WORKSPACE_DEMO_IDS.mara.evaluation,
      portfolioName: "Mara paper one",
      simulatedCapital: 100_000,
    });

    expect(first.outcome).toBe("applied");
    const frozenDraft = await requiredCurrentDraft(repository, "mara");
    const second = await repository.launch({
      ...commandBase("launch", 2),
      draftId: frozenDraft.id,
      expectedDraftRevision: frozenDraft.revision,
      checkpointId: firstCheckpoint.id,
      evaluationId: WORKSPACE_DEMO_IDS.mara.evaluation,
      portfolioName: "Mara paper two",
      simulatedCapital: 150_000,
    });
    expect(second).toMatchObject({
      outcome: "rejected",
      failure: { code: "invalid-state" },
    });

    const portfolios = await repository.listPortfolios(
      WORKSPACE_DEMO_IDS.mara.champion
    );
    expect(portfolios.map((portfolio) => portfolio.displayName)).toEqual([
      "Mara paper one",
    ]);
    const currentDraft = await requiredCurrentDraft(repository, "mara");
    expect(currentDraft).toMatchObject({ generation: 1, status: "launched" });
    await expect(
      validateWorkspaceScenario(await repository.readSnapshot())
    ).resolves.toEqual([]);
  });

  it("preserves all launch targets when Evaluation provenance is stale", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const checkpoint = await requiredCheckpoint(
      repository,
      draft.currentCheckpointId
    );
    const before = await repository.readSnapshot();
    const receipt = await repository.launch({
      ...commandBase("launch", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      checkpointId: checkpoint.id,
      evaluationId: WORKSPACE_DEMO_IDS.iris.evaluation,
      portfolioName: "Should not exist",
      simulatedCapital: 100_000,
    });
    const after = await repository.readSnapshot();

    expect(receipt).toMatchObject({
      outcome: "rejected",
      failure: { code: "checkpoint-not-evaluated" },
    });
    expect(after.portfolios).toEqual(before.portfolios);
    expect(after.strategies).toEqual(before.strategies);
    expect(after.drafts).toEqual(before.drafts);
    expect(after.checkpoints).toEqual(before.checkpoints);
    expect(Object.keys(after.receipts)).toHaveLength(1);
  });

  it("serializes concurrent commands, rejects the stale one, and enforces idempotency payload identity", async () => {
    const { repository, commandBase } = await createHarness();
    const draft = await requiredCurrentDraft(repository, "mara");
    const checkpoint = await requiredCheckpoint(
      repository,
      draft.currentCheckpointId
    );
    const selection = rule(checkpoint.strategy, "selection");
    const first = {
      ...commandBase("propose", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      baseCheckpointId: checkpoint.id,
      changes: [
        {
          ruleId: selection.id,
          expectedValue: selection.value,
          proposedValue: "Top decile",
        },
      ],
      motivation: "First proposal.",
    } satisfies ProposeChangeCommand;
    const second = {
      ...commandBase("propose", 2),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      baseCheckpointId: checkpoint.id,
      changes: [
        {
          ruleId: selection.id,
          expectedValue: selection.value,
          proposedValue: "Top half",
        },
      ],
      motivation: "Second proposal.",
    } satisfies ProposeChangeCommand;
    const [firstReceipt, secondReceipt] = await Promise.all([
      repository.propose(first),
      repository.propose(second),
    ]);
    expect([firstReceipt.outcome, secondReceipt.outcome].sort()).toEqual([
      "applied",
      "conflicted",
    ]);
    const conflicted = [firstReceipt, secondReceipt].find(
      (receipt) => receipt.outcome === "conflicted"
    );
    expect(conflicted?.failure?.code).toBe("stale-revision");
    expect(conflicted?.lifecycle.map((transition) => transition.state)).toEqual(
      ["submitted", "accepted", "conflicted"]
    );

    const conflicting = {
      ...first,
      commandId: entityId("command", "command_conflicting_payload"),
      motivation: "Different payload under the same key.",
    };
    await expect(repository.propose(conflicting)).rejects.toMatchObject({
      code: "idempotency-key-conflict",
    } satisfies Partial<WorkspaceAuthorityError>);
  });

  it("enforces stop → archive → unarchive as stopped and keeps deployment stopped", async () => {
    const { repository, commandBase } = await createHarness();
    const initial = (await repository.getPortfolio(
      WORKSPACE_DEMO_IDS.iris.portfolio
    ))!;
    const stopped = await repository.stopPaper({
      ...commandBase("stop", 1),
      portfolioId: initial.id,
      expectedPortfolioRevision: initial.revision,
    } satisfies StopPaperCommand);
    expect(stopped.result).toMatchObject({ state: "stopped" });

    const stoppedPortfolio = (await repository.getPortfolio(initial.id))!;
    const archived = await repository.archivePaper({
      ...commandBase("archive", 2),
      portfolioId: initial.id,
      expectedPortfolioRevision: stoppedPortfolio.revision,
    } satisfies ArchivePaperCommand);
    expect(archived.result).toMatchObject({ state: "archived" });
    await expect(
      repository.listPortfolios(WORKSPACE_DEMO_IDS.iris.champion)
    ).resolves.toEqual([]);
    await expect(
      repository.listPortfolios(WORKSPACE_DEMO_IDS.iris.champion, {
        includeArchived: true,
      })
    ).resolves.toHaveLength(1);

    const archivedPortfolio = (await repository.getPortfolio(initial.id))!;
    const unarchived = await repository.unarchivePaper({
      ...commandBase("unarchive", 3),
      portfolioId: initial.id,
      expectedPortfolioRevision: archivedPortfolio.revision,
    } satisfies UnarchivePaperCommand);
    expect(unarchived.result).toMatchObject({ state: "stopped" });
    const snapshot = await repository.readSnapshot();
    expect(snapshot.deployments[initial.deploymentId].state).toBe("stopped");
    expect(snapshot.schedules[initial.scheduleId].nextRunAt).toBeUndefined();
    await expect(validateWorkspaceScenario(snapshot)).resolves.toEqual([]);
  });

  it("queries normalized accounts, current positions, fills, and enriched order provenance", async () => {
    const { repository } = await createHarness();
    const portfolioId = WORKSPACE_DEMO_IDS.iris.portfolio;
    const [snapshots, positions, fills, runs] = await Promise.all([
      repository.listAccountSnapshots(portfolioId),
      repository.listPositions(portfolioId),
      repository.listFills(portfolioId),
      repository.listRuns(portfolioId),
    ]);
    const scenario = await repository.readSnapshot();

    expect(snapshots).toHaveLength(7);
    expect(snapshots.at(-1)).toMatchObject({
      id: WORKSPACE_DEMO_IDS.iris.currentAccountSnapshot,
      cash: 22_800,
      positionsMarketValue: 81_000,
      accountValue: 103_800,
      income: 2_800,
      unrealizedPnl: 1_000,
    });
    expect(positions).toHaveLength(4);
    expect(
      positions.reduce((sum, position) => sum + position.marketValue, 0)
    ).toBe(81_000);
    expect(fills).toHaveLength(4);
    expect(runs[0].orderIds).toHaveLength(4);
    for (const orderId of runs[0].orderIds) {
      const order = scenario.orders[orderId];
      expect(order).toMatchObject({
        status: "filled",
        provenance: { kind: "portfolio-run", runId: runs[0].id },
      });
      expect(order.filledQuantity).toBe(order.requestedQuantity);
      expect(order.averageFillPrice).toBeGreaterThan(0);
      expect(order.submittedAt).toBeDefined();
      expect(order.filledAt).toBeDefined();
    }
  });

  it("persists only sent Atlas exchanges with canonical references", async () => {
    const { repository, commandBase } = await createHarness();
    const completed = await repository.appendAtlasExchange({
      ...commandBase("append-atlas-exchange", 1),
      championId: WORKSPACE_DEMO_IDS.mara.champion,
      userText: "  Explain the current concentration rule.  ",
      assistantText: "The active checkpoint limits the portfolio to eight positions.",
      references: [
        entityReference(
          "draft-checkpoint",
          WORKSPACE_DEMO_IDS.mara.checkpointV12
        ),
      ],
    });
    const sent = await repository.appendAtlasExchange({
      ...commandBase("append-atlas-exchange", 2),
      championId: WORKSPACE_DEMO_IDS.mara.champion,
      userText: "Prepare a follow-up comparison.",
    });

    expect(completed).toMatchObject({
      outcome: "applied",
      result: { kind: "atlas-exchange-appended", status: "completed" },
    });
    expect(sent.result).toMatchObject({ status: "sent" });
    const exchanges = await repository.listAtlasExchanges(
      WORKSPACE_DEMO_IDS.mara.champion
    );
    expect(exchanges).toHaveLength(2);
    expect(exchanges[0]).toMatchObject({
      sequence: 1,
      userText: "Explain the current concentration rule.",
      status: "completed",
    });
    expect(exchanges[1]).toMatchObject({
      sequence: 2,
      userText: "Prepare a follow-up comparison.",
      status: "sent",
      assistantText: undefined,
    });
    expect(exchanges[1]).not.toHaveProperty("composerText");
    await expect(
      validateWorkspaceScenario(await repository.readSnapshot())
    ).resolves.toEqual([]);
  });

  it("preserves same-version persistent state, resets explicitly, and reseeds on seed-version change", async () => {
    const seed = await createWorkspaceDemoSeed();
    const storage = new InMemoryWorkspaceScenarioStorage();
    const first = await createInMemoryWorkspaceRepository({ seed, storage });
    const draft = await requiredCurrentDraft(first, "mara");
    const checkpoint = await requiredCheckpoint(first, draft.currentCheckpointId);
    const selection = rule(checkpoint.strategy, "selection");
    await first.propose({
      ...fixedCommandBase("propose", 1),
      draftId: draft.id,
      expectedDraftRevision: draft.revision,
      baseCheckpointId: checkpoint.id,
      changes: [
        {
          ruleId: selection.id,
          expectedValue: selection.value,
          proposedValue: "Top decile",
        },
      ],
      motivation: "Persistent proposal.",
    });

    const reopened = await createInMemoryWorkspaceRepository({ seed, storage });
    expect(Object.keys((await reopened.readSnapshot()).changeSets)).toHaveLength(1);
    await reopened.resetDemo();
    expect(Object.keys((await reopened.readSnapshot()).changeSets)).toHaveLength(0);

    const upgradedSeed = structuredClone(seed);
    upgradedSeed.seedVersion += 1;
    upgradedSeed.champions[WORKSPACE_DEMO_IDS.mara.champion].workspaceTitle =
      "Versioned seed replacement";
    const upgraded = await createInMemoryWorkspaceRepository({
      seed: upgradedSeed,
      storage,
    });
    await expect(
      upgraded.getChampion(WORKSPACE_DEMO_IDS.mara.champion)
    ).resolves.toMatchObject({ workspaceTitle: "Versioned seed replacement" });
  });
});

async function createHarness() {
  let sequence = 0;
  const runtime: WorkspaceRuntime = {
    now: () => isoTimestamp("2026-07-15T18:00:00.000Z"),
    createId: <TKind extends DomainObjectKind>(kind: TKind) =>
      entityId(
        kind,
        `generated_${kind.replaceAll("-", "_")}_${String(++sequence).padStart(3, "0")}`
      ),
  };
  const repository = await createInMemoryWorkspaceRepository({ runtime });
  return {
    repository,
    commandBase: <TType extends WorkspaceCommandType>(
      type: TType,
      number: number
    ) => fixedCommandBase(type, number),
  };
}

function fixedCommandBase<TType extends WorkspaceCommandType>(
  type: TType,
  sequence: number
) {
  return {
    type,
    commandId: entityId("command", `command_test_${sequence}`),
    idempotencyKey: idempotencyKey(`idempotency_test_${sequence}`),
    actor: entityReference("user", WORKSPACE_DEMO_IDS.user),
    submittedAt: isoTimestamp("2026-07-15T17:59:00.000Z"),
  };
}

async function requiredCurrentDraft(
  repository: WorkspaceDemoRepository,
  champion: "mara" | "iris"
) {
  const draft = await repository.getCurrentDraft(
    WORKSPACE_DEMO_IDS[champion].champion
  );
  if (!draft) throw new Error("Expected current Draft.");
  return draft;
}

async function requiredCheckpoint(
  repository: WorkspaceDemoRepository,
  id: Parameters<WorkspaceDemoRepository["getCheckpoint"]>[0]
) {
  const checkpoint = await repository.getCheckpoint(id);
  if (!checkpoint) throw new Error("Expected checkpoint.");
  return checkpoint;
}

function rule(
  strategy: Awaited<ReturnType<typeof requiredCheckpoint>>["strategy"],
  semanticKey: string
) {
  const result = strategy.sections
    .flatMap((section) => section.rules)
    .find((candidate) => candidate.semanticKey === semanticKey);
  if (!result) throw new Error(`Expected ${semanticKey} rule.`);
  return result;
}

function evaluationSetup(champion: "mara" | "iris") {
  return {
    window: { start: "2020-01-01", end: "2026-06-30" },
    benchmarkId: WORKSPACE_DEMO_IDS[champion].benchmark,
    startingCapital: 100_000,
    transactionCostBps: 10,
    fillModel: "next-session-open" as const,
    dataCutoff: isoTimestamp("2026-06-30T20:00:00.000Z"),
    timezone: "America/New_York",
    source: {
      provider: "Test provider",
      dataset: "Test immutable dataset",
    },
  };
}
