import type {
  ActorReference,
  AnyDomainReference,
  EntityId,
  IdempotencyKey,
  IsoTimestamp,
  RevisionToken,
  SchemaVersion,
  StrategyContentHash,
} from "@/domain/identity";

export type EntityTable<TRecord extends { id: string }> = Record<string, TRecord>;

export interface WorkspaceScenario {
  id: EntityId<"workspace-scenario">;
  schemaVersion: SchemaVersion;
  seedVersion: number;
  revision: RevisionToken;
  seededAt: IsoTimestamp;
  clock: IsoTimestamp;
  users: EntityTable<UserRecord>;
  champions: EntityTable<ChampionRecord>;
  drafts: EntityTable<DraftRecord>;
  checkpoints: EntityTable<DraftCheckpointRecord>;
  strategies: EntityTable<ImmutableStrategyRecord>;
  changeSets: EntityTable<ChangeSetRecord>;
  evaluations: EntityTable<EvaluationRecord>;
  evaluationEvents: EntityTable<EvaluationEventRecord>;
  sourceArtifacts: EntityTable<SourceArtifactRecord>;
  decisions: EntityTable<DecisionRecord>;
  orders: EntityTable<OrderRecord>;
  fills: EntityTable<FillRecord>;
  portfolios: EntityTable<PaperPortfolioRecord>;
  accountSnapshots: EntityTable<PortfolioAccountSnapshotRecord>;
  positions: EntityTable<PositionRecord>;
  deployments: EntityTable<DeploymentRecord>;
  schedules: EntityTable<ScheduleRecord>;
  benchmarks: EntityTable<BenchmarkRecord>;
  benchmarkObservations: EntityTable<BenchmarkObservationRecord>;
  runs: EntityTable<PortfolioRunRecord>;
  atlasExchanges: EntityTable<AtlasExchangeRecord>;
  receipts: EntityTable<WorkspaceCommandReceipt>;
}

export interface UserRecord {
  id: EntityId<"user">;
  displayName: string;
  revision: RevisionToken;
}

export interface ChampionRecord {
  id: EntityId<"champion">;
  displayName: string;
  initials: string;
  workspaceTitle: string;
  lineageId: EntityId<"strategy-lineage">;
  currentDraftId: EntityId<"draft">;
  revision: RevisionToken;
}

export type StrategySectionKind =
  | "universe"
  | "selection"
  | "exit"
  | "portfolio"
  | "risk"
  | "schedule";

export interface StrategyRule {
  id: EntityId<"strategy-rule">;
  semanticKey: string;
  label: string;
  value: string;
  constraint?: string;
  rationale?: string;
  dataRequirementIds: string[];
}

export interface StrategySection {
  id: string;
  kind: StrategySectionKind;
  title: string;
  rules: StrategyRule[];
}

export type StrategyScheduleDefinition =
  | {
      cadence: "weekly";
      weekday: 1 | 2 | 3 | 4 | 5;
      timezone: string;
      localTime: string;
      holidayPolicy: "next-business-day";
    }
  | {
      cadence: "monthly-first-business-day";
      timezone: string;
      localTime: string;
      holidayPolicy: "next-business-day";
    };

export interface StructuredStrategy {
  schemaVersion: SchemaVersion;
  title: string;
  objective: string;
  sections: StrategySection[];
  assumptions: string[];
  exclusions: string[];
  schedule: StrategyScheduleDefinition;
}

export type DraftStatus = "active" | "launched";

export interface DraftRecord {
  id: EntityId<"draft">;
  championId: EntityId<"champion">;
  lineageId: EntityId<"strategy-lineage">;
  generation: number;
  status: DraftStatus;
  currentCheckpointId: EntityId<"draft-checkpoint">;
  revision: RevisionToken;
  createdAt: IsoTimestamp;
}

export type DraftCheckpointOrigin =
  | { kind: "initial" }
  | {
      kind: "accepted-change-set";
      changeSetId: EntityId<"change-set">;
    }
  | {
      kind: "paper-launch-clone";
      portfolioId: EntityId<"paper-portfolio">;
      sourceCheckpointId: EntityId<"draft-checkpoint">;
    };

