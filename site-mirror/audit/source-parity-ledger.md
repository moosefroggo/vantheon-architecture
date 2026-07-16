# Replacement source versus downloaded Vantheon parity ledger

Audit date: 2026-07-15

## Scope

This is the governing comparison for the redesign:

1. **Replacement implementation:** the route-reachable application under
   `src/` in `vantheon-architecture`.
2. **Downloaded Vantheon:** captured HTML, screenshots, serialized UI states,
   and compiled production chunks under `site-mirror/`.
3. **Accepted redesign contract:** `README.md` and accepted decisions under
   `docs/`, used to distinguish an intentional redesign from an omission.

`site-mirror/local-preview/` is only a scriptless viewer for the downloaded
states. It is not the implementation being evaluated. The downloaded chunks
are built/minified deployment artifacts rather than the original maintainable
source; they prove that a branch, schema, endpoint, or event name existed, but
not that a feature was reachable or should be copied.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| **Implemented** | Reachable and operational in the current `src/` application. |
| **Partial** | Reachable, but an important state, field, identity, or outcome is missing or inaccurate. |
| **Missing** | Required by the downloaded product or accepted redesign and absent from `src/`. |
| **Intentional divergence** | Deliberately differs because the accepted redesign supersedes the downloaded UI. |
| **Gated** | Must remain unavailable until a safety/product decision or prerequisite is satisfied. |
| **Bundle-only** | Present only in downloaded compiled code; not proven reachable and not automatically a requirement. |

## Executive result

The replacement is a functional, evidence-led Champion-workspace vertical
slice, not a complete replacement site. It is substantially further along than
the scriptless capture suggested: it has structured Drafts, working Dry Runs,
append-only checkpoint restore, an explicit Paper launch, populated Paper
positions and run-linked equity history, Paper run Summary/Activity, and a
read-only Paper Strategy.

The highest-value work is correctness and identity, not screenshot cloning:

- Iris displays Draft `V2.0` while its demo authority expects `V1.1`; its Draft
  evaluation and restore fail as stale.
- Every meaningful view remains under `/`; refresh returns to Mara and browser
  history cannot restore Champion, environment, run, or panel state.
- Reachable Edit only attaches a rule to canned Atlas conversation. The semantic
  Current/Proposed, Accept/Reject, conflict, and authoritative checkpoint flow is
  missing even though dormant scaffolding exists.
- Dry Run calls rule constraints `Source`, infers `Passed` without observed
  condition records, and counts eligible decisions as orders.
- Iris's declared monthly cadence is paired with six weekly run/equity points,
  and its Evaluation uses Russell 1000 Value while Paper silently switches to
  SPY. Its otherwise strong chart is therefore not a coherent evidence fixture.
- The runtime bypasses the repository's rich opaque-ID contracts in favor of
  display strings and in-memory fixture state, while claiming `Autosaved`.
- Paper is a single nullable snapshot, so a Champion cannot launch and compare
  multiple persistent Paper portfolios as the accepted model requires.
- Champions management, settings/profile behavior, legal/support/feedback, and
  most portfolio actions from the downloaded product are not implemented.

One separate P0 blocks distribution of the downloaded artifact: an excluded
authentication state serializes two non-empty password fields. The values are
not repeated in any report.

## Cross-cutting parity

