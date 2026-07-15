# State and Data-Flow Diagrams

## Status and Scope

Accepted as the visual companion to `docs/domain-model.md` and `docs/priority-user-journeys.md`.

These diagrams specify observable product and frontend contracts. They do not prescribe database transactions, endpoint shapes, service boundaries, or orchestration implementation. A backend may realize the flows differently only if it preserves the named states, authority boundaries, failure behavior, and provenance.

## Reading Rules

- Server-authoritative state changes occur only after validation and an authoritative result.
- A client proposal, streamed tool output, animation, cache entry, or optimistic projection is never proof of acceptance.
- Draft, portfolio, deployment, run, order, and connection states are independent state domains. One diagram must not be interpreted as silently changing another.
- Paper and Live strategies are immutable. Strategy-changing actions always target the current Draft.
- Labels such as `Paper V5` are concise presentation labels; exact source checkpoints remain available in detail views.
- A failure path preserves the last valid authoritative state unless the diagram explicitly shows a successful transition.

## State-Domain Owners

| State domain | Sole authoritative owner | Client responsibility |
|---|---|---|
| Draft, checkpoints, Draft change sets, and Draft mutation commands | Server strategy domain | Render projection, collect intent, preserve eligible Draft recovery commands |
| Immutable strategy | Server strategy domain | Render immutable projection and provenance |
| Portfolio, deployment, Paper launch, Live promotion, and operational controls | Server portfolio and deployment domain | Review, confirm, show freshness and risk, and reconcile authoritative status |
| Run and decision | Server execution domain | Stream progress and render durable evidence |
| Order and trade | Server execution domain, reconciling venue or broker events | Never imply acceptance or fill before authoritative event |
| Session and authorization | Server identity and authorization boundary | Re-authenticate, gate actions, and clear unauthorized projections |
| Market telemetry | Market or server stream | Conflate visual updates and communicate freshness |
| Local interaction state | Browser | Own selection, panels, focus, and disposable projections |
| Offline Draft recovery queue | Browser until accepted by the server strategy domain | Preserve eligible Draft commands and replay against their base checkpoint; never queue consequential portfolio controls |
| Simulator clock and scenario | Test harness | Record marks and produce reproducible reports |

---

## 1. Core Value Loop

The two priority journeys share one loop. Live remains an explicit capital decision rather than an automatic completion step.

```mermaid
flowchart LR
    A["Express intent"] --> B["Create or improve current Draft"]
    B --> C["Review strategy and assumptions"]
    C --> D["Run transparent evaluation"]
    D --> E["Inspect actions, rejections, and risk"]
    E --> F{"Evidence understandable and useful?"}
    F -->|"No"| G["Ask, revise, or test again"]
    G --> B
    F -->|"Yes"| H["Launch Draft to Paper with immutable strategy"]
    H --> I["Observe portfolio runs and outcomes"]
    I --> J["Trace evidence to exact strategy rule"]
    J --> K["Propose learning against current Draft"]
    K --> B
    I --> L{"Eligible for Live review?"}
    L -->|"No"| I
    L -->|"Yes"| M["Review changes, impact, and risk"]
    M --> N["Explicit human confirmation"]
    N --> O["Activate Live deployment"]
```

## 2. Draft Checkpoint Lifecycle

One accepted semantic Draft change set creates one checkpoint, regardless of its authorized initiator. Low-level commands inside the change set do not create separate user-facing checkpoints.

```mermaid
stateDiagram-v2
    state "Editing current checkpoint" as Editing
    state "Change set proposed" as Proposed
    state "Awaiting transport" as Offline
    state "Recovering pending commands" as Recovering
    state "Server validating base and commands" as Validating
    state "Authoritative checkpoint created" as Checkpointed
    state "Rejected without mutation" as Rejected
    state "Failed without mutation" as Failed
    state "Base checkpoint conflict" as Conflict
    state "User or Champion resolves conflict" as Resolving
    state "Review restore as semantic change" as RestoreReview

    [*] --> Editing
    Editing --> Proposed: strategy change requested
    Editing --> RestoreReview: select prior checkpoint
    RestoreReview --> Validating: accept restore proposal against current base
    RestoreReview --> Editing: cancel restore
    Proposed --> Validating: submit with base checkpoint
    Proposed --> Offline: transport unavailable
    Offline --> Recovering: connection restored
    Recovering --> Proposed: base remains compatible
    Recovering --> Conflict: base is stale
    Validating --> Checkpointed: accepted and patch emitted
    Validating --> Rejected: invalid or unauthorized
    Validating --> Failed: interrupted or server failure
    Validating --> Conflict: stale or incompatible base
    Checkpointed --> Editing: next checkpoint is current
    Rejected --> Editing: explain result
    Failed --> Proposed: retry safely
    Failed --> Editing: discard proposal
    Conflict --> Resolving: compare semantic states
    Resolving --> Proposed: safe revised proposal
    Resolving --> Editing: cancel and preserve current Draft
```

