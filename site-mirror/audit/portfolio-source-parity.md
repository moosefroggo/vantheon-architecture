# Portfolio/trading source parity audit

## Executive verdict

The actual `src/` application is **not** the inert mirror described in the
capture audit. It is a stateful React demo and already implements several of
that audit's highest-value remediations: a truthful zero-history Paper state,
a populated Paper fixture, run-linked portfolio observations, a read-only
frozen strategy, a working Runs collection, dedicated run Summary and Activity
views, and a Draft-to-Paper transition that keeps the next Draft separate.

It is not yet a complete portfolio/trading implementation. The largest gaps
are structural:

1. There is only one in-memory Paper projection per Champion, no portfolio
   selector, no stable portfolio/deployment identity, and no URL-addressable
   portfolio/run state.
2. Positions are display-only and materially under-specified; Orders has a
   minimal renderer but no reachable populated fixture. Close position,
   funding, and schedule editing do not exist.
3. Paper stop/archive/unarchive, operational degradation, and Live promotion
   are not modeled as working lifecycles.
4. Drawdown is implemented only as an unmounted component/fixture. Composition,
   attribution, broader risk, trade blotter, and Paper-to-Paper comparison are
   absent from the source app; several are only evidenced in the captured
   production bundle.
5. Every mutation is fixture-only and resets on reload. TanStack Query is
   mounted, but the workspace performs no query or mutation and calls no
   production-shaped portfolio API.
6. Iris declares a monthly, first-business-day cadence but supplies weekly runs
   and equity observations, so the otherwise traceable chart is not
   cadence-honest.

Some differences from the captured site are **intentional and should be kept**:
the redesign avoids an empty dashboard-card wall, refuses to draw a benchmark
before the first completed run, does not show an `AHEAD/BEHIND` verdict without
a comparison-validity envelope, treats Paper equity as discrete run evidence
rather than an intraday ticker, and moves Runs into the accepted workbench
output tray instead of cloning the production sub-sidebar.

## Status vocabulary

| Status | Meaning in this report |
| --- | --- |
| **Implemented** | Mounted, reachable, and exercised by a current fixture. |
| **Partial** | Reachable but reduced/incomplete, or implemented as an unmounted component. |
| **Missing** | No usable source model, view, or action exists. |
| **Intentional divergence** | Source differs from the captured site in order to satisfy an accepted product decision. |
| **Gated** | The source deliberately stops before a consequential/unavailable flow. |
| **Bundle-only** | Evidence exists in the captured production bundle, but not in `src/`. |

The live-capture baseline is `site-mirror/audit/portfolio-trading.md:45-99`.
Accepted decisions outrank the mirror: the repository declares that precedence
in `README.md:77-91`.

## Actionable parity matrix

