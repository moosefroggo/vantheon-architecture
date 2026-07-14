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

| ID | Decision | Status | Owner role | Date |
|---|---|---|---|---|
| D-001 | Prioritize onboarding to value and rigorous iteration | Accepted | Product | 2026-07-14 |
| D-002 | Define Champion, workspace, and strategy lineage separately | Accepted | Product | 2026-07-14 |
| D-003 | Use major Draft generations and minor checkpoints | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-004 | Freeze immutable strategies when launching Paper | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-005 | Keep multiple Paper portfolios for longitudinal evidence | Accepted | Product | 2026-07-14 |
| D-006 | Treat portfolios as persistent and runs as executions | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-007 | Require Paper evidence before standard Live promotion | Accepted | Product + Risk | 2026-07-14 |
| D-008 | Keep conversation persistent but mutate only the current Draft | Accepted | Product + Frontend | 2026-07-14 |
| D-009 | Apply old evidence to the latest Draft without MVP branching | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-010 | Organize navigation around Draft, Paper, and Live | Accepted | Product + Design | 2026-07-14 |
| D-011 | Use server-authoritative commands and patches | Accepted | Domain Engineering | 2026-07-14 |
| D-012 | Assign one owner to each client-state domain | Accepted | Frontend | 2026-07-14 |
| D-013 | Start with one Next.js application | Accepted | Frontend | 2026-07-14 |
| D-014 | Keep high-frequency telemetry outside ordinary React state | Accepted | Frontend | 2026-07-14 |
| D-015 | Use stock shadcn through stable semantic boundaries | Accepted | Design + Frontend | 2026-07-14 |
| D-016 | Target WCAG 2.2 AA and authoritative-state-safe motion | Accepted | Design + Accessibility | 2026-07-14 |
| D-017 | Validate rendering with a deterministic backend simulator | Accepted | Frontend + Performance | 2026-07-14 |
| D-018 | Derive performance budgets from representative baselines | Accepted | Performance | 2026-07-14 |
| D-019 | Treat authentication and authorization as live contracts | Accepted | Security + Frontend | 2026-07-14 |
| D-020 | Treat AI and automated review as evidence, not authority | Accepted | Engineering | 2026-07-14 |
| D-021 | Require a supported-viewport contract before layout work | Accepted | Design + Frontend | 2026-07-14 |
| D-022 | Defer scale infrastructure until measured requirements exist | Deferred | Architecture | 2026-07-14 |
| D-023 | Require transparent, behavior-level evaluation evidence | Accepted | Product + Risk | 2026-07-14 |
| D-024 | Keep Live pause and open-order cancellation separate | Accepted | Product + Risk | 2026-07-14 |
| D-025 | Seed each next Draft from the exact launched checkpoint | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-026 | Restore checkpoints by creating a new append-only checkpoint | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-027 | Make Paper and Live eligibility explicit and server-authoritative | Accepted | Product + Risk | 2026-07-14 |
| D-028 | Treat Champion inputs and outputs as untrusted proposals | Accepted | Champion Platform + Security | 2026-07-14 |
| D-029 | Give Paper portfolios explicit stop and archive lifecycles | Accepted | Product + Domain Engineering | 2026-07-14 |
| D-030 | Compare Paper evidence only within a declared validity envelope | Accepted | Product + Data | 2026-07-14 |
| D-031 | Phase the simulator with the product vertical slices | Accepted | Frontend + Performance | 2026-07-14 |
| D-032 | Center domain work and evidence rather than the chat transcript | Accepted | Product + Design + Frontend | 2026-07-14 |

## Proposed Decisions

Proposed decisions are tracked here rather than scattered as anonymous `unresolved` footers. `Blocking point` states when implementation must stop for a decision; it does not imply that all proposals block the first vertical slice.

| ID | Decision needed | Owner role | Blocking point | Status |
|---|---|---|---|---|
| P-001 | Minimum supported viewport, collapse order, and small-screen capabilities | Design + Frontend | Before workspace shell acceptance | Proposed |
| P-002 | Identity provider, session mechanism, reconnect authentication, and offline-data retention | Security + Frontend | Before authenticated user data | Proposed |
| P-003 | Snapshot cursor, event identity, sequence, and backfill contracts | Backend + Frontend | Before production live streams | Proposed |
| P-004 | Which Draft interactions may use visibly optimistic presentation | Product + Frontend | Before optimistic Draft UI | Proposed |
| P-005 | Browser, assistive-technology, forced-colors, and operating-system test matrix | Accessibility + QA | Before production Live use | Proposed |
| P-006 | Live-region batching, critical-event taxonomy, and notification preferences | Accessibility + Product | Before production live alerts | Proposed |
| P-007 | Versioned Live evidence-policy thresholds by strategy cadence and risk class | Product + Risk | Before Live promotion ships | Proposed |
| P-008 | Paper comparison validity thresholds and insufficient-evidence treatment | Product + Data | Before Paper comparison claims improvement | Proposed |
| P-009 | Champion model/provider, tool policy, model-evaluation suite, and upgrade gates | Champion Platform + Security | Before Champion commands affect a Draft | Proposed |
| P-010 | Representative performance devices, networks, scenario scales, and CI variance | Performance | Before numeric budgets block CI | Proposed |
| P-011 | Telemetry vendors, schemas, sampling, retention, and redaction policy | Security + Observability | Before production telemetry | Proposed |
| P-012 | Dense-chart accessible-table granularity and virtualization fallback | Accessibility + Data Visualization | Before affected charts ship | Proposed |

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

