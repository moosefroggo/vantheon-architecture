# Vantheon Architectural Review

> **Superseded review — retained for history only.** This review targeted an earlier `PLAN.md` revision and contains recommendations that conflict with accepted decisions. Do not use it as implementation guidance. Current authority lives in `docs/decisions.md` and the dedicated handbook documents.

This document provides a comprehensive, objective, and professional architectural evaluation of the Vantheon Product & Frontend Architecture as defined in `PLAN.md`. It synthesizes critical insights, risks, and recommendations compiled from three independent Explorer reports: Engineering & Product Analysis, Design & UX Analysis, and Growth & Loops Analysis.

---

## Part 1: Comprehensive Architectural Analysis (Five Perspectives)

### 1. Engineering Perspective: Technical Stack & Performance Analysis

The proposed Vantheon frontend architecture uses a modern React and TypeScript stack integrated with the Next.js App Router `[PLAN.md line 73]`. The technology selections are generally sound but introduce specific performance risks and integration complexities that require careful architectural boundaries.

#### 1.1 Technical Stack Component Analysis `[PLAN.md lines 74-78]`

*   **Next.js App Router `[PLAN.md line 73]`**:
    *   *Architectural Role*: Serves as the web client framework, providing persistent layouts and server component optimization.
    *   *Risks & Bottlenecks*: Over-indexing on React Server Components (RSCs) in a highly interactive workspace will cause boundary confusion. Server-side rendering (SSR) hydration errors are highly likely if client-only states (e.g., IndexedDB or the WebSocket-backed Subscription Store) attempt to initialize during pre-rendering.
    *   *Recommendation*: Restrict RSCs to the outer layout shell and initial static metadata loading. Use dynamic imports (`ssr: false`) or gate client-only databases and socket initializations inside React `useEffect` hooks.
*   **TanStack Query `[PLAN.md line 75]`**:
    *   *Architectural Role*: Owns server-backed entities, indexes, histories, and evolving feeds.
    *   *Risks & Bottlenecks*: As a pull-based caching layer, it is ill-suited for real-time tickers. Stale cache configurations can lead to version desynchronization, showing outdated strategy states to the user.
    *   *Recommendation*: Limit TanStack Query to static and versioned resources (e.g., historical run logs, draft checkpoint ledgers, configurations). Ensure mutations trigger immediate, explicit query cache invalidation.
*   **Zustand `[PLAN.md line 76]`**:
    *   *Architectural Role*: Manages transient, local UI interaction states and client projections (e.g., active tabs, panels, collapsed states).
    *   *Risks & Bottlenecks*: Without strict architectural enforcement, developers may store authoritative strategy configurations or portfolio financial summaries in Zustand, causing UI drift and dual-source-of-truth conflicts.
    *   *Recommendation*: Establish strict TypeScript boundaries. Zustand stores must remain strictly read-only relative to server data and be restricted to temporary UI state.
*   **Dexie & IndexedDB `[PLAN.md line 77]`**:
    *   *Architectural Role*: Serves as the recovery buffer and offline workspace for pending local work.
    *   *Risks & Bottlenecks*: High risk of dual-source-of-truth conflicts if local edits diverge from the server's canonical checkpoint ID. Large local queries could also block the main UI thread.
    *   *Recommendation*: Implement Dexie purely as a write-ahead log (WAL) or crash-recovery cache. The server-side checkpoint ledger must always be treated as the single source of truth `[PLAN.md line 124]`.
*   **External Subscription Store `[PLAN.md line 78]`**:
    *   *Architectural Role*: Manages high-frequency market and portfolio telemetry outside React's render loop.
    *   *Risks & Bottlenecks*: Interfacing a high-frequency subscription store with React can bottleneck the main thread during reconciliation, causing frame drops and input lag.
    *   *Recommendation*: Use React’s `useSyncExternalStore` for selective UI bindings, or stream updates directly to canvas/SVG objects via refs to bypass the React reconciliation engine entirely.

#### 1.2 Rendering Efficiency & Optimization `[PLAN.md lines 83-87]`

