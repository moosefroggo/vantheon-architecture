# Architecture Decision Ledger

## Status

This ledger records product and frontend architecture decisions for the Vantheon demo. It is not a backend schema or implementation backlog.

Decision states:

- **Accepted** — governs current design and implementation.
- **Proposed** — requires an explicit product or engineering decision before dependent work begins.
- **Deferred** — intentionally excluded until its revisit trigger occurs.
- **Superseded** — retained for history but replaced by another decision.

Changes to an accepted decision must update this ledger and every affected journey, entity, state diagram, and validation scenario.

## Summary

| ID | Decision | Status |
|---|---|---|
| D-001 | Prioritize onboarding to value and rigorous iteration | Accepted |
| D-002 | Define Champion, workspace, and strategy lineage separately | Accepted |
| D-003 | Use major Draft generations and minor checkpoints | Accepted |
| D-004 | Freeze immutable strategies when launching Paper | Accepted |
| D-005 | Keep multiple Paper portfolios for longitudinal evidence | Accepted |
| D-006 | Treat portfolios as persistent and runs as executions | Accepted |
| D-007 | Require Paper evidence before standard Live promotion | Accepted |
| D-008 | Keep conversation persistent but mutate only the current Draft | Accepted |
| D-009 | Apply old evidence to the latest Draft without MVP branching | Accepted |
| D-010 | Organize navigation around Draft, Paper, and Live | Accepted |
| D-011 | Use server-authoritative commands and patches | Accepted |
| D-012 | Assign one owner to each client-state domain | Accepted |
| D-013 | Start with one Next.js application | Accepted |
| D-014 | Keep high-frequency telemetry outside ordinary React state | Accepted |
| D-015 | Use stock shadcn through stable semantic boundaries | Accepted |
| D-016 | Target WCAG 2.2 AA and authoritative-state-safe motion | Accepted |
| D-017 | Validate rendering with a deterministic backend simulator | Accepted |
| D-018 | Derive performance budgets from representative baselines | Accepted |
| D-019 | Treat authentication and authorization as live contracts | Accepted |
| D-020 | Treat AI and automated review as evidence, not authority | Accepted |
| D-021 | Require a supported-viewport contract before layout work | Accepted |
| D-022 | Defer scale infrastructure until measured requirements exist | Deferred |
| D-023 | Require transparent, behavior-level evaluation evidence | Accepted |
| D-024 | Keep Live pause and open-order cancellation separate | Accepted |

---

## D-001 — Prioritize onboarding to value and rigorous iteration

**Status:** Accepted

**Context:** Feature breadth can obscure the two loops that determine whether users receive value and develop justified trust.

**Decision:** Plan and deliver against two ordered journeys: onboarding to understandable Paper value, then rigorous evidence-driven iteration.

**Reasoning:** These journeys test the complete product promise while forcing strategy clarity, provenance, testing, and capital separation to work together.

**Consequences:** Every feature must name the journey stage, friction, trust guarantee, and measure it improves. Unrelated work is deferred unless needed for security, compliance, accessibility, or reliability.

**Revisit when:** Instrumented usage shows a different journey is blocking activation or safe continued use.

## D-002 — Define Champion, workspace, and strategy lineage separately

**Status:** Accepted

**Context:** “Champion” had been used for an agent, a workspace, and a strategy history.

**Decision:** A Champion is the persistent AI agent identity. Its workspace is the interface containing Draft, Paper, Live, conversation, and activity. Its strategy lineage is the current Draft generation, its restorable checkpoints, and the immutable strategies created from prior Drafts.

**Reasoning:** Distinct concepts prevent ownership, routing, and provenance ambiguity without weakening the product metaphor.

**Consequences:** Interfaces and documentation must use the qualified terms when identity could be ambiguous.

**Revisit when:** Champions can share workspaces, control multiple independent active lineages, or transfer strategies between identities.

## D-003 — Use major Draft generations and minor checkpoints

**Status:** Accepted

**Context:** Users need a visible next iteration and restorable work without turning every autosave or low-level command into a public version.

