# Vantheon Product & Frontend Architecture Documentation

> **Status: planning history and traceability checklist.** This file is not normative. Accepted decisions in `docs/decisions.md` and the dedicated handbook documents govern implementation. New unresolved questions belong in the Proposed Decisions table rather than in this file.

## Summary

Create a compact Markdown architecture handbook that aligns founders, design, and frontend engineering around one governing outcome:

> Minimize the distance from intent → strategy → evidence → iteration, while making every transition involving capital explicit, explainable, and controlled. Strategy and configuration changes may be reversible; executed trades are not.

The documentation will cover product outcomes, information architecture, conceptual entities, frontend state ownership, technology choices, lifecycle diagrams, decisions, reasoning, and unresolved assumptions. It will describe frontend-facing contracts without designing database schemas or backend internals.

Planning prioritizes two journeys above feature breadth: onboarding to understandable Paper value, followed by a rigorous evidence-to-improvement iteration loop. `docs/priority-user-journeys.md` is the governing journey specification.

## Documentation Set

- `README.md` — handbook index, reading order, scope, decision-status legend, and architectural summary.
- `docs/product-foundations.md` — product outcomes, trust ladder, core testing loop, terminology, measurable indicators, and UX principles.
- `docs/priority-user-journeys.md` — onboarding-to-value and rigorous-iteration journey maps, trust gates, recovery paths, metrics, and delivery order.
- `docs/information-architecture.md` — persistent Champion workspace, Draft/Paper/Live navigation, first-session flow, contextual actions, and trust-oriented hierarchy.
- `docs/domain-model.md` — conceptual entity and provenance model for Champion, conversation, draft generation, checkpoint, immutable strategy, Paper/Live portfolio, run, command, and deployment.
- `docs/frontend-architecture.md` — stack, state ownership, data flow, streaming, caching, offline recovery, navigation performance, and component boundaries.
- `docs/champion-runtime-safety.md` — untrusted-input boundaries, capability-scoped tools, independent validation, model evaluation, and incident controls.
- `docs/ui-component-architecture.md` — stock shadcn demo rules, primitive/domain boundaries, theme isolation, and safe customization path.
- `docs/accessibility-and-motion.md` — WCAG 2.2 AA target, keyboard and focus model, assistive-technology behavior for live data, chart alternatives, reduced motion, and authoritative-state motion rules.
- `docs/performance-simulation.md` — deterministic backend simulation, stress scenarios, browser instrumentation, latency budgets, and regression methodology.
- `docs/state-diagrams.md` — Mermaid lifecycle and data-flow diagrams.
- `docs/decisions.md` — numbered decision ledger with status, context, decision, reasoning, consequences, and revisit trigger.

## Canonical Product Model

- A `Champion` is the persistent AI agent identity with which the user collaborates. The `Champion workspace` contains its Draft, Paper, Live, conversation, and activity; the `strategy lineage` is the sequence of Draft checkpoints and immutable strategies it develops. These terms are related but not interchangeable.
- A Champion develops one current draft generation, displayed as `Draft Vn`.
- Each accepted semantic Draft change set creates one restorable minor checkpoint such as `V5.1 → V5.2`, regardless of whether it originated from conversation, direct editing, autonomous Champion work, or another authorized actor. Non-mutating or unsuccessful work does not increment the checkpoint.
- Launching Draft V5 from checkpoint V5.2 freezes an immutable Strategy V5 snapshot, creates Paper V5, and begins Draft V6 at checkpoint V6.0 with the exact structured content of V5.2. V6.0 is a generation-initialization checkpoint; the first semantic change becomes V6.1.
- Restoring an older checkpoint never rewinds or deletes history. Restoring V8.2 while current is V8.4 creates a reviewed and validated V8.5 containing the restored content.
- Paper navigation uses the concise label `Paper V5`; portfolio details expose `Strategy snapshot from Draft V5 · checkpoint V5.2`, the frozen strategy, semantic changes, and provenance.
- Multiple Paper portfolios such as V5, V6, and V7 coexist, accumulate independent performance and run histories, and can be compared over time.
- A portfolio is persistent evidence; a run is one scheduled execution inside that portfolio. A portfolio is never modeled as a run.
- Live promotion follows the trust path `Paper → Live`. Live pins the exact Paper-tested strategy snapshot and requires explicit confirmation.
- Paper and Live eligibility are versioned server-authoritative assessments. The Champion may explain or recommend remediation but cannot grant, bypass, or override eligibility.
- Chat remains persistent across the workspace:
  - Draft: create, modify, explain, and test.
  - Paper: analyze outcomes and propose changes to the current Draft.
  - Live: explain, monitor risk, and prepare changes for the Draft.
