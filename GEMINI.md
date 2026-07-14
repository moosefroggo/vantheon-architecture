# Vantheon review instructions

Review this repository as architecture for an agentic financial application. Prioritize correctness, safety, internal consistency, and implementability over stylistic preferences.

## Product invariants

- A Champion develops the current Draft; strategy-changing conversation must not mutate a deployed Paper or Live strategy.
- The primary product surface is structured domain work and evidence. Conversation is contextual and correlated; it must not become the only progress view, result surface, approval path, or audit trail.
- Draft minor checkpoints are restorable development history. A deployed major version is an immutable snapshot of an exact checkpoint.
- The next Draft's `Vn.0` checkpoint is an exact content clone of the checkpoint launched as the preceding immutable strategy; it is not an empty strategy.
- Restoring an older checkpoint creates the next append-only checkpoint after review and validation; history is never rewound.
- Multiple Paper portfolios may coexist and must retain independent strategy, run, and performance histories.
- A portfolio contains many runs. Never model a portfolio itself as a run.
- Live promotion follows Paper validation and requires an explicit, reviewable user action.
- Paper and Live eligibility are versioned server-authoritative assessments. The Champion cannot grant, bypass, or override them.
- Treat user content, market data, news, retrieved material, tool output, and model output as untrusted. Only independently validated, capability-scoped commands may change business state.
- Every consequential outcome should be traceable through portfolio, run, decision, immutable strategy, checkpoint, and originating change.
- Paper is optimized for learning and comparison. Live is optimized for risk visibility, control, and capital safety.

## Architecture boundaries

- Flag any authoritative business or financial state placed only in React component state, Zustand, browser storage, or an optimistic client mutation.
- Server-backed reads and validated patches may be projected into the client, but local stores must not become the system of record.
- Keep high-frequency market and portfolio telemetry outside ordinary React application state when update rates would cause broad render churn.
- Separate domain state from interface state and distinguish viewed context from the Draft mutation target.
- Do not invent backend schemas or infrastructure unless a document explicitly includes them in scope.

## Review priorities

1. Financial safety, authorization, immutability, provenance, and failure handling.
2. Contradictions between information architecture, entity relationships, state diagrams, and decisions.
3. Ambiguous version, checkpoint, portfolio, deployment, or run terminology.
4. Broken lifecycle paths, especially failure, cancellation, conflict, offline recovery, and retries.
5. Performance claims presented as guarantees without measurable budgets or evidence.
6. Missing accessibility, privacy, security, testing, observability, or rollout considerations.

For Markdown and Mermaid changes, verify terminology against `docs/product-foundations.md`, accepted decisions against `docs/decisions.md`, links, rendered diagrams, and the primary intent-to-evidence iteration loop. Treat `PLAN.md` only as historical planning context. Make findings specific and actionable; agreement with a summary is not evidence of correctness.
