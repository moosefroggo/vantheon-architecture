# Product Foundations

## Status

Accepted as the product-level contract for information architecture, design, and frontend implementation. Numeric targets remain unset until representative sessions establish baselines.

## Governing Outcome

> Minimize the distance from intent → strategy → evidence → iteration, while making every transition involving capital explicit, explainable, and controlled.

Strategy and configuration changes may be reversible. Executed trades are not. The interface must never describe an executed financial action as if it can simply be undone.

## Planning Priority

Vantheon optimizes two journeys, in order:

1. **Onboarding to value:** turn user intent into an understandable Draft, credible initial evidence, and a safely running Paper portfolio.
2. **Rigorous iteration:** turn observed portfolio behavior into a contextualized, tested Draft improvement without changing anything already running.

The detailed journey stages, trust gates, recovery paths, and delivery order live in [Priority User Journeys](./priority-user-journeys.md). A feature that supports neither journey is deferred unless it is necessary for security, compliance, accessibility, or reliability.

## Product Outcomes

### 1. Understandable value before configuration depth

A new user can describe an investment intent, receive a structured strategy, and understand its objective, universe, principal rules, risk constraints, assumptions, and exclusions before learning the full entity model or configuring advanced data.

### 2. Evidence-led iteration

Every material result can lead to an explanation, and every explanation can lead to a deliberate improvement proposal. Tests compare the proposal with a relevant baseline and disclose their conditions and limitations.

### 3. Safe separation of development and deployment

The current Draft remains the only strategy mutation target. In the MVP, each Paper portfolio remains pinned to the immutable strategy with which it launched; a newer Draft launches a separate Paper portfolio. Live remains pinned until an explicit promotion starts a new deployment for future operation.

### 4. Traceable financial behavior

A user can trace a portfolio outcome through the run, decision, immutable strategy rule, source Draft checkpoint, and motivating change. Inactivity and rejection receive the same explanatory treatment as trades.

### 5. Calm control of capital

Live emphasizes current capital, exposure, risk, pending actions, operational status, and the exact strategy in control. Promotion, pausing future executions, and cancelling eligible open orders are separate, explicit, audited actions.

### 6. Honest operation under failure

Loading, stale, offline, degraded, unauthorized, failed, and recovering states remain distinguishable from strategy performance. The interface does not present cached or optimistic data as currently authorized, live, or confirmed.

## Non-Goals for the Initial Product

- A terminal optimized primarily for maximum information density or tick-by-tick visual motion.
- A chat transcript treated as the canonical strategy.
- Automatic Paper-to-Live promotion.
- Multiple active Draft branches per Champion.
- Hidden generic backtests presented as strategy validation.
- AI output treated as authority for strategy, orders, deployments, or capital state.
- Full mobile creation and trading workflows until viewport support is explicitly decided.
- Infrastructure complexity that has not been justified by measured load.

## Trust Ladder

Trust is earned progressively rather than requested up front.

| Level | User question | Product evidence | Allowed next step |
|---|---|---|---|
| Understand | What is this strategy trying to do? | Structured Draft, assumptions, exclusions, and semantic changes | Clarify or test |
| Observe | What would it do, and why? | Transparent evaluation with actions, rejections, risk behavior, data cutoff, and limitations | Revise or continue |
| Test | Does it behave consistently without real capital? | Immutable Paper strategy, runs, no-trade explanations, and operational history | Iterate or compare |
| Compare | Is the apparent improvement supported? | Common-window comparisons, risk and behavior differences, and exact source checkpoints | Gather more evidence or request Live review |
| Commit capital | What will control money, and what could change? | Exact Paper-tested snapshot, impact and risk review, destination, warnings, and explicit confirmation | Promote to Live |
| Control and recover | What is happening now, and what can I safely stop? | Freshness, authorization, operational state, risk, audit trail, separate pause and order-cancellation controls | Monitor, pause, cancel eligible orders, or prepare a new Draft |

Passing one level does not guarantee the next. Short-term return alone never establishes readiness for Live.

## Canonical Terminology

Use these terms consistently in product copy, diagrams, components, analytics, and tests.

| Term | Definition | Required language |
|---|---|---|
| **Champion** | The persistent AI agent identity with which the user collaborates. | A Champion develops and explains; it is not the workspace or strategy. |
| **Champion workspace** | The persistent product environment containing Draft, Paper, Live, conversation, activity, and notifications for one Champion. | Draft/Paper/Live navigation does not create a different Champion. |
| **Strategy lineage** | The current Draft generation, its restorable checkpoints, and the immutable strategies created from prior Drafts. | One active Draft lineage per Champion in the MVP. |
| **Draft Vn** | The current mutable candidate generation. | Display as `Developing`; it is the only strategy mutation target. |
| **Checkpoint Vn.x** | A restorable Draft state created after an accepted semantic Draft change set, regardless of authorized initiator. | Non-mutating, rejected, and autosave-only work does not create a checkpoint. |
| **Strategy Vn** | An immutable snapshot frozen from an exact Draft checkpoint. | Always retain the source checkpoint and provenance. |
| **Paper portfolio** | A persistent simulated portfolio pinned to one immutable strategy in the MVP. Multiple Paper portfolios may coexist. | Display as `Paper Vn` and state clearly that no real capital is involved. |
| **Live portfolio** | The capital-bearing destination presented in the Champion workspace. | Always expose the exact strategy controlling future operation and current operational status. |
| **Portfolio run** | One scheduled decision and execution cycle within a portfolio. | A portfolio contains runs; a bounded user-requested test is an Evaluation, not a portfolio run. |
| **Conversation** | Persistent human–Champion communication and provenance. | It can express intent and render progress, but it is not canonical strategy state. |
| **Change set** | A semantic, server-validatable proposal that may alter the current Draft. | Explain motivation, expected benefit, downside, unchanged constraints, and evidence needed. |
| **Evidence** | A result whose assumptions, data cutoff, conditions, behavior, risk, and limitations are visible. | A performance number without context is not sufficient evidence. |
| **Paper launch** | The explicit action that freezes the current Draft checkpoint into an immutable strategy and starts a new Paper portfolio. | Use `Launch Draft Vn to Paper`; do not call this a Live deployment. |
| **Live promotion** | The explicit action that selects an eligible Paper-tested strategy for Live. | Use `Promote Paper Vn to Live`; never imply automatic promotion or confirmation through chat alone. |

