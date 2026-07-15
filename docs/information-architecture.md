# Information Architecture

## Status

Accepted for the Champion workspace hierarchy and the two priority journeys.

**Viewport support remains Proposed under P-001.** The layout behavior in this document is the proposed desktop-first policy; exact supported widths and any mobile capability must be decided before layout implementation is accepted.

## IA Objective

> Keep intent, strategy, evidence, and iteration close together while making development, simulated operation, and capital-bearing operation unmistakably different.

The IA is organized around user goals—Draft, Paper, and Live—not backend entities. Versions, checkpoints, commands, deployments, and runs appear where they help the user understand or act; they are not peer top-level destinations.

The active domain surface—not the transcript—is the center of the workspace. Conversation is a contextual control and explanation channel correlated with the strategy, evidence, activity, and outcomes visible in that surface.

## Persistent Champion Workspace

Champion selection is the shell-level parent context. One selected Champion owns the visible workspace, conversation, Draft/Paper/Live hierarchy, mutation target, and attached domain references. Within that scope, the Champion workspace persists while the selected Draft, Paper portfolio, Live surface, or detail view changes.

```mermaid
flowchart TB
    CS[Champion selector] --> W[Champion workspace]
    W --> S[Persistent shell]
    S --> I[Champion identity and status]
    S --> N[Draft / Paper / Live switcher]
    S --> M[Primary domain surface]
    S --> A[Correlated Champion activity]
    S --> C[Complementary conversation]
    M --> D[Draft workspace]
    M --> P[Paper workspace]
    M --> L[Live workspace]
    N --> M
    D --> T[Current Draft mutation target]
    P --> T
    L --> T
    P --> PS[Active and stopped Paper selector]
    P --> AR[Archived Paper collection]
    P --> E[Immutable portfolio evidence]
    L --> E
```

### Persistent shell responsibilities

- Champion selector plus the selected Champion's identity, availability, and current activity.
- Draft/Paper/Live switcher with explicit `Developing` and `Running` labels.
- Current operational, freshness, and authorization status when material.
- A primary domain surface whose identity, status, current work, and next meaningful action remain legible without conversation.
- Persistently visible docked conversation whose prompt, references, and attached context adapt to the viewed surface.
- Correlated Champion activity that exposes verified work phases and resulting domain objects outside prose.
- Viewed-context and Draft-mutation-target labels adjacent to the composer.
- Notifications and secondary detail that can collapse during data-dense work; conversation remains visible.
- Stable navigation and useful cached state while nested content changes.

Within one selected Champion, the shell must not reset conversation, reconnect transports solely because of Draft/Paper/Live navigation, or imply that changing views changes the strategy controlling a portfolio. Champion selection follows the scoped transition below.

### Champion selection and restoration

Switching Champions is one scoped workspace transition, not a collection of independent panel changes:

```text
Select Champion B
→ bind shell identity to Champion B
→ restore Champion B conversation/thread
→ restore Champion B last active Draft/Paper/Live environment
→ restore only Champion B selections and attached domain references
→ reconcile Champion B authorization, freshness, and warm/cold cache state
→ enable Champion B interactions
```

- Each Champion preserves its own last active environment, nested portfolio/run/rule selection, conversation position, and eligible warm-cache state.
- The shell changes identity before showing loading or restored content; the prior Champion's strategy, messages, financial values, and controls never remain interactive under the new identity.
- Composer attachments, Draft mutation targets, local edits, pending UI actions, optimistic projections, and domain references are cleared or restored by Champion-scoped keys. They never transfer implicitly.
- A warm return may restore useful last-known state immediately with visible freshness and reconciliation status. A cold selection progressively loads after the new Champion identity is established.
- Deep links name the Champion scope explicitly. Unauthorized or missing cross-Champion references fail closed inside the selected shell rather than resolving against another Champion with a matching display label.
- Cross-Champion comparison, if added later, is an explicit multi-scope surface. It cannot reuse an ordinary single-Champion composer or mutation target.

## Workspace Attention and Correlation Model

