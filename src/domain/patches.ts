import type {
  DomainObjectKind,
  EntityReference,
  IsoTimestamp,
  OpaqueToken,
  RevisionToken,
  SchemaVersion,
} from "./identity";

export interface StreamPosition {
  readonly streamId: OpaqueToken<"stream-id">;
  readonly epoch: OpaqueToken<"stream-epoch">;
  readonly sequence: OpaqueToken<"logical-sequence">;
}

/**
 * Versioned, normalized frontend boundary for server truth. The patch payload is
 * deliberately generic until the transport contract is accepted.
 */
export interface AuthoritativePatchEnvelope<
  TObjectKind extends DomainObjectKind = DomainObjectKind,
  TPatch = unknown,
> {
  readonly type: "authoritative-patch";
  readonly authority: "server";
  readonly envelopeVersion: SchemaVersion;
  readonly eventId: OpaqueToken<"event-id">;
  readonly position: StreamPosition;
  readonly entity: EntityReference<TObjectKind>;
  readonly revision: RevisionToken;
  readonly emittedAt: IsoTimestamp;
  readonly patch: TPatch;
}
