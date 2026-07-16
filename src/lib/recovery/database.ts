import Dexie, { type Table } from "dexie";

import type { PendingDraftCommandRecovery } from "./draft-recovery";

const DATABASE_NAME = "vantheon-draft-recovery";

export class DraftRecoveryDatabase extends Dexie {
  pendingDraftCommands!: Table<PendingDraftCommandRecovery, string>;

  constructor() {
    super(DATABASE_NAME);
    this.version(1).stores({
      pendingDraftCommands:
        "&commandId, [ownerId+championId+draftId], [draftId+localSequence], state, updatedAt",
    });
  }
}

let browserDatabase: DraftRecoveryDatabase | undefined;

/** Browser-only and lazy so importing contracts during SSR never opens IndexedDB. */
export function getDraftRecoveryDatabase() {
  if (typeof globalThis.indexedDB === "undefined") {
    throw new Error("Draft recovery requires browser IndexedDB.");
  }

  browserDatabase ??= new DraftRecoveryDatabase();
  return browserDatabase;
}