**Decision:** Begin with visually stock shadcn primitives in `components/ui`, shared semantics in `components/system`, domain components in `components/domain`, and workflows in `features`. Isolate visual tokens in one theme file. Accessibility corrections to tokens, focus treatment, target size, or component spacing are required when stock defaults fail the accepted WCAG target and are not considered bespoke branding.

**Reasoning:** The demo gains accessible defaults while later branding can change tokens and internals without rewriting financial workflows.

**Consequences:** Avoid one-to-one wrappers and hard-coded product colors. Domain props express meaning rather than visual styling. Audit stock components in the actual supported viewport before calling the demo WCAG 2.2 AA conformant.

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

## D-025 — Seed each next Draft from the exact launched checkpoint

**Status:** Accepted

**Context:** Launching Draft V5 at checkpoint V5.2 creates Paper V5 and Draft V6 at checkpoint V6.0. The content of V6.0 must not be ambiguous.

**Decision:** Draft V6 checkpoint V6.0 is a byte-for-byte equivalent structured-strategy seed of the exact V5.2 content frozen as Strategy V5, interpreted under the same schema. It begins a new mutable generation solely to separate future work from the strategy now running in Paper.

**Reasoning:** The user continues from the strategy they just launched without mutating Paper or losing work. The major number communicates deployment separation, not an immediate semantic change.

**Consequences:** V6.0 is a generation-initialization checkpoint, not the result of a semantic change set. It records its parent immutable strategy and source checkpoint. The first accepted semantic change creates V6.1.

**Revisit when:** The product intentionally supports starting a new generation from a template, empty strategy, or different source; that must be a separate explicit action, never Paper-launch behavior.

## D-026 — Restore checkpoints by creating a new append-only checkpoint

**Status:** Accepted

**Context:** Users need to recover a prior Draft state without erasing intervening work or rewriting deployed strategies.

**Decision:** Restoring checkpoint V8.2 while Draft V8 is at V8.4 creates a semantic restore proposal against V8.4. After review and server validation, acceptance creates checkpoint V8.5 whose strategy content matches V8.2 under the current schema. V8.3 and V8.4 remain in history.

**Reasoning:** Restore behaves like every other authoritative Draft mutation and preserves a complete causal history.

**Consequences:** Restore never moves the checkpoint pointer backward, deletes history, changes Paper or Live, or bypasses semantic review. Schema incompatibility opens conflict resolution instead of applying silently.

**Revisit when:** Branching becomes an accepted product capability.

## D-027 — Make Paper and Live eligibility explicit and server-authoritative

**Status:** Accepted

**Context:** “Evidence sufficient” and “eligible for Live” cannot be left to whichever screen happens to implement the action.

**Decision:** Eligibility is a versioned, explainable server policy. Paper launch requires a structurally valid Draft, defined risk constraints and schedule, available data dependencies, disclosed assumptions, and at least one successfully completed transparent Evaluation. A zero-trade Evaluation may qualify because Paper exists to gather evidence. Live promotion additionally requires the exact Paper-tested strategy, satisfied evidence-policy thresholds, no blocking operational/data/risk failures, current authorization, a fresh impact review, and explicit human confirmation.

**Reasoning:** Paper should be easy and safe to start; Live must fail closed against an auditable policy rather than UI convention.

**Consequences:** The UI shows every satisfied, missing, failed, and stale criterion. The standard MVP path has no user override for a missing hard Live criterion. A zero-trade Paper may qualify only when its observation/run requirements are met and the inactivity is expected and explained; zero trades neither automatically qualifies nor disqualifies it. Numeric thresholds remain P-007 until Risk and Product approve them.

**Revisit when:** Regulation, account type, strategy cadence, or risk class requires a different policy; policy version and rationale remain attached to every review.

## D-028 — Treat Champion inputs and outputs as untrusted proposals

**Status:** Accepted

**Context:** The Champion consumes user text, market data, research, news, tool output, and runtime context that may be wrong, malicious, stale, or adversarial. Its own explanation cannot independently validate its proposal.

**Decision:** Treat all model-consumed content as untrusted data and every model-produced command, explanation, citation, and semantic diff as a proposal. Server-side schema, permission, invariant, risk, and policy validation must be independent of the model. Tool access is allowlisted, scoped, audited, and separated between read, Draft mutation, Paper, and Live-capital capabilities.

