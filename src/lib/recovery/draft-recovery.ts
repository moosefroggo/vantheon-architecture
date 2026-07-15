import type {
  DraftCheckpointReference,
} from "@/domain/contracts";
import type {
  EntityId,
  IsoTimestamp,
  SchemaVersion,
} from "@/domain/identity";

export const DRAFT_RECOVERY_SCHEMA_VERSION = 1 as const;

export type DraftRecoveryState =
  | "pending"
  | "rejected"
  | "requires-conflict-review";

/**
 * A recovery buffer for Draft commands. It can never represent an applied Draft
 * and cannot contain Paper, Live, order, or portfolio-control commands.
 */
export interface PendingDraftCommandRecovery<
  TCommand = unknown,
  TLocalProjection = unknown,
> {
  readonly recoverySchemaVersion: typeof DRAFT_RECOVERY_SCHEMA_VERSION;
  readonly authority: "local-recovery-only";
  readonly scope: "draft";
  readonly commandId: EntityId<"command">;
  readonly commandSchemaVersion: SchemaVersion;
  readonly ownerId: EntityId<"user">;
  readonly championId: EntityId<"champion">;
  readonly draftId: EntityId<"draft">;
  readonly baseCheckpoint: DraftCheckpointReference;
  readonly localSequence: number;
  readonly command: TCommand;
  readonly localProjection?: TLocalProjection;
  readonly state: DraftRecoveryState;
  readonly createdAt: IsoTimestamp;
  readonly updatedAt: IsoTimestamp;
}

export type DraftRecoveryBaseAssessment =
  | "base-compatible"
  | "semantic-conflict-required";

/** Compatibility only permits normal resubmission; it never applies local JSON. */
export function assessDraftRecoveryBase(
  recovery: Pick<
    PendingDraftCommandRecovery,
    "draftId" | "baseCheckpoint"
  >,
  currentCheckpoint: DraftCheckpointReference,
): DraftRecoveryBaseAssessment {
  const sameBase =
    recovery.draftId === currentCheckpoint.draft.id &&
    recovery.baseCheckpoint.draft.id === currentCheckpoint.draft.id &&
    recovery.baseCheckpoint.generation === currentCheckpoint.generation &&
    recovery.baseCheckpoint.checkpoint.id === currentCheckpoint.checkpoint.id &&
    recovery.baseCheckpoint.ordinal === currentCheckpoint.ordinal;

  return sameBase ? "base-compatible" : "semantic-conflict-required";
}