| Surface / capability | Status | Actual source behavior | Gap or disposition |
| --- | --- | --- | --- |
| Paper identity and provenance | **Partial** | Header shows a Paper label, status, `Simulated`, strategy label, and source string (`src/features/workspace/paper-portfolio-workspace.tsx:169-193`). | The fixture has no stable portfolio, strategy, deployment, or source-checkpoint references (`:56-109`). `formatPaperLabel()` collapses every `Paper Vn` to generic `Paper` (`src/lib/version-labels.ts:10-12`), so multiple named portfolios cannot be distinguished. |
| Read-only Paper Strategy | **Partial** | Paper snapshot rules are cloned at launch (`src/features/workspace/workspace-demo-authority.ts:202-240`), mapped into a locked Strategy panel (`src/features/workspace/champion-workspace.tsx:225-237`; `paper-portfolio-workspace.tsx:741-765`), and remain unchanged when the next Draft changes. | This correctly repairs the mirror's mislabeled Strategy capture (`site-mirror/audit/portfolio-trading.md:198-202`), but mapping drops rule ID/name and exposes only group plus `value · constraint`. It lacks objective, semantic changes, actor/time, schema/runtime/data provenance, and typed immutable-strategy identity required by `docs/domain-model.md:195-207`. `Open Draft` is bare navigation, not `Improve in Draft` with evidence context. |
| Multiple Paper portfolios | **Missing** | A Champion session holds one `paperSnapshot` and one `paperSelection` (`src/features/workspace/champion-workspace.tsx:114-136`). Launch review is disabled after that snapshot exists (`:183-198`). | Violates accepted coexistence/comparison requirements D-005 (`docs/decisions.md:136-148`). No selector, stable portfolio ID, active/stopped collection, or archived collection exists. |
| Portfolio value and P&L | **Partial** | Value, total/daily P&L, buying power, deployed value, exposure, max drawdown, counts, next run, and freshness render (`src/features/workspace/paper-portfolio-workspace.tsx:133-143`, `:196-243`). Iris supplies non-zero value, return, exposure, drawdown, and four positions (`src/features/workspace/workspace-fixtures.ts:455-470`, `:548-553`). | Stronger than the all-empty capture, but total P&L is reverse-derived from return because no starting-capital/cash-flow ledger exists (`paper-portfolio-workspace.tsx:134-139`); that becomes wrong once funding exists. `buyingPower` is also presented as cash (`:140-142`, `:211-229`), conflating distinct concepts. |
| Gainers/detractors, asset grid, recent-order cards | **Intentional divergence / Partial** | Source replaces the captured dashboard grid with a compact fact strip, evidence chart, Latest Run card, and lower output tray (`paper-portfolio-workspace.tsx:196-268`). | Omitting empty filler cards and the cash-only donut is aligned with D-034/D-036 (`docs/decisions.md:542-580`). The populated capabilities behind those cards—attribution, composition drill-down, and recent-order navigation—still need an intentional home; they are not implemented elsewhere. |
| Equity history | **Partial** | Iris has six completed-run observations and a normalized SPY series (`workspace-fixtures.ts:471-490`). Each observation must resolve to a run; unresolved run/decision references produce an explicit invalid state (`paper-portfolio-workspace.tsx:825-883`). | Trace linkage and accessible summary/table are strong, but Iris labels its cadence `First business day of each month` while the fixtures run weekly on Jun 1, 8, 15, 22, 29, and Jul 6. Its Evaluation also declares Russell 1000 Value as benchmark (`workspace-fixtures.ts:391-395`) while Paper silently uses SPY. Correct the schedule/benchmark/run/equity snapshot before treating the chart as coherent evidence. |
| Empty/invalid equity states | **Implemented** | No history shows first-run timing and no benchmark curve (`paper-portfolio-workspace.tsx:431-457`); malformed trace data shows “Equity evidence unavailable” (`:460-475`). | This is an intentional improvement over the captured flat-cash-versus-SPY contest and follows the accepted chart contract (`docs/charting-architecture.md:29-43`). |
| SPY benchmark comparison | **Partial / fixture mismatch** | Benchmark is sampled at run timestamps (`paper-portfolio-workspace.tsx:888-905`) and rendered neutrally; accessible copy calculates returns only after two common observations (`src/lib/charts/accessible-summary.ts:187-230`). | Correctly omits `AHEAD/BEHIND`, but Iris's Evaluation benchmark is Russell 1000 Value while Paper silently changes to SPY. No explicit D-030 validity-envelope read model exists. This is benchmark comparison, not Paper-to-Paper strategy comparison. |
| Chart ranges | **Partial** | Generic `ChartFrame` can render range controls (`src/components/domain/charts/chart-frame.tsx:207-238`). | The mounted Paper model hardcodes a single `all` range labelled “Completed runs since launch” (`paper-portfolio-workspace.tsx:885-929`) and passes neither `availableRanges` nor `onRangeChange`. The 1D/1W/1M/3M/YTD/1Y/ALL captured interaction is absent. Evidence-oriented ranges may intentionally differ from production, but working range state is still missing. |
| Chart hover/live point/version markers | **Intentional divergence / Partial** | Lightweight Charts provides a crosshair and formatted values (`src/lib/charts/lightweight/streaming-financial-plot.tsx:65-110`), while visible observation buttons open run/decision traces. | No custom hovered timestamp/readout or version markers. A Paper portfolio is pinned to one immutable strategy under D-004 (`docs/decisions.md:122-134`), so version-boundary markers inside one Paper curve are not required. No live-point/tick treatment is correct under D-036. |
| Positions list | **Partial** | Iris makes a positive table reachable with symbol, market value, weight, and daily P&L (`paper-portfolio-workspace.tsx:677-709`; `workspace-fixtures.ts:548-553`). Mara exercises the empty state. | Missing asset name/logo, quantity, cost basis, unit/current price, unrealized dollar/percent return, contribution, search, filtering, pagination, no-match, loading, failed/retry, and row/detail navigation described by the bundle evidence (`site-mirror/audit/portfolio-trading.md:150-167`). Count and rows are independent fields and can drift. |
| Close position | **Bundle-only** | No source type, control, dialog, validation, or mutation exists. | The captured production bundle evidences full/partial close, optimistic rollback, and error feedback (`site-mirror/audit/portfolio-trading.md:150-167`). Before implementing, define the Paper-override provenance and a production-shaped, fail-closed command; do not add a local row deletion. |
| Orders list | **Partial** | Renderer supports only symbol, side, quantity, and free-form status (`paper-portfolio-workspace.tsx:712-739`); the fixture type has the same five fields (`:98-104`). | No current fixture supplies `orderRows` (`workspace-fixtures.ts:455-554`), so only “No orders” is reachable. Missing order type, prices, requested/filled quantities, TIF, bracket children, timestamps, originating run, rejection reason, paging/search/no-match/loading/error/retry, and navigation. Production richness is documented at `site-mirror/audit/portfolio-trading.md:169-184`. |
| Manual order cancellation | **Gated / intentional** | No action exists. | Do not infer a Paper cancel feature from an Atlas symbol. The capture found no supported manual cancel flow (`site-mirror/audit/portfolio-trading.md:182-184`), and accepted D-024 concerns a separately authorized **Live** emergency action (`docs/decisions.md:402-414`). |
| Runs navigation model | **Intentional divergence** | Runs is a tab in a collapsible Paper output tray (`paper-portfolio-workspace.tsx:273-343`), not a sub-sidebar over Orders. Selecting a run replaces the primary pane and adds breadcrumbs (`champion-workspace.tsx:721-728`, `:821-859`, `:922-964`). | This differs from the captured product overlay (`site-mirror/audit/portfolio-trading.md:186-196`) but matches the accepted operational workbench/output-tray direction (`docs/decisions.md:542-566`). The state is still not URL-addressable. |
| Runs list | **Partial** | Six Iris runs are reachable; reverse-order rows show label, time, and decision (`paper-portfolio-workspace.tsx:479-523`; `workspace-fixtures.ts:492-547`). | Only completed runs exist. No scheduled/evaluating/no-trade-with-status/orders-pending/failed/cancelled variants, loading/error/retry, pagination, or cancellation action. Status is omitted from list rows. |
| Run Summary | **Partial** | Detail shows status, completion time, elapsed, orders, buying power, decision, evaluated count, data cutoff, and decision trace (`paper-portfolio-workspace.tsx:525-603`, `:622-658`). | Historical buying power incorrectly uses the **current portfolio** value (`:577-579`). Missing duration defaults to `8m 54s` (`:575`) and absent counts become zero, manufacturing facts. It omits portfolio/deployment/strategy/schedule refs, rule evaluations, submitted/generated order records, failure/cancel cause, and explicit freshness. |
| Run Activity | **Partial** | Run 6 supplies four timestamped events and the Activity tab renders them (`workspace-fixtures.ts:520-545`; `paper-portfolio-workspace.tsx:604-617`). | Runs 1–5 fabricate three events at the same completion time when activity is absent (`paper-portfolio-workspace.tsx:538-559`). Missing activity should remain unavailable, not be invented. No failure/cancel/order-lifecycle activity exists. |
| Improve from Paper evidence | **Partial** | Atlas changes its prompt when viewing a run/Paper (`src/features/workspace/workspace-champion-dock.tsx:236-264`), and submitted prose says changes target the Draft (`champion-workspace.tsx:1125-1152`). | There is no run/decision `Improve in Draft` action and no typed portfolio/run/decision/source-checkpoint attachment. `paperSelection.reference` is reduced to a display context string; this misses D-035's required context transfer (`docs/decisions.md:562-566`). |
| Schedule summary | **Partial** | `nextRun` and `runCadence` render, and the launch review shows a schedule (`paper-portfolio-workspace.tsx:233-243`, `:356-383`; `champion-workspace.tsx:1225-1228`). | Schedule is an untyped display string. No timezone-aware schedule entity, holiday flag, paused/no-schedule state, daily/weekly/monthly editor, validation, pending/success/error, or session controls. Launch review hardcodes Friday-after-close rather than reading the selected Champion fixture. |
| Edit schedule | **Missing** | No source control or mutation. | Live product captured the dialog/result and the bundle supports variants (`site-mirror/audit/portfolio-trading.md:142-148`). Implement only after defining a schedule command and operational preconditions. |
| Funding / Add funds | **Missing** | No source action, amount model, deposit ledger, dialog, or mutation. Launch review hardcodes `$100,000 simulated` (`champion-workspace.tsx:1221-1224`). | Production captured validation and mutation behavior (`site-mirror/audit/portfolio-trading.md:130-140`). Adding it requires flow-adjusted performance/accounting so a deposit is not reported as strategy return. |
| Draft → Paper launch | **Implemented, fixture-only** | Review shows source, simulated capital, schedule, and resulting Paper/next Draft (`champion-workspace.tsx:1185-1258`). Demo authority validates the exact evaluated checkpoint/rule snapshot, clones Paper rules, and advances the Draft to `Vn+1.0` (`workspace-demo-authority.ts:202-240`). Pending/error UI exists. | This satisfies the core immutable boundary and is tested (`src/features/workspace/workspace-demo-authority.test.ts:76-94`). It still lacks stable Strategy/Portfolio/Deployment IDs, portfolio naming/setup inputs, idempotency, authorization/concurrency tokens, durable receipt, rollback/retry fixture, and coherent portfolio data generated from the launched setup. Capital and cadence are hardcoded. |
| Paper operational lifecycle | **Missing** | Fixture status is a string (`paper-portfolio-workspace.tsx:58-60`); current examples are only `Running`. A disabled “Archived Paper” sidebar row appears whenever Paper exists (`champion-workspace.tsx:666-680`). | No provisioning/paused/degraded/disconnected/recovering/stopping/stopped/archive/unarchive state or action. This does not satisfy D-029's mandatory stop-before-archive lifecycle (`docs/decisions.md:472-484`) or the accepted state machine (`docs/state-diagrams.md:281-327`). The disabled archive row should not imply archived state. |
| Paper → Live | **Gated, but copy is mishandled** | Live opens a readiness journey; no capital mutation or promotion exists (`champion-workspace.tsx:860-884`; `src/features/workspace/empty-environment-workspace.tsx:90-108`). | Consequential flow is safely gated, consistent with the captured unavailable Live control. However the source hardcodes `14 days and five completed runs` and derives `measurementComplete` from five runs (`champion-workspace.tsx:866-868`; `empty-environment-workspace.tsx:90-95`) even though numeric Live policy thresholds remain Proposed P-007 (`docs/decisions.md:63-73`) and D-027 requires a versioned server assessment (`:444-456`). |
| Run now / what-if | **Bundle-only** | No source control/model. | Production clients exist, but capture did not prove reachable UI (`site-mirror/audit/portfolio-trading.md:93-94`, `:142-148`). Keep hidden until Product assigns them to a supported surface. |
| Max drawdown scalar | **Implemented** | Portfolio fact strip shows the fixture's absolute max drawdown (`paper-portfolio-workspace.tsx:233-243`). | It is a summary only, without window, methodology, evidence point, or risk status. |
| Drawdown analysis | **Missing, with unmounted scaffold** | `DrawdownEvidenceChart` and a populated fixture exist (`src/components/domain/charts/drawdown-evidence-chart.tsx:24-95`; `src/lib/charts/fixtures.ts:110-166`). | Nothing imports the component into the route-reachable app, so it earns no implementation parity. Its fixture is not linked to Iris/Mara and its evidence-marker interactions do not open source records. Reuse it through the accepted portfolio chart toggle rather than a disconnected demo page. |
| Composition and attribution | **Bundle-only** | No source model/view. | Production bundle has composition and position-attribution families (`site-mirror/audit/portfolio-trading.md:212-229`). Accepted chart architecture anticipates allocation/attribution (`docs/charting-architecture.md:18-25`, `:86-100`), but product placement and complete states remain to be built. |
| Risk metrics | **Partial / bundle-only** | Source exposes return, exposure, scalar max drawdown, and a dormant drawdown component. | No volatility, Sharpe, win rate, profit factor, concentration/risk detail, date-window model, or risk failure state. Broader metrics are bundle-only, not source parity. |
| Trade blotter | **Bundle-only** | No source model/view/export. | Bundle evidence only (`site-mirror/audit/portfolio-trading.md:214-229`). Decide dashboard vs Atlas result before implementation. |
| Paper-to-Paper comparison | **Missing** | An unused Zustand store can hold selected Paper IDs (`src/lib/state/workspace-interaction-store.ts:10-18`, `:34-62`), but the mounted workspace never imports it and cannot create multiple Papers. | Accepted D-005/D-030 require coexisting portfolios and an explicit validity envelope (`docs/decisions.md:136-148`, `:486-498`). SPY comparison is not a substitute. |
| Backtests | **Gated / out of current Paper scope** | No Paper backtest flow. | Keep gated until a deliberate Evaluation flow exists; a compiled lifecycle string is not enough. |

