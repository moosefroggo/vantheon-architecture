# Vantheon replacement-source parity audit

Audit date: 2026-07-15

## What this audit compares

This package evaluates the frontend being built in
`vantheon-architecture/src/` against the downloaded Vantheon deployment under
`site-mirror/`:

- captured HTML, screenshots, and serialized states establish **observed live
  surfaces and behavior**;
- downloaded compiled chunks establish **bundle-only capabilities and endpoint
  shapes**, not necessarily reachable UI;
- the route-reachable application under `src/` establishes **what our frontend
  actually implements**;
- accepted decisions under `docs/` explain when a difference is a deliberate
  redesign rather than a parity defect.

The scriptless `site-mirror/local-preview/` is only a safe viewer for captured
states. It is not our implementation and is not the parity target. The
downloaded `_next` chunks are minified deployment artifacts, not Vantheon's
original maintainable source code.

## Verdict

The replacement is a credible, interactive Champion-workspace vertical slice,
but not yet a complete Vantheon replacement.

It is further along than the static captures initially suggested. The current
source already has:

- a real evidence-first workbench with per-Champion sessions and a persistent
  Atlas dock;
- structured Draft Summary/Document views and permanent Dry Run;
- working checkpoint-bound Dry Runs with Summary, Activity, history, and
  baseline evidence;
- append-only restore-as-latest behavior;
- explicit Paper launch that freezes rules and starts a separate next Draft;
- honest zero-history Paper behavior;
- a populated Iris Paper portfolio with positions, six run-linked equity
  observations, an SPY overlay, and accessible trace navigation;
- Paper run list, dedicated Summary/Activity, and a locked read-only Strategy;
- typed domain contracts, chart validity checks, accessible chart summaries,
  and a demo authority that rejects stale checkpoint/rule snapshots.

The most important work is correctness and identity, not visual cloning. The
source currently contains several misleading or unsafe demo behaviors, no
canonical route model, no reachable semantic Edit/Accept/Reject loop, one
singleton Paper per Champion, and only a small fraction of the downloaded
global/account product.

## Highest-priority findings

| Priority | Finding | Consequence |
| --- | --- | --- |
| **P0 before artifact sharing** | An excluded auth capture serializes two non-empty password fields. | Do not distribute the mirror until both source/generated copies and catalog entries are scrubbed and sanitation is automated. The value is never repeated in these reports. |
| **P1** | Iris shows Draft `V2.0` while its authority expects `V1.1`. | Dry Run and restore fail with a stale-checkpoint error in the built UI. |
| **P1** | Iris claims monthly cadence but supplies weekly runs/equity points; Evaluation uses Russell 1000 Value while Paper silently uses SPY. | The otherwise strong chart is not a coherent evidence fixture. |
| **P1** | Evidence-panel tab, open checkpoint, and restore-candidate state can cross a Champion switch. | A checkpoint selected for one Champion can remain actionable under another identity. |
| **P1** | `Autosaved` is unconditional, but every mutation/result resets on refresh. | The UI claims durability that does not exist. |
| **P1** | Dry Run renders constraints as `Source`, infers `Passed` from missing rejection references, and counts eligible decisions as orders. | The evidence model overclaims what was actually observed or ordered. |
| **P1** | Historical Paper runs invent `8m 54s` and fallback activity, and use current portfolio buying power as a historical run fact. | Run evidence can look authoritative while being fabricated or time-shifted. |
| **P1** | Portfolio P&L is reverse-derived from return and buying power is described as cash. | Funding or cash-flow support would produce misleading performance. |
| **P1** | Only `/` exists; all Champion/environment/run/panel state is in memory. | Refresh resets to Mara; deep links and Back/Forward cannot restore context. |
| **P1** | Edit only attaches a rule to canned Atlas conversation; dormant `RuleEditor` is not mounted. | Current/Proposed, Accept/Reject, conflict, and authoritative checkpoint review are missing. |
| **P1** | Paper is one nullable snapshot and has no stop/archive/unarchive lifecycle. | Later Drafts cannot launch independent portfolios or be compared safely. |
| **P1** | Paper readiness is unreachable before launch, Draft stays highlighted while Paper is open, and Live readiness invents `14 days / five runs`. | Environment navigation and readiness policy are not truthful. |
| **P1** | CI-required Playwright tests target older labels and unreachable flows. | `npm run test:e2e` currently passes 3 of 10 tests and fails 7; browser acceptance is not green. |
| **P1/P2** | Champions management, settings behavior, feedback/help, legal, branded 404, multiple portfolio actions, and many positive/failure states are absent. | The source covers the core workbench, not the complete downloaded site. |

The credential artifact is the only unconditional P0. The other items are P1
for this simulated, no-real-capital vertical slice; several would become
release blockers before production use.

## Surface summary

