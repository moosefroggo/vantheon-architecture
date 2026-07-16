"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { IsoTimestamp } from "@/domain/identity";

export type TelemetryConnectionState =
  | "active"
  | "degraded"
  | "disconnected"
  | "recovering"
  | "failed"
  | "unauthorized";

export interface TelemetryVisualSnapshot<TValue, TSequence = unknown> {
  readonly value: TValue;
  readonly sequence: TSequence;
  readonly connection: TelemetryConnectionState;
  readonly freshness: "current" | "stale" | "unknown";
  readonly observedAt?: IsoTimestamp;
  readonly receivedAt: IsoTimestamp;
}

type Listener = () => void;
type FrameScheduler = (flush: () => void) => void;

export interface TelemetryStore<TKey, TSnapshot> {
  getSnapshot: (key: TKey) => TSnapshot | undefined;
  subscribe: (key: TKey, listener: Listener) => () => void;
  enqueueVisualSnapshot: (key: TKey, snapshot: TSnapshot) => void;
  flushVisualSnapshots: () => void;
}

function scheduleOnNextFrame(flush: () => void) {
  if (typeof globalThis.requestAnimationFrame === "function") {
    globalThis.requestAnimationFrame(flush);
    return;
  }

  globalThis.queueMicrotask(flush);
}

/**
 * Narrow, frame-conflated visual projections. Upstream reconciliation retains
 * logical event fidelity; this store intentionally keeps only the latest frame.
 */
export function createTelemetryStore<TKey, TSnapshot>(options?: {
  readonly schedule?: FrameScheduler;
}): TelemetryStore<TKey, TSnapshot> {
  const snapshots = new Map<TKey, TSnapshot>();
  const pending = new Map<TKey, TSnapshot>();
  const listeners = new Map<TKey, Set<Listener>>();
  const schedule = options?.schedule ?? scheduleOnNextFrame;
  let frameScheduled = false;

  const flushVisualSnapshots = () => {
    frameScheduled = false;

    for (const [key, snapshot] of pending) {
      snapshots.set(key, snapshot);
      listeners.get(key)?.forEach((listener) => listener());
    }

    pending.clear();
  };

  return {
    getSnapshot: (key) => snapshots.get(key),
    subscribe: (key, listener) => {
      const keyListeners = listeners.get(key) ?? new Set<Listener>();
      keyListeners.add(listener);
      listeners.set(key, keyListeners);

      return () => {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) listeners.delete(key);
      };
    },
    enqueueVisualSnapshot: (key, snapshot) => {
      pending.set(key, snapshot);
      if (frameScheduled) return;

      frameScheduled = true;
      schedule(flushVisualSnapshots);
    },
    flushVisualSnapshots,
  };
}

export function useTelemetrySnapshot<TKey, TSnapshot>(
  store: TelemetryStore<TKey, TSnapshot>,
  key: TKey,
  serverSnapshot?: TSnapshot,
) {
  const subscribe = useCallback(
    (listener: Listener) => store.subscribe(key, listener),
    [key, store],
  );
  const getSnapshot = useCallback(() => store.getSnapshot(key), [key, store]);
  const getServerSnapshot = useCallback(
    () => serverSnapshot,
    [serverSnapshot],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