| Capability | Downloaded Vantheon evidence | `src/` result | Classification | Priority/action |
| --- | --- | --- | --- | --- |
| Functional runtime | Deployed bundles drive the live app; the local viewer intentionally strips them. | Real React interactions, local authority, fixtures, dialogs, tabs, charts, and state transitions work. | **Implemented for demo; partial for production** | Preserve the source app as the runtime. Add server/query persistence rather than trying to animate the mirror. |
| Canonical routes and deep links | Champion UUID, view, version, subview, and run state appear in captured URLs. | Only `/` and framework `/_not-found` build. All nested state is React memory. | **Missing** | P1: route stable Champion, portfolio, checkpoint, evaluation, run, and selected-object IDs; restore on refresh and Back/Forward. |
| Identity and provenance | Captures expose UUID-shaped resources and bundles expose many resource endpoints, but visible metadata is inconsistent. | Rich domain contracts exist, yet reachable fixtures/actions use labels such as `V1.2`, `Dry Run 1`, and `Strategy V1`. | **Partial** | P1: wire opaque IDs, revisions, schema versions, actor/time, source references, and content identity into runtime models and receipts. |
| Authoritative mutation boundary | Downloaded app calls server endpoints; reachability and failure semantics vary. | In-memory authority validates checkpoint/rule snapshots and returns confirmed projections. | **Implemented demo boundary; partial lifecycle** | Keep the boundary. Replace demo storage with typed command/query adapters and complete pending/failure/conflict/receipt states. |
| Fixture coherence | Captures span inconsistent moments and account-specific staging data. | Two sanitized Champions improve privacy, but Iris's visible/current authority checkpoints disagree and its monthly cadence is represented by weekly evidence points. | **Mishandled** | P1 first fix: initialize session, authority, Paper source, next Draft, schedule, runs, and chart from one lifecycle snapshot; add invariant tests. |
| Champion isolation | Live app has Champion-scoped routes/state. | Most session, selection, conversation, and mutation state is keyed by Champion. Evidence-panel tab/expanded state and the panel's open/restore candidate state leak across switches; a candidate selected for one Champion can remain actionable under another. | **Partial / unsafe cross-context state** | P1: namespace every nested selection/pending interaction and test repeated cross-Champion restoration. |
| Durable save | Live app persists server state. | Refresh discards changes/runs/launch/conversation, but Strategy Summary always says `Autosaved`. | **Mishandled** | P1: remove the claim or bind it to authoritative projection/sync state. |
| Authentication | Download includes login/recovery/passkey/account security. | Auth is deliberately absent from the requested local redesign. Production authorization/session handling is also absent. | **Intentional divergence locally; missing production contract** | Keep login/passkeys out of this local flow. Before protected production data, implement accepted D-019 session/revocation/cache cleanup separately. |
| Download hygiene | One auth state contains serialized password inputs and account-specific staging IDs. | Not part of `src/`, but present in the audit artifact. | **Security defect** | P0 before sharing: scrub/exclude, rotate if reused, neutralize staging identity, and add sanitation checks. |
| End-to-end acceptance | Download behavior was explored manually. | Unit/type/lint/build pass, but the CI Playwright suite targets an older UI and currently passes 3 of 10 tests. | **Mishandled / stale safety net** | P1: rewrite E2E around the reachable workflow and current semantics, then add regression coverage for every P1 correctness bug. |

## Strategy, Draft, and evaluation parity

