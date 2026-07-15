import { describe, expect, it, vi } from "vitest";

import { createTelemetryStore } from "./telemetry-store";

describe("createTelemetryStore", () => {
  it("conflates visual updates to the latest snapshot in one frame", () => {
    const scheduled: Array<() => void> = [];
    const store = createTelemetryStore<string, number>({
      schedule: (flush) => scheduled.push(flush),
    });
    const listener = vi.fn();
    store.subscribe("portfolio-1", listener);

    store.enqueueVisualSnapshot("portfolio-1", 101);
    store.enqueueVisualSnapshot("portfolio-1", 102);

    expect(scheduled).toHaveLength(1);
    expect(store.getSnapshot("portfolio-1")).toBeUndefined();

    scheduled[0]?.();

    expect(store.getSnapshot("portfolio-1")).toBe(102);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("notifies only subscribers for the changed telemetry key", () => {
    const store = createTelemetryStore<string, number>({
      schedule: () => undefined,
    });
    const first = vi.fn();
    const second = vi.fn();
    store.subscribe("first", first);
    store.subscribe("second", second);

    store.enqueueVisualSnapshot("first", 1);
    store.flushVisualSnapshots();

    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
  });
});