The layout must not resemble a general-purpose chat application with an attached preview. Its attention hierarchy is:

1. **Primary domain surface:** the structured Draft, Evaluation result, Paper portfolio, run/decision trace, comparison, or Live risk/control view.
2. **Correlated work and activity:** what the Champion or system is doing, which object it affects, what completed, and what requires attention.
3. **Conversation:** intent, clarification, explanation, and contextual requests.

At every supported viewport, conversation remains docked beside the primary surface. The primary surface receives the majority of usable workspace and first focus, while the dock retains a usable composer, current context, mutation target, connection state, and relevant history. Conversation never becomes an overlay, sheet, modal, transient drawer, or separate route. If a viewport cannot preserve both regions without obscuring domain identity, evidence, or consequential controls, its full-workspace support must be resolved under P-001 rather than by covering the work with chat.

### Bidirectional correlation

Conversation and domain work remain synchronized without duplicating authority:

```text
Message or direct workspace action
→ intent / activity
→ proposed change, Evaluation, or analysis
→ authoritative domain result
→ visible artifact, evidence, or outcome
```

- A message that initiates work shows typed references to its activity, change set, Evaluation, run, or eligibility result.
- Champion progress appears in the activity system and on the affected domain surface, not only as streaming prose.
- A completed result materializes in its canonical surface. Chat summarizes and links to it instead of becoming the only place it can be inspected.
- Selecting a reference in conversation opens, focuses, or highlights the corresponding object in the primary surface.
- `Ask Champion`, `Explain`, and `Improve in Draft` actions launched from an object attach that exact object, immutable source, and data cutoff to conversation.
- Semantic changes highlight the affected structured strategy sections and remain in History even if the originating message is not visible.
- Virtualizing, reconnecting, or failing conversation does not hide or cancel accepted work; authoritative status comes from domain events and queries, and the persistent dock exposes its degraded state in place.

Chat is never a top-level route, the sole progress indicator, the only approval surface, or the only record that a change, Evaluation, run, order, or deployment occurred.

## Desktop Workbench Pattern

After a structured Draft exists, the Champion workspace uses an operational workbench rather than an onboarding page:

```text
┌──────────────────────────── Global toolbar ─────────────────────────────┐
├─ Environment ─┬──── Primary workbench ────┬─ Inspector ─┬─ Conversation ┤
│ Draft Vn      │ Strategy / portfolio /    │ Rule, run,  │ Context +     │
│ Paper         │ run / risk surface        │ evidence    │ mutation      │
│ Live          │                           │             │ target        │
├───────────────┴────── Test / run output tray ────────────┴──────────────┤
```

- **Environment navigator:** Draft, active and stopped Paper portfolios, Archived Paper, and Live. Each row pairs a compact semantic status dot with explicit sub-copy such as checkpoint state, `No portfolios`, `Running`, or a risk/connection state. The dot supports scanning but never replaces the words.
- **Primary workbench:** the actual structured strategy, portfolio, run, comparison, or Live control surface. It is fluid and receives most usable space; it is not placed inside a centered hero card.
- **Contextual inspector:** parameters, constraints, evidence, provenance, and actions for the selected rule, metric, chart point, position, order, run, or decision.
- **Output tray:** Evaluation, backtest, portfolio-run, decision, order, and failure output remains correlated with the artifact without replacing it.
- **Champion conversation dock:** always visible, non-modal, and spatially secondary. `Discuss`, `Explain`, or `Improve in Draft` focuses its composer with the selected object attached; normal selection keeps its viewed context synchronized without covering the canonical object.

The Draft workbench composes one permanent circuit rather than scattering workflow verbs across tabs:

```text
checkpoint + untested changes → Test → evidence versus baseline → eligibility → optional Paper launch
```

