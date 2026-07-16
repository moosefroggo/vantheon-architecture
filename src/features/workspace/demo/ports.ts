import type { EntityId, IdempotencyKey } from "@/domain/identity";

import type {
  AcceptChangeCommand,
  AppendAtlasExchangeCommand,
  ArchivePaperCommand,
  AtlasExchangeRecord,
  ChangeSetRecord,
  ChampionRecord,
  DraftCheckpointRecord,
  DraftRecord,
  EvaluateDraftCommand,
  EvaluationRecord,
  FillRecord,
  LaunchPaperCommand,
  PaperPortfolioRecord,
  PortfolioAccountSnapshotRecord,
  PortfolioRunRecord,
  PositionRecord,
  ProposeChangeCommand,
  RejectChangeCommand,
  RestoreCheckpointCommand,
  StopPaperCommand,
  UnarchivePaperCommand,
  WorkspaceCommandReceipt,
  WorkspaceCommandResult,
  WorkspaceScenario,
} from "./types";

type ResultOf<TKind extends WorkspaceCommandResult["kind"]> = Extract<
  WorkspaceCommandResult,
  { kind: TKind }
>;

export interface WorkspaceQueryPort {
  readSnapshot(): Promise<WorkspaceScenario>;
  listChampions(): Promise<ChampionRecord[]>;
  getChampion(id: EntityId<"champion">): Promise<ChampionRecord | undefined>;
  getCurrentDraft(
    championId: EntityId<"champion">
  ): Promise<DraftRecord | undefined>;
  getDraft(id: EntityId<"draft">): Promise<DraftRecord | undefined>;
  getCheckpoint(
    id: EntityId<"draft-checkpoint">
  ): Promise<DraftCheckpointRecord | undefined>;
  listCheckpoints(
    championId: EntityId<"champion">
  ): Promise<DraftCheckpointRecord[]>;
  getChangeSet(
    id: EntityId<"change-set">
  ): Promise<ChangeSetRecord | undefined>;
  listChangeSets(draftId: EntityId<"draft">): Promise<ChangeSetRecord[]>;
  getEvaluation(
    id: EntityId<"evaluation">
  ): Promise<EvaluationRecord | undefined>;
  listEvaluations(
    championId: EntityId<"champion">
  ): Promise<EvaluationRecord[]>;
  getPortfolio(
    id: EntityId<"paper-portfolio">
  ): Promise<PaperPortfolioRecord | undefined>;
  listPortfolios(
    championId: EntityId<"champion">,
    options?: { includeArchived?: boolean }
  ): Promise<PaperPortfolioRecord[]>;
  listRuns(
    portfolioId: EntityId<"paper-portfolio">
  ): Promise<PortfolioRunRecord[]>;
  listAccountSnapshots(
    portfolioId: EntityId<"paper-portfolio">
  ): Promise<PortfolioAccountSnapshotRecord[]>;
  listPositions(
    portfolioId: EntityId<"paper-portfolio">
  ): Promise<PositionRecord[]>;
  listFills(portfolioId: EntityId<"paper-portfolio">): Promise<FillRecord[]>;
  listAtlasExchanges(
    championId: EntityId<"champion">
  ): Promise<AtlasExchangeRecord[]>;
  getReceiptByIdempotencyKey(
    key: IdempotencyKey
  ): Promise<WorkspaceCommandReceipt | undefined>;
}

export interface WorkspaceCommandPort {
  proposeDraftChange(
    command: ProposeChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-created">>>;
  acceptChangeSet(
    command: AcceptChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-accepted">>>;
  rejectChangeSet(
    command: RejectChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-rejected">>>;
  restoreCheckpoint(
    command: RestoreCheckpointCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-created">>>;
  runEvaluation(
    command: EvaluateDraftCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"evaluation-completed">>>;
  launchPaper(
    command: LaunchPaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"paper-launched">>>;
  stopPaper(
    command: StopPaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
  archivePaper(
    command: ArchivePaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
  unarchivePaper(
    command: UnarchivePaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
  appendAtlasExchange(
    command: AppendAtlasExchangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"atlas-exchange-appended">>>;
  resetDemo(): Promise<void>;

  /** Compatibility aliases retained while existing tests/adapters migrate. */
  propose(
    command: ProposeChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-created">>>;
  accept(
    command: AcceptChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-accepted">>>;
  reject(
    command: RejectChangeCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-rejected">>>;
  restore(
    command: RestoreCheckpointCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"change-set-created">>>;
  evaluate(
    command: EvaluateDraftCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"evaluation-completed">>>;
  launch(
    command: LaunchPaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"paper-launched">>>;
  stop(
    command: StopPaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
  archive(
    command: ArchivePaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
  unarchive(
    command: UnarchivePaperCommand
  ): Promise<WorkspaceCommandReceipt<ResultOf<"portfolio-state-changed">>>;
}

export interface WorkspaceDemoRepository
  extends WorkspaceQueryPort,
    WorkspaceCommandPort {
  initialize(): Promise<void>;
  reset(): Promise<void>;
  close(): Promise<void>;
}

export interface WorkspaceScenarioStorage {
  initialize(seed: WorkspaceScenario): Promise<void>;
  read(): Promise<WorkspaceScenario>;
  mutate<TResult>(
    mutation: (scenario: WorkspaceScenario) => Promise<TResult>
  ): Promise<TResult>;
  reset(seed: WorkspaceScenario): Promise<void>;
  close(): Promise<void>;
}