### Version-language invariant

After Draft V5 at checkpoint V5.2 is launched to Paper:

```text
Paper V5
Running immutable Strategy V5
Source: Draft V5 · checkpoint V5.2

Draft V6 · checkpoint V6.0
Developing independently
```

Changes to Draft V6 can never mutate Paper V5. The same separation applies while viewing Live.

## Product and UX Principles

### Lead with the next meaningful action

Each primary surface has one dominant action appropriate to its state. Secondary navigation provides depth without forcing the user to find the next step in another section.

### Show context and authority separately

Always distinguish what the user is viewing from what a strategy-changing action can modify:

```text
Viewing: Paper V5 · Run 42
Changes go to: Draft V8 · checkpoint V8.4
```

Analysis can remain grounded in Paper or Live evidence. Accepted strategy changes still target only the current Draft.

### Explain before escalating commitment

Move from Draft to evaluation, Paper, comparison, and Live as an evidence ladder. Do not use friction merely to signal safety; use meaningful review of assumptions, changes, impact, and destination.

### Make inactivity legible

No-trade runs, rejected candidates, unchanged Drafts, and waiting states show what was evaluated and why no action occurred. Restraint is observable Champion work, not missing data.

### Prefer semantic financial language

Present “maximum allocation reduced from 7% to 5%,” not a raw JSON path or command list. Commands preserve provenance; snapshots establish the resulting state; the user-facing explanation uses domain meaning.

### Progressively disclose complexity

The first useful Draft and evaluation do not require manual configuration of every dataset, signal, schedule, or risk parameter. Advanced controls remain available after assumptions and defaults are visible.

### Treat AI as a collaborator, not authority

Champion output may propose, explain, and stream progress. Server validation and authoritative patches define accepted Draft state. Explicit user confirmation remains mandatory for Live-capital transitions.

### Preserve continuity without hiding freshness

Champion identity, conversation, and useful cached context persist across Draft, Paper, and Live. Every live or cached surface exposes freshness, connection, authorization, and reconciliation state when material.

### Design for accessible comprehension

Draft, Paper, Live, risk, freshness, and operational states use words and structure, not color or motion alone. Critical journeys target WCAG 2.2 AA, keyboard completion, reduced motion, and meaningful non-canvas chart equivalents.

## Measurable Indicators

Instrumentation names outcomes and failure modes before assigning targets. Baselines must come from representative users, devices, data shapes, and network conditions.

### Onboarding to value

- Time to first coherent Draft.
- Time to first understandable evidence.
- Time to first Paper portfolio.
- Number of required user inputs before Draft and evaluation.
- Draft, evaluation, and Paper-launch completion and abandonment.
- User ability to identify what is developing versus running.
- Questions or errors caused by version, checkpoint, Paper, or Live terminology.

### Rigorous iteration

- Time from an observed outcome to a contextualized Draft proposal.
- Time from proposal to evaluated checkpoint.
- Percentage of improvement actions retaining complete source provenance.
- Version-target confusion, cancelled cross-context commands, and stale-base conflicts.
- Iterations before a new Paper launch.
- Paper comparison usage and depth of evidence inspection.
- Semantic conflicts surfaced versus silent or incorrect application.

### Trust and control

- Evidence details inspected before Paper and Live promotion.
- Live review abandonment and warning acknowledgement.
- Frequency and completion of pause and eligible-order cancellation actions.
- Incorrect assumptions that a Draft edit changed Paper or Live.
- Ability to trace an outcome to its immutable strategy and run.

### Reliability, accessibility, and performance

- Recovery completion after offline, disconnect, session expiry, and stale-base conditions.
- Reconciliation errors, duplicate effects, and stale-data duration.
- Keyboard-only completion of both priority journeys.
- Automated accessibility violations and unresolved manual findings.
- Event-to-paint, snapshot-to-usable-view, input responsiveness, memory growth, and command-to-visible-confirmation distributions.

Numeric targets become decision-ledger entries only after baseline evidence is reviewed.

## Decision Test for New Work

Before approving a feature or interaction, answer:

1. Which priority journey and stage does it improve?
2. What user outcome or measurable friction does it change?
3. What trust guarantee does it preserve or strengthen?
4. What is the next meaningful action?
5. Are viewed context, mutation target, provenance, freshness, and authority clear?
6. Does failure leave Draft, Paper, Live, and capital in an understandable state?
7. Does it introduce a concept before the user needs it?
8. Can it be tested with semantic, accessibility, operational, and performance states?

If the answers are unclear, the work is not ready for implementation.
