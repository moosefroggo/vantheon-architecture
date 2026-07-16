import { describe, expect, it } from "vitest";

import { entityId } from "@/domain/identity";

import { validateWorkspaceScenario } from "./invariants";
import { createWorkspaceDemoSeed, WORKSPACE_DEMO_IDS } from "./seed";

describe("normalized workspace demo seed", () => {
  it("satisfies all authority invariants", async () => {
    const scenario = await createWorkspaceDemoSeed();
    await expect(validateWorkspaceScenario(scenario)).resolves.toEqual([]);
  });

  it("models Iris Strategy V1 with one Paper and automatically opens Draft V2", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const champion = scenario.champions[WORKSPACE_DEMO_IDS.iris.champion];
    const currentDraft = scenario.drafts[champion.currentDraftId];
    const currentCheckpoint =
      scenario.checkpoints[currentDraft.currentCheckpointId];
    const frozen = scenario.strategies[WORKSPACE_DEMO_IDS.iris.strategyV1];

    expect(currentDraft).toMatchObject({ generation: 2, status: "active" });
    expect(currentCheckpoint.label).toBe("V2.1");
    expect(frozen.label).toBe("Strategy V1");
    expect(frozen.sourceCheckpointId).toBe(
      WORKSPACE_DEMO_IDS.iris.checkpointV11
    );
    expect(currentCheckpoint.strategyHash).toBe(frozen.strategyHash);
    expect(currentCheckpoint.strategy).toEqual(frozen.strategy);
    expect(currentCheckpoint.strategy).not.toBe(frozen.strategy);
    expect(currentCheckpoint.origin).toEqual({
      kind: "inherited",
      sourceStrategyId: WORKSPACE_DEMO_IDS.iris.strategyV1,
    });
    expect(champion.currentDraftId).toBe(WORKSPACE_DEMO_IDS.iris.draftV2);
  });

  it("uses monthly Iris runs and the launch benchmark consistently", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const runs = Object.values(scenario.runs).sort(
      (left, right) => left.sequence - right.sequence
    );
    const localDates = runs.map((run) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(run.scheduledFor))
    );

    expect(localDates).toEqual([
      "2026-02-02",
      "2026-03-02",
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
      "2026-07-01",
    ]);
    expect(new Set(runs.map((run) => run.benchmarkId))).toEqual(
      new Set([WORKSPACE_DEMO_IDS.iris.benchmark])
    );
    expect(
      scenario.benchmarks[WORKSPACE_DEMO_IDS.iris.benchmark].displayName
    ).toBe("SPDR S&P 500 ETF Trust");
    for (const run of runs) {
      const observation =
        scenario.benchmarkObservations[run.benchmarkObservationId];
      expect(observation).toMatchObject({
        portfolioId: WORKSPACE_DEMO_IDS.iris.portfolio,
        runId: run.id,
        benchmarkId: run.benchmarkId,
        observedAt: run.completedAt,
      });
    }
  });

  it("keeps Mara history sequential and the current checkpoint content distinct", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const v101 = scenario.checkpoints[WORKSPACE_DEMO_IDS.mara.checkpointV101];
    const v102 = scenario.checkpoints[WORKSPACE_DEMO_IDS.mara.checkpointV102];
    const versions = Object.values(scenario.strategies)
      .filter((strategy) => strategy.championId === WORKSPACE_DEMO_IDS.mara.champion)
      .map((strategy) => strategy.version)
      .sort((left, right) => left - right);
    expect(versions).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(v101.strategyHash).not.toBe(v102.strategyHash);
    expect(v101.strategy.sections[3].rules[0].value).toContain("10 positions");
    expect(v102.strategy.sections[3].rules[0].value).toContain("8 positions");
  });

  it("keeps every displayed checkpoint ordinal equal to its history count", async () => {
    const scenario = await createWorkspaceDemoSeed();

    for (const draft of Object.values(scenario.drafts)) {
      const current = scenario.checkpoints[draft.currentCheckpointId];
      const history = Object.values(scenario.checkpoints)
        .filter((checkpoint) => checkpoint.draftId === draft.id)
        .sort((left, right) => left.ordinal - right.ordinal);

      expect(history).toHaveLength(current.ordinal);
      expect(history.map((checkpoint) => checkpoint.ordinal)).toEqual(
        Array.from({ length: current.ordinal }, (_, index) => index + 1)
      );
    }
  });

  it("allows every Mara strategy version to keep an independently active Paper", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const portfolios = Object.values(scenario.portfolios).filter(
      (portfolio) => portfolio.championId === WORKSPACE_DEMO_IDS.mara.champion
    );
    const deployments = portfolios.map(
      (portfolio) => scenario.deployments[portfolio.deploymentId]
    );

    expect(portfolios).toHaveLength(9);
    expect(new Set(portfolios.map((portfolio) => portfolio.state))).toEqual(
      new Set(["active"])
    );
    expect(new Set(deployments.map((deployment) => deployment.state))).toEqual(
      new Set(["active"])
    );
  });

  it("keeps Mara Evaluation decision references unique and summary-derived", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const evaluation = scenario.evaluations[WORKSPACE_DEMO_IDS.mara.evaluation];
    const decisions = evaluation.decisionIds.map(
      (decisionId) => scenario.decisions[decisionId]
    );

    expect(evaluation.decisionIds).toEqual([
      "decision_mara_msft",
      "decision_mara_tsm",
    ]);
    expect(new Set(evaluation.decisionIds).size).toBe(
      evaluation.decisionIds.length
    );
    expect(decisions.map((decision) => decision.symbol)).toEqual([
      "MSFT",
      "TSM",
    ]);
    expect(evaluation.summary.decisions).toBe(decisions.length);
  });

  it("reconciles normalized Iris accounts, positions, orders, and fills", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const portfolio = scenario.portfolios[WORKSPACE_DEMO_IDS.iris.portfolio];
    const current =
      scenario.accountSnapshots[portfolio.currentAccountSnapshotId];
    const positions = Object.values(scenario.positions).filter(
      (position) => position.portfolioId === portfolio.id
    );
    const firstRun = Object.values(scenario.runs).sort(
      (left, right) => left.sequence - right.sequence
    )[0];

    expect(current).toMatchObject({
      cash: 22_800,
      positionsMarketValue: 81_000,
      accountValue: 103_800,
      netContributions: 100_000,
      unrealizedPnl: 1_000,
      income: 2_800,
    });
    expect(
      positions.reduce((sum, position) => sum + position.marketValue, 0)
    ).toBe(current.positionsMarketValue);
    expect(firstRun.decisionIds).toHaveLength(4);
    expect(firstRun.orderIds).toHaveLength(4);
    expect(Object.keys(scenario.fills)).toHaveLength(4);
    for (const orderId of firstRun.orderIds) {
      const order = scenario.orders[orderId];
      const fills = Object.values(scenario.fills).filter(
        (fill) => fill.orderId === order.id
      );
      expect(order.provenance).toMatchObject({
        kind: "portfolio-run",
        runId: firstRun.id,
      });
      expect(fills.reduce((sum, fill) => sum + fill.quantity, 0)).toBe(
        order.filledQuantity
      );
    }
  });

  it("reports hash, cadence, and reference corruption with precise codes", async () => {
    const scenario = await createWorkspaceDemoSeed();
    scenario.checkpoints[
      WORKSPACE_DEMO_IDS.mara.checkpointV12
    ].strategy.sections[0].rules[0].value = "Tampered";
    const firstRun = Object.values(scenario.runs)[0];
    firstRun.benchmarkId = entityId("benchmark", "benchmark_invalid");
    firstRun.scheduledFor = firstRun.scheduledFor.replace(
      "2026-02-02",
      "2026-02-09"
    ) as typeof firstRun.scheduledFor;
    scenario.orders[firstRun.orderIds[0]].filledQuantity += 1;
    scenario.evaluations[WORKSPACE_DEMO_IDS.mara.evaluation].decisionIds[1] =
      scenario.evaluations[
        WORKSPACE_DEMO_IDS.mara.evaluation
      ].decisionIds[0];

    const codes = new Set(
      (await validateWorkspaceScenario(scenario)).map(
        (violation) => violation.code
      )
    );
    expect([...codes]).toEqual(
      expect.arrayContaining([
        "checkpoint-hash-mismatch",
        "run-provenance-mismatch",
        "monthly-cadence-mismatch",
        "order-fill-quantity-mismatch",
        "duplicate-evaluation-decision-reference",
      ])
    );
  });

  it("rejects more than one Paper portfolio for an immutable strategy version", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const source = scenario.portfolios[WORKSPACE_DEMO_IDS.iris.portfolio];
    const duplicateId = entityId("paper-portfolio", "paper_portfolio_duplicate");
    scenario.portfolios[duplicateId] = {
      ...structuredClone(source),
      id: duplicateId,
      displayName: "Invalid duplicate",
    };

    const codes = (await validateWorkspaceScenario(scenario)).map(
      (violation) => violation.code
    );
    expect(codes).toContain("strategy-paper-cardinality-mismatch");
  });
});