| Area | Source result |
| --- | --- |
| Draft/Strategy | **Partial.** Strong structured current state and Dry Run loop; no reachable semantic proposal/Accept/Reject; thin policy depth and provenance. |
| Checkpoints/Data | **Partial.** Append-only restore is right; history is synthetic and Data is only Evaluation setup, not datasets/bindings/sources. |
| Evaluation | **Partial.** Completed Summary/Activity works; lifecycle, source truth, decision/order separation, stable identity, and repeated-run timing are incomplete. |
| Paper launch/Strategy | **Partial-to-strong.** Immutable clone boundary and locked Strategy work; setup/receipt fields are hardcoded and only one Paper can exist. |
| Portfolio evidence | **Partial.** Populated run-linked chart and positions are ahead of the capture, but cadence/benchmark/accounting facts conflict. |
| Runs | **Partial.** List, Summary, decision trace, and Activity work; incomplete runs fabricate fallback evidence and lack durable lifecycle states. |
| Positions/Orders | **Partial.** Positive positions exist; no Close flow. Orders renderer is minimal and no fixture supplies an order row. |
| Funding/Schedule/Lifecycle | **Missing relative to observed downloaded actions and accepted Paper lifecycle.** |
| Champion shell | **Partial.** Switching and most session restoration work; route identity, panel isolation, Paper readiness, metadata, and management do not. |
| Global/account site | **Mostly missing.** Profile is placeholder copy; Champions index/create/search, settings forms, feedback/help, legal, and custom 404 are absent. |
| Live/Backtests | **Gated.** Correctly unavailable, but Live readiness must not present proposed numeric thresholds as policy. |
| Authentication/passkeys | **Intentional local exclusion.** Production authorization/session behavior remains a separate accepted contract. |

## Deliberate redesigns to preserve

Do not mechanically restore every downloaded surface:

- Keep domain artifacts and evidence primary, with conversation persistently
  docked rather than making chat the shell or audit trail.
- Keep `Drafting Vn · Checkpoint m` and append-only restore instead of ambiguous
  beta version labels or rewinding history.
- Keep Dry Run distinct from a persistent portfolio run.
- Keep Paper Runs in the output tray/primary work surface rather than copying the
  captured Runs-over-Orders sub-sidebar collision.
- Keep Paper equity tied to completed-run observations; do not clone intraday
  ticker ranges when the strategy cadence does not support them.
- Keep honest empty/invalid chart states and neutral benchmark language.
- Do not copy the downloaded one-step destructive `Archive` semantics. Accepted
  Paper lifecycle is Stop → Stopped → Archive; Unarchive returns to Stopped.
- Keep login/passkeys out of the requested auth-free local flow.
- D-036 excludes rankings/leaderboards from the Champion research workspace and
  rejects ambient market urgency. Whether the downloaded global Leaderboard
  survives as a separate route is still a product decision.
- Keep Live, Backtests, Skills, and bundle-only analytics gated until they have
  explicit accepted contracts and complete states.

## Dependency-ordered remediation

1. Scrub the password-bearing capture and add artifact sanitation checks.
2. Fix misleading source facts: Iris identity/cadence/benchmark, `Autosaved`,
   fabricated run evidence, P&L/cash semantics, Live threshold, and archive stub.
3. Repair the E2E suite and add integrated Iris and Champion-switch isolation
   tests before expanding features.
4. Wire stable typed IDs and authoritative read models into the route-reachable
   runtime instead of maintaining a richer unused contract layer beside string
   fixtures.
5. Add canonical Champion/environment/checkpoint/evaluation/portfolio/run routes
   with refresh, Back/Forward, and explicit unavailable/unauthorized states.
6. Fix environment selection and move every nested/pending panel state inside the
   selected Champion namespace; then add the routed Champions inventory,
   safe Create, search, recents, and name editing.
7. Implement typed semantic Draft proposal → Current/Proposed review →
   Accept/Reject → authoritative checkpoint/conflict/receipt.
8. Replace synthetic checkpoint history and fake source inference with actual
   snapshots, Data capability bindings, rule-evaluation records, source
   artifacts, freshness, and durable events.
9. Separate decisions from orders and complete Evaluation/run
   queued/running/completed/failed/inconclusive/cancelled lifecycles.
10. Model multiple Paper portfolios, accepted stop/archive/unarchive behavior,
    and validity-aware Paper comparison.
11. Complete positions and representative orders, then deliberately implement
    funding, schedule editing, and position close with cash-flow-safe accounting
    and typed command outcomes.
12. Restore the selected global/account surfaces and finish route, action,
    accessibility, error/recovery, and sanitation acceptance coverage.

The complete feature-by-feature matrix and acceptance criteria are in
[source-parity-ledger.md](source-parity-ledger.md).

## Verification

- `npm run check` passes: handbook checks, chart-boundary checks, lint,
  TypeScript, and 35 unit/component tests across 18 files.
- `npm run build` succeeds and reports only `/` plus framework `/_not-found`.
- `npm run test:e2e` fails with 3 passing and 7 failing tests; the suite still
  targets earlier UI vocabulary and orphaned flows.
- Production-build browser smoke testing confirmed Mara Draft, Iris populated
  Paper, run Summary/Activity, locked Paper Strategy, refresh reset, constant `/`
  URL state, and the Iris `V1.1` versus `V2.0` stale-checkpoint failure.
- `eslint.config.mjs` now excludes the generated `site-mirror/**` artifact so
  repository lint evaluates authored source rather than minified downloaded
  bundles.

## Detailed reports

### Replacement source versus downloaded product

- [Governing parity ledger](source-parity-ledger.md)
- [Strategy and Draft source parity](strategy-source-parity.md)
- [Portfolio and trading source parity](portfolio-source-parity.md)
- [Global, Champions, and account source parity](global-source-parity.md)

### Downloaded product evidence

- [Strategy and Draft capture audit](strategy-drafts.md)
- [Portfolio and trading capture audit](portfolio-trading.md)
- [Global and account capture audit](global-account.md)
- [Compiled-bundle capability map](bundle-capability-map.md)
- [Capture and preview integrity](capture-integrity.md)
- [Initial audit-package QA review](qa-review.md)