| Capability | `src/` result | Classification | Priority/action |
| --- | --- | --- | --- |
| Evidence-led workbench | Draft, Live readiness, primary artifact, output tray, and persistent Atlas dock are reachable. Paper appears only after launch; the intended pre-launch Paper readiness surface is unreachable, and Draft remains highlighted while Paper is active. | **Partial; intentional redesign direction** | Preserve the workbench direction, but fix environment reachability/selection semantics. |
| Structured Draft Summary | Six named rule groups with values, constraints, selection, and Edit affordances. | **Implemented** | Extend the schema without returning to a corrupted Markdown diff. |
| Full strategy policy | Document derives objective, selection, portfolio, risk/exit, and execution from the rules. | **Partial** | P2: add thesis, indicators, precedence, sizing examples, assumptions, exclusions, data-failure behavior, and cooldowns represented in the downloaded strategy. |
| Version/checkpoint metadata | Draft generation, checkpoint ordinal, and Tested/Untested are visible. | **Partial** | P1: add stable IDs, origin/parent, semantic summary, actor, exact time, revision/schema, content hash, and projection/validation state. |
| Edit and change review | Edit selects a rule and focuses Atlas. Atlas returns canned text. Dormant `RuleEditor` can apply directly but is unreachable. | **Missing core workflow / partial scaffold** | P1: typed proposal against exact checkpoint → Current/Proposed review → Accept/Reject → validated authoritative checkpoint or explicit conflict/error. |
| Checkpoint history | Active plus one baseline row can be opened; restore-as-latest creates an incremented checkpoint and preserves deployed states. | **Partial; append-only behavior implemented** | P1: use actual historical snapshots, complete history, semantic diff, provenance, validation, and receipt. Current baseline rules are synthetic clones. |
| Datasets and sources | `Datasets` opens Evaluation setup values only. No capabilities, bindings, providers, health, citations, or source artifacts exist. | **Missing/ mislabeled** | P1: rename current content to Evaluation setup; add explicit capability/binding/source models and provenance. |
| Dry Run creation | Exact current checkpoint/rules are validated, a completed Evaluation is produced, listed, and reopenable. | **Implemented for completed demo path** | Preserve and bind to immutable IDs. |
| Dry Run lifecycle | `Running…` then completed or generic error. No durable queued/running/failed/inconclusive/cancelled/retry records; repeated runs reuse the same template time, duration, cutoff, and decisions under a new ID. | **Partial** | P1: complete the lifecycle and event model; P2: make repeated deterministic fixtures temporally truthful. |
| Dry Run Summary and Activity | Summary, decisions, near misses, baseline metrics, coarse Activity, and setup facts are real views. | **Partial** | Correct evidence semantics: observed condition values/results, timestamps, freshness, source artifacts, warnings/errors, and resulting order references. |
| Decision/order truth | Eligible decisions are rendered/counted as orders; unreferenced rules are inferred `Passed`; constraint text is rendered under `Source`. | **Mishandled** | P1: separate Decision, RuleEvaluation, and Order records. Never infer evidence from absence. |
| Paper launch | Explicit simulated-capital review, pending/error UI, exact checkpoint/rule validation, frozen Paper rules, and next-Draft clone. | **Implemented core; partial setup/receipt** | Derive capital/schedule from the command, show unlocking Evaluation, and return durable strategy/portfolio/deployment/next-Draft IDs. |
| Paper Strategy | Frozen rules and exact source label render read-only. | **Implemented** | This is ahead of the invalid downloaded Paper Strategy capture; retain it and add full provenance. |
| Multiple Paper launches | One nullable Paper snapshot permanently disables further launches. | **Missing accepted model** | P1: Paper must be an indexed collection; launching a later Draft adds a portfolio without replacing prior evidence. |
| Backtests, reset, Skills, Evaluation cancel | Mostly captured as Coming Soon or compiled-bundle branches. | **Gated / bundle-only** | Decide scope explicitly; do not expose merely because strings/endpoints survived in a bundle. |

## Paper portfolio and trading parity