export interface DraftCheckpointRecord {
  id: EntityId<"draft-checkpoint">;
  championId: EntityId<"champion">;
  draftId: EntityId<"draft">;
  generation: number;
  ordinal: number;
  label: string;
  previousCheckpointId?: EntityId<"draft-checkpoint">;
  origin: DraftCheckpointOrigin;
  strategy: StructuredStrategy;
  strategyHash: StrategyContentHash;
  createdBy: ActorReference;
  createdAt: IsoTimestamp;
  revision: RevisionToken;
}

export interface ImmutableStrategyRecord {
  id: EntityId<"immutable-strategy">;
  championId: EntityId<"champion">;
  lineageId: EntityId<"strategy-lineage">;
  version: number;
  label: string;
  sourceCheckpointId: EntityId<"draft-checkpoint">;
  strategy: StructuredStrategy;
  strategyHash: StrategyContentHash;
  createdAt: IsoTimestamp;
  revision: RevisionToken;
}

export interface SemanticRuleChange {
  ruleId: EntityId<"strategy-rule">;
  before: string;
  after: string;
}

export type ChangeSetStatus =
  | "proposed"
  | "accepted"
  | "rejected"
  | "failed"
  | "conflicted"
  | "cancelled"
  | "superseded";

export interface ChangeSetRecord {
  id: EntityId<"change-set">;
  championId: EntityId<"champion">;
  draftId: EntityId<"draft">;
  baseCheckpointId: EntityId<"draft-checkpoint">;
  kind: "rule-change" | "restore";
  restoreSourceCheckpointId?: EntityId<"draft-checkpoint">;
  status: ChangeSetStatus;
  changes: SemanticRuleChange[];
  motivation: string;
  evidenceRefs: string[];
  expectedBenefit?: string;
  downside?: string;
  unchangedRuleIds: EntityId<"strategy-rule">[];
  resultCheckpointId?: EntityId<"draft-checkpoint">;
  createdBy: ActorReference;
  createdAt: IsoTimestamp;
  decidedAt?: IsoTimestamp;
  decisionReason?: string;
  revision: RevisionToken;
}

export interface EvaluationSetup {
  window: { start: string; end: string };
  benchmarkId: EntityId<"benchmark">;
  startingCapital: number;
  transactionCostBps: number;
  fillModel: "next-session-open";
  dataCutoff: IsoTimestamp;
  timezone: string;
  source: {
    provider: string;
    dataset: string;
  };
}

export type EvaluationStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "inconclusive";

export interface RuleEvaluationResult {
  ruleId: EntityId<"strategy-rule">;
  status: "passed" | "failed" | "unavailable" | "not-reached";
  observedValue?: string;
  sourceArtifactId?: EntityId<"source-artifact">;
}

export interface EvaluationRecord {
  id: EntityId<"evaluation">;
  championId: EntityId<"champion">;
  draftId: EntityId<"draft">;
  checkpointId: EntityId<"draft-checkpoint">;
  strategyHash: StrategyContentHash;
  setup: EvaluationSetup;
  status: EvaluationStatus;
  ruleEvaluations: RuleEvaluationResult[];
  decisionIds: EntityId<"decision">[];
  orderIds: EntityId<"order">[];
  eventIds: EntityId<"evaluation-event">[];
  sourceArtifactIds: EntityId<"source-artifact">[];
  summary: {
    decisions: number;
    proposedOrders: number;
    submittedOrders: number;
    nearMisses: number;
  };
  startedAt: IsoTimestamp;
  completedAt?: IsoTimestamp;
  revision: RevisionToken;
}

export interface EvaluationEventRecord {
  id: EntityId<"evaluation-event">;
  evaluationId: EntityId<"evaluation">;
  sequence: number;
  phase: "preflight" | "data" | "rules" | "decisions" | "complete";
  status: "started" | "completed" | "failed";
  message: string;
  occurredAt: IsoTimestamp;
  revision: RevisionToken;
}

export interface SourceArtifactRecord {
  id: EntityId<"source-artifact">;
  provider: string;
  dataset: string;
  asOf: IsoTimestamp;
  immutableLocator: string;
  revision: RevisionToken;
}

export interface DecisionRecord {
  id: EntityId<"decision">;
  evaluationId?: EntityId<"evaluation">;
  runId?: EntityId<"portfolio-run">;
  symbol: string;
  outcome: "eligible" | "rejected" | "hold";
  evidence: string;
  ruleIds: EntityId<"strategy-rule">[];
  createdAt: IsoTimestamp;
  revision: RevisionToken;
}