## Empty, loading, failure, and recovery coverage

| State family | Implemented | Missing |
| --- | --- | --- |
| Portfolio history | Honest no-run state and invalid trace state (`paper-portfolio-workspace.tsx:431-475`, `:825-883`). | Query loading, failed/retry, stale/disconnected recovery, sparse-history variants beyond fixture data. |
| Chart | Dynamic-import skeleton and generic `loading/ready/empty/failed` frame contract (`src/components/domain/charts/portfolio-equity-chart.tsx:20-27`; `src/components/domain/charts/chart-frame.tsx:34-47`, `:140-149`). | Mounted Paper presentation only emits `empty`, `invalid`, or `ready`; it never drives ChartFrame loading/failed. No retry. |
| Runs | No-completed-runs zero state (`paper-portfolio-workspace.tsx:486-495`). | Loading, failed/retry, scheduled/running/failed/cancelled rows, event loading/failure. |
| Positions | “No positions” (`paper-portfolio-workspace.tsx:684-686`). | Loading, search/no-match, failed/retry, paging, mutation states. |
| Orders | “No orders” (`paper-portfolio-workspace.tsx:712-715`). | Any populated reachable state plus loading/search/no-match/failed/retry/paging. |
| Paper Strategy | Fallback says exact source remains available (`paper-portfolio-workspace.tsx:751-764`). | It does not provide a way to load/open that source and has no missing-source/error state. |
| Mutations | Paper launch has pending and error (`champion-workspace.tsx:1201-1255`). | No deterministic launch failure fixture, idempotent retry, authorization/concurrency conflict UI, or portfolio action mutations. |

