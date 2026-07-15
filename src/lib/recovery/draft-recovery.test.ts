import { describe, expect, it } from "vitest";

import type { DraftCheckpointReference } from "@/domain/contracts";
import type { EntityId } from "@/domain/identity";

import { assessDraftRecoveryBase } from "./draft-recovery";

function checkpoint(
  draftId: string,
  checkpointId: string,
  generation = 8,
  ordinal = 4,
): DraftCheckpointReference {
  return {
    draft: {
      kind: "draft",
      id: draftId as EntityId<"draft">,
    },
    checkpoint: {
      kind: "draft-checkpoint",
      id: checkpointId as EntityId<"draft-checkpoint">,
    },
    generation,
    ordinal,
  };
}

describe("assessDraftRecoveryBase", () => {
  it("allows only an exact authoritative base to continue through replay", () => {
    const base = checkpoint("draft-8", "checkpoint-8.4");

    expect(
      assessDraftRecoveryBase(
        {
          draftId: base.draft.id,
          baseCheckpoint: base,
        },
        base,
      ),
    ).toBe("base-compatible");
  });

  it("requires semantic conflict review when the server Draft advanced", () => {
    const base = checkpoint("draft-8", "checkpoint-8.4");
    const current = checkpoint("draft-8", "checkpoint-8.5", 8, 5);

    expect(
      assessDraftRecoveryBase(
        {
          draftId: base.draft.id,
          baseCheckpoint: base,
        },
        current,
      ),
    ).toBe("semantic-conflict-required");
  });
});