**Decision:** Display the mutable candidate as `Draft Vn`. Each accepted semantic Draft change set creates one restorable checkpoint such as `V5.1 → V5.2`, regardless of whether it originated from conversation, direct editing, autonomous Champion work, or another authorized actor. Non-mutating, rejected, and autosave-only work do not increment it.

**Reasoning:** Major generations communicate deployment separation; minor checkpoints provide meaningful recovery and provenance.

**Consequences:** A change set containing multiple low-level commands produces one semantic checkpoint. Checkpoint creation is server-authoritative. The Draft generation and checkpoint are displayed separately: `Draft V8 · checkpoint V8.4`.

**Revisit when:** Direct multi-user editing or independent branch workflows require a different user-visible history model.

## D-004 — Freeze immutable strategies when launching Paper

**Status:** Accepted

**Context:** Continuing development must never change a strategy already collecting evidence.

**Decision:** Launching Draft V5 from checkpoint V5.2 creates immutable Strategy V5, starts a Paper portfolio pinned to it, and starts Draft V6 at checkpoint V6.0 independently.

**Reasoning:** The generation labels make the safety boundary visible and preserve the exact strategy definition and provenance. Reproducing execution additionally requires its runtime, data, clock, assumptions, and event inputs.

**Consequences:** Paper displays `Paper V5` while details expose the exact V5.2 source checkpoint. Draft edits cannot mutate Paper.

**Revisit when:** A product requirement permits in-place Paper strategy replacement; if adopted, deployment periods must preserve the old strategy and evidence.

## D-005 — Keep multiple Paper portfolios for longitudinal evidence

**Status:** Accepted

**Context:** Rigorous iteration requires observing behavior over time rather than replacing one simulated result with another.

**Decision:** Paper V5, V6, V7, and later portfolios may coexist, accumulate independent histories, and be compared.

**Reasoning:** Parallel evidence exposes behavioral and regime differences and avoids rewriting history.

**Consequences:** Navigation and caching must support multiple Paper portfolios. Comparisons must disclose unequal windows, schedules, and evidence quantities.

**Revisit when:** Resource cost or comprehension testing justifies archival, limits, or a different comparison model.

## D-006 — Treat portfolios as persistent and runs as executions

**Status:** Accepted

**Context:** Earlier diagrams risked grouping a portfolio with a backtest or scheduled execution.

**Decision:** A Paper or Live portfolio is a persistent container of capital state and evidence. A portfolio run is one scheduled decision and execution cycle inside it. A bounded user-requested test is an Evaluation, not a portfolio run. A portfolio is never modeled as a run.

**Reasoning:** This preserves continuity and lets every decision and trade trace to the specific execution that produced it.

**Consequences:** Run identity and strategy identity remain visibly separate. Backtests may share execution infrastructure but remain a distinct product concept.

**Revisit when:** A deliberate domain-model migration proposes redefining portfolio continuity or execution identity and supplies an equivalent provenance model.

## D-007 — Require Paper evidence before standard Live promotion

**Status:** Accepted

**Context:** Live capital requires stronger evidence and control than drafting or simulation.

**Decision:** The standard trust path is Draft → Paper → Live. Live pins the exact Paper-tested strategy and requires explicit destination, impact, risk, and capital confirmation.

**Reasoning:** This creates a progressive trust ladder and prevents conversational intent from becoming an immediate capital action.

**Consequences:** No automatic Paper-to-Live transition. Use `Launch Draft Vn to Paper` for Draft → Paper and `Promote Paper Vn to Live` for Paper → Live; reserve deployment for the underlying domain assignment. Emergency execution controls remain separate from strategy editing and from one another. Executed trades are not described as reversible.

**Revisit when:** A regulated or professionally controlled workflow supports an alternate path with equivalent safeguards and auditability.

## D-008 — Keep conversation persistent but mutate only the current Draft

**Status:** Accepted

**Context:** Users converse while viewing Draft, Paper, Live, or a specific run, but deployed strategies must remain immutable.

