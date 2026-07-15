declare const opaqueTokenBrand: unique symbol;

/** Opaque at the UI boundary; transport adapters validate and brand raw values. */
export type OpaqueToken<TName extends string> = string & {
  readonly [opaqueTokenBrand]: TName;
};

export type SchemaVersion = OpaqueToken<"schema-version">;
export type IsoTimestamp = OpaqueToken<"iso-timestamp">;
export type RevisionToken = OpaqueToken<"revision">;

export type DomainObjectKind =
  | "user"
  | "champion"
  | "champion-workspace"
  | "strategy-lineage"
  | "draft"
  | "draft-checkpoint"
  | "immutable-strategy"
  | "paper-portfolio"
  | "live-portfolio"
  | "deployment"
  | "portfolio-run"
  | "evaluation"
  | "decision"
  | "order"
  | "trade"
  | "intent"
  | "change-set"
  | "command"
  | "live-eligibility-assessment"
  | "champion-activity"
  | "conversation-message";

export type EntityId<TKind extends DomainObjectKind> = OpaqueToken<
  `entity:${TKind}`
>;

export interface EntityReference<TKind extends DomainObjectKind> {
  readonly kind: TKind;
  readonly id: EntityId<TKind>;
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
