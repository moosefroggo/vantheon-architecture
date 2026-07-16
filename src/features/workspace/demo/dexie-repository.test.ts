import { afterEach, describe, expect, it, vi } from "vitest";

import { createBrowserWorkspaceRepository } from "./dexie-repository";

describe("browser workspace authority persistence", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is lazy and reports an explicit SSR/unsupported-browser boundary", async () => {
    vi.stubGlobal("indexedDB", undefined);
    vi.stubGlobal("IDBKeyRange", undefined);

    await expect(createBrowserWorkspaceRepository()).rejects.toThrow(
      "requires browser IndexedDB"
    );
  });
});