Non-mutating conversation remains in `Editing` and does not increment the checkpoint. Restoring V8.2 from current V8.4 follows `RestoreReview → Validating → Checkpointed` and creates V8.5 containing the restored content; it never rewinds the current pointer or deletes V8.3/V8.4.

## 3. Paper Launch

The authoritative launch commit exposes Strategy V5, active Paper V5, and Draft V6 at checkpoint V6.0 together. No client state should imply that the generation advanced before that commit.

```mermaid
flowchart TD
    A["Draft V5 · checkpoint V5.2 is current"] --> B["Assess versioned Paper eligibility policy"]
    B --> C{"Eligible?"}
    C -->|"No"| F["Block launch and show missing criteria"]
    F --> A
    C -->|"Yes"| D["Review source checkpoint, assumptions, evaluation, schedule, and simulated capital"]
    D --> E{"Human confirms Paper launch?"}
    E -->|"No"| A
    E -->|"Yes"| G["Revalidate eligibility and prepare immutable Strategy V5 candidate"]
    G --> H["Provision Paper portfolio resources"]
    H --> I{"Provisioned?"}
    I -->|"No"| J["No active Paper; preserve retry target"]
    J --> A
    I -->|"Yes"| K["Commit authoritative Paper launch"]
    K --> L["Immutable Strategy V5 from Draft V5 · checkpoint V5.2"]
    K --> M["Paper V5 active with simulated capital"]
    K --> N["Draft V6 · checkpoint V6.0 becomes mutation target"]
```

Existing Paper portfolios remain independent. A later Draft normally launches another Paper portfolio rather than rewriting Paper V5.

## 4. Live Promotion

Live promotion uses the exact Paper-tested strategy. The prior Live deployment remains in control unless the final activation succeeds.

```mermaid
flowchart TD
    A["Paper V5 with immutable Strategy V5"] --> B["Assess versioned Live eligibility policy"]
    B --> C{"All hard criteria satisfied?"}
    C -->|"No"| D["Continue Paper and show missing, failed, or stale criteria"]
    C -->|"Yes"| E["Compare Strategy V5 with current Live strategy"]
    E --> F["Review capital, positions, orders, exposure, risk, and limitations"]
    F --> G{"Human confirms exact destination and capital?"}
    G -->|"No"| H["Keep candidate and current Live unchanged"]
    G -->|"Yes"| I["Recheck authorization, evidence, and current portfolio state"]
    I --> J{"Still valid?"}
    J -->|"No"| K["Block activation and show changed conditions"]
    K --> H
    J -->|"Yes"| L["Atomically activate Live deployment for Strategy V5"]
    L --> M["End prior deployment period if one exists"]
    L --> N["Live V5 becomes current controlling strategy"]
    N --> O["Audit confirmation and deployment provenance"]
```

## 5. Deployment Lifecycle

Deployment state is separate from portfolio operational state. A paused portfolio can still have the same active deployment assignment. In the MVP, a Paper deployment remains pinned for that Paper portfolio; only a Live deployment can be superseded in place.

```mermaid
stateDiagram-v2
    state "Deployment candidate" as Candidate
    state "Under review" as Reviewing
    state "Ready for activation" as Ready
    state "Provisioning assignment" as Provisioning
    state "Controlling portfolio" as Active
    state "Ended normally" as Ended
    state "Superseded by new deployment" as Superseded
    state "Failed before activation" as Failed
    state "Cancelled before activation" as Cancelled

    [*] --> Candidate
    Candidate --> Reviewing
    Reviewing --> Ready: evidence and confirmation complete
    Reviewing --> Cancelled: user cancels
    Reviewing --> Failed: invalid or unauthorized
    Ready --> Provisioning
    Provisioning --> Active: authoritative activation
    Provisioning --> Failed: activation fails
    Active --> Superseded: newer Live deployment activates
    Active --> Ended: portfolio stops
    Failed --> Reviewing: retry with current state
    Ended --> [*]
    Superseded --> [*]
    Cancelled --> [*]
```