*   **Lightweight Charts `[PLAN.md line 84]`**: Canvas-based rendering is highly performant. To prevent CPU degradation, implement client-side data downsampling (e.g., Largest Triangle Three Buckets - LTTB) before feeding data to charts.
*   **Frame Conflation `[PLAN.md line 86]`**: Buffering high-frequency market ticks and batching DOM/canvas updates (e.g., at 30Hz or 60Hz via `requestAnimationFrame`) is a critical and necessary pattern to avoid browser thread locking.
*   **Virtualized Lists `[PLAN.md line 85]`**: Essential for long conversations, runs, orders, and positions. Because AI chat messages contain dynamic heights (markdown, diagrams), adopt `@tanstack/react-virtual` with dynamic height measurement. To prevent native browser search (`Cmd+F`) from failing on virtualized off-screen items, implement an in-app search mechanism that queries the client-side data array directly.
*   **React Activity `[PLAN.md line 87]`**: Using this experimental API to keep hidden tab states (Draft/Paper/Live) warm in memory introduces significant memory leak risks. Components marked as hidden that continue listening to active WebSockets or polling tasks will silently drain resources. Implement explicit event cleanup and subscription pauses when a tab is deactivated.

---

### 2. Design Perspective: Visual Layout & Workspace Integrity

The design challenges in `PLAN.md` center around presenting dense financial data while maintaining distinct, safe boundaries between drafting and running environments.

#### 2.1 Screen Real Estate & Layout Balance `[PLAN.md lines 39-43]`
The "Persistent Champion Shell" `[PLAN.md line 39]` wraps a persistent chat sidebar and switcher around a dynamic workspace. Because financial platforms require significant horizontal width for charting `[PLAN.md line 84]`, multi-run comparisons `[PLAN.md line 52]`, and tabular exposure logs `[PLAN.md line 57]`, a fixed sidebar will crowd the layout. The design must support collapsible panels for the conversation and notification feeds to prioritize data-dense workspaces when active strategy work is underway.

#### 2.2 Visual Contextual Boundaries
Draft, Paper, and Live workspaces display highly similar structural data (strategies, histories, metrics). Relying solely on textual switcher labels `[PLAN.md line 41]` introduces a major visual salience risk. Under stress (e.g., market volatility), users are prone to "context slips," mistaking a Live environment for a Draft sandbox.
*   *Recommendation*: Implement a strict, global color-coded taxonomy:
    *   **Draft (Developing)**: Purple/Indigo theme symbolizing a creative sandbox.
    *   **Paper (Simulating)**: Teal/Green theme symbolizing simulation and observation.
    *   **Live (Running)**: Gold/Amber and dark charcoal theme symbolizing capital at risk.
    *   **Live Warning Banner**: Display a high-contrast, persistent banner at the top of the Live workspace: `⚠️ LIVE ENVIRONMENT — CAPITAL AT RISK`.

#### 2.3 State Representation & Switcher Upgrade `[PLAN.md lines 41, 116]`
The switcher uses binary labels `Developing` and `Running` `[PLAN.md line 41]`. This model fails to represent critical intermediate and degraded states of asynchronous trading models:
*   *Draft State*: Should distinguish between `Idle` (waiting for input) and `Validating` (running compilation or dry runs).
*   *Paper / Live States*: Must represent `Active` (normal execution), `Paused` (halted manually), and `Degraded / Error` (connection lost or API limits hit, visually highlighted in red).

---

### 3. User (UX) Perspective: Cognitive Load & Terminology

#### 3.1 The Targeting Disconnection `[PLAN.md lines 34, 122]`
`PLAN.md` establishes that *"Strategy-changing chat always targets the current Draft. Paper and Live strategies remain immutable."* `[PLAN.md line 34]`.
*   *UX Risk*: If a user is viewing a failure in `Live V5` and types *"Reduce exposure limit to 5%"*, the command is executed on the background `Draft V6.0`. Because the change does not immediately reflect on their active screen, the user will experience severe confusion, assume the change was applied to Live, and remain exposed to the unpatched live risk.
*   *Mitigation*: Introduce a persistent, high-contrast target badge above the chat input (e.g., `⚡ Target: Draft V6.0`). Intercept strategy-altering commands typed while viewing Paper/Live with a confirmation dialog explaining that the change will branch into a new Draft.

