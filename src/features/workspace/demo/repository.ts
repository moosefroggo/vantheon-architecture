import {
  entityId,
  isoTimestamp,
  revisionToken,
  type DomainObjectKind,
  type EntityId,
  type RevisionToken,
} from "@/domain/identity";

import { sha256Canonical, hashStrategy } from "./hash";
import {
  assertValidWorkspaceScenario,
  validateWorkspaceScenario,
  type WorkspaceScenarioViolation,
} from "./invariants";
import type {
  WorkspaceDemoRepository,
  WorkspaceScenarioStorage,
} from "./ports";
import type {
  AcceptChangeCommand,
  AppendAtlasExchangeCommand,
  ArchivePaperCommand,
  ChangeSetRecord,
  DraftCheckpointRecord,
  DraftRecord,
  EvaluateDraftCommand,
  LaunchPaperCommand,
  ProposeChangeCommand,
  RejectChangeCommand,
  RestoreCheckpointCommand,
  SemanticRuleChange,
  StopPaperCommand,
  StructuredStrategy,
  UnarchivePaperCommand,
  WorkspaceCommand,
  WorkspaceCommandErrorCode,
  WorkspaceCommandReceipt,
  WorkspaceCommandResult,
  WorkspaceRuntime,
  WorkspaceScenario,
} from "./types";

type ResultOf<TKind extends WorkspaceCommandResult["kind"]> = Extract<
  WorkspaceCommandResult,
  { kind: TKind }
>;

export class WorkspaceAuthorityError extends Error {
  constructor(
    readonly code: WorkspaceCommandErrorCode,
    message: string
  ) {
    super(message);
    this.name = "WorkspaceAuthorityError";
  }
}

class WorkspaceCommandRejection extends WorkspaceAuthorityError {}

export class WorkspaceAuthorityRepository implements WorkspaceDemoRepository {
  constructor(
    private readonly storage: WorkspaceScenarioStorage,
    private readonly seed: WorkspaceScenario,
    private readonly runtime: WorkspaceRuntime = createDefaultWorkspaceRuntime()
  ) {}

  async initialize() {
    await assertValidWorkspaceScenario(this.seed);
    await this.storage.initialize(structuredClone(this.seed));
    await assertValidWorkspaceScenario(await this.storage.read());
  }

  async reset() {
    await assertValidWorkspaceScenario(this.seed);
    await this.storage.reset(structuredClone(this.seed));
  }

  close() {
    return this.storage.close();
  }

  async readSnapshot() {
    return structuredClone(await this.storage.read());
  }

  async listChampions() {
    const scenario = await this.storage.read();
    return cloneSorted(Object.values(scenario.champions), (left, right) =>
      left.displayName.localeCompare(right.displayName)
    );
  }

  async getChampion(id: EntityId<"champion">) {
    return cloneOptional((await this.storage.read()).champions[id]);
  }

  async getCurrentDraft(championId: EntityId<"champion">) {
    const scenario = await this.storage.read();
    const champion = scenario.champions[championId];
    return champion
      ? cloneOptional(scenario.drafts[champion.currentDraftId])
      : undefined;
  }

  async getDraft(id: EntityId<"draft">) {
    return cloneOptional((await this.storage.read()).drafts[id]);
  }

  async getCheckpoint(id: EntityId<"draft-checkpoint">) {
    return cloneOptional((await this.storage.read()).checkpoints[id]);
  }