export interface OrderRecord {
  id: EntityId<"order">;
  portfolioId?: EntityId<"paper-portfolio">;
  provenance:
    | {
        kind: "evaluation";
        evaluationId: EntityId<"evaluation">;
        decisionId: EntityId<"decision">;
      }
    | {
        kind: "portfolio-run";
        runId: EntityId<"portfolio-run">;
        decisionId: EntityId<"decision">;
      }
    | {
        kind: "manual-paper-intervention";
        portfolioId: EntityId<"paper-portfolio">;
        actor: ActorReference;
        reason: string;
      };
  symbol: string;
  side: "buy" | "sell";
  orderType: "market" | "limit" | "stop" | "trailing-stop";
  timeInForce: "day" | "good-til-cancelled";
  requestedQuantity: number;
  filledQuantity: number;
  requestedPrice?: number;
  averageFillPrice?: number;
  status:
    | "proposed"
    | "submitted"
    | "partially-filled"
    | "filled"
    | "rejected"
    | "cancelled"
    | "expired";
  createdAt: IsoTimestamp;
  submittedAt?: IsoTimestamp;
  filledAt?: IsoTimestamp;
  rejectedAt?: IsoTimestamp;
  cancelledAt?: IsoTimestamp;
  lastUpdatedAt: IsoTimestamp;
  revision: RevisionToken;
}

export interface FillRecord {
  id: EntityId<"fill">;
  orderId: EntityId<"order">;
  portfolioId: EntityId<"paper-portfolio">;
  runId?: EntityId<"portfolio-run">;
  quantity: number;
  price: number;
  fees: number;
  executedAt: IsoTimestamp;
  revision: RevisionToken;
}

export type PaperPortfolioState = "active" | "stopped" | "archived";

export interface PaperPortfolioRecord {
  id: EntityId<"paper-portfolio">;
  championId: EntityId<"champion">;
  displayName: string;
  strategyId: EntityId<"immutable-strategy">;
  sourceCheckpointId: EntityId<"draft-checkpoint">;
  deploymentId: EntityId<"deployment">;
  scheduleId: EntityId<"schedule">;
  benchmarkId: EntityId<"benchmark">;
  currentAccountSnapshotId: EntityId<"portfolio-account-snapshot">;
  state: PaperPortfolioState;
  simulatedCapital: number;
  launchedAt: IsoTimestamp;
  stoppedAt?: IsoTimestamp;
  archivedAt?: IsoTimestamp;
  revision: RevisionToken;
}

export interface PortfolioAccountSnapshotRecord {
  id: EntityId<"portfolio-account-snapshot">;
  portfolioId: EntityId<"paper-portfolio">;
  asOf: IsoTimestamp;
  currency: "USD";
  cash: number;
  reservedCash: number;
  buyingPower: number;
  positionsMarketValue: number;
  grossExposureValue: number;
  netExposureValue: number;
  accountValue: number;
  netContributions: number;
  realizedPnl: number;
  unrealizedPnl: number;
  income: number;
  fees: number;
  dailyPnlExFlows: number;
  cumulativeTimeWeightedReturn: number;
  sourceRunId?: EntityId<"portfolio-run">;
  revision: RevisionToken;
}

export interface PositionRecord {
  id: EntityId<"position">;
  portfolioId: EntityId<"paper-portfolio">;
  accountSnapshotId: EntityId<"portfolio-account-snapshot">;
  instrumentKey: string;
  symbol: string;
  displayName: string;
  quantity: number;
  averageCost: number;
  markPrice: number;
  marketValue: number;
  realizedPnl: number;
  unrealizedPnl: number;
  weight: number;
  dailyPnl: number;
  availableToClose: number;
  revision: RevisionToken;
}

export interface DeploymentRecord {
  id: EntityId<"deployment">;
  portfolioId: EntityId<"paper-portfolio">;
  strategyId: EntityId<"immutable-strategy">;
  scheduleId: EntityId<"schedule">;
  state: "active" | "stopped";
  startedAt: IsoTimestamp;
  stoppedAt?: IsoTimestamp;
  revision: RevisionToken;
}

export interface ScheduleRecord {
  id: EntityId<"schedule">;
  portfolioId: EntityId<"paper-portfolio">;
  definition: StrategyScheduleDefinition;
  effectiveFrom: IsoTimestamp;
  nextRunAt?: IsoTimestamp;
  revision: RevisionToken;
}