`Test Draft Vn` remains available in every Draft state. Eligibility and `Launch Draft Vn to Paper` appear beside it when valid; neither replaces Test. The output tray exposes a named `Dry Runs` collection rather than a generic `Tests` bucket. Its rows identify each immutable Evaluation and its exact Draft checkpoint, outcome, and completion time; selecting a row opens the Dry Run as a dedicated workbench page with `Summary` and `Activity` views. Strategy rules carry latest-evidence references; selecting a rule filters its decisions, and selecting a decision focuses the responsible rule.

The developer-workflow analogy is intentional: the navigator selects an environment or artifact, the workbench exposes its source of record, the output tray presents evidence, and the Champion helps interpret or propose a change against the current Draft.

Empty-Draft onboarding may temporarily combine intent capture, transparent starters, and an emerging artifact. As soon as a structured Draft exists, onboarding chrome and teaching copy yield to this workbench. Paper and Live remain navigable before creation through compact readiness states; they are not disabled simply because they are empty.

## Conceptual Navigation Hierarchy

```text
Champions
└── Selected Champion
    └── Champion Workspace
        ├── Draft Vn · Developing
        │   ├── Strategy                  default
        │   ├── Experiments               evaluations and backtests
        │   ├── History                   checkpoints and immutable versions
        │   └── Data                      advanced
        ├── Paper
        │   ├── Active and stopped portfolio selector
        │   ├── Compare portfolios
        │   ├── Archived portfolios      secondary searchable collection
        │   └── Selected Paper Vn · Running
        │       ├── Overview              default
        │       ├── Runs
        │       ├── Positions
        │       ├── Orders
        │       └── Strategy Vn           read-only, exact source checkpoint
        └── Live · Running Vn
            ├── Overview                  default
            ├── Risk
            ├── Positions
            ├── Orders
            ├── Runs
            └── Strategy Vn               read-only
```

One Live destination is shown per Champion in the initial IA. This does not establish a permanent backend limit. Multiple Paper portfolios are first-class and remain independently selectable and comparable.

### Route identity rules

- Use stable Champion, portfolio, run, and experiment identifiers for routing; display labels such as `Paper V5` are not entity identifiers.
- Champion identity is the parent route and cache namespace for Draft, Paper, Live, conversation, and nested domain references.
- Keep Draft, Paper, and Live routes beneath the persistent Champion layout.
- A selected Paper portfolio remains addressable so run, decision, and comparison context can be shared or restored.
- Deep links restore the viewed context and then resolve the current Draft mutation target independently.
- Unauthorized, deleted, stopped, or unavailable resources render an explicit state within the shell rather than silently redirecting to a different financial context.

Exact URL syntax is an implementation concern; these identity and persistence rules are the contract.

## Workspace Switcher

The switcher answers three questions without opening another view:

| Item | Primary label | Required secondary state | Behavior |
|---|---|---|---|
| Draft | `Draft V8` | `Untested · V8.4` or `Tested · V8.4` | Opens the current mutable Draft. |
| Paper | `Paper` or selected `Paper V5` | `No portfolios` or an explicit count plus operational state, such as `1 portfolio · Running` | Opens the selected/recent Paper; exposes all Paper portfolios and comparison. |
| Live | `Live` | `No live portfolio` or the existing portfolio's strategy plus risk/operational state | Opens Live overview or readiness state if Live does not exist. |

The number communicates strategy generation; the state words communicate what exists and what is happening. A neutral/active/attention dot may reinforce that meaning, but it is decorative and never carries status alone. Selection uses structure and `aria-current`, not the status dot. `No live portfolio` is entity absence; `Disconnected` applies only to an existing portfolio whose current stream cannot be confirmed. Draft, Paper, and Live must remain distinguishable without custom color.

## Draft Workspace: Create and Test

### Default information order

1. Loop bar: Draft/checkpoint, untested changes, permanent Test, eligibility, and optional Paper launch.
2. Strategy objective and structured content with direct, validated rule-edit affordances.
3. Universe, entry/exit behavior, sizing, risk, schedule, assumptions, and exclusions.
4. Rule-linked evidence from the latest matching Evaluation.
5. Evidence ledger with evaluated checkpoint, baseline, neutral deltas, assumptions, cutoff, and limitations.
6. Most recent semantic change set and provenance.
7. Advanced configuration and raw detail.