`AsyncState` provides generic loading/empty/failed/retry UI
(`src/components/system/async-state.tsx:7-50`) but is not imported by any
mounted workspace feature. It is infrastructure, not current state coverage.

## Fixture-only authority boundary

The app route mounts only `ChampionWorkspace` (`src/app/page.tsx:1-5`). That
component owns the entire selected Champion, Draft, Paper, run selection, and
conversation projection in one `useState` tree
(`src/features/workspace/champion-workspace.tsx:114-151`). Its “authority” is an
in-memory facade with 160 ms latency (`src/features/workspace/workspace-demo-authority.ts:68-93`).

Consequences:

- Reloading loses every launch, evaluation, selection, and conversation.
- No portfolio/trading interaction uses TanStack Query, despite the provider
  being mounted (`src/app/providers.tsx:9-16`).
- No `fetch`, query, or mutation exists in the workspace source.
- Stage, portfolio tab, panel, run, range, and dialog state have no URL identity.
  The single route cannot restore back/forward or a shared run link, contrary to
  the accepted route contract (`docs/information-architecture.md:173-182`).
- The facade is a useful demo safety boundary, but it is not a
  production-shaped portfolio service, durable simulator, or server authority.

Classify the current launch as **implemented for the demo, fixture-only for the
product**. Any new funding, schedule, close, archive, or Live action must go
through a typed command facade with preconditions and deterministic
pending/success/failure—not directly mutate React arrays.