export interface BenchmarkRecord {
  id: EntityId<"benchmark">;
  symbol: string;
  displayName: string;
  methodology: string;
  revision: RevisionToken;
}

export interface BenchmarkObservationRecord {
  id: EntityId<"benchmark-observation">;
  benchmarkId: EntityId<"benchmark">;
  runId: EntityId<"portfolio-run">;
  observedAt: IsoTimestamp;
  normalizedValue: number;
  revision: RevisionToken;
}

export interface PortfolioRunRecord {
  id: EntityId<"portfolio-run">;
  portfolioId: EntityId<"paper-portfolio">;
  deploymentId: EntityId<"deployment">;
  strategyId: EntityId<"immutable-strategy">;
  scheduleId: EntityId<"schedule">;
  benchmarkId: EntityId<"benchmark">;
  benchmarkObservationId: EntityId<"benchmark-observation">;
  sequence: number;
  scheduledFor: IsoTimestamp;
  startedAt: IsoTimestamp;
  completedAt: IsoTimestamp;
  dataCutoff: IsoTimestamp;
  status: "completed";
  evaluatedUniverseCount: number;
  beforeAccountSnapshotId: EntityId<"portfolio-account-snapshot">;
  afterAccountSnapshotId: EntityId<"portfolio-account-snapshot">;
  decisionIds: EntityId<"decision">[];
  orderIds: EntityId<"order">[];
  revision: RevisionToken;
}

export interface AtlasExchangeRecord {
  id: EntityId<"atlas-exchange">;
  championId: EntityId<"champion">;
  sequence: number;
  userText: string;
  assistantText?: string;
  status: "sent" | "completed" | "failed";
  references: AnyDomainReference[];
  sentAt: IsoTimestamp;
  completedAt?: IsoTimestamp;
  revision: RevisionToken;
}

export type WorkspaceCommandType =
  | "propose"
  | "accept"
  | "reject"
  | "restore"
  | "evaluate"
  | "launch"
  | "stop"
  | "archive"
  | "unarchive"
  | "append-atlas-exchange";

export interface WorkspaceCommandBase<TType extends WorkspaceCommandType> {
  type: TType;
  /** Explicit command scope; target references are carried by each command. */
  championId?: EntityId<"champion">;
  commandId: EntityId<"command">;
  idempotencyKey: IdempotencyKey;
  actor: ActorReference;
  submittedAt: IsoTimestamp;
}

export interface ProposeChangeCommand extends WorkspaceCommandBase<"propose"> {
  draftId: EntityId<"draft">;
  expectedDraftRevision: RevisionToken;
  baseCheckpointId: EntityId<"draft-checkpoint">;
  changes: Array<{
    ruleId: EntityId<"strategy-rule">;
    expectedValue: string;
    proposedValue: string;
  }>;
  motivation: string;
  evidenceRefs?: string[];
  expectedBenefit?: string;
  downside?: string;
}

export interface AcceptChangeCommand extends WorkspaceCommandBase<"accept"> {
  changeSetId: EntityId<"change-set">;
  expectedChangeSetRevision: RevisionToken;
  expectedDraftRevision: RevisionToken;
}

export interface RejectChangeCommand extends WorkspaceCommandBase<"reject"> {
  changeSetId: EntityId<"change-set">;
  expectedChangeSetRevision: RevisionToken;
  reason?: string;
}

export interface RestoreCheckpointCommand extends WorkspaceCommandBase<"restore"> {
  draftId: EntityId<"draft">;
  expectedDraftRevision: RevisionToken;
  sourceCheckpointId: EntityId<"draft-checkpoint">;
  motivation: string;
}

export interface EvaluateDraftCommand extends WorkspaceCommandBase<"evaluate"> {
  draftId: EntityId<"draft">;
  expectedDraftRevision: RevisionToken;
  checkpointId: EntityId<"draft-checkpoint">;
  setup: EvaluationSetup;
}

export interface LaunchPaperCommand extends WorkspaceCommandBase<"launch"> {
  draftId: EntityId<"draft">;
  expectedDraftRevision: RevisionToken;
  checkpointId: EntityId<"draft-checkpoint">;
  evaluationId: EntityId<"evaluation">;
  portfolioName: string;
  simulatedCapital: number;
}