- Strategy-changing chat always targets the current Draft. Paper and Live strategies remain immutable.
- Champion inputs and outputs are untrusted. Model-produced changes are proposals until capability-scoped commands pass independent server validation.
- The chat composer always distinguishes the viewed context from the mutation target, for example: `Viewing Paper V5 · Changes go to Draft V8 · checkpoint V8.4`.
- Learning from an older Paper or Live version is proposed against the latest Draft. The Champion compares the observed source rule with its current equivalent, explains incompatibilities, and requests a decision rather than silently overwriting or creating another Draft branch.
- Paper is optimized for learning and comparison; Live is optimized for capital visibility, risk, and control.

## Information Architecture

- Persistent Champion shell:
  - Champion identity and status.
  - Draft/Paper/Live switcher with `Developing` and `Running` state labels.
  - Persistent contextual conversation.
  - Visible viewed-context and Draft-mutation-target labels near the conversation composer.
  - Current Champion activity and notifications.
  - Collapsible conversation and notification panels for data-dense workspaces.
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
  - Direct `Improve in Draft Vn` actions that retain the portfolio, run, decision, relevant rule evaluation, immutable strategy version, and source checkpoint as context.
- Live:
  - Overview, risk, exposure, pending actions, positions, orders, runs, and read-only strategy.
  - Persistent visibility of the version controlling capital.
  - Clear operational states such as active, paused, degraded, disconnected, and failed.
  - Separate emergency controls to pause future Champion executions and cancel eligible open orders without mutating the strategy.
  - Explicit promotion review showing semantic changes and expected impact.
- Explicitly design the two novel decision surfaces rather than treating them as generic dialogs:
  - Semantic change review groups related commands into understandable strategy changes and shows motivation, expected benefit, downside, unchanged constraints, provenance, and required evidence.
  - Conflict resolution compares the observed source rule with the current Draft, explains incompatibility in domain language, and offers only safe, server-validatable decisions.
- Record a viewport-support decision before layout implementation. The demo may be desktop-first, but the minimum usable viewport, unsupported widths, panel-collapse behavior, and any mobile read-only experience must be explicit rather than accidental.
- The first-value flow will be documented as:
  - Express intent directly or begin from a transparent starter pattern.
  - Receive a structured Draft.
  - Review meaningful changes.
  - Run a quick evaluation or backtest with visible, Champion-selected defaults.
  - Inspect decisions and inactivity.
  - Start Paper.
  - Observe and compare.
  - Improve the next Draft.
  - Promote a Paper-tested strategy to Live through an explicit review.

## Frontend Architecture and Interfaces