### Primary actions

- Empty/new Draft: `Describe what you want` or select a transparent starter.
- Coherent Draft without evidence: `Test Draft Vn`.
- Changed Draft with prior evidence: `Evaluate changes`.
- Paper eligibility satisfied under D-027: `Launch Draft Vn to Paper`.

Test is permanent. `Evaluate changes` is contextual wording for the same Test capability; Paper launch is an additional action, never its replacement.

Strategy review and the first evaluation result remain inline on the default Strategy surface. Experiments provides history and depth; it must not be a required detour for the core loop.

### Secondary destinations

- **Dry Runs:** always discoverable in the sticky output tray. `Test Draft` creates and opens a new immutable Dry Run; completed runs remain reopenable. Summary contains the outcome, simulated-order breakdown, near misses, data-integrity result, takeaway, and baseline comparison. Activity contains coarse verified phases, condition evaluations, observed values, sources, freshness, assumptions, and resulting orders—not hidden chain-of-thought or internal file paths.
- **Experiments:** the deeper collection for Dry Runs, backtests, assumptions, results, and comparison when the output tray no longer provides enough history.
- **History:** restorable checkpoints, immutable strategies, semantic changes, and provenance. Selecting `Restore checkpoint V8.2` opens a semantic restore review against the current checkpoint; acceptance creates the next checkpoint rather than rewinding history.
- **Data:** datasets, universes, benchmarks, and advanced assumptions. Keep secondary during onboarding.

## Paper Workspace: Learn and Compare

Paper is a persistent simulated portfolio, not a run. It is optimized for understanding whether an immutable strategy behaves as intended over time.

### Overview information order

1. `Paper Vn`, simulated-capital label, exact immutable strategy, and source checkpoint.
2. Four-number value strip: portfolio value, return/P&L, exposure, and drawdown.
3. Cadence-honest evidence curve or truthful first-run placeholder.
4. Latest meaningful run or event, visible above the fold on the accepted desktop viewport.
5. Operational facts: buying power, positions, orders, freshness, schedule, and next expected run.
6. Performance limitations, evidence-linked Champion assessment, and comparison entry point.
7. Positions, orders, and read-only strategy detail.

### Paper navigation

- **Overview:** current evidence and Champion assessment.
- **Runs:** scheduled cycles, decisions, trades, no-trades, failures, and source data cutoff.
- **Positions:** simulated holdings and exposure.
- **Orders:** simulated order history and status.
- **Strategy:** frozen read-only Strategy Vn, source Draft Vn · checkpoint Vn.x, semantic changes, and provenance.
- **Compare:** a Paper-level action for selecting multiple persistent portfolios; it need not be repeated as a tab inside every selected portfolio.
- **Archived:** a Paper-level collection of stopped portfolios retained for history and comparison without scheduled runs or full-resolution subscriptions.

Runs precede Positions and Orders in Paper navigation because learning why the strategy acted is the primary job. A run detail defaults to its decision trace, not raw logs.

### Primary actions

- Portfolio overview: `Review latest run` or, when a result is selected, `Improve in Draft Vn`.
- Run/no-trade detail: `Ask Champion about this run` and `Improve in Draft Vn`.
- Comparison: `Continue observing` or `Evaluate learning in Draft Vn`.
- Active Paper: `Stop future Paper runs` with explicit schedule impact and preserved evidence.
- Stopped Paper: `Archive Paper portfolio`; archive is reversible and deletion is not offered in the MVP.

Existing Paper portfolios remain unchanged when a newer Draft is evaluated or launched to Paper. Each Paper launch creates another independently observable source of evidence.

### Paper lifecycle interaction placement

Lifecycle controls stay secondary to learning and iteration. They must be discoverable without competing visually with `Review latest run`, `Improve in Draft`, or comparison.