## Highest-priority corrections

### P1 — Correct demo facts that can currently mislead

1. Stop fabricating `8m 54s`, zero counts, and synthetic activity for historical
   runs that lack detail. Render `Unavailable` and load a run-scoped record.
2. Store run-scoped buying power; never display current portfolio buying power
   as a historical run fact.
3. Separate cash, buying power, net deposits/withdrawals, portfolio value,
   investment return, and P&L. Funding cannot safely ship on the current
   reverse-derived P&L formula.
4. Populate Paper launch review from the selected Draft/portfolio setup rather
   than hardcoding `$100,000`, Friday cadence, and `Strategy V1`.
5. Remove the invented 14-day/five-run readiness threshold until P-007 is
   accepted; show non-authoritative observation guidance separately from Live
   eligibility.
6. Replace the disabled “Archived Paper” row with truthful lifecycle state.

### P1 — Establish the portfolio domain and navigation

1. Add stable typed `PaperPortfolio`, `Deployment`, `Schedule`, `Position`,
   `Order`, `Run`, `Decision`, and cash-flow fixtures/read models. Wire the
   existing `PaperContextViewModel` boundary (`src/domain/contracts.ts:111-125`)
   instead of free-form strings.
2. Support multiple Paper portfolios per Champion, with active/stopped selector,
   archived collection, and stable URL-addressable portfolio/run/detail state.