- Use one React/TypeScript application with Next.js App Router and persistent layouts; defer a separate terminal application until a measured boundary justifies it. [Next.js App Router](https://nextjs.org/docs/app)
- Use stock shadcn visuals for the demo while isolating generated primitives, semantic domain components, and theme tokens as defined in `docs/ui-component-architecture.md`.
- State ownership:
  - TanStack Query: server-backed entities, indexes, histories, and evolving feeds, including read models reconciled from pushed events.
  - Zustand: local interaction state and client projections; never authoritative financial or strategy state.
  - Dexie/IndexedDB: recovery buffer containing pending commands, their base checkpoints, and local projections—not the canonical draft. Recovery replays compatible commands and surfaces semantic conflicts rather than overwriting server state. Dexie supports reactive updates originating in tabs and workers. [Dexie React documentation](https://dexie.org/docs/Tutorial/React)
  - External subscription store: high-frequency market and portfolio telemetry outside React’s application render cycle, exposed selectively through `useSyncExternalStore` or imperative chart bindings.
- Streaming:
  - AI SDK UI data streams for chat, structured message parts, progress, and tool interaction; streamed tool output is presentation, not authority. [AI SDK `useChat`](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
  - Persistent WebSocket for market, portfolio, and Champion activity events.
  - Web Worker, binary encoding, and SharedWorker remain measured-load optimizations rather than MVP prerequisites.
- Frontend security and session contracts must cover HTTP and WebSocket authentication, reconnect re-authentication, token handling, session expiry, authorization changes, cross-tab logout, and safe failure behavior. No client cache or stream subscription proves current authorization.
- Rendering:
  - Lightweight Charts for initial financial visualization. [Lightweight Charts](https://tradingview.github.io/lightweight-charts/)
  - Virtualized long conversations, runs, orders, and positions.
  - Application-level search for virtualized histories whose off-screen content is unavailable to native browser search.
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
  - Simulator scenario descriptor, seeded clock, and transport fault profile.
  - Event timing envelope and browser performance report.
- Exact REST/WebSocket payloads, database fields, and backend orchestration remain out of scope.

## Performance Simulation and Live-Latency Validation

- Build one contract-level backend simulator rather than isolated component mocks. It must expose the same frontend-facing HTTP snapshots and commands, WebSocket market/portfolio/Champion streams, and streamed chat protocol expected in production.
- Support both deterministic recorded replay and seeded synthetic generation so failures are reproducible and performance comparisons use identical event sequences.
- Make scenarios configurable by active Champions, warm and cold portfolios, subscribed instruments, chart-history size, event rate, burst size, message size, chat token rate, command-acknowledgement delay, jitter, disconnects, server errors, stale snapshots, duplicate events, out-of-order logical sequence numbers, and reconnect backfill.
- Provide named profiles for normal operation, market-open bursts, volatility spikes, slow commands, degraded connectivity, reconnect storms, large first visits, warm Champion switching, and long-running soak tests. Initial rates remain configuration rather than product guarantees until production-like baselines exist.
- Include event metadata sufficient to measure the full path: server emission, browser receipt, store application, subscriber notification, and next painted frame. Commands also record submission, acknowledgement, authoritative patch, and visible confirmation.
- Measure p50/p95/p99 event-to-paint latency, snapshot-to-usable-view time, command-to-visible-confirmation latency, dropped or conflated updates, stale-data age, long tasks, input responsiveness, frame rate, React commit cost, worker/store queue depth, memory growth, reconnect recovery time, and correctness after recovery.
- Use Playwright to drive real browser scenarios and retain traces on failure for DOM, network, console, and interaction diagnosis. [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- Use k6 separately to create concurrent HTTP/WebSocket pressure against the simulator or a staging backend; protocol load tests complement but do not replace browser rendering tests. New WebSocket tests use `k6/websockets`. [k6 WebSocket testing](https://grafana.com/docs/k6/latest/using-k6/protocols/websockets/)
- Run a small deterministic smoke profile in pull requests, broader burst/regression profiles on scheduled CI, and soak tests manually or against staging. Performance failures preserve the scenario seed, configuration, trace, and metric summary.
- Keep simulator data synthetic or explicitly sanitized. It must never require brokerage credentials, production API keys, customer conversations, or real portfolio data.
- Establish latency and memory budgets from measured baselines, then make regressions fail CI only after the budgets and acceptable variance are reviewed and recorded in the decision ledger.

## Accessibility, Motion, and Interaction Safety

- Target WCAG 2.2 AA for the supported demo viewport and document any known exceptions with an owner and revisit trigger.
- Define keyboard navigation and focus restoration across the persistent shell, Draft/Paper/Live switches, collapsible panels, dialogs, chat, virtualized histories, and React `Activity`-preserved views.
- Batch and prioritize assistive-technology announcements so high-frequency prices and portfolio changes do not flood live regions. Connection loss, risk changes, command outcomes, and required user action receive distinct announcement treatment.
- Provide a synchronized textual summary or accessible data table for information otherwise available only through canvas-based charts.
- Preserve meaningful collection semantics for virtualized tables and histories, including total-size and position information where supported.
- Honor `prefers-reduced-motion`. Motion and value flashes must be bounded, interruptible, and reserved for changes that warrant attention.
- Distinguish proposed, pending, optimistic, and authoritatively confirmed state without relying on motion or color alone. Animation must never imply that a strategy, order, deployment, or capital state changed before server confirmation.
- Define reconciliation behavior when streamed presentation or an optimistic projection differs from the authoritative patch; corrections must be legible and must not silently flicker into a different financial meaning.

## Test Strategy

- Add component and integration tests for semantic domain components, state ownership boundaries, command lifecycle, promotion safety, conflict recovery, and operational states.
- Run automated accessibility checks with axe where practical and `@axe-core/playwright` across critical Draft, Paper, Live, run-detail, promotion, and emergency-control journeys.
- Maintain visual-regression coverage for domain surfaces carrying financial meaning, focus treatment, responsive behavior, reduced-motion alternatives, degradation, and error states.
- Test keyboard-only completion of onboarding to Paper and the rigorous iteration loop.
- Keep deterministic browser performance tests and protocol load tests as complementary layers rather than substitutes for functional, accessibility, security, or visual testing.

## State and Data-Flow Diagrams

Use Mermaid source embedded in Markdown for:

- Core value loop: intent → draft → evidence → Paper → observation → iteration → Live.
- Draft checkpoint lifecycle: editing → validating → applied/checkpointed, with rejected, failed, conflict, offline, and recovery paths.
- Paper launch: Draft V5 · checkpoint V5.2 → validation → immutable Strategy V5 → Paper V5 + Draft V6 · checkpoint V6.0; failure leaves the Draft unchanged.
- Live promotion: eligible Paper V5 → change/risk review → explicit confirmation → Live V5.
- Cross-version learning: Paper V5 run context → compare with Draft V8 · checkpoint V8.4 → compatible proposal or explained conflict → validated Draft checkpoint.
- Command flow: conversation intent → Champion interpretation → typed change set → validation → authoritative patch → local projection.
- Portfolio run lifecycle: scheduled → evaluating → decision → no trade/trade → completed, with failed and cancelled outcomes.
- Portfolio operational lifecycle: provisioning → active → paused/degraded/disconnected → recovered or stopped.
- Live emergency controls: pause future executions and cancel eligible open orders as distinct, audited operations.
- Provenance graph: message → change set → checkpoint → immutable strategy → deployment → portfolio → run → decision → order/trade → outcome.
- Client state ownership: queries, patches, streaming stores, Zustand projections, IndexedDB recovery, and React surfaces.
- Performance harness: scenario source → protocol simulator → browser transports → stores/workers → React or chart renderers → performance marks and reports.
- Reconnect correctness: disconnect → stale indicator → snapshot/backfill → ordered reconciliation → current and usable view.
- Champion cache tiers: active, recently visited/warm, and aggregate-only.

## Decision Ledger

Record the following as accepted decisions with their reasoning and revisit conditions:

- Prioritize onboarding to understandable Paper value and the rigorous iteration loop over unrelated feature breadth.
- Define Champion as the agent identity and distinguish it from the Champion workspace and strategy lineage.
- Organize IA around Draft, Paper, and Live user goals rather than technical entities.
- Use major generations for deployed strategy identity and minor checkpoints for restorable draft history.
- Create one checkpoint per accepted semantic Draft change set, regardless of actor, not per low-level command.
- Label portfolios as Paper V5 while exposing Draft V5 · checkpoint V5.2 as exact source provenance.
- Allow multiple simultaneous Paper portfolios for longitudinal comparison.
- Require Paper validation before Live promotion.
- Treat evaluation as evidence only when its assumptions, data cutoff, behavior, rejections, risk, and limitations are visible; return alone is insufficient.
- Keep chat contextual but route strategy mutations exclusively to the current Draft.
- Always expose viewed context separately from the Draft mutation target.
- Apply observations from older portfolios as proposals against the latest Draft; explain conflicts and do not introduce multiple active Draft branches in the MVP.
- Keep deployed strategies immutable and show semantic rather than raw JSON differences.
- Use server-backed reads and validated patches; local stores render reality but do not define it.
- Use a single Next.js application initially.
- Use uncustomized shadcn for demo primitives; keep financial meaning in stable domain components and future visual identity behind a theme boundary.
- Target WCAG 2.2 AA and require accessible alternatives for canvas-only financial information.
- Honor reduced motion and prevent motion from implying unconfirmed financial state.
- Record the supported demo viewport and panel-collapse behavior before implementing the persistent workspace layout.
- Treat authenticated transport and current authorization as explicit frontend contracts for HTTP, streaming chat, and WebSocket reconnection.
- Keep high-frequency market state outside ordinary React state.
- Validate frontend performance against a deterministic contract-level backend simulator before optimizing from intuition.
- Treat browser event-to-paint measurements and protocol load measurements as separate, complementary test layers.
- Add CRDT collaboration, SharedWorker, protobuf, custom WebGL, or multiple frontend applications only after concrete requirements justify them.
- Treat AI review and automated testing as evidence, never as substitutes for explicit human approval of Live-capital changes.

## Validation Scenarios

The documentation is complete when a reader can trace these scenarios without ambiguity:

- A first-time user creates checkpoint V1.1 in Draft V1, tests it, launches Paper V1 from that exact checkpoint, and continues in Draft V2 at checkpoint V2.0.
- A user viewing Paper V5 asks for a change; Draft V6 advances while Paper V5 remains unchanged.
- A user viewing an old Paper V5 run while Draft V8 is at checkpoint V8.4 can transfer the complete run context into a proposed checkpoint V8.5 without overwriting or branching the Draft; incompatible rules produce an explanation and decision request.
- A user compares Paper V5, V6, and V7, opens V5, and sees immutable Strategy V5, its exact source checkpoint V5.2, and the portfolio's complete run history.
- A no-trade run explains what was evaluated, which rule blocked action, and how to explore an improvement in the Draft.
- A tested Paper V5 is promoted to Live V5 through an explicit risk and change review.
- A user can pause future Live executions independently from cancelling eligible open orders, with both actions clearly scoped and auditable.
- A disconnected or degraded portfolio remains visibly distinct from an active portfolio and exposes an appropriate recovery path.
- A failed checkpoint or promotion does not silently mutate Paper or Live.
- Offline or interrupted draft work is recovered by replaying pending commands from their base checkpoint; incompatible work is preserved for semantic conflict resolution without treating IndexedDB as canonical.
- Switching between warm Champions restores useful state quickly while cold Champions load progressively.
- Under identical seeded event streams, performance reports remain reproducible and identify regressions in event-to-paint latency, responsiveness, dropped updates, and memory.
- A market-open burst does not freeze strategy editing or chat input, and visible financial state remains within the documented freshness budget.
- A keyboard-only user can complete onboarding through Paper launch and move from a Paper run into a tested Draft improvement without losing focus context.
- A screen-reader user can access a meaningful equivalent of chart information without receiving announcements for every market tick.
- Pending or optimistic UI cannot be mistaken for an authoritatively accepted strategy, order, deployment, or capital change.
- Session expiry or revoked authorization closes or re-authenticates streams safely, clears unauthorized projections, and never presents cached data as currently authorized live state.
- After a forced disconnect and reconnect backfill, the UI reaches the same portfolio, order, run, and chart state as an uninterrupted deterministic replay without duplicate effects.
- Champion switching is exercised for active, warm, and cold cache tiers while background streams continue at configured load.
- Long-duration soak tests identify unbounded growth in subscriptions, chart data, virtualized histories, worker queues, or browser memory.
- Every portfolio outcome can be traced to a run and the precise immutable strategy responsible.

All Mermaid diagrams must render successfully, terminology must remain consistent across documents, and every state domain must have exactly one declared owner.

## Assumptions

- This phase documents product and frontend architecture, not backend implementation or database design.
- Draft checkpoint numbering is user-visible and restorable.
- Paper portfolios remain available after one is promoted to Live.
- The current IA presents one Live destination per Champion without encoding that as a permanent backend limitation.
- Direct editing, if supported, will use the same accepted change-set and checkpoint mechanism as chat-driven changes.
- The MVP maintains one active Draft lineage per Champion; alternative Draft branches are intentionally deferred.
- Starter patterns and quick evaluations must disclose their universe, time window, benchmark, capital, and other material assumptions rather than running a silent generic backtest.
- Performance simulation targets frontend-facing contracts and does not prescribe the production backend implementation.
- Performance budgets begin as observed baselines and become CI gates only after representative devices, data shapes, and network profiles are agreed.
- Outcome metrics will be named—time to first strategy, first test, first Paper, iteration-cycle time, version-context errors, and promotion abandonment—but numeric targets will wait for a measured baseline.
