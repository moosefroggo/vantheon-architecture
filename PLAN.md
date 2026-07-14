# Vantheon Product & Frontend Architecture Documentation

## Summary

Create a compact Markdown architecture handbook that aligns founders, design, and frontend engineering around one governing outcome:

> Minimize the distance from intent → strategy → evidence → iteration, while making every transition involving capital explicit, explainable, and reversible.

The documentation will cover product outcomes, information architecture, conceptual entities, frontend state ownership, technology choices, lifecycle diagrams, decisions, reasoning, and unresolved assumptions. It will describe frontend-facing contracts without designing database schemas or backend internals.

## Documentation Set

- `README.md` — handbook index, reading order, scope, decision-status legend, and architectural summary.
- `docs/product-foundations.md` — product outcomes, trust ladder, core testing loop, terminology, measurable indicators, and UX principles.
- `docs/information-architecture.md` — persistent Champion workspace, Draft/Paper/Live navigation, first-session flow, contextual actions, and trust-oriented hierarchy.
- `docs/domain-model.md` — conceptual entity and provenance model for Champion, conversation, draft generation, checkpoint, immutable strategy, Paper/Live portfolio, run, command, and deployment.
- `docs/frontend-architecture.md` — stack, state ownership, data flow, streaming, caching, offline recovery, navigation performance, and component boundaries.
- `docs/state-diagrams.md` — Mermaid lifecycle and data-flow diagrams.
- `docs/decisions.md` — numbered decision ledger with status, context, decision, reasoning, consequences, and revisit trigger.

## Canonical Product Model

- A Champion develops one current draft generation, displayed as `Draft Vn`.
- Strategy-changing accepted Champion responses create restorable minor checkpoints such as `V5.1 → V5.2`; non-mutating conversation does not increment the checkpoint.
- Promoting Draft V5 from checkpoint V5.2 freezes an immutable Strategy V5 snapshot, creates Paper V5, and begins Draft V6.0.
- Paper navigation uses the concise label `Paper V5`; portfolio details expose `Strategy snapshot from Draft V5.2`, the frozen strategy, semantic changes, and provenance.
- Multiple Paper portfolios such as V5, V6, and V7 coexist, accumulate independent performance and run histories, and can be compared over time.
- A portfolio is persistent evidence; a run is one scheduled execution inside that portfolio. A portfolio is never modeled as a run.
- Live promotion follows the trust path `Paper → Live`. Live pins the exact Paper-tested strategy snapshot and requires explicit confirmation.
- Chat remains persistent across the workspace:
  - Draft: create, modify, explain, and test.
  - Paper: analyze outcomes and propose changes to the current Draft.
  - Live: explain, monitor risk, and prepare changes for the Draft.
- Strategy-changing chat always targets the current Draft. Paper and Live strategies remain immutable.
- Paper is optimized for learning and comparison; Live is optimized for capital visibility, risk, and control.

## Information Architecture

- Persistent Champion shell:
  - Champion identity and status.
  - Draft/Paper/Live switcher with `Developing` and `Running` state labels.
  - Persistent contextual conversation.
  - Current Champion activity and notifications.
- Draft:
  - Strategy as the default creation surface.
  - Inline semantic change review and immediate testing.
  - Experiments for dry runs and backtests.
  - Restorable checkpoint history.
  - Advanced data configuration kept secondary.
- Paper:
  - Overview centered on evidence and Champion assessment.
  - First-class comparison across Paper V5/V6/V7.
  - Runs before lower-level positions and orders.
  - Read-only frozen strategy with exact source checkpoint.
  - Direct `Improve in Draft Vn` actions that retain the observed run as context.
- Live:
  - Overview, risk, exposure, pending actions, positions, orders, runs, and read-only strategy.
  - Persistent visibility of the version controlling capital.
  - Explicit promotion review showing semantic changes and expected impact.
- The first-value flow will be documented as:
  - Express intent.
  - Receive a structured Draft.
  - Review meaningful changes.
  - Dry run or backtest.
  - Inspect decisions and inactivity.
  - Start Paper.
  - Observe and compare.
  - Improve the next Draft.
  - Promote proven Paper to Live.

## Frontend Architecture and Interfaces