## 6. Cross-Version Learning

Old evidence remains immutable context. The learning is translated into a proposal against the one current Draft rather than recreating the old Draft or opening an MVP branch.

```mermaid
flowchart TD
    A["Open Paper V5 Run 42"] --> B["Trace outcome to Strategy V5 rule and Draft V5 · checkpoint V5.2 source"]
    B --> C["Select Improve in Draft"]
    C --> D["Carry portfolio, run, decision, rule evaluation, cutoff, and question"]
    D --> E["Show Viewing Paper V5 Run 42"]
    D --> F["Resolve Draft V8 · checkpoint V8.4 as command target"]
    E --> G["Compare V5 source rule with Draft V8 · checkpoint V8.4 equivalent"]
    F --> G
    G --> H{"Learning compatible with current Draft?"}
    H -->|"Yes"| I["Show target and propose semantic change set against checkpoint V8.4"]
    I --> J["Validate commands and base checkpoint"]
    J --> K["Create authoritative checkpoint V8.5 in Draft V8"]
    H -->|"No"| L["Explain conflict, superseded rule, or changed assumption"]
    L --> M{"User chooses a safe resolution?"}
    M -->|"No"| N["Preserve V5 evidence and Draft V8 · checkpoint V8.4"]
    M -->|"Yes"| I
```

## 7. Correlated Champion Work and Command Flow

Conversation is one persistent presentation of work, not its owner. Its dock remains visible, while the primary domain surface and activity projection remain current through authoritative events if the conversation stream is loading, reconnecting, or unavailable.

```mermaid
sequenceDiagram
    actor User
    participant Surface as Primary domain surface
    participant Conversation as Conversation dock
    participant Activity as Champion activity projection
    participant Server as Authoritative server
    participant Champion as Champion runtime
    participant Query as Server-state projection
    participant Recovery as IndexedDB recovery queue

    User->>Surface: Submit intent or invoke action from an object
    Surface->>Server: Persist intent, source references, and Draft target
    Server-->>Activity: Emit verified work phase and affected object
    Server->>Champion: Interpret intent with evidence and current Draft
    Champion-->>Conversation: Stream explanation and typed object references
    Note over Conversation,Champion: Streamed parts are not work status or authoritative state
    Champion->>Server: Submit typed change set against base checkpoint
    Server->>Server: Validate actor, base, commands, and domain rules
    alt Accepted
        Server->>Server: Create one checkpoint and provenance
        Server-->>Query: Emit authoritative patch and status
        Query-->>Surface: Paint confirmed artifact and semantic change
        Server-->>Activity: Mark work complete with result reference
        Surface->>Recovery: Clear matching pending command
    else Rejected or failed
        Server-->>Query: Emit authoritative rejection or failure
        Query-->>Surface: Preserve Draft and explain result
        Server-->>Activity: Mark rejected or failed
    else Base conflict
        Server-->>Query: Emit current checkpoint and semantic conflict
        Query-->>Surface: Request safe resolution
    end
```

The conversation dock may summarize and link to the result, but the result is independently present in the primary surface and activity history. If transport is unavailable before submission, the browser preserves the pending command and its base checkpoint in the recovery queue. Reconnection replays it only after comparing that base with current server state.

## 8. Portfolio Run Lifecycle

A run records one execution cycle. Orders can outlive the run, so run completion does not imply that every accepted order has filled.

```mermaid
stateDiagram-v2
    state "Scheduled" as Scheduled
    state "Evaluating market and rules" as Evaluating
    state "Decision produced" as Deciding
    state "No-trade result" as NoTrade
    state "Orders submitted or proposed" as Orders
    state "Trade observed during run" as Trade
    state "Completed with durable evidence" as Completed
    state "Failed with cause" as Failed
    state "Cancelled before completion" as Cancelled

    [*] --> Scheduled
    Scheduled --> Evaluating: execution starts
    Scheduled --> Cancelled: cancelled before start
    Evaluating --> Deciding: evaluations complete
    Evaluating --> Failed: data or execution failure
    Evaluating --> Cancelled: authorised cancellation
    Deciding --> NoTrade: action rejected or hold
    Deciding --> Orders: one or more orders result
    Deciding --> Failed: decision cannot complete
    NoTrade --> Completed
    Orders --> Trade: fill arrives before run closes
    Orders --> Completed: orders remain separately tracked
    Trade --> Completed
    Failed --> [*]
    Cancelled --> [*]
    Completed --> [*]
```