| Portfolio state | Paper selector | Portfolio detail | Available lifecycle action |
|---|---|---|---|
| Active | Visible with `Running` status | Overview header overflow or settings area | `Stop future Paper runs` |
| Stopping | Visible with `Stopping` status | Persistent progress/status; evidence remains usable | No duplicate stop or archive action |
| Stopped | Visible in a `Stopped` subsection until archived | Read-only evidence with stopped time and last completed run | `Archive Paper portfolio` or explicitly resume if supported |
| Archived | Removed from active and stopped selector groups | Opened from the Paper-level `Archived` collection | `Unarchive`; returns to Stopped and never resumes automatically |

The Paper switcher ends with a secondary `Archived` entry that shows a count and opens a searchable collection. Archived portfolios do not appear alongside active comparison candidates by default, but the comparison picker may include them through an explicit `Include archived` filter.

`Stop future Paper runs` opens a scoped confirmation that states:

- No new scheduled runs begin after the stop is accepted.
- A run already executing may reach a terminal state unless a separately supported cancellation action is chosen.
- Simulated positions, immutable strategy, runs, decisions, orders, and performance evidence are preserved.
- Stopping does not change the current Draft, Live, or another Paper portfolio.

After the authoritative stop result, show `Archive Paper portfolio` in the stopped portfolio's overflow/settings area and optionally in its selector-row context menu. Archive confirmation explains that the portfolio leaves the everyday selector, loses scheduled work and full-resolution subscriptions, and remains searchable, inspectable, and available as historical comparison evidence.

Archiving an Active or Stopping portfolio in one action is not offered. Unarchive is also explicit and authoritative; it returns the portfolio to Stopped so resuming scheduled runs, if supported, requires a separate action and confirmation.

### Comparison validity

Paper comparison is descriptive until a declared evidence envelope is satisfied. The comparison shows the common observation window, market/regime overlap, schedules, completed runs, trade/no-trade activity, data quality, capital assumptions, and material strategy differences.

When P-008 thresholds are not met, label the result `Insufficient comparable evidence`. Show differences, but do not rank portfolios, declare a winner, recommend Live, or let Champion prose imply that one strategy is superior. Full-lifetime metrics remain secondary when lifetimes differ.

## Live Workspace: Control and Risk

Live is optimized for capital visibility, risk, pending actions, and operational control rather than experimentation.

### Overview information order

1. Live status and exact immutable strategy controlling future operation.
2. Capital, cash, exposure, risk status, and freshness.
3. Pending orders/actions and next scheduled execution.
4. Material recent decisions and outcomes.
5. Operational warnings and required action.
6. Positions, orders, runs, and read-only strategy detail.

### Live navigation

- **Overview:** capital, exposure, pending activity, and recent events.
- **Risk:** constraints, current utilization, warnings, and breaches.
- **Positions:** holdings and concentration.
- **Orders:** pending, eligible for cancellation, filled, rejected, and historical orders.
- **Runs:** decision cycles and explanations.
- **Strategy:** exact read-only strategy and provenance.

### Primary and emergency actions

- Normal state: `Review Live Vn` or `Prepare changes in Draft Vn`.
- Candidate satisfying the current D-027 policy: `Review Paper Vn for Live`; promotion remains a separate review journey.
- Emergency: `Pause future Champion executions` and `Cancel eligible open orders` are separate controls with distinct consequences, confirmations, permissions, and audit results.

Editing the Draft never serves as an emergency control and never alters Live directly.

## Journey 1 IA: Onboarding to Value

The onboarding route keeps the core sequence on the Draft default surface until Paper launch.

| Stage | Default surface | Primary content | Primary action | Trust signal |
|---|---|---|---|---|
| Orientation | Empty Draft | Champion capability, no-money-at-risk state, intent prompt, transparent starters | Describe intent / choose starter | Clear Paper versus Live language |
| Intent | Conversation + Draft shell | Material questions and declared defaults | Create Draft | No portfolio created |
| Understand | Draft Strategy | Structured rules, risks, assumptions, exclusions, explanation | Test Draft | Current Draft/checkpoint visible |
| Evidence | Inline evaluation | Actions, rejections, risk, window, benchmark, capital, cutoff, limitations | Revise or launch Paper | Infrastructure failure separated from poor performance |
| Paper review | Paper launch review | Exact checkpoint, immutable snapshot, schedule, simulated capital | Confirm Paper launch | Explicitly no real capital |
| Activated | Paper Overview | Running Paper V1, frozen strategy, first useful next action | Review first/latest run | Draft V2 shown separately |

