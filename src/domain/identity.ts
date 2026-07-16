declare const opaqueTokenBrand: unique symbol;

/** Opaque at the UI boundary; transport adapters validate and brand raw values. */
export type OpaqueToken<TName extends string> = string & {
  readonly [opaqueTokenBrand]: TName;
};

export type SchemaVersion = OpaqueToken<"schema-version">;
export type IsoTimestamp = OpaqueToken<"iso-timestamp">;
export type RevisionToken = OpaqueToken<"revision">;
export type IdempotencyKey = OpaqueToken<"idempotency-key">;
export type StrategyContentHash = OpaqueToken<"strategy-content-sha256">;

export type DomainObjectKind =
  | "user"
  | "champion"
  | "champion-workspace"
  | "workspace-scenario"
  | "strategy-lineage"
  | "strategy-rule"
  | "draft"
  | "draft-checkpoint"
  | "immutable-strategy"
  | "paper-portfolio"
  | "portfolio-account-snapshot"
  | "position"
  | "live-portfolio"
  | "deployment"
  | "portfolio-run"
  | "schedule"
  | "benchmark"
  | "benchmark-observation"
  | "evaluation"
  | "evaluation-event"
  | "source-artifact"
  | "decision"
  | "order"
  | "fill"
  | "trade"
  | "intent"
  | "change-set"
  | "command"
  | "command-receipt"
  | "live-eligibility-assessment"
  | "champion-activity"
  | "conversation-message"
  | "atlas-exchange";

export type EntityId<TKind extends DomainObjectKind> = OpaqueToken<
  `entity:${TKind}`
>;

export interface EntityReference<TKind extends DomainObjectKind> {
  readonly kind: TKind;
  readonly id: EntityId<TKind>;
}

/**
 * Validates transport/fixture values before applying an opaque entity brand.
 * IDs remain transport-neutral; the kind is carried by the TypeScript brand
 * and the accompanying EntityReference rather than by a required wire prefix.
 */
export function entityId<TKind extends DomainObjectKind>(
  kind: TKind,
  value: string
): EntityId<TKind> {
  const normalized = value.trim();
  if (!normalized || !/^[a-z0-9][a-z0-9_-]*$/i.test(normalized)) {
    throw new TypeError(`Invalid ${kind} entity ID.`);
  }
  return normalized as EntityId<TKind>;
}

export function entityReference<TKind extends DomainObjectKind>(
  kind: TKind,
  id: EntityId<TKind>
): EntityReference<TKind> {
  return { kind, id };
}

export function schemaVersion(value: string): SchemaVersion {
  return nonEmptyOpaque(value, "schema version") as SchemaVersion;
}

export function isoTimestamp(value: string): IsoTimestamp {
  const normalized = value.trim();
  if (!normalized || Number.isNaN(Date.parse(normalized))) {
    throw new TypeError("Invalid ISO timestamp.");
  }
  return normalized as IsoTimestamp;
}

export function revisionToken(value: string): RevisionToken {
  return nonEmptyOpaque(value, "revision token") as RevisionToken;
}

export function idempotencyKey(value: string): IdempotencyKey {
  return nonEmptyOpaque(value, "idempotency key") as IdempotencyKey;
}

export function strategyContentHash(value: string): StrategyContentHash {
  const normalized = value.trim().toLowerCase();
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new TypeError("Invalid SHA-256 strategy content hash.");
  }
  return normalized as StrategyContentHash;
}

function nonEmptyOpaque(value: string, label: string) {
  const normalized = value.trim();
  if (!normalized) throw new TypeError(`Invalid ${label}.`);
  return normalized;
}

export type AnyDomainReference = {
  [TKind in DomainObjectKind]: EntityReference<TKind>;
}[DomainObjectKind];

export type ActorReference =
  | EntityReference<"user">
  | EntityReference<"champion">;

export type ConversationReferenceKind =
  | "intent"
  | "champion-activity"
  | "change-set"
  | "draft-checkpoint"
  | "evaluation"
  | "paper-portfolio"
  | "live-portfolio"
  | "portfolio-run"
  | "decision"
  | "live-eligibility-assessment"
  | "deployment";

/** A message links to canonical objects; it never embeds their authoritative state. */
export type ConversationReference = {
  [TKind in ConversationReferenceKind]: EntityReference<TKind>;
}[ConversationReferenceKind];