## 9. Portfolio Operational Lifecycle

Operational status communicates whether a portfolio can execute and whether displayed state is current. It must remain distinct from strategy performance.

```mermaid
stateDiagram-v2
    state "Provisioning" as Provisioning
    state "Active and current" as Active
    state "Paused for future executions" as Paused
    state "Degraded but connected" as Degraded
    state "Disconnected and stale" as Disconnected
    state "Reauthorizing and reconciling" as Reconciling
    state "Provisioning or operational failure" as Failed
    state "Finishing current run; no new runs scheduled" as Stopping
    state "Stopped" as Stopped
    state "Archived Paper evidence" as Archived

    [*] --> Provisioning
    Provisioning --> Active: ready
    Provisioning --> Failed: provisioning fails
    Failed --> Provisioning: safe retry
    Failed --> Stopped: abandon
    Active --> Paused: execution pause accepted
    Paused --> Active: resume accepted
    Active --> Degraded: partial service or stale dependency
    Degraded --> Active: recovered
    Active --> Disconnected: stream lost
    Degraded --> Disconnected: stream lost
    Paused --> Disconnected: stream lost
    Disconnected --> Reconciling: transport and authorization return
    Reconciling --> Active: snapshot and backfill converge
    Reconciling --> Paused: reconciled portfolio remains paused
    Reconciling --> Degraded: recovery incomplete
    Active --> Stopping: stop accepted during a run
    Active --> Stopped: stop accepted while idle
    Paused --> Stopped: stop accepted
    Degraded --> Stopping: stop accepted during a run
    Degraded --> Stopped: stop accepted while idle
    Stopping --> Stopped: current run reaches terminal state
    Stopped --> Archived: archive Paper
    Archived --> Stopped: unarchive; remain stopped
    Stopped --> [*]: close non-Paper history
```

Paper archive is deliberately two-step: an Active or Stopping portfolio cannot transition directly to Archived. Unarchive restores discoverability and historical inspection only; a separate explicit resume action is required before any future scheduled run.

The navigation status must preserve both entity existence and the underlying lifecycle through connection loss. `No portfolio` is not a state in this machine because no entity exists yet. `Disconnected` applies only after a portfolio exists and overlays its last confirmed lifecycle; recovery reconciles that same portfolio rather than creating a new one. Compact dots may reinforce these states, but persistent text carries the canonical meaning.

## 10. Live Emergency Controls

Pausing executions and cancelling orders are separate operations because each has a different scope and may succeed independently. Neither edits the strategy.

```mermaid
flowchart TD
    A["Open Live emergency controls"] --> B{"Choose operation"}

    B -->|"Pause future executions"| C["Review scope and current run state"]
    C --> D["Explicitly confirm execution pause"]
    D --> E["Reauthorize and submit audited pause command"]
    E --> F{"Pause accepted?"}
    F -->|"Yes"| G["Portfolio state becomes Paused"]
    F -->|"No"| H["Keep prior operational state and explain"]
    G --> I["Open orders remain separately visible"]

    B -->|"Cancel eligible open orders"| J["List exact eligible and ineligible orders"]
    J --> K["Select scope and explicitly confirm cancellation"]
    K --> L["Reauthorize and submit cancellation per order"]
    L --> M["Reconcile accepted, rejected, filled, and already-cancelled results"]
    M --> N["Audit each authoritative order outcome"]
    N --> O["Execution schedule remains separately controlled"]
```

## 11. Authoritative Order Lifecycle

A cancellation request is not a cancellation, and an accepted order is not a trade. Each fill produces immutable trade evidence.