Do not require navigation to Data, History, raw logs, broker setup, or Live configuration before activation. Users may open deeper details, but the next action returns to the core path.

## Journey 2 IA: Rigorous Iteration

Iteration begins from evidence and returns to evidence; it does not begin from a generic settings screen.

| Stage | Viewed context | Persistent context/action | Destination |
|---|---|---|---|
| Observe | Paper/Live overview, comparison, run, decision, order, risk, or no-trade | Exact portfolio, strategy, run, cutoff, and selected observation | Explanation in place |
| Trace | Run decision trace | Rule evaluations, action/rejection, immutable rule, source checkpoint | `Improve in Draft Vn` |
| Transfer | Original evidence remains attached to conversation | `Viewing … · Changes go to Draft Vn · checkpoint Vn.x` | Current Draft semantic proposal |
| Resolve drift | Source version compared with current Draft | Compatible application or domain-language conflict choices | Server-validatable proposal |
| Review change | Draft Strategy | Motivation, change, benefit, downside, unchanged constraints, provenance | Accept/reject change set |
| Test | Inline evaluation/Experiments | Baseline, assumptions, risk, behavior, limitations | Revise or launch new Paper |
| Compare | Paper comparison | Common window, source checkpoints, behavior, risk, activity, limitations | Continue observing or request Live review |
| Capital review | Separate Live promotion review | Exact tested strategy, evidence sufficiency, impact, warnings, destination | Explicit confirmation |

### Context transfer contract

`Improve in Draft` carries enough information to restore and audit the observation:

- Champion and portfolio.
- Paper or Live strategy version and source Draft checkpoint.
- Run, decision, order, trade, or no-trade reference.
- Relevant rule evaluations and market-data cutoff.
- Selected observation or user question.

The source remains immutable. If it differs materially from the current Draft, show the comparison and conflict before offering a change.

## Viewed Context Versus Mutation Target

This distinction is persistent, not a one-time warning.

| Viewed surface | Analysis context | Strategy mutation target | Required composer treatment |
|---|---|---|---|
| Draft V8 · checkpoint V8.4 | Current Draft | Draft V8 · checkpoint V8.4 | `Developing Draft V8 · checkpoint V8.4` |
| Paper V5 overview | Paper V5 evidence | Draft V8 · checkpoint V8.4 | `Viewing Paper V5 · Changes go to Draft V8 · checkpoint V8.4` |
| Paper V5 Run 42 | Run 42 and Strategy V5 | Draft V8 · checkpoint V8.4 | Preserve the run reference visibly |
| Live V3 | Live V3 evidence and risk | Draft V8 · checkpoint V8.4 | `Viewing Live V3 · Changes go to Draft V8 · checkpoint V8.4` |
| Paper comparison | Selected immutable portfolios | Draft V8 · checkpoint V8.4 | List compared versions; one Draft target |

An explanatory question does not create a checkpoint. When the Champion proposes a strategy change, the semantic change-review surface identifies the target again before acceptance. Server validation and the authoritative patch determine whether the Draft changed.

## Novel Decision Surfaces

### Semantic change review

This is a first-class domain surface, not a generic confirmation dialog. It shows:

- Draft target and current base checkpoint.
- Related commands grouped into understandable strategy changes.
- Motivation and linked evidence.
- Expected benefit and possible downside.
- Unchanged constraints.
- Required follow-up test.
- Proposed, validating, accepted/applied, rejected, failed, stale, or superseded status.

### Version-conflict resolution

When old evidence or offline work conflicts with the current Draft, show:

- Immutable source and current Draft side by side in domain language.
- The rule or assumption that diverged.
- Why direct application is incompatible or redundant.
- Safe choices that the server can validate, including keeping the current Draft, adapting the learning, or cancelling the proposal.

Do not expose silent overwrite, raw JSON merge, or a second active Draft branch as an MVP choice.

### Eligibility review

Paper launch and Live promotion render the versioned server eligibility assessment rather than inferring readiness in the browser. Show:

- Policy version and exact Draft checkpoint or Paper strategy assessed.
- Satisfied, missing, failed, stale, and advisory criteria.
- The evidence, data cutoff, authorization, risk, and operational input behind each criterion.
- Whether reassessment is required before confirmation.
- The remediation or observation still needed.

Missing hard Live criteria block the standard MVP promotion path. The Champion may explain the assessment but cannot alter it or replace it with a recommendation.

## Operational, Loading, and Error States

Every primary route renders one of these states without losing the persistent shell or changing financial context unexpectedly.

| State | User-visible requirement | Safe action |
|---|---|---|
| Loading | Identify what is loading; retain known identity and context | Wait or navigate elsewhere |
| Empty | Explain why no entity/evidence exists and show one next action | Create, test, or return |
| Stale | Show last update and that displayed data may be outdated | Retry/reconnect; avoid implying currentness |
| Offline | Preserve local pending work and base checkpoint; Paper/Live are read-only cached context | Reconnect or continue recoverable Draft work |
| Provisioning | State destination and progress without calling it active | Cancel if supported or wait |
| Active | Show fresh status and next expected operation | Normal contextual action |
| Paused | State that future Champion executions are paused and clarify open-order status | Resume if authorized; manage orders separately |
| Degraded | Explain impaired capability and affected data/actions | Retry, inspect details, or use safe controls |
| Disconnected | Show loss of live updates, last confirmed state, and reconnection progress | Reconnect; do not present cached values as live |
| Failed | Separate infrastructure failure from strategy outcome | Retry, preserve candidate/source, or contact support |
| Unauthorized/session expired | Remove or obscure unauthorized projections and stop protected streams | Re-authenticate or leave workspace |
| Recovering/reconciling | Show snapshot/backfill progress and temporary freshness limits | Wait; block conflicting consequential actions |
| Stopped/closed | Preserve historical evidence and state that no future operation occurs | Inspect history, archive Paper, or create a new destination |
| Archived Paper | Remove from the active selector, stop schedules/subscriptions, and retain provenance | Inspect, compare descriptively, or restore to stopped history |

Command, Paper-launch, and Live-promotion failures leave the previous authoritative Draft, Paper, and Live state intact. A failed Paper or Live transition must not land on a partially active success view.

## Progressive Disclosure

| Moment | Keep primary | Reveal on demand | Defer until needed |
|---|---|---|---|
| First entry | Champion, no-money-at-risk state, intent, starter assumptions | How starters work | Data plumbing, checkpoints, raw commands |
| First Draft | Objective, rules, risk, assumptions, explanation, test | Full strategy sections, latest semantic diff | Advanced datasets and technical schema |
| Evaluation | Actions/rejections, behavior, risk, assumptions, limitations | Detailed trades, regime slices, raw observations | Engine diagnostics |
| Paper | Running version, source checkpoint, assessment, runs, comparison | Positions, orders, full strategy | Low-level telemetry |
| Live | Capital, exposure, risk, pending actions, version, freshness | Full positions/orders/runs/strategy | Operational diagnostics unless degraded |
| Conflict | Source/current semantic difference and safe choices | Full provenance | Raw command or JSON diff for support only |

Progressive disclosure must not hide material assumptions, warnings, capital impact, authorization, freshness, or the identity of the strategy in control.

## Viewport and Panel Policy — Proposed (P-001)

### Proposed behavior