**Decision:** Conversation persists across the Champion workspace and carries viewed context. Strategy-changing requests always target the current Draft. The composer shows both viewed context and mutation target.

**Reasoning:** Persistent context improves explanation and iteration while a single mutation target removes capital ambiguity.

**Consequences:** A Paper question may explain its frozen strategy and then propose a current-Draft change. The interface must never imply that the viewed Paper or Live strategy was edited.

**Revisit when:** Multiple active Draft branches become an intentional product capability.

## D-009 — Apply old evidence to the latest Draft without MVP branching

**Status:** Accepted

**Context:** A user can learn from Paper V5 after the current Draft has advanced to Draft V8 at checkpoint V8.4.

**Decision:** Preserve Paper V5 and Strategy V5 as evidence, compare the relevant Strategy V5 rule with Draft V8 at checkpoint V8.4, and propose a semantic change against that current Draft checkpoint. Explain incompatibility and request a decision rather than silently overwriting or creating a second active branch.

**Reasoning:** Learning transfers forward without losing current work or exposing branch management during the MVP.

**Consequences:** Cross-version conflict resolution is a first-class product surface, not a generic overwrite dialog.

**Revisit when:** Users repeatedly need independent hypotheses that cannot be represented through Paper comparisons.

## D-010 — Organize navigation around Draft, Paper, and Live

**Status:** Accepted

**Context:** Strategies, versions, commands, deployments, and runs are implementation concepts rather than primary user goals.

**Decision:** The top-level Champion workspace exposes Draft, Paper, and Live, with conversation and identity persistent across them.

**Reasoning:** The structure maps to developing, learning, and controlling capital.

**Consequences:** Version history, runs, and entities appear contextually rather than as equal top-level destinations. Paper prioritizes evidence; Live prioritizes risk and control.

**Revisit when:** Usability testing shows users need a cross-Champion or cross-portfolio destination that cannot fit this workspace model.

## D-011 — Use server-authoritative commands and patches

**Status:** Accepted

**Context:** Human, Champion, risk engine, and future collaborator changes need uniform validation and provenance.

**Decision:** Writes flow through typed commands carrying idempotency identity and entity-appropriate preconditions. Draft mutations include a base checkpoint and, when applied, emit a new checkpoint. Portfolio, promotion, order, and operational commands use their own current-state, authorization, and concurrency preconditions. The browser renders projections and may show explicitly pending work, but does not define canonical strategy or financial state.

**Reasoning:** A command boundary supports authorization, concurrency, semantic history, and multiple actors.

**Consequences:** Streamed AI tool output is presentation, not authority. Stale commands reconcile or surface a domain conflict. Consequential Paper, Live, execution-pause, and order-cancellation commands fail closed and are never silently queued for offline replay. Immutable snapshots remain the final-state integrity source.

**Revisit when:** A proven offline-first requirement needs local authority; the safety and reconciliation model must then be redesigned explicitly.

## D-012 — Assign one owner to each client-state domain

**Status:** Accepted

**Context:** Duplicated ownership causes stale displays, excess rendering, and unpredictable reconciliation.

**Decision:** On the client, TanStack Query owns the cache and representation of server-backed read models and indexes; Zustand owns local interaction state and non-authoritative projections; IndexedDB stores recovery material and pending commands; an external subscription store owns high-frequency telemetry. Server domains remain authoritative for business state.

**Reasoning:** One declared owner makes data flow and failure behavior predictable.

**Consequences:** The same canonical entity is not independently authored in multiple stores. IndexedDB recovery compares base checkpoints and never overwrites newer server state blindly.

**Revisit when:** Profiling or offline requirements demonstrate that an ownership boundary is inadequate.

## D-013 — Start with one Next.js application

**Status:** Accepted

**Context:** Separate marketplace and terminal applications add authentication, navigation, analytics, deployment, and design-system complexity.

**Decision:** Use one React/TypeScript application with Next.js App Router and persistent layouts.

**Reasoning:** It supports public and authenticated surfaces while retaining a persistent client workspace and shared system.