- Use one React/TypeScript application with Next.js App Router and persistent layouts; defer a separate terminal application until a measured boundary justifies it. [Next.js App Router](https://nextjs.org/docs/app)
- State ownership:
  - TanStack Query: server-backed entities, indexes, histories, and evolving feeds.
  - Zustand: local interaction state and client projections; never authoritative financial or strategy state.
  - Dexie/IndexedDB: recovery buffer and pending local work, not the canonical draft. Dexie supports reactive updates originating in tabs and workers. [Dexie React documentation](https://dexie.org/docs/Tutorial/React)
  - External subscription store: high-frequency market and portfolio telemetry outside React’s application render cycle.
- Streaming:
  - AI SDK UI data streams for chat, structured message parts, progress, and tool interaction; streamed tool output is presentation, not authority. [AI SDK `useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
  - Persistent WebSocket for market, portfolio, and Champion activity events.
  - Web Worker, binary encoding, and SharedWorker remain measured-load optimizations rather than MVP prerequisites.
- Rendering:
  - Lightweight Charts for initial financial visualization. [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
  - Virtualized long conversations, runs, orders, and positions.
  - Frame-conflated visual market updates rather than rendering every tick.
  - React `Activity` may preserve recently visited UI state, with explicit cleanup because hidden boundaries remove effects and subscriptions. [React `Activity`](https://react.dev/reference/react/Activity)
- Frontend-facing conceptual contracts will describe:
  - Workspace context: viewed surface versus mutation target.
  - Draft identity: generation and current checkpoint.
  - Immutable strategy reference: generation and source checkpoint.
  - Paper/Live portfolio summary and pinned strategy.
  - Run summary and result states.
  - Command/change-set status.
  - Semantic diff and provenance references.
- Exact REST/WebSocket payloads, database fields, and backend orchestration remain out of scope.

## State and Data-Flow Diagrams

Use Mermaid source embedded in Markdown for:

- Core value loop: intent → draft → evidence → Paper → observation → iteration → Live.
- Draft checkpoint lifecycle: editing → validating → applied/checkpointed, with rejected, failed, conflict, offline, and recovery paths.
- Paper promotion: Draft V5.2 → validation → immutable Strategy V5 → Paper V5 + Draft V6.0; failure leaves the draft unchanged.
- Live promotion: eligible Paper V5 → change/risk review → explicit confirmation → Live V5.
- Command flow: conversation intent → Champion interpretation → typed change set → validation → authoritative patch → local projection.
- Portfolio run lifecycle: scheduled → evaluating → decision → no trade/trade → completed, with failed and cancelled outcomes.
- Provenance graph: message → change set → checkpoint → immutable strategy → portfolio → run → decision → order/trade → outcome.
- Client state ownership: queries, patches, streaming stores, Zustand projections, IndexedDB recovery, and React surfaces.
- Champion cache tiers: active, recently visited/warm, and aggregate-only.

## Decision Ledger

Record the following as accepted decisions with their reasoning and revisit conditions:

- Organize IA around Draft, Paper, and Live user goals rather than technical entities.
- Use major generations for deployed strategy identity and minor checkpoints for restorable draft history.
- Create one checkpoint per accepted strategy-changing response, not per low-level command.
- Label portfolios as Paper V5 while exposing Draft V5.2 as exact source provenance.
- Allow multiple simultaneous Paper portfolios for longitudinal comparison.
- Require Paper validation before Live promotion.
- Keep chat contextual but route strategy mutations exclusively to the current Draft.
- Keep deployed strategies immutable and show semantic rather than raw JSON differences.
- Use server-backed reads and validated patches; local stores render reality but do not define it.
- Use a single Next.js application initially.
- Keep high-frequency market state outside ordinary React state.
- Add CRDT collaboration, SharedWorker, protobuf, custom WebGL, or multiple frontend applications only after concrete requirements justify them.

## Validation Scenarios

The documentation is complete when a reader can trace these scenarios without ambiguity:

- A first-time user creates Draft V1.1 through chat, tests it, launches Paper V1 from the exact checkpoint, and continues in Draft V2.0.
- A user viewing Paper V5 asks for a change; Draft V6 advances while Paper V5 remains unchanged.
- A user compares Paper V5, V6, and V7, opens V5, and sees its exact V5.2 source strategy and complete run history.
- A no-trade run explains what was evaluated, which rule blocked action, and how to explore an improvement in the Draft.
- A tested Paper V5 is promoted to Live V5 through an explicit risk and change review.
- A failed checkpoint or promotion does not silently mutate Paper or Live.
- Offline or interrupted draft work is recoverable without treating IndexedDB as canonical.
- Switching between warm Champions restores useful state quickly while cold Champions load progressively.
- Every portfolio outcome can be traced to a run and the precise immutable strategy responsible.

All Mermaid diagrams must render successfully, terminology must remain consistent across documents, and every state domain must have exactly one declared owner.

## Assumptions

- This phase documents product and frontend architecture, not backend implementation or database design.
- Draft checkpoint numbering is user-visible and restorable.
- Paper portfolios remain available after one is promoted to Live.
- The current IA presents one Live destination per Champion without encoding that as a permanent backend limitation.
- Direct editing, if supported, will use the same accepted change-set and checkpoint mechanism as chat-driven changes.
- Outcome metrics will be named—time to first strategy, first test, first Paper, iteration-cycle time, version-context errors, and promotion abandonment—but numeric targets will wait for a measured baseline.