- **Wide desktop:** persistent Champion/navigation region, primary workspace, and docked contextual conversation appear simultaneously.
- **Constrained supported desktop:** preserve both the majority-width primary workspace and a usable conversation dock; reduce navigation to a compact rail and collapse secondary detail before reducing either canonical financial context or the dock's context/composer contract.
- Notifications and secondary detail may collapse, but conversation, Draft/Paper/Live identity, operational state, freshness, and consequential-action feedback remain visible. Widths that cannot safely preserve this contract require an explicit P-001 support decision and do not fall back to an overlay.
- Resizing secondary regions or moving focus between the workspace and conversation preserves selection and context predictably.
- Dense tables and charts adapt or scroll without clipping risk, order, version, or confirmation information.

### Decisions required before layout implementation is accepted

- Minimum supported CSS viewport width and height.
- Supported browser/device matrix and representative test devices.
- Exact panel-collapse order and breakpoints.
- Whether widths below the minimum receive a read-only portfolio experience, a reduced workflow, or an explicit unsupported notice.
- Whether any mobile experience can perform strategy changes, Paper launch, Live promotion review, or emergency controls.
- Keyboard, screen-reader, zoom, and reduced-motion behavior at each supported layout.

Until these are recorded in the decision ledger, “responsive” must not be used as an unqualified acceptance claim.

## Search, History, and Deep Detail

- Virtualize long conversations, runs, orders, positions, and activity histories.
- Provide application-level search/filtering where off-screen virtualized content is unavailable to browser find.
- Search results retain entity type, Champion, portfolio/version, timestamp, and operational context.
- Opening a result does not change the current Draft target merely because it opens old evidence.
- Deep links and back navigation restore selection, scroll position where practical, and the source context attached to conversation.

## Traceability to Priority Journeys

| IA surface | Onboarding contribution | Iteration contribution |
|---|---|---|
| Persistent shell | Orientation and stable Champion identity | Preserves conversation and context across evidence and Draft |
| Draft Strategy | Creates understandable first strategy and inline evidence | Reviews semantic proposal and tests current checkpoint |
| Experiments | Stores deeper first-test detail | Compares hypothesis with baseline |
| Paper Overview | Activation destination and first running evidence | Ongoing observation and improvement entry point |
| Run decision trace | Explains initial action/rejection | Establishes precise causal source for improvement |
| Paper comparison | Not required before first activation | Tests improvements longitudinally without replacing history |
| Paper archive collection | Not shown in the core activation path | Bounds active Paper clutter while preserving historical evidence |
| Live Overview/Risk | Excluded from required first-session flow | Supports separate capital decision and ongoing control |
| Contextual conversation | Captures intent and explains evidence | Transfers immutable evidence to the current Draft |
| Semantic change review | Makes Champion-selected changes understandable | Preserves deliberate, evidence-linked improvement |
| Conflict resolution | Handles interrupted/stale onboarding safely | Prevents old evidence from silently overwriting the latest Draft |

## IA Acceptance Checks

- A first-time user can reach Paper without opening advanced Data, raw History, or Live configuration.
- The default Draft surface keeps strategy, latest changes, evidence, and the next test action close together.
- A user can distinguish Draft Vn, Paper Vn, and Live Vn without color.
- Every Paper and Live view exposes the exact immutable strategy in control and its source checkpoint.
- A Paper or Live observation can reach `Improve in Draft` without losing its run and rule context.
- The composer always exposes viewed context and mutation target when they differ.
- Persistent conversation does not duplicate or replace Champion activity, current work, domain results, authority, or the next meaningful action in the primary surface.
- Paper navigation prioritizes runs and learning; Live navigation prioritizes risk and control.
- Active Paper can be stopped from its detail context; only Stopped Paper can be archived; Archived Paper is discoverable outside the everyday selector and unarchives without resuming.
- No-trade, stale, degraded, disconnected, unauthorized, and failed states remain understandable and actionable.
- Emergency pause and eligible-order cancellation cannot be mistaken for strategy editing or each other.
- Collapsed panels, deep links, and warm navigation preserve context and restore focus.
- The two priority journeys can be completed with keyboard-only navigation at every supported viewport.
- The viewport decision is resolved and recorded before responsive layout acceptance.
