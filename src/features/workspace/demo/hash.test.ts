import { describe, expect, it } from "vitest";

import { canonicalJson, hashStrategy, sha256Canonical } from "./hash";
import { createWorkspaceDemoSeed, WORKSPACE_DEMO_IDS } from "./seed";

describe("canonical strategy hashing", () => {
  it("sorts object keys while preserving array order", () => {
    expect(canonicalJson({ z: 2, a: { y: 3, x: 1 } })).toBe(
      '{"a":{"x":1,"y":3},"z":2}'
    );
    expect(canonicalJson([2, 1])).not.toBe(canonicalJson([1, 2]));
  });

  it("produces the standard SHA-256 digest of canonical JSON", async () => {
    await expect(sha256Canonical({ b: 2, a: 1 })).resolves.toBe(
      "43258cff783fe7036d8a43033f830adfc60ec037382473548ac742b888292777"
    );
  });

  it("hashes semantically identical strategy objects identically", async () => {
    const scenario = await createWorkspaceDemoSeed();
    const checkpoint = scenario.checkpoints[WORKSPACE_DEMO_IDS.iris.checkpointV11];
    const reordered = Object.fromEntries(
      Object.entries(checkpoint.strategy).reverse()
    ) as unknown as typeof checkpoint.strategy;

    await expect(hashStrategy(reordered)).resolves.toBe(
      checkpoint.strategyHash
    );
  });

  it("rejects unsupported or cyclic canonical values", () => {
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;
    expect(() => canonicalJson(cyclic)).toThrow(/cyclic/i);
    expect(() => canonicalJson(Number.POSITIVE_INFINITY)).toThrow(
      /non-finite/i
    );
  });
});