| Capability | `src/` result | Classification | Priority/action |
| --- | --- | --- | --- |
| Paper overview | Running/simulated state, immutable source, value, P&L, buying power, exposure, drawdown, positions, orders, schedule, next run, and freshness. | **Implemented demo surface** | Bind facts to stable portfolio/deployment/schedule references and authoritative freshness. |
| Honest empty state | Mara shows no synthetic curve before a traceable completed run. | **Implemented; intentional redesign** | Preserve the evidence-validity behavior. |
| Populated equity evidence | Iris has six run-linked observations, normalized SPY benchmark, accessible summary/table, methodology, quality, and trace navigation. The fixture calls the cadence monthly while the points/runs are weekly, and Evaluation declares Russell 1000 Value while Paper uses SPY. | **Mishandled fixture** | Preserve trace linkage, but unify strategy schedule, Evaluation benchmark, Paper benchmark, runs, and timestamps before adding comparison windows. |
| Range/filter behavior | Source chart shows completed runs since launch only. Downloaded app displayed 1D–ALL controls. | **Partial / intentional simplification** | Do not copy meaningless intraday ranges. Add only cadence-honest, URL-restorable ranges that meet evidence thresholds. |
| Paper runs | List, latest run, run Summary, decision trace, and Activity are reachable. Missing run data falls back to fabricated `8m 54s`/activity, and detail shows current portfolio buying power rather than a run snapshot. | **Partial / some misleading fallbacks** | Add stable route/ID, immutable run facts, failures/no-trade/partial/cancelled states, linked decisions/orders/sources, and retry/cancel rules where valid. Never invent evidence. |
| Positions | Iris renders symbol, market value, weight, and daily P&L; Mara has an honest empty state. | **Partial** | Add quantity, price/cost basis, total P&L/return, allocation contribution, freshness, run/decision provenance, detail, and allowed close/rebalance actions. |
| Orders | Table component supports symbol, side, quantity, status, but no shipped fixture contains rows. | **Partial scaffold** | P1: add representative order families/statuses/fills/rejections/bracket links/run provenance and detail; add cancel only for eligible open orders. |
| Position close | No close action, review, sizing, pending, partial-fill, error, or receipt. | **Missing relative to downloaded product** | P1 only if manually closing Paper positions remains an accepted capability; make consequences and Draft independence explicit. |
| Funding and schedule editing | Facts render, but Add Funds and Edit Schedule interactions/outcomes are absent. | **Missing relative to downloaded product** | P1/P2: decide product scope, then model typed validation, authoritative outcomes, retries, idempotency, timezone/holiday behavior, and audit receipts. |
| Portfolio selection/comparison | One Paper snapshot per Champion; no selector, second portfolio, comparison, or validity envelope. | **Missing accepted model** | P1: collection + stable portfolio IDs first, then descriptive comparison with common window/regime/schedule/data-quality context. |
| Stop/archive/unarchive | Disabled Archived Paper label only; no lifecycle commands. | **Missing accepted model** | P1: stop future runs; archive only when Stopped; unarchive returns to Stopped. Do not copy the downloaded destructive one-step Archive behavior. |
| Composition/risk/attribution/what-if | Downloaded bundles contain latent analytics branches; route reachability is unverified. | **Bundle-only / product decision** | Prioritize evidence traceability and comparison first. Add analytics only with declared methodology and validity envelope. |
| Live | Readiness journey only; no capital/control surface. It hardcodes `14 days and five runs` and completion checks run count even though the quantitative threshold remains proposed P-007. | **Gated; threshold mishandled** | Keep gated and do not present unresolved numbers as policy. Require accepted Paper-evidence, authorization, capital-impact, and operational-safety contracts. |

## Global, Champions, and account parity

| Capability | `src/` result | Classification | Priority/action |
| --- | --- | --- | --- |
| Champion switcher and environment navigation | Mara and Iris are selectable; most per-Champion state restores independently. Pre-launch Paper readiness is unreachable and Draft stays visually active while Paper is selected. | **Partial** | Preserve parent-context model; add availability/activity metadata, fix panel leakage, and make every environment truthful and independently selectable. |
| Champions index/recent/search/create/name edit | Selector is the only collection UI. Recency is tracked but never rendered. | **Missing/partial** | P1 after routes: one canonical inventory, routed list, safe explicit Create, search/empty state, recent subset, name validation, and authoritative outcomes. |
| Champion retirement | No source action. Downloaded Archive concealed liquidation and irreversible deletion. | **Gated / bundle-only** | Define honest retirement semantics, portfolio consequences, permissions, recovery, and audit before exposing. |
| Profile/settings | Profile dialog promises account/security/brokerage/notifications but contains one generic card. | **Mishandled placeholder** | P1: implement the selected non-auth preferences or remove the promises. Keep passkeys/password/sign-out out of the auth-free build. |
| Themes | Light/dark tokens exist; no Dawn/Dusk/Auto control, persistence, system mode, or no-flash startup. | **Partial foundation** | P2 if retained by product. |
| The First | No route. | **Missing relative to downloaded site; outside core IA** | Explicitly decide whether the content surface remains. |
| Leaderboard | Absent even though the downloaded site has an observed global route. | **Missing relative to capture / product decision** | D-036 forbids rankings in the Champion research workspace. Decide whether the separate global surface survives; do not port it into the workspace by default. |
| Feedback/help | No feedback workflow or durable first-party support path. | **Missing relative to downloaded site** | P2: add accessible validation/pending/success/failure/retry and stable support destination if retained. |
| Privacy/Terms | No route or persistent discovery. | **Missing** | P2: expose legal pages without requiring login. |
| Missing/unavailable resources | No custom `not-found.tsx`; unknown Champion lookup throws. | **Mishandled** | P1/P2: branded route 404 plus explicit unauthorized/deleted/unavailable states inside the persistent shell. |
| Global market status | Hard-coded open/close badge is always in the workspace header. | **Intentional divergence required** | Remove or contextualize; accepted D-036 rejects ambient market widgets unrelated to the evidence/control task. |