**Consequences:** Client-heavy terminal surfaces remain isolated within the application. Route and data prefetching must preserve useful workspace continuity.

**Revisit when:** Measured performance, deployment independence, team ownership, or security boundaries justify a split.

## D-014 — Keep high-frequency telemetry outside ordinary React state

**Status:** Accepted

**Context:** Market and portfolio events can arrive much faster than users can interpret or React should reconcile an application tree.

**Decision:** Process high-frequency telemetry in an external store, subscribe narrowly with `useSyncExternalStore`, bind chart data imperatively where appropriate, and conflate visual updates to animation frames.

**Reasoning:** Execution fidelity and readable visual frequency are different requirements.

**Consequences:** React continues to own application composition, not every tick. Freshness and conflation must be measured and visible during degradation.

**Revisit when:** Measured loads are low enough for a simpler path or high enough to require workers, binary protocols, or custom rendering.

## D-015 — Use stock shadcn through stable semantic boundaries

**Status:** Accepted

**Context:** The demo needs speed without binding product meaning to generated primitive internals.

**Decision:** Use uncustomized shadcn primitives in `components/ui`, shared semantics in `components/system`, domain components in `components/domain`, and workflows in `features`. Isolate visual tokens in one theme file.

**Reasoning:** The demo gains accessible defaults while later branding can change tokens and internals without rewriting financial workflows.

**Consequences:** Avoid one-to-one wrappers and hard-coded product colors. Domain props express meaning rather than visual styling.

**Revisit when:** A custom design system or external component library becomes an explicit requirement.

## D-016 — Target WCAG 2.2 AA and authoritative-state-safe motion

**Status:** Accepted

**Context:** Dense live financial data, canvas charts, virtualization, and streaming updates create accessibility and comprehension risks.

**Decision:** Target WCAG 2.2 AA, provide textual equivalents for chart information, preserve keyboard/focus behavior, batch assistive announcements, honor reduced motion, and never use motion or color alone to imply confirmed financial state.

**Reasoning:** Accessibility and trustworthy state communication are product architecture requirements, not final-stage polish.

**Consequences:** Critical journeys receive keyboard, screen-reader, automated axe, reduced-motion, and visual-regression coverage.

**Revisit when:** Standards change; the target may be raised but not silently weakened.

## D-017 — Validate rendering with a deterministic backend simulator

**Status:** Accepted

**Context:** Protocol throughput alone cannot reveal main-thread stalls, chart cost, stale displays, or slow Champion switching.

**Decision:** Build one contract-level simulator for HTTP, WebSocket, and streamed chat behavior with seeded synthetic generation, recorded replay, latency, jitter, bursts, duplicates, logical reordering, disconnects, and backfill.

**Reasoning:** Reproducible end-to-end scenarios can test both correctness and event-to-paint behavior before the production backend is complete.

**Consequences:** Playwright drives browser scenarios; k6 creates protocol pressure separately. Failure artifacts retain seeds, configuration, traces, and metric summaries.

**Revisit when:** A staging backend fully satisfies deterministic replay and fault injection needs.

## D-018 — Derive performance budgets from representative baselines

**Status:** Accepted

**Context:** Invented latency thresholds can reward irrelevant optimization or produce unstable CI.

**Decision:** Instrument the full path, collect representative device/network/data baselines, and approve budgets and variance before turning regressions into CI failures.

**Reasoning:** Budgets should describe a validated experience, not unsupported precision.

**Consequences:** Measures are named immediately, but numeric targets remain unresolved until baselines exist.

**Revisit when:** Representative production telemetry supports tighter or segmented budgets.

## D-019 — Treat authentication and authorization as live contracts

**Status:** Accepted

**Context:** Long-lived streams and local caches can outlast sessions or permissions.

**Decision:** Specify authentication, reconnect re-authentication, token handling, session expiry, authorization changes, cross-tab logout, and cache/stream cleanup for HTTP, WebSocket, and streamed chat.

**Reasoning:** A connected stream or cached projection is not proof of current authorization.