3. Preserve the accepted output-tray Runs design, but make selection/deep links
   restorable and carry a typed run/decision context into `Improve in Draft`.
4. Replace the minimal position/order row contracts with the complete display
   fields, positive fixtures, search/no-match, loading/error/retry, and linked
   run/order records.

### P1 — Add safe fixture-backed actions

1. Funding with min/max validation, idempotency, pending/success/failure, and
   atomic recomputation of cash/value/returns.
2. Schedule editing with actual cadence/timezone/holiday fields and
   paused/no-schedule variants.
3. Full/partial close with validated quantity, explicit Paper-override
   provenance, optimistic projection only if approved, rollback, and durable
   order outcome.
4. Stop → Stopping/Stopped → Archive plus Unarchive → Stopped, exactly as D-029
   requires.

### P2 — Complete evidence and analytics deliberately

1. Mount the existing drawdown component as a portfolio chart mode and bind it
   to the same run/evidence records as equity.
2. Build composition, attribution, risk, and trade-blotter read models only
   after choosing their dashboard/Atlas placement.
3. Implement Paper comparison after multiple portfolios exist. Its read model
   must declare common window, schedules, run/activity counts, data quality,
   capital assumptions, material strategy differences, and validity status.
4. Add working evidence-oriented ranges. Do not automatically clone intraday
   range conventions if the data only changes at completed runs.

## Verification performed

The source was inspected from the mounted route through fixtures, demo authority,
workspace composition, chart adapters/renderers, and tests. The focused command

```text
npm test -- --run src/features/workspace/paper-portfolio-workspace.test.ts src/components/domain/charts/portfolio-equity-chart.test.tsx src/components/domain/charts/chart-frame.test.tsx
```

passed 3 files / 6 tests. Current focused coverage proves zero/ready/invalid
equity contracts and chart-reference accessibility. The current E2E suite is
not green: `npm run test:e2e` passes 3 of 10 tests and fails 7 because it still
expects older labels and unreachable flows such as `Test Draft`, modal rule
editing, `Paper V1`, `Fork checkpoint`, and `Live portfolio`. CI invokes that
suite, so it is a P1 stale safety net—not proof that the Paper Summary/Activity
journey passes. It also lacks schedule, funding, close, populated orders,
lifecycle, range selection, analytics, and failure/recovery coverage.

## Bottom line

The source app has already moved beyond “copy the captured frontend.” Its
portfolio center is more truthful than the captured empty dashboard, and its
Paper Strategy and run details repair two major capture holes. The shortest
path to product readiness is therefore **not** visual mimicry. It is to preserve
the accepted evidence-led divergences while completing stable portfolio domain
identity, route state, positive trading records, safe commands, lifecycle
states, and deliberate analytics surfaces.