## Dependency-ordered remediation

### P0 — before distributing the downloaded artifact

1. Remove the password-bearing auth state from source capture, generated preview,
   and catalog; rotate the test string if reused; add rejection for non-empty
   password inputs and common secrets. Neutralize account/staging identifiers in
   any external handoff.

### P1 — make the vertical slice truthful and structurally extensible

2. Fix Iris's lifecycle, cadence, benchmark, run, and equity snapshot and add integrated
   per-fixture invariant tests.
3. Correct misleading runtime claims: `Autosaved`, Dry Run `Source`, inferred
   `Passed`, and decision-as-order counts.
4. Adopt the existing opaque-ID/domain contracts in route-reachable models and
   implement canonical Champion/environment/checkpoint/portfolio/run routes.
5. Persist/query authoritative projections so refresh, deep links, Back/Forward,
   reconnect, and explicit missing/unauthorized states work.
6. Complete the Draft semantic change loop: typed proposal, Current/Proposed,
   Accept/Reject, validation/conflict, resulting checkpoint, and audit receipt.
7. Replace synthetic checkpoint history and source inference with exact snapshots,
   semantic provenance, rule evaluations, source artifacts, and durable events.
8. Turn Paper from a singleton into a portfolio collection; then add comparison
   and the stop → archive → unarchive lifecycle.
9. Complete representative positions/orders/run states and explicitly decide
   funding, scheduling, position-close, and cancellation capabilities.
10. Add the routed Champions inventory and safe Create/search/recent/edit flows;
    close all cross-Champion state leakage.
11. Either implement the selected profile/preferences contract or remove the
    misleading account/security/brokerage/notification promises.
12. Replace the stale E2E suite with reachable current journeys and add regression
    tests for authority identity, cross-Champion isolation, evidence truth, and
    route restoration.

### P2 — complete the replacement site

13. Add legal, support, feedback, branded not-found, and retained content/theme
    surfaces with complete loading/error/success/accessibility states.
14. Extend strategy depth, evaluation lifecycle variants, Paper analytics, and
    responsive/accessibility coverage only after identity and evidence truth are
    stable.
15. Keep Backtests, Live, Skills, latent analytics, workspace Leaderboard, and destructive
    Champion retirement gated until each has an explicit accepted contract.

## Verification

- `npm run check` passes after excluding the generated `site-mirror/**` artifact
  from repository lint.
- `npm run build` succeeds. Next reports only `/` and `/_not-found`, confirming
  the routing finding.
- `npm run test:e2e` fails: 3 tests pass and 7 fail. The suite still expects old
  labels and unreachable flows such as `Test Draft`, a modal Rule Editor,
  `Paper V1`, `Fork checkpoint`, and `Live portfolio`; CI invokes this suite.
- Browser smoke testing of the production build confirmed working Mara Draft,
  Iris populated Paper, run Summary/Activity, and read-only Paper Strategy.
- The same smoke test confirmed every interaction stays at `/`, reload resets
  Iris to Mara, and Iris Dry Run reports:
  `Expected base checkpoint V1.1; received V2.0.`

## Detailed evidence

- [Strategy/Draft source parity](strategy-source-parity.md)
- [Portfolio/trading source parity](portfolio-source-parity.md)
- [Global/account source parity](global-source-parity.md)
- [Downloaded Strategy/Draft capture](strategy-drafts.md)
- [Downloaded Portfolio/trading capture](portfolio-trading.md)
- [Downloaded global/account capture](global-account.md)
- [Compiled-bundle capability map](bundle-capability-map.md)
- [Capture and preview integrity](capture-integrity.md)
- [Independent QA review](qa-review.md)
