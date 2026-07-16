import type {
  ActorReference,
  AnyDomainReference,
  EntityId,
  EntityReference,
  IsoTimestamp,
  RevisionToken,
  SchemaVersion,
} from "./identity";

export type ChampionAvailability =
  | "available"
  | "working"
  | "degraded"
  | "unavailable";

export interface ChampionViewModel {
  readonly schemaVersion: SchemaVersion;
  readonly id: EntityId<"champion">;
  readonly displayName: string;
  readonly availability: ChampionAvailability;
  readonly workspace: EntityReference<"champion-workspace">;
  readonly activeLineage: EntityReference<"strategy-lineage">;
  readonly currentActivity?: EntityReference<"champion-activity">;
  readonly lastConfirmedAt?: IsoTimestamp;
}

export interface DraftGenerationReference {
  readonly draft: EntityReference<"draft">;
  readonly generation: number;
}

export interface DraftCheckpointReference extends DraftGenerationReference {
  readonly checkpoint: EntityReference<"draft-checkpoint">;
  readonly ordinal: number;
}

export interface ImmutableStrategyReference {
  readonly strategy: EntityReference<"immutable-strategy">;
  readonly sourceCheckpoint: DraftCheckpointReference;
}

export type DraftCheckpointOrigin =
  | {
      readonly kind: "generation-initialization";
      readonly parentStrategy: EntityReference<"immutable-strategy">;
      readonly sourceCheckpoint: DraftCheckpointReference;
    }
  | {
      readonly kind: "accepted-change-set";
      readonly changeSet: EntityReference<"change-set">;
    };

export interface DraftCheckpointViewModel<TStructuredStrategy = unknown> {
  readonly schemaVersion: SchemaVersion;
  readonly reference: DraftCheckpointReference;
  readonly revision: RevisionToken;
  readonly previousCheckpoint?: DraftCheckpointReference;
  readonly origin: DraftCheckpointOrigin;
  readonly structuredStrategy: TStructuredStrategy;
  readonly createdBy: ActorReference;
  readonly createdAt: IsoTimestamp;
}

export type DraftProjectionState =
  | "current"
  | "pending-command"
  | "stale"
  | "recovering"
  | "conflicted"
  | "unauthorized";

export type DraftValidationState =
  | "unknown"
  | "validating"
  | "valid"
  | "invalid";

export interface DraftViewModel<TStructuredStrategy = unknown> {
  readonly schemaVersion: SchemaVersion;
  readonly generation: DraftGenerationReference;
  readonly currentCheckpoint: DraftCheckpointReference;
  readonly structuredStrategy: TStructuredStrategy;
  readonly projectionState: DraftProjectionState;
  readonly validationState: DraftValidationState;
  readonly hasUnresolvedAssumptions: boolean;
  readonly hasConflicts: boolean;
  readonly lastConfirmedAt?: IsoTimestamp;
}

export type OperationalState =
  | "active"
  | "paused"
  | "degraded"
  | "disconnected"
  | "recovering"
  | "failed"
  | "unauthorized";

export type PaperOperationalState =
  | OperationalState
  | "stopping"
  | "stopped"
  | "archived";

export interface FreshnessViewModel {
  readonly state: "current" | "stale" | "unknown";
  readonly confirmedAt?: IsoTimestamp;
}

interface PortfolioContextBase<TMode extends "paper" | "live"> {
  readonly schemaVersion: SchemaVersion;
  readonly mode: TMode;
  readonly displayLabel: string;
  readonly controllingStrategy: ImmutableStrategyReference;
  readonly deployment: EntityReference<"deployment">;
  readonly freshness: FreshnessViewModel;
}

export interface PaperContextViewModel<TEvidenceSummary = unknown>
  extends PortfolioContextBase<"paper"> {
  readonly portfolio: EntityReference<"paper-portfolio">;
  readonly operationalState: PaperOperationalState;
  readonly evidenceSummary: TEvidenceSummary;
}

export type LiveAuthorizationState =
  | "authorized"
  | "reauthentication-required"
  | "unauthorized";

export interface LiveContextViewModel<
  TCapitalAtRisk = unknown,
  TRiskSummary = unknown,
> extends PortfolioContextBase<"live"> {
  readonly portfolio: EntityReference<"live-portfolio">;
  readonly operationalState: OperationalState;
  readonly authorizationState: LiveAuthorizationState;
  readonly capitalAtRisk: TCapitalAtRisk;
  readonly riskSummary: TRiskSummary;
}

export type WorkspaceViewedContext =
  | {
      readonly surface: "draft";
      readonly checkpoint: DraftCheckpointReference;
    }
  | {
      readonly surface: "paper";
      readonly portfolio: EntityReference<"paper-portfolio">;
      readonly run?: EntityReference<"portfolio-run">;
    }
  | {
      readonly surface: "live";
      readonly portfolio: EntityReference<"live-portfolio">;
      readonly run?: EntityReference<"portfolio-run">;
    }
  | {
      readonly surface: "evaluation";
      readonly evaluation: EntityReference<"evaluation">;
    };

/** Viewed evidence and the only legal mutation target remain independently visible. */
export interface WorkspaceContextViewModel {
  readonly schemaVersion: SchemaVersion;
  readonly champion: EntityReference<"champion">;
  readonly viewing: WorkspaceViewedContext;
  readonly mutationTarget: DraftCheckpointReference;
}

export type KnownChampionActivityPhase =
  | "interpreting"
  | "researching"
  | "preparing-change-set"
  | "waiting-on-evaluation"
  | "validating";

export type ChampionActivityPhase =
  | { readonly kind: KnownChampionActivityPhase }
  | { readonly kind: "extension"; readonly code: string };

export type ChampionActivityLifecycle =
  | { readonly status: "queued" | "running" }
  | {
      readonly status: "requires-user-action";
      readonly requiredAction: AnyDomainReference;
    }
  | {
      readonly status: "completed";
      readonly result: AnyDomainReference;
    }
  | {
      readonly status: "failed";
      readonly failure: AnyDomainReference;
    }
  | {
      readonly status: "cancelled";
      readonly result?: AnyDomainReference;
    };

/** Phase and lifecycle are verified server projections, never model-authored truth. */
export interface ChampionActivityViewModel {
  readonly schemaVersion: SchemaVersion;
  readonly activity: EntityReference<"champion-activity">;
  readonly champion: EntityReference<"champion">;
  readonly phase: ChampionActivityPhase;
  readonly lifecycle: ChampionActivityLifecycle;
  readonly origin?: AnyDomainReference;
  readonly viewedContext?: WorkspaceViewedContext;
  readonly affectedObjects: readonly AnyDomainReference[];
  readonly startedAt?: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}