#### 3.2 Terminology Standardization `[PLAN.md lines 23, 24, 39, 40]`
*   **"Champion"**: In industry norms, "Champion" refers to the single, best-performing model running in production. In `PLAN.md`, it represents the overarching workspace shell `[PLAN.md lines 23, 39]`. This creates immediate confusion. Rename the overarching shell to **"Strategy Agent"** or **"Strategy Workspace"**, and reserve "Champion" strictly for the active, live strategy version.
*   **Draft Checkpoint vs. Strategy Snapshot**: A minor version jump (e.g., Draft `V5.2` promoted to Strategy `V5` / Paper `V5` `[PLAN.md lines 24-25]`) creates a conceptual gap. The UI must render a visual lineage tree (e.g., `Draft V5.2 ──> Strategy V5 ──> Paper V5`) in the portfolio details to make this mapping explicit.

#### 3.3 Offline Sync and Conflict Resolution `[PLAN.md line 139]`
`PLAN.md` outlines that offline draft work must be recoverable via IndexedDB `[PLAN.md line 139]`. When a user reconnects, if the server state has progressed beyond the local buffer, the user faces potential conflict. The UX must provide a side-by-side diff dialog that allows the user to:
1.  *Apply local changes* (overwrite the server draft).
2.  *Discard local changes* (pull the latest server state).
3.  *Manually review and merge* individual lines.

---

### 4. Product Perspective: Strategic Alignment & Risk Governance

#### 4.1 Strategic Alignment (Trust Ladder) `[PLAN.md lines 29, 60-69]`
The progression of **Draft → Paper → Live** matches the logical stages of quantitative strategy development, establishing a "Trust Ladder." By enforcing dry runs and paper testing, Vantheon prevents users from executing unvalidated code. However, forcing users through long simulated runs introduces friction for seasoned developers who perform local testing.
*   *Recommendation*: Maintain the strict path for standard users, but provide an "External Evidence Attestation" option for advanced users to upload external backtest logs to bypass the simulation phase, marking the Live agent as "Externally Attested" to manage platform liability.

#### 4.2 Risk Management & Mutation Constraints `[PLAN.md lines 34, 122]`
Mutations are restricted to the Draft workspace, keeping Paper and Live immutable. While highly secure, if a live strategy begins malfunctioning during high volatility, navigating back to Draft, applying a fix, and promoting it through the validation steps is too slow.
*   *Recommendation*: Implement a global **Emergency Circuit Breaker** button on the Live workspace. This button bypasses the strategy modification pipeline and directly issues an administrative halt command to the execution server, pausing all active orders without altering the immutable strategy file.

---

### 5. Growth Perspective: Lifecycle Loops & Onboarding

Vantheon's growth depends on two core user loops:
1.  **Active Reuse Loop**: Observing a running strategy, identifying improvements, and drafting changes `[PLAN.md lines 55, 68]`.
2.  **Upgrading Loop**: Moving proven Paper strategies to Live capital allocation `[PLAN.md line 29]`.

#### 5.1 Onboarding Friction Points
*   **The "Blank Canvas" Chasm**: Standard onboarding starts by asking the user to "Express intent" `[PLAN.md line 61]`. A blank text box causes high cognitive load. First-time users often input vague prompts (e.g., "trade crypto"), leading to low-quality drafts and early abandonment.
*   **Time-to-Evidence Delay**: The first value activation point is seeing *evidence* (backtests/dry runs). Requiring the user to configure initial capital, assets, and dates before their first test introduces excessive setup friction.
*   **Concept Shock**: Inexperienced users will be disoriented by the system automatically incrementing checkpoints and launching new drafts (e.g., Draft V5.2 freezing to become Paper V5 while Draft V6.0 automatically opens `[PLAN.md lines 24-25]`).

---

## Part 2: First-Time User Time-to-Value (TTV)

