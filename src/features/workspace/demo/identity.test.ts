import { describe, expect, it } from "vitest";

import {
  entityId,
  idempotencyKey,
  isoTimestamp,
  strategyContentHash,
} from "@/domain/identity";

describe("workspace authority opaque transport values", () => {
  it("brands validated IDs, timestamps, and idempotency keys", () => {
    expect(entityId("draft", "draft_demo_01")).toBe("draft_demo_01");
    expect(isoTimestamp("2026-07-15T18:00:00.000Z")).toBe(
      "2026-07-15T18:00:00.000Z"
    );
    expect(idempotencyKey("launch-demo-1")).toBe("launch-demo-1");
  });

  it("rejects malformed boundary values", () => {
    expect(() => entityId("draft", "")).toThrow(/invalid draft/i);
    expect(() => entityId("draft", "spaces are not ids")).toThrow(
      /invalid draft/i
    );
    expect(() => isoTimestamp("not-a-time")).toThrow(/ISO timestamp/i);
    expect(() =>
      strategyContentHash("sha256:not-a-real-digest")
    ).toThrow(/SHA-256/i);
  });
});