**Consequences:** Revocation and expiry have explicit UI and cleanup states. Any retained recovery or cached data is quarantined according to the still-unresolved retention policy, inaccessible while unauthorized, and never displayed as if still live and authorized.

**Revisit when:** The identity provider and backend session design are finalized; implementation details can then be recorded without changing the principle.

## D-020 — Treat AI and automated review as evidence, not authority

**Status:** Accepted

**Context:** AI review and test automation improve coverage but can make mistakes, particularly around financial semantics.

**Decision:** Use Gemini review and automated tests as evidence. They never replace code ownership, required human review, server validation, or explicit user approval of Live-capital changes.

**Reasoning:** Automation reduces review cost without transferring accountability.

**Consequences:** Review findings remain actionable suggestions. Protected financial actions cannot depend solely on a model response or passing test suite.

**Revisit when:** Never for Live user approval; review workflow mechanics may change.

## D-021 — Require a supported-viewport contract before layout work

**Status:** Accepted

**Context:** A persistent workspace with navigation, a dense center surface, and conversation cannot be made meaningfully “responsive” without deciding which workflows each viewport supports.

**Decision:** Do not accept implementation of the persistent workspace shell until a supported-viewport contract defines minimum usable dimensions, collapse order, unsupported-width behavior, and the capabilities available on small screens.

**Unresolved implementation choice:** The current direction is desktop-first, with explicit graceful behavior below the supported width rather than an accidental compressed terminal. Exact widths, breakpoints, and mobile scope remain Proposed.

**Consequences:** Layout, accessibility, and visual-regression work must share one explicit viewport matrix rather than inventing behavior component by component.

**Revisit when:** Research supports expanding or narrowing the viewport capabilities; record the replacement contract before changing breakpoints.

## D-022 — Defer scale infrastructure until measured requirements exist

**Status:** Deferred

**Context:** SharedWorker, protobuf, custom WebGL, CRDT collaboration, and multiple frontend applications are coherent options but costly foundations.

**Decision:** Do not adopt them for the MVP without a concrete requirement and evidence that the simpler architecture fails.

**Reasoning:** The primary risks are user comprehension, useful evidence, iteration quality, and trust—not theoretical maximum throughput.

**Consequences:** Interfaces preserve upgrade paths, and the simulator establishes when additional infrastructure becomes justified.

**Revisit when:** Measured event load, collaboration behavior, rendering cost, or organizational boundaries cross an agreed threshold.

## D-023 — Require transparent, behavior-level evaluation evidence

**Status:** Accepted

**Context:** Fast backtests and attractive return numbers can create unjustified confidence when their assumptions and behavior remain hidden.

**Decision:** Treat an evaluation as meaningful evidence only when it discloses its universe, benchmark, time window, capital and transaction assumptions, data cutoff, limitations, actions, rejections or inactivity, and relevant risk behavior. Return alone is insufficient.

**Reasoning:** Users need to understand what the strategy did, why it acted or abstained, and where the result may not generalize before launching Paper or considering Live.

**Consequences:** No-trade and rejected decisions are first-class results. Quick evaluations use visible Champion-selected defaults, and infrastructure failure remains distinct from poor strategy performance.

**Revisit when:** A different evaluation type cannot express one of these fields; it must provide an equivalent explanation of conditions, behavior, risk, and limitations.

## D-024 — Keep Live pause and open-order cancellation separate

**Status:** Accepted

**Context:** Pausing future Champion executions does not necessarily cancel orders already eligible for execution, and cancelling open orders does not prevent future scheduled runs.

**Decision:** Expose `Pause future Champion executions` and `Cancel eligible open orders` as separate, audited, fail-closed operations with distinct scope, authorization, confirmation, and outcomes.

**Reasoning:** Combining the controls can leave capital behavior different from what the user intended during an urgent situation.

**Consequences:** The interface always states the status of the other concern after either operation. Neither action mutates the strategy, neither is silently queued offline, and partial failure remains explicit.

**Revisit when:** A future emergency workflow offers a combined orchestration action; the underlying operations and individual outcomes must still remain visible and auditable.