**Reasoning:** Prompt injection, hallucination, tool misuse, and model regression must not create a direct authority path to strategy or capital state.

**Consequences:** Champion runtime/version provenance is recorded; model upgrades require regression evaluation; consequential operations retain explicit human and server gates; untrusted content cannot grant tools, change system instructions, or supply authoritative confirmation. See `docs/champion-runtime-safety.md`.

**Revisit when:** Never for the untrusted-input and independent-validation principles; individual tools and evaluation gates evolve through P-009.

## D-029 — Give Paper portfolios explicit stop and archive lifecycles

**Status:** Accepted

**Context:** Iteration can create many persistent scheduled Paper portfolios. Letting all of them run forever increases cost and makes comparison unusable.

**Decision:** Users can stop future Paper runs without deleting accumulated evidence, then archive only after the portfolio reaches Stopped. Active and Stopped Paper remain in the everyday selector; Archived Paper moves to a secondary searchable collection. Archived portfolios remain inspectable and eligible as historical comparison context but do not run or receive full-resolution subscriptions. Unarchive returns to Stopped and never resumes automatically.

**Reasoning:** The product preserves provenance while bounding scheduled work and active-navigation density.

**Consequences:** Stop, archive, unarchive, and any future resume are separate audited actions. A run already in progress may finish while the portfolio is Stopping, but no later scheduled run begins. Archive is reversible; deletion is not an MVP operation. The UI recommends review when active Paper count or inactivity exceeds a product-configured threshold, which remains non-authoritative.

**Revisit when:** Retention, cost, or regulatory policy requires immutable cold storage or deletion.

## D-030 — Compare Paper evidence only within a declared validity envelope

**Status:** Accepted

**Context:** Comparing a long-running Paper portfolio with a newly launched one can imply confidence that the evidence does not support.

**Decision:** Every Paper comparison declares its evidence envelope: common observation window, market/regime overlap, strategy schedules, completed runs, trade/no-trade activity, data quality, capital assumptions, and material strategy differences. When P-008 thresholds are unmet, the UI labels the comparison `Insufficient comparable evidence` and may show descriptive differences but must not rank, recommend, or declare a winner.

**Reasoning:** Disclosure alone does not make incomparable samples meaningful.

**Consequences:** Common-window results are primary; full-lifetime results are secondary and clearly unequal. Champion assessments cite the envelope and cannot upgrade an insufficient comparison through prose.

**Revisit when:** A reviewed statistical or experimental methodology replaces the initial validity policy.

## D-031 — Phase the simulator with the product vertical slices

**Status:** Accepted

**Context:** The full simulator specification is valuable but would compete with the product if built before stable frontend contracts and journeys exist.

**Decision:** Slice 1 implements only the production-shaped contract facade, deterministic normal profile, one delay/failure path, event-to-paint marks, and expected-state oracle needed for onboarding to first evidence. Reconnect/backfill enters with Paper learning; burst, large-history, session-change, multi-browser, k6, and soak profiles enter only with the features they protect.

**Reasoning:** Performance evidence grows with the product instead of becoming a speculative parallel backend.

**Consequences:** The complete scenario catalog remains the target architecture, not the initial milestone. Each vertical slice funds the smallest simulator capability needed for its correctness and responsiveness claims.

**Revisit when:** Production contracts or a staging backend can replace portions of the simulator earlier.

## D-032 — Center domain work and evidence rather than the chat transcript

**Status:** Accepted

**Context:** Conversation is a powerful way to express intent and ask for explanation, but making the transcript the dominant surface would make Vantheon resemble a general chatbot and would hide durable work, progress, evidence, and authority inside prose.

**Decision:** The primary workspace is always the active domain surface: structured Draft, Evaluation, Paper evidence, run/decision trace, comparison, or Live risk and control. Conversation is a persistent, contextual collaboration channel beside that surface. Champion work materializes through structured activity and authoritative domain entities; messages reference those entities rather than becoming their only representation.

**Reasoning:** Users trust financial software by seeing what exists, what changed, what is running, what evidence supports it, and what remains pending. Chat is best at intent and explanation; structured artifacts and event-linked evidence are best at comprehension, iteration, and auditability.

**Consequences:** The primary surface receives spatial, focus, loading, and navigation priority. Conversation may collapse without hiding current work or stopping the Champion. Progress, semantic changes, evaluations, eligibility, runs, and outcomes remain inspectable outside the transcript. Selecting a reference in conversation opens or focuses the corresponding domain object; invoking the Champion from an object attaches that exact context. Chat is never a top-level product destination or the only work queue, status display, approval surface, or audit trail.

**Revisit when:** Never for the separation between conversational presentation and authoritative domain state; layout emphasis may change after measured usability evidence.