To reduce onboarding friction and accelerate activation, we analyze the Vantheon first-session pipeline step-by-step and propose three concrete recommendations.

### Onboarding Pipeline Friction Analysis `[PLAN.md lines 60-69]`

$$\text{Express Intent [Line 61]} \longrightarrow \text{Receive Draft [Line 62]} \longrightarrow \text{Review Changes [Line 63]} \longrightarrow \text{Dry Run [Line 64]} \longrightarrow \text{Start Paper [Line 66]} \longrightarrow \text{Observe [Line 67]}$$

*   **Friction Point 1 (Intent)**: Users are met with a blank prompt. Vague prompts yield poor code, causing immediate drop-offs.
*   **Friction Point 2 (Review)**: The user is expected to review changes and strategy code immediately. Code is intimidating to non-technical founders or beginner traders.
*   **Friction Point 3 (Dry Run)**: Manual setup of dates, capital, and data feeds delays the "first moment of value" (seeing the strategy in action).
*   **Friction Point 4 (Concept Shock)**: The sudden separation of the active sandbox (Draft V2.0) from the running simulator (Paper V1) causes confusion if not explained.

### Concrete Recommendations to Reduce Friction

#### Recommendation 1: Form-Assisted "Intent Templates" (Blank Canvas Solution)
*   **Mechanism**: On first login, replace the blank chat input with a clean landing wizard presenting three "Starter Champions" (e.g., *S&P 500 Mean Reversion*, *BTC Momentum Follower*, *Multi-Asset Risk-Parity*).
*   **User Flow**: Selecting a template opens a simplified form overlay asking for basic parameters (e.g., "Assets to Trade," "Risk Tolerance: Low/Medium/High").
*   **Backend Integration**: The frontend structured-parameters state is merged with the template and sent to the AI SDK as a system prompt, ensuring the first generated draft is highly accurate and configured.

#### Recommendation 2: Zero-Config Instant "Mini-Backtests" on Draft
*   **Mechanism**: Automate the first dry run `[PLAN.md line 64]`. As soon as Draft V1.0 is generated, the frontend immediately initiates a silent, lightweight backtest against a pre-cached 3-month dataset of a standard benchmark (e.g., SPY).
*   **User Flow**: The UI renders a clean Lightweight Chart showing the performance curve of Draft V1.0 alongside the benchmark, without requiring the user to configure settings or click "Run." This delivers the "evidence" moment of value within 10 seconds of onboarding.

#### Recommendation 3: Guided "Launch Simulator" (Paper V1) Wizard
*   **Mechanism**: Hide the backend complexity of version drift and checkpoint freezes during the initial promotion.
*   **User Flow**: Replace the technical "Promote to Paper" button with a friendly "Launch Simulator" action. Clicking it displays a brief, animated step-by-step modal:
    $$\text{Draft V1 (Your Strategy Blueprint)} \longrightarrow \text{Paper V1 (Your Simulated Agent)}$$
    *Helper Text*: *"We've locked your V1 blueprint as Paper V1 to run simulated trades. We also opened Draft V2.0 in your sandbox so you can keep editing without interrupting your running simulator."*

---

## Part 3: Iteration Loop Optimization

The core value loop of Vantheon relies on rapid iteration based on continuous feedback. The current architecture introduces several critical bottlenecks.

### Iteration Loop Mapping & Bottlenecks `[PLAN.md line 102]`

```
  ┌────────────────────────────────────────────────────────┐
  │                                                        │
  ▼                                                        │
┌───────────────────┐    ┌───────────────────┐             │ (Improve in Draft)
│ 1. Express Intent │───►│ 2. Draft Strategy │             │
└───────────────────┘    └─────────┬─────────┘             │
                                   │                       │
                                   ▼                       │
                         ┌───────────────────┐             │
                         │ 3. Run Test/Back  │             │
                         └─────────┬─────────┘             │
                                   │                       │
                                   ▼                       │
                         ┌───────────────────┐             │
                         │ 4. Launch Paper   │             │
                         └─────────┬─────────┘             │
                                   │                       │
                                   ▼                       │
                         ┌───────────────────┐             │
                         │ 5. Observe Run    ├─────────────┘
                         └─────────┬─────────┘
                                   │
                                   ▼ (Proven Strategy)
                         ┌───────────────────┐
                         │ 6. Promote Live   │
                         └───────────────────┘
```