  async listCheckpoints(championId: EntityId<"champion">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.checkpoints).filter(
        (checkpoint) => checkpoint.championId === championId
      ),
      (left, right) =>
        left.generation - right.generation || left.ordinal - right.ordinal
    );
  }

  async getChangeSet(id: EntityId<"change-set">) {
    return cloneOptional((await this.storage.read()).changeSets[id]);
  }

  async listChangeSets(draftId: EntityId<"draft">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.changeSets).filter(
        (changeSet) => changeSet.draftId === draftId
      ),
      (left, right) => left.createdAt.localeCompare(right.createdAt)
    );
  }

  async getEvaluation(id: EntityId<"evaluation">) {
    return cloneOptional((await this.storage.read()).evaluations[id]);
  }

  async listEvaluations(championId: EntityId<"champion">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.evaluations).filter(
        (evaluation) => evaluation.championId === championId
      ),
      (left, right) => left.startedAt.localeCompare(right.startedAt)
    );
  }

  async getPortfolio(id: EntityId<"paper-portfolio">) {
    return cloneOptional((await this.storage.read()).portfolios[id]);
  }

  async listPortfolios(
    championId: EntityId<"champion">,
    options: { includeArchived?: boolean } = {}
  ) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.portfolios).filter(
        (portfolio) =>
          portfolio.championId === championId &&
          (options.includeArchived || portfolio.state !== "archived")
      ),
      (left, right) => left.launchedAt.localeCompare(right.launchedAt)
    );
  }

  async listRuns(portfolioId: EntityId<"paper-portfolio">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.runs).filter(
        (run) => run.portfolioId === portfolioId
      ),
      (left, right) => left.sequence - right.sequence
    );
  }

  async listAccountSnapshots(portfolioId: EntityId<"paper-portfolio">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.accountSnapshots).filter(
        (snapshot) => snapshot.portfolioId === portfolioId
      ),
      (left, right) => left.asOf.localeCompare(right.asOf)
    );
  }

  async listPositions(portfolioId: EntityId<"paper-portfolio">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.positions).filter(
        (position) => position.portfolioId === portfolioId
      ),
      (left, right) => left.symbol.localeCompare(right.symbol)
    );
  }

  async listFills(portfolioId: EntityId<"paper-portfolio">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.fills).filter(
        (fill) => fill.portfolioId === portfolioId
      ),
      (left, right) => left.executedAt.localeCompare(right.executedAt)
    );
  }

  async listAtlasExchanges(championId: EntityId<"champion">) {
    const scenario = await this.storage.read();
    return cloneSorted(
      Object.values(scenario.atlasExchanges).filter(
        (exchange) => exchange.championId === championId
      ),
      (left, right) => left.sequence - right.sequence
    );
  }

  async getReceiptByIdempotencyKey(
    key: import("@/domain/identity").IdempotencyKey
  ) {
    const scenario = await this.storage.read();
    return cloneOptional(
      Object.values(scenario.receipts).find(
        (receipt) => receipt.idempotencyKey === key
      )
    );
  }

  resetDemo() {
    return this.reset();
  }

  proposeDraftChange(command: ProposeChangeCommand) {
    return this.propose(command);
  }

  acceptChangeSet(command: AcceptChangeCommand) {
    return this.accept(command);
  }

  rejectChangeSet(command: RejectChangeCommand) {
    return this.reject(command);
  }

  restoreCheckpoint(command: RestoreCheckpointCommand) {
    return this.restore(command);
  }

  runEvaluation(command: EvaluateDraftCommand) {
    return this.evaluate(command);
  }

  launchPaper(command: LaunchPaperCommand) {
    return this.launch(command);
  }

  stopPaper(command: StopPaperCommand) {
    return this.stop(command);
  }

  archivePaper(command: ArchivePaperCommand) {
    return this.archive(command);
  }

  unarchivePaper(command: UnarchivePaperCommand) {
    return this.unarchive(command);
  }

  propose(command: ProposeChangeCommand) {
    return this.apply<ResultOf<"change-set-created">>(
      command,
      async (scenario, now) => {
        const draft = requireDraft(scenario, command.draftId);
        requireActiveDraft(draft);
        requireRevision(
          draft.revision,
          command.expectedDraftRevision,
          "Draft"
        );
        if (draft.currentCheckpointId !== command.baseCheckpointId) {
          reject("stale-checkpoint", "Proposal base is not the current checkpoint.");
        }
        const base = requireCheckpoint(scenario, command.baseCheckpointId);
        const motivation = requireText(command.motivation, "Motivation");
        const changes = normalizeProposedChanges(base, command.changes);
        const changedIds = new Set(changes.map((change) => change.ruleId));
        const changeSetId = this.runtime.createId("change-set");
        const changeSet: ChangeSetRecord = {
          id: changeSetId,
          championId: draft.championId,
          draftId: draft.id,
          baseCheckpointId: base.id,
          kind: "rule-change",
          status: "proposed",
          changes,
          motivation,
          evidenceRefs: command.evidenceRefs?.map((value) => value.trim()).filter(Boolean) ?? [],
          expectedBenefit: optionalText(command.expectedBenefit),
          downside: optionalText(command.downside),
          unchangedRuleIds: strategyRules(base.strategy)
            .map((rule) => rule.id)
            .filter((id) => !changedIds.has(id)),
          createdBy: command.actor,
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.changeSets[changeSet.id] = changeSet;
        draft.revision = incrementRevision(draft.revision);

        return {
          kind: "change-set-created",
          changeSetId,
          changeSetRevision: changeSet.revision,
          draftRevision: draft.revision,
        };
      }
    );
  }

  accept(command: AcceptChangeCommand) {
    return this.apply<ResultOf<"change-set-accepted">>(
      command,
      async (scenario, now) => {
        const changeSet = requireChangeSet(scenario, command.changeSetId);
        requireRevision(
          changeSet.revision,
          command.expectedChangeSetRevision,
          "Change set"
        );
        if (changeSet.status !== "proposed") {
          reject("invalid-state", "Only a proposed change set can be accepted.");
        }
        const draft = requireDraft(scenario, changeSet.draftId);
        requireActiveDraft(draft);
        requireRevision(
          draft.revision,
          command.expectedDraftRevision,
          "Draft"
        );
        if (draft.currentCheckpointId !== changeSet.baseCheckpointId) {
          reject(
            "stale-checkpoint",
            "The Draft advanced after this change set was proposed."
          );
        }
        const current = requireCheckpoint(scenario, draft.currentCheckpointId);
        const nextStrategy = strategyForAcceptedChange(scenario, changeSet, current);
        const strategyHash = await hashStrategy(nextStrategy);
        const checkpointId = this.runtime.createId("draft-checkpoint");
        const checkpoint: DraftCheckpointRecord = {
          id: checkpointId,
          championId: draft.championId,
          draftId: draft.id,
          generation: draft.generation,
          ordinal: current.ordinal + 1,
          label: `V${draft.generation}.${current.ordinal + 1}`,
          previousCheckpointId: current.id,
          origin: { kind: "accepted-change-set", changeSetId: changeSet.id },
          strategy: nextStrategy,
          strategyHash,
          createdBy: command.actor,
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.checkpoints[checkpoint.id] = checkpoint;
        draft.currentCheckpointId = checkpoint.id;
        draft.revision = incrementRevision(draft.revision);
        changeSet.status = "accepted";
        changeSet.resultCheckpointId = checkpoint.id;
        changeSet.decidedAt = now;
        changeSet.revision = incrementRevision(changeSet.revision);

        return {
          kind: "change-set-accepted",
          changeSetId: changeSet.id,
          checkpointId: checkpoint.id,
          draftRevision: draft.revision,
        };
      }
    );
  }

  reject(command: RejectChangeCommand) {
    return this.apply<ResultOf<"change-set-rejected">>(
      command,
      async (scenario, now) => {
        const changeSet = requireChangeSet(scenario, command.changeSetId);
        requireRevision(
          changeSet.revision,
          command.expectedChangeSetRevision,
          "Change set"
        );
        if (changeSet.status !== "proposed") {
          reject("invalid-state", "Only a proposed change set can be rejected.");
        }
        changeSet.status = "rejected";
        changeSet.decidedAt = now;
        changeSet.decisionReason = optionalText(command.reason);
        changeSet.revision = incrementRevision(changeSet.revision);
        return {
          kind: "change-set-rejected",
          changeSetId: changeSet.id,
          changeSetRevision: changeSet.revision,
        };
      }
    );
  }

  restore(command: RestoreCheckpointCommand) {
    return this.apply<ResultOf<"change-set-created">>(
      command,
      async (scenario, now) => {
        const draft = requireDraft(scenario, command.draftId);
        requireActiveDraft(draft);
        requireRevision(
          draft.revision,
          command.expectedDraftRevision,
          "Draft"
        );
        const current = requireCheckpoint(scenario, draft.currentCheckpointId);
        const source = requireCheckpoint(scenario, command.sourceCheckpointId);
        const sourceDraft = requireDraft(scenario, source.draftId);
        if (
          source.championId !== draft.championId ||
          sourceDraft.lineageId !== draft.lineageId
        ) {
          reject(
            "invalid-command",
            "Restore source must belong to the same Champion lineage."
          );
        }
        if (source.id === current.id || source.strategyHash === current.strategyHash) {
          reject(
            "invalid-command",
            "Restore source must differ from the current checkpoint."
          );
        }
        if (source.strategy.schemaVersion !== current.strategy.schemaVersion) {
          reject(
            "invalid-command",
            "Restore source uses an incompatible strategy schema."
          );
        }
        const changes = diffStrategies(current.strategy, source.strategy);
        if (changes.length === 0) {
          reject("invalid-command", "Restore has no semantic differences.");
        }
        const changedIds = new Set(changes.map((change) => change.ruleId));
        const changeSetId = this.runtime.createId("change-set");
        const changeSet: ChangeSetRecord = {
          id: changeSetId,
          championId: draft.championId,
          draftId: draft.id,
          baseCheckpointId: current.id,
          kind: "restore",
          restoreSourceCheckpointId: source.id,
          status: "proposed",
          changes,
          motivation: requireText(command.motivation, "Motivation"),
          evidenceRefs: [],
          unchangedRuleIds: strategyRules(current.strategy)
            .map((rule) => rule.id)
            .filter((id) => !changedIds.has(id)),
          createdBy: command.actor,
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.changeSets[changeSet.id] = changeSet;
        draft.revision = incrementRevision(draft.revision);
        return {
          kind: "change-set-created",
          changeSetId,
          changeSetRevision: changeSet.revision,
          draftRevision: draft.revision,
        };
      }
    );
  }

  evaluate(command: EvaluateDraftCommand) {
    return this.apply<ResultOf<"evaluation-completed">>(
      command,
      async (scenario, now) => {
        const draft = requireDraft(scenario, command.draftId);
        requireEvaluableDraft(draft);
        requireRevision(
          draft.revision,
          command.expectedDraftRevision,
          "Draft"
        );
        if (draft.currentCheckpointId !== command.checkpointId) {
          reject(
            "stale-checkpoint",
            "Evaluation must test the current accepted checkpoint."
          );
        }
        const checkpoint = requireCheckpoint(scenario, command.checkpointId);
        validateEvaluationSetup(scenario, command.setup);

        const evaluationId = this.runtime.createId("evaluation");
        const sourceId = this.runtime.createId("source-artifact");
        const decisionEligibleId = this.runtime.createId("decision");
        const decisionRejectedId = this.runtime.createId("decision");
        const eventIds = Array.from({ length: 5 }, () =>
          this.runtime.createId("evaluation-event")
        );
        const rules = strategyRules(checkpoint.strategy);
        const selectionRule =
          rules.find((rule) => rule.semanticKey === "selection") ?? rules[0];
        const portfolioRule =
          rules.find((rule) => rule.semanticKey === "portfolio") ?? rules[0];
        if (!selectionRule || !portfolioRule) {
          reject("invalid-command", "Strategy must contain evaluable rules.");
        }

        scenario.sourceArtifacts[sourceId] = {
          id: sourceId,
          provider: command.setup.source.provider,
          dataset: command.setup.source.dataset,
          asOf: command.setup.dataCutoff,
          immutableLocator: `demo://evaluation/${evaluationId}/source`,
          revision: initialRevision(),
        };
        scenario.decisions[decisionEligibleId] = {
          id: decisionEligibleId,
          evaluationId,
          symbol: "DEMO-A",
          outcome: "eligible",
          evidence: "Selection rules passed; no order was submitted.",
          ruleIds: [selectionRule.id],
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.decisions[decisionRejectedId] = {
          id: decisionRejectedId,
          evaluationId,
          symbol: "DEMO-B",
          outcome: "rejected",
          evidence: "Portfolio constraint rejected the candidate.",
          ruleIds: [portfolioRule.id],
          createdAt: now,
          revision: initialRevision(),
        };
        const phases = [
          ["preflight", "Validated checkpoint and strategy hash."],
          ["data", "Bound immutable source evidence."],
          ["rules", "Recorded explicit rule outcomes."],
          ["decisions", "Recorded decisions separately from orders."],
          ["complete", "Completed the bounded Evaluation."],
        ] as const;
        phases.forEach(([phase, message], index) => {
          const id = eventIds[index];
          scenario.evaluationEvents[id] = {
            id,
            evaluationId,
            sequence: index + 1,
            phase,
            status: "completed",
            message,
            occurredAt: now,
            revision: initialRevision(),
          };
        });
        scenario.evaluations[evaluationId] = {
          id: evaluationId,
          championId: draft.championId,
          draftId: draft.id,
          checkpointId: checkpoint.id,
          strategyHash: checkpoint.strategyHash,
          setup: structuredClone(command.setup),
          status: "completed",
          ruleEvaluations: rules.map((rule) => ({
            ruleId: rule.id,
            status: "passed",
            observedValue: "Evaluated against the declared setup",
            sourceArtifactId: sourceId,
          })),
          decisionIds: [decisionEligibleId, decisionRejectedId],
          orderIds: [],
          eventIds,
          sourceArtifactIds: [sourceId],
          summary: {
            decisions: 2,
            proposedOrders: 0,
            submittedOrders: 0,
            nearMisses: 1,
          },
          startedAt: now,
          completedAt: now,
          revision: initialRevision(),
        };
        return {
          kind: "evaluation-completed",
          evaluationId,
          checkpointId: checkpoint.id,
        };
      }
    );
  }

  launch(command: LaunchPaperCommand) {
    return this.apply<ResultOf<"paper-launched">>(
      command,
      async (scenario, now) => {
        const draft = requireDraft(scenario, command.draftId);
        requireActiveDraft(draft);
        requireRevision(
          draft.revision,
          command.expectedDraftRevision,
          "Draft"
        );
        if (draft.currentCheckpointId !== command.checkpointId) {
          reject("stale-checkpoint", "Paper launch checkpoint is stale.");
        }
        const checkpoint = requireCheckpoint(scenario, command.checkpointId);
        const evaluation = scenario.evaluations[command.evaluationId];
        if (
          !evaluation ||
          evaluation.status !== "completed" ||
          evaluation.checkpointId !== checkpoint.id
        ) {
          reject(
            "checkpoint-not-evaluated",
            "Paper launch requires a completed Evaluation of this checkpoint."
          );
        }
        if (evaluation.strategyHash !== checkpoint.strategyHash) {
          reject(
            "strategy-hash-mismatch",
            "Evaluation strategy hash does not match the launch checkpoint."
          );
        }
        const displayName = requireText(command.portfolioName, "Portfolio name");
        if (
          Object.values(scenario.portfolios).some(
            (portfolio) =>
              portfolio.championId === draft.championId &&
              portfolio.displayName.toLocaleLowerCase() ===
                displayName.toLocaleLowerCase()
          )
        ) {
          reject(
            "invalid-command",
            "Portfolio name must be unique within the Champion."
          );
        }
        if (!Number.isFinite(command.simulatedCapital) || command.simulatedCapital <= 0) {
          reject(
            "invalid-command",
            "Simulated capital must be a positive finite amount."
          );
        }

        const strategyId = this.runtime.createId("immutable-strategy");
        const portfolioId = this.runtime.createId("paper-portfolio");
        const deploymentId = this.runtime.createId("deployment");
        const scheduleId = this.runtime.createId("schedule");
        const initialAccountSnapshotId = this.runtime.createId(
          "portfolio-account-snapshot"
        );
        const benchmarkObservationId = this.runtime.createId(
          "benchmark-observation"
        );
        const nextDraftId = this.runtime.createId("draft");
        const nextCheckpointId = this.runtime.createId("draft-checkpoint");
        const strategyVersion = draft.generation;
        if (
          Object.values(scenario.strategies).some(
            (strategy) =>
              strategy.lineageId === draft.lineageId &&
              strategy.version === strategyVersion
          )
        ) {
          reject(
            "invalid-state",
            `Strategy V${strategyVersion} already has its immutable Paper version.`
          );
        }
        scenario.strategies[strategyId] = {
          id: strategyId,
          championId: draft.championId,
          lineageId: draft.lineageId,
          version: strategyVersion,
          label: `Strategy V${strategyVersion}`,
          sourceCheckpointId: checkpoint.id,
          strategy: structuredClone(checkpoint.strategy),
          strategyHash: checkpoint.strategyHash,
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.portfolios[portfolioId] = {
          id: portfolioId,
          championId: draft.championId,
          displayName,
          strategyId,
          sourceCheckpointId: checkpoint.id,
          deploymentId,
          scheduleId,
          benchmarkId: evaluation.setup.benchmarkId,
          currentAccountSnapshotId: initialAccountSnapshotId,
          state: "active",
          simulatedCapital: command.simulatedCapital,
          launchedAt: now,
          revision: initialRevision(),
        };
        scenario.deployments[deploymentId] = {
          id: deploymentId,
          portfolioId,
          strategyId,
          scheduleId,
          state: "active",
          startedAt: now,
          revision: initialRevision(),
        };
        scenario.schedules[scheduleId] = {
          id: scheduleId,
          portfolioId,
          definition: structuredClone(checkpoint.strategy.schedule),
          effectiveFrom: now,
          revision: initialRevision(),
        };
        scenario.accountSnapshots[initialAccountSnapshotId] = {
          id: initialAccountSnapshotId,
          portfolioId,
          asOf: now,
          currency: "USD",
          cash: command.simulatedCapital,
          reservedCash: 0,
          buyingPower: command.simulatedCapital,
          positionsMarketValue: 0,
          grossExposureValue: 0,
          netExposureValue: 0,
          accountValue: command.simulatedCapital,
          netContributions: command.simulatedCapital,
          realizedPnl: 0,
          unrealizedPnl: 0,
          income: 0,
          fees: 0,
          dailyPnlExFlows: 0,
          cumulativeTimeWeightedReturn: 0,
          revision: initialRevision(),
        };
        scenario.benchmarkObservations[benchmarkObservationId] = {
          id: benchmarkObservationId,
          benchmarkId: evaluation.setup.benchmarkId,
          portfolioId,
          observedAt: now,
          normalizedValue: 100_000,
          revision: initialRevision(),
        };
        draft.status = "launched";
        draft.revision = incrementRevision(draft.revision);
        const nextGeneration = strategyVersion + 1;
        scenario.checkpoints[nextCheckpointId] = {
          id: nextCheckpointId,
          championId: draft.championId,
          draftId: nextDraftId,
          generation: nextGeneration,
          ordinal: 1,
          label: `V${nextGeneration}.1`,
          origin: { kind: "inherited", sourceStrategyId: strategyId },
          strategy: structuredClone(checkpoint.strategy),
          strategyHash: checkpoint.strategyHash,
          createdBy: command.actor,
          createdAt: now,
          revision: initialRevision(),
        };
        scenario.drafts[nextDraftId] = {
          id: nextDraftId,
          championId: draft.championId,
          lineageId: draft.lineageId,
          generation: nextGeneration,
          status: "active",
          currentCheckpointId: nextCheckpointId,
          revision: initialRevision(),
          createdAt: now,
        };
        const champion = scenario.champions[draft.championId];
        champion.currentDraftId = nextDraftId;
        champion.revision = incrementRevision(champion.revision);

        return {
          kind: "paper-launched",
          portfolioId,
          strategyId,
          initialAccountSnapshotId,
          nextDraftId,
          nextCheckpointId,
        };
      }
    );
  }

  stop(command: StopPaperCommand) {
    return this.changePortfolioState(command, "active", "stopped");
  }

  archive(command: ArchivePaperCommand) {
    return this.changePortfolioState(command, ["active", "stopped"], "archived");
  }

  unarchive(command: UnarchivePaperCommand) {
    return this.changePortfolioState(command, "archived", "stopped");
  }

  appendAtlasExchange(command: AppendAtlasExchangeCommand) {
    return this.apply<ResultOf<"atlas-exchange-appended">>(
      command,
      async (scenario, now) => {
        if (!scenario.champions[command.championId]) {
          reject("unknown-entity", "Atlas exchange Champion does not exist.");
        }
        const userText = requireText(command.userText, "Sent Atlas message");
        const assistantText = optionalText(command.assistantText);
        const exchangeId = this.runtime.createId("atlas-exchange");
        const sequence =
          Math.max(
            0,
            ...Object.values(scenario.atlasExchanges)
              .filter(
                (exchange) => exchange.championId === command.championId
              )
              .map((exchange) => exchange.sequence)
          ) + 1;
        const status = assistantText ? "completed" : "sent";
        scenario.atlasExchanges[exchangeId] = {
          id: exchangeId,
          championId: command.championId,
          sequence,
          userText,
          assistantText,
          status,
          references: structuredClone(command.references ?? []),
          sentAt: command.submittedAt,
          completedAt: assistantText ? now : undefined,
          revision: initialRevision(),
        };
        return {
          kind: "atlas-exchange-appended",
          exchangeId,
          status,
        };
      }
    );
  }

  private changePortfolioState(
    command: StopPaperCommand | ArchivePaperCommand | UnarchivePaperCommand,
    expectedState:
      | "active"
      | "stopped"
      | "archived"
      | readonly ("active" | "stopped" | "archived")[],
    nextState: "stopped" | "archived"
  ) {
    return this.apply<ResultOf<"portfolio-state-changed">>(
      command,
      async (scenario, now) => {
        const portfolio = scenario.portfolios[command.portfolioId];
        if (!portfolio) {
          reject("unknown-entity", "Paper portfolio does not exist.");
        }
        requireRevision(
          portfolio.revision,
          command.expectedPortfolioRevision,
          "Paper portfolio"
        );
        const expectedStates = Array.isArray(expectedState)
          ? expectedState
          : [expectedState];
        if (!expectedStates.includes(portfolio.state)) {
          reject(
            "invalid-state",
            `${command.type} requires a ${expectedStates.join(" or ")} Paper portfolio.`
          );
        }
        const deployment = scenario.deployments[portfolio.deploymentId];
        if (!deployment) {
          reject("unknown-entity", "Paper deployment does not exist.");
        }
        const previousState = portfolio.state;
        portfolio.state = nextState;
        portfolio.revision = incrementRevision(portfolio.revision);
        if (
          command.type === "stop" ||
          (command.type === "archive" && previousState === "active")
        ) {
          portfolio.stoppedAt = now;
          deployment.state = "stopped";
          deployment.stoppedAt = now;
          deployment.revision = incrementRevision(deployment.revision);
          const schedule = scenario.schedules[portfolio.scheduleId];
          if (!schedule) {
            reject("unknown-entity", "Paper schedule does not exist.");
          }
          schedule.nextRunAt = undefined;
          schedule.revision = incrementRevision(schedule.revision);
        }
        if (command.type === "archive") {
          portfolio.archivedAt = now;
        }
        // Unarchive deliberately returns to stopped and never restarts a deployment.
        return {
          kind: "portfolio-state-changed",
          portfolioId: portfolio.id,
          state: portfolio.state,
          portfolioRevision: portfolio.revision,
        };
      }
    );
  }

  private async apply<TResult extends WorkspaceCommandResult>(
    command: WorkspaceCommand,
    handler: (
      scenario: WorkspaceScenario,
      now: ReturnType<WorkspaceRuntime["now"]>
    ) => Promise<TResult>
  ): Promise<WorkspaceCommandReceipt<TResult>> {
    const fingerprint = await sha256Canonical(command);
    return this.storage.mutate(async (scenario) => {
      const existing = Object.values(scenario.receipts).find(
        (receipt) => receipt.idempotencyKey === command.idempotencyKey
      );
      if (existing) {
        if (
          existing.commandFingerprint !== fingerprint ||
          existing.commandType !== command.type
        ) {
          throw new WorkspaceAuthorityError(
            "idempotency-key-conflict",
            "Idempotency key was already used for a different command."
          );
        }
        return structuredClone(existing) as WorkspaceCommandReceipt<TResult>;
      }

      const now = this.runtime.now();
      const working = structuredClone(scenario);
      let result: TResult | undefined;
      let failure:
        | { code: WorkspaceCommandErrorCode; message: string }
        | undefined;
      let outcome: WorkspaceCommandReceipt["outcome"] = "applied";

      try {
        result = await handler(working, now);
        const violations = await validateWorkspaceScenario(working);
        if (violations.length > 0) {
          outcome = "failed";
          failure = invariantFailure(violations);
          result = undefined;
        }
      } catch (error) {
        result = undefined;
        if (error instanceof WorkspaceCommandRejection) {
          outcome = isConflictCode(error.code) ? "conflicted" : "rejected";
          failure = { code: error.code, message: error.message };
        } else {
          outcome = "failed";
          failure = {
            code: "invariant-violation",
            message:
              error instanceof Error
                ? error.message
                : "Unknown demo authority failure.",
          };
        }
      }

      const target = outcome === "applied" ? working : scenario;
      target.revision = incrementRevision(scenario.revision);
      target.clock = now;
      const receipt: WorkspaceCommandReceipt<TResult> = {
        id: this.runtime.createId("command-receipt"),
        commandId: command.commandId,
        idempotencyKey: command.idempotencyKey,
        commandType: command.type,
        commandFingerprint: fingerprint,
        outcome,
        result,
        failure,
        submittedAt: command.submittedAt,
        acceptedAt: now,
        completedAt: now,
        lifecycle: [
          { state: "submitted", occurredAt: command.submittedAt },
          { state: "accepted", occurredAt: now },
          { state: outcome, occurredAt: now },
        ],
        scenarioRevision: target.revision,
        revision: initialRevision(),
      };
      target.receipts[receipt.id] = receipt;
      replaceScenario(scenario, target);
      return structuredClone(receipt);
    });
  }
}

function isConflictCode(code: WorkspaceCommandErrorCode) {
  return code === "stale-revision" || code === "stale-checkpoint";
}

let fallbackIdSequence = 0;

export function createDefaultWorkspaceRuntime(): WorkspaceRuntime {
  return {
    now: () => isoTimestamp(new Date().toISOString()),
    createId: <TKind extends DomainObjectKind>(kind: TKind) => {
      const cryptoId = globalThis.crypto?.randomUUID?.();
      const suffix = cryptoId
        ? cryptoId.replaceAll("-", "_")
        : `${Date.now()}_${++fallbackIdSequence}`;
      return entityId(kind, `${kind.replaceAll("-", "_")}_${suffix}`);
    },
  };
}

function requireDraft(scenario: WorkspaceScenario, id: EntityId<"draft">) {
  const draft = scenario.drafts[id];
  if (!draft) reject("unknown-entity", "Draft does not exist.");
  return draft;
}

function requireCheckpoint(
  scenario: WorkspaceScenario,
  id: EntityId<"draft-checkpoint">
) {
  const checkpoint = scenario.checkpoints[id];
  if (!checkpoint) reject("unknown-entity", "Draft checkpoint does not exist.");
  return checkpoint;
}

function requireChangeSet(
  scenario: WorkspaceScenario,
  id: EntityId<"change-set">
) {
  const changeSet = scenario.changeSets[id];
  if (!changeSet) reject("unknown-entity", "Change set does not exist.");
  return changeSet;
}

function requireActiveDraft(draft: DraftRecord) {
  if (draft.status !== "active") {
    reject("invalid-state", "Command target must be the active Draft.");
  }
}

function requireEvaluableDraft(draft: DraftRecord) {
  if (draft.status !== "active" && draft.status !== "launched") {
    reject("invalid-state", "Command target must be an active or launched Draft.");
  }
}

function requireRevision(
  actual: RevisionToken,
  expected: RevisionToken,
  label: string
) {
  if (actual !== expected) {
    reject(
      "stale-revision",
      `${label} revision is stale; refresh before retrying.`
    );
  }
}

function requireText(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) reject("invalid-command", `${label} is required.`);
  return normalized;
}

function optionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeProposedChanges(
  checkpoint: DraftCheckpointRecord,
  proposed: ProposeChangeCommand["changes"]
): SemanticRuleChange[] {
  if (proposed.length === 0) {
    reject("invalid-command", "At least one semantic change is required.");
  }
  const rules = new Map(
    strategyRules(checkpoint.strategy).map((rule) => [rule.id, rule])
  );
  const seen = new Set<string>();
  return proposed.map((change) => {
    if (seen.has(change.ruleId)) {
      reject("invalid-command", "A rule may appear only once per proposal.");
    }
    seen.add(change.ruleId);
    const rule = rules.get(change.ruleId);
    if (!rule) reject("invalid-command", "Proposed rule does not exist.");
    if (rule.semanticKey === "schedule") {
      reject(
        "invalid-command",
        "Schedule changes require a typed schedule-definition command."
      );
    }
    if (rule.value !== change.expectedValue) {
      reject("stale-checkpoint", "Proposed rule value is stale.");
    }
    const after = requireText(change.proposedValue, "Proposed rule value");
    if (after === rule.value) {
      reject("invalid-command", "Proposal must change rule semantics.");
    }
    return { ruleId: rule.id, before: rule.value, after };
  });
}

function strategyForAcceptedChange(
  scenario: WorkspaceScenario,
  changeSet: ChangeSetRecord,
  current: DraftCheckpointRecord
) {
  if (changeSet.kind === "restore") {
    const source = changeSet.restoreSourceCheckpointId
      ? scenario.checkpoints[changeSet.restoreSourceCheckpointId]
      : undefined;
    if (!source) reject("unknown-entity", "Restore source no longer exists.");
    return structuredClone(source.strategy);
  }

  const strategy = structuredClone(current.strategy);
  const rules = new Map(strategyRules(strategy).map((rule) => [rule.id, rule]));
  for (const change of changeSet.changes) {
    const rule = rules.get(change.ruleId);
    if (!rule || rule.value !== change.before) {
      reject(
        "stale-checkpoint",
        "Change set no longer matches its base strategy."
      );
    }
    rule.value = change.after;
  }
  return strategy;
}

function diffStrategies(
  current: StructuredStrategy,
  source: StructuredStrategy
): SemanticRuleChange[] {
  const currentRules = new Map(
    strategyRules(current).map((rule) => [rule.id, rule])
  );
  const sourceRules = new Map(strategyRules(source).map((rule) => [rule.id, rule]));
  if (
    currentRules.size !== sourceRules.size ||
    [...currentRules.keys()].some((id) => !sourceRules.has(id))
  ) {
    reject(
      "invalid-command",
      "Restore source has an incompatible structured rule set."
    );
  }
  return [...currentRules.values()].flatMap((rule) => {
    const sourceRule = sourceRules.get(rule.id);
    return sourceRule && sourceRule.value !== rule.value
      ? [{ ruleId: rule.id, before: rule.value, after: sourceRule.value }]
      : [];
  });
}

function strategyRules(strategy: StructuredStrategy) {
  return strategy.sections.flatMap((section) => section.rules);
}

function validateEvaluationSetup(
  scenario: WorkspaceScenario,
  setup: EvaluateDraftCommand["setup"]
) {
  if (
    Number.isNaN(Date.parse(setup.window.start)) ||
    Number.isNaN(Date.parse(setup.window.end)) ||
    Date.parse(setup.window.start) >= Date.parse(setup.window.end)
  ) {
    reject("invalid-command", "Evaluation window must be ordered dates.");
  }
  if (!scenario.benchmarks[setup.benchmarkId]) {
    reject("unknown-entity", "Evaluation benchmark does not exist.");
  }
  if (!Number.isFinite(setup.startingCapital) || setup.startingCapital <= 0) {
    reject("invalid-command", "Starting capital must be positive.");
  }
  if (
    !Number.isFinite(setup.transactionCostBps) ||
    setup.transactionCostBps < 0
  ) {
    reject("invalid-command", "Transaction costs cannot be negative.");
  }
  requireText(setup.timezone, "Evaluation timezone");
  requireText(setup.source.provider, "Source provider");
  requireText(setup.source.dataset, "Source dataset");
}

function reject(code: WorkspaceCommandErrorCode, message: string): never {
  throw new WorkspaceCommandRejection(code, message);
}

function initialRevision() {
  return revisionToken("rev_000001");
}

export function incrementRevision(revision: RevisionToken) {
  const match = /^rev_([0-9]{6})$/.exec(revision);
  if (!match) {
    throw new WorkspaceAuthorityError(
      "invariant-violation",
      `Cannot increment malformed revision ${revision}.`
    );
  }
  return revisionToken(
    `rev_${String(Number(match[1]) + 1).padStart(6, "0")}`
  );
}

function invariantFailure(violations: WorkspaceScenarioViolation[]) {
  const first = violations[0];
  return {
    code: "invariant-violation" as const,
    message: `${first.path}: ${first.message}`,
  };
}

function replaceScenario(target: WorkspaceScenario, source: WorkspaceScenario) {
  if (target === source) return;
  Object.assign(target, structuredClone(source));
}

function cloneOptional<T>(value: T | undefined) {
  return value === undefined ? undefined : structuredClone(value);
}

function cloneSorted<T>(values: T[], compare: (left: T, right: T) => number) {
  return structuredClone(values.sort(compare));
}