```mermaid
stateDiagram-v2
    state "Decision proposes order" as Proposed
    state "Submitted to authority" as Submitted
    state "Accepted and open" as Open
    state "Partially filled" as Partial
    state "Cancellation requested" as CancelPending
    state "Filled" as Filled
    state "Rejected" as Rejected
    state "Cancelled" as Cancelled
    state "Expired" as Expired

    [*] --> Proposed
    Proposed --> Submitted: submit authorised order
    Proposed --> Cancelled: withdraw before submission
    Submitted --> Open: authority accepts
    Submitted --> Rejected: authority rejects
    Submitted --> CancelPending: cancellation requested
    Open --> Partial: fill received
    Open --> Filled: full fill received
    Open --> CancelPending: cancellation requested
    Open --> Expired: time in force ends
    Partial --> Partial: additional partial fill
    Partial --> Filled: remaining quantity fills
    Partial --> CancelPending: cancel remainder
    CancelPending --> Cancelled: authority confirms
    CancelPending --> Partial: fill arrives before cancellation
    CancelPending --> Filled: full fill arrives before cancellation
    CancelPending --> Rejected: order submission was never accepted
    Filled --> [*]
    Rejected --> [*]
    Cancelled --> [*]
    Expired --> [*]
```

## 12. Provenance Graph

Every outcome remains traceable without pretending that every outcome includes an order or trade.

```mermaid
flowchart LR
    A["Message or system observation"] --> B["Interpreted intent"]
    B --> C["Semantic change set"]
    C --> D["Typed commands"]
    D --> E["Draft checkpoint"]
    E --> F["Immutable strategy"]
    E --> G["Evaluation"]
    F --> H["Deployment"]
    H --> I["Portfolio"]
    I --> J["Portfolio run"]
    J --> K["Rule evaluations"]
    K --> L["Decision"]
    L --> M["No-trade outcome"]
    L --> N["Order"]
    N --> O["Trade"]
    O --> P["Position and performance outcome"]
    I --> Q["Market-attributed outcome"]
    Q --> P
```

An evaluation may originate from a Draft checkpoint before Paper launch. A market-attributed outcome must not be presented as if the Champion directly caused the market movement.

## 13. Client State Ownership and Write Boundary

Reads flow down as snapshots, queries, and patches. Writes flow up as typed commands. The browser renders and recovers work; it does not define strategy or financial reality.

```mermaid
flowchart TD
    AUTH["Session and authorization boundary"] --> SERVER["Authoritative server domains"]

    SERVER -->|"Snapshots and entity queries"| QUERY["TanStack Query read models"]
    SERVER -->|"Authoritative patches and statuses"| QUERY
    QUERY --> REACT["React domain surfaces"]

    SERVER -->|"Market and portfolio telemetry"| EXT["External subscription store"]
    EXT --> CHART["Imperative chart bindings"]
    EXT -->|"Selective subscription"| REACT

    SERVER -->|"Chat parts and progress"| CHAT["Streaming chat projection"]
    CHAT --> REACT

    LOCAL["Zustand local interaction and projections"] --> REACT
    REACT -->|"Selection, panels, focus, compare"| LOCAL

    REACT -->|"Intent and typed commands"| SERVER
    REACT -->|"Preserve pending command and base"| IDB["IndexedDB recovery buffer"]
    IDB -->|"Replay after base comparison"| SERVER

    NOTE["No cache or stream proves current authorization"] --> AUTH
```

## 14. Performance Harness and Timing Path

The browser harness measures real render cost. Protocol load tests create backend pressure but do not substitute for event-to-paint measurement.

```mermaid
flowchart LR
    REC["Sanitized recorded replay"] --> SCENARIO["Scenario descriptor and seeded clock"]
    SYN["Seeded synthetic generator"] --> SCENARIO
    SCENARIO --> SIM["Contract-level protocol simulator"]

    K6["k6 HTTP and WebSocket pressure"] --> SIM
    SIM --> HTTP["HTTP snapshots and commands"]
    SIM --> WS["WebSocket event streams"]
    SIM --> STREAM["Streamed chat protocol"]

    PLAY["Playwright browser scenario"] --> BROWSER["Real browser"]
    HTTP --> BROWSER
    WS --> BROWSER
    STREAM --> BROWSER

    BROWSER --> RCV["Browser receipt mark"]
    RCV --> STORE["Store or worker apply mark"]
    STORE --> SUB["Subscriber notification mark"]
    SUB --> RENDER["React or chart rendering"]
    RENDER --> PAINT["Next painted frame mark"]

    SIM --> EMIT["Server emission time, stream epoch, and sequence"]
    EMIT --> REPORT["Performance and correctness collector"]
    RCV --> REPORT
    STORE --> REPORT
    SUB --> REPORT
    PAINT --> REPORT
    BROWSER --> REPORT
    REPORT --> ART["Seed, profile, metrics, trace, and regression report"]
```