#### Bottleneck 1: Chat-Targeting Mismatch (Contextual Disconnect) `[PLAN.md lines 34, 122]`
*   *The Issue*: Chat mutations always target the current Draft. If a user is actively observing a run in `Paper V5` and uses chat to input a correction, the system modifies `Draft V6.0` in the background.
*   *Friction*: The user sees no update on their active screen, creating a complete disconnect between their focus (Paper V5) and the mutation target (Draft V6.0).

#### Bottleneck 2: Contextual Loss During Redirection `[PLAN.md line 55]`
*   *The Issue*: Clicking the "Improve in Draft" button redirects the user, but `PLAN.md` does not specify how the run's context is passed.
*   *Friction*: If the user must manually re-explain which trade failed or which rule blocked execution, the loop breaks. The AI must receive the exact run metadata and failed rule evaluations automatically.

#### Bottleneck 3: Version Drift Conflict
*   *The Issue*: A user has `Paper V5` running (source: `Draft V5.2`). In the meantime, they have continued editing, advancing the active `Draft` to `V8.4`.
*   *Friction*: If they click "Improve in Draft" from `Paper V5`, the merge path is undefined. Does it overwrite Draft V8.4? Does it branch from V5.2 and discard V8.4 changes?

---

### Loop Optimization Proposals

#### Proposal 1: Context-Aware Chat Intercepts & Mutation Target Badges
*   **Target Status Badge**: Place a persistent target indicator above the chat input (e.g., `⚡ Target: Draft V8.4 (Latest)`).
*   **Interception Warning**: When a user viewing a Paper/Live screen types a command, intercept it with an inline warning:
    > *"Paper V5 is running and immutable. This command will create a new Draft checkpoint (V8.5) incorporating these changes."*
*   **Target Sync Toggle**: Provide a dropdown within the chat box allowing users to switch the target:
    1.  *Latest Draft* (Draft V8.4)
    2.  *Branch from current view* (Draft V5.2 - starts a new branch)

#### Proposal 2: One-Click "Rule Tuner" from Run Logs `[PLAN.md line 136]`
*   **Mechanism**: When a run is blocked by a specific rule (e.g., "RSI indicator limit exceeded" `[PLAN.md line 136]`), render an inline action button next to the log entry: `[Tweak Rule in Draft]`.
*   **Behavior**: Clicking this button automatically focuses the chat panel, targets the Draft, and sends a pre-populated prompt:
    > *"Draft a revision to adjust [Rule Name] which blocked [Trade/Run ID] on Paper V5."*

#### Proposal 3: Explicit Branch vs. Merge Dialog on Improvement
When the user clicks "Improve in Draft" from an older Paper version (V5) while the current Draft has progressed to V8.4, present a simple, 2-option choice:
1.  **Merge Context (Recommended)**: *"Apply this learning to your latest active draft (Draft V8.4)."* (Attempts to patch the latest blueprint).
2.  **Branch Strategy**: *"Create a separate branch from V5.2 (Draft V5.2-revised) to patch this version specifically."*

#### Proposal 4: Technical & Frontend Implementation Details
*   **Zustand Projections `[PLAN.md line 76]`**: Utilize Zustand to manage the active target state (`targetDraftId`), the "Branch vs. Merge" modal visibility, and the temporary UI diff layouts. Zustand ensures fast UI transitions without writing unvalidated configurations to the database.
*   **TanStack Query Fetch `[PLAN.md line 75]`**: When the user clicks `Tweak Rule in Draft`, TanStack Query fetches the full rule JSON payload and run history logs.
*   **AI SDK UI Streams `[PLAN.md line 80]`**: Pass the fetched rule payload and run logs as structured metadata to the AI SDK stream `[PLAN.md line 80]`. The AI streams the modified code back, and the client displays a side-by-side semantic diff of the rules rather than raw JSON `[PLAN.md line 123]`.