export interface StopPaperCommand extends WorkspaceCommandBase<"stop"> {
  portfolioId: EntityId<"paper-portfolio">;
  expectedPortfolioRevision: RevisionToken;
}

export interface ArchivePaperCommand extends WorkspaceCommandBase<"archive"> {
  portfolioId: EntityId<"paper-portfolio">;
  expectedPortfolioRevision: RevisionToken;
}

export interface UnarchivePaperCommand
  extends WorkspaceCommandBase<"unarchive"> {
  portfolioId: EntityId<"paper-portfolio">;
  expectedPortfolioRevision: RevisionToken;
}

export interface AppendAtlasExchangeCommand
  extends WorkspaceCommandBase<"append-atlas-exchange"> {
  championId: EntityId<"champion">;
  userText: string;
  assistantText?: string;
  references?: AnyDomainReference[];
}

export type WorkspaceCommand =
  | ProposeChangeCommand
  | AcceptChangeCommand
  | RejectChangeCommand
  | RestoreCheckpointCommand
  | EvaluateDraftCommand
  | LaunchPaperCommand
  | StopPaperCommand
  | ArchivePaperCommand
  | UnarchivePaperCommand
  | AppendAtlasExchangeCommand;

export type WorkspaceCommandResult =
  | {
      kind: "change-set-created";
      changeSetId: EntityId<"change-set">;
      changeSetRevision: RevisionToken;
      draftRevision: RevisionToken;
    }
  | {
      kind: "change-set-accepted";
      changeSetId: EntityId<"change-set">;
      checkpointId: EntityId<"draft-checkpoint">;
      draftRevision: RevisionToken;
    }
  | {
      kind: "change-set-rejected";
      changeSetId: EntityId<"change-set">;
      changeSetRevision: RevisionToken;
    }
  | {
      kind: "evaluation-completed";
      evaluationId: EntityId<"evaluation">;
      checkpointId: EntityId<"draft-checkpoint">;
    }
  | {
      kind: "paper-launched";
      portfolioId: EntityId<"paper-portfolio">;
      strategyId: EntityId<"immutable-strategy">;
      nextDraftId: EntityId<"draft">;
      nextCheckpointId: EntityId<"draft-checkpoint">;
      initialAccountSnapshotId: EntityId<"portfolio-account-snapshot">;
    }
  | {
      kind: "portfolio-state-changed";
      portfolioId: EntityId<"paper-portfolio">;
      state: PaperPortfolioState;
      portfolioRevision: RevisionToken;
    }
  | {
      kind: "atlas-exchange-appended";
      exchangeId: EntityId<"atlas-exchange">;
      status: AtlasExchangeRecord["status"];
    };

export type WorkspaceCommandErrorCode =
  | "unknown-entity"
  | "stale-revision"
  | "stale-checkpoint"
  | "invalid-command"
  | "invalid-state"
  | "checkpoint-not-evaluated"
  | "strategy-hash-mismatch"
  | "idempotency-key-conflict"
  | "invariant-violation";

export interface WorkspaceCommandFailure {
  code: WorkspaceCommandErrorCode;
  message: string;
}

export interface WorkspaceCommandReceipt<
  TResult extends WorkspaceCommandResult = WorkspaceCommandResult,
> {
  id: EntityId<"command-receipt">;
  commandId: EntityId<"command">;
  idempotencyKey: IdempotencyKey;
  commandType: WorkspaceCommandType;
  commandFingerprint: string;
  outcome: WorkspaceCommandLifecycleState;
  result?: TResult;
  failure?: WorkspaceCommandFailure;
  submittedAt: IsoTimestamp;
  acceptedAt?: IsoTimestamp;
  completedAt?: IsoTimestamp;
  lifecycle: WorkspaceCommandLifecycleTransition[];
  scenarioRevision: RevisionToken;
  revision: RevisionToken;
}

export type WorkspaceCommandLifecycleState =
  | "submitted"
  | "accepted"
  | "applied"
  | "rejected"
  | "failed"
  | "conflicted";

export interface WorkspaceCommandLifecycleTransition {
  state: WorkspaceCommandLifecycleState;
  occurredAt: IsoTimestamp;
}

export interface WorkspaceRuntime {
  now(): IsoTimestamp;
  createId<TKind extends import("@/domain/identity").DomainObjectKind>(
    kind: TKind
  ): EntityId<TKind>;
}