Command scenarios add submission, acknowledgement, authoritative result, patch receipt, and visible-confirmation marks. Ordering uses stream sequence and authoritative revision; timestamps measure latency and freshness.

## 15. Reconnect Correctness

The UI preserves last-known information with an explicit stale state. It does not present cached data as currently authorized or current.

```mermaid
flowchart TD
    A["Current authorized view"] --> B["Transport disconnect detected"]
    B --> C["Mark data stale and gate unsafe actions"]
    C --> D["Reconnect transport and reauthenticate"]
    D --> E{"Authorization valid?"}
    E -->|"No"| F["Close streams and clear unauthorized projections"]
    F --> G["Show signed-out or access-revoked state"]
    E -->|"Yes"| H["Request snapshot, stream epoch, and backfill"]
    H --> I["Deduplicate event identities"]
    I --> J["Order by epoch, sequence, and authoritative revision"]
    J --> K{"Gap or conflict remains?"}
    K -->|"Yes"| L["Request authoritative recovery snapshot"]
    L --> I
    K -->|"No"| M["Apply one reconciled projection"]
    M --> N["Resume subscriptions from reconciled cursor"]
    N --> O["Mark view current and usable"]
```

Under a deterministic scenario, the final portfolio, run, order, and chart state must equal uninterrupted replay without duplicate effects.

## 16. Champion Cache Tiers

Cache tier is a frontend performance policy, not a change in domain authority.

```mermaid
flowchart LR
    A["Aggregate-only Champion"] -->|"Card visible or hover prefetch"| B["Recently visited or warm Champion"]
    A -->|"Direct cold selection"| C["Progressive snapshot and history load"]
    C --> D["Active Champion"]
    B -->|"Select"| D
    D -->|"Switch away"| B
    B -->|"Warm limit or memory pressure"| A

    A --> A1["Status, value, daily result, version, small series"]
    B --> B1["Recent chat, strategy snapshot, chart state, recent activity"]
    D --> D1["Full visible detail, relevant streams, and chart resolution"]
```

The active tier receives full visible detail. A bounded set of recently visited Champions stays warm. All others retain only aggregates. Hidden React views must still clean up effects and subscriptions explicitly.

Champion switching is a parent-context transition with a fail-closed interaction boundary:

```mermaid
stateDiagram-v2
    [*] --> ChampionAActive
    ChampionAActive --> Switching: Select Champion B
    Switching --> BindBIdentity: Clear or namespace A transient state
    BindBIdentity --> RestoreB: Bind B route, thread, and mutation scope
    RestoreB --> ReconcileB: Restore B last environment and warm state
    ReconcileB --> ChampionBActive: Authorization and target resolved
    ReconcileB --> ChampionBDegraded: Stale, unavailable, or unauthorized reference
    ChampionBDegraded --> ChampionBActive: Scoped recovery succeeds
```

While `Switching`, strategy-changing submission is disabled. Champion A's conversation, mutation target, selected objects, optimistic projections, and financial facts cannot appear as Champion B state. `RestoreB` can use only Champion B namespaced state; a missing item becomes an explicit scoped empty/error state rather than a cross-Champion fallback.

## Diagram Validation Scenarios

The diagrams are internally consistent only if all of these statements remain true:

- Paper launch creates one immutable strategy and a new Draft generation without exposing partial active state.
- A rejected, failed, conflicted, offline, or cancelled change does not increment the Draft checkpoint.
- A user can follow Paper V5 evidence into Draft V8 at checkpoint V8.4 and create checkpoint V8.5 without altering or branching V5.
- A portfolio owns many runs; a run pins the exact deployment and immutable strategy active at its start.
- No-trade completes a run with durable evidence and no fabricated order.
- A Champion switch restores only the selected Champion's conversation, last environment, mutation target, and domain references; no prior-Champion interaction state leaks across the boundary.
- An order may complete after its originating run, and cancellation remains pending until authoritative confirmation.
- Pausing future executions does not imply that open orders were cancelled, and cancelling orders does not pause future runs.
- Failed Live activation leaves the previous Live deployment in control.
- Disconnects remain visibly stale until authorization, snapshot, and ordered backfill converge.
- Browser timing marks measure event-to-paint behavior without becoming event-order authority.
- Active, warm, and aggregate-only Champion tiers change retained client detail, not business state.
