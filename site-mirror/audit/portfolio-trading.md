# Portfolio and trading surface audit

## Executive verdict

The capture is a useful visual reference for an **empty paper-trading account**, but it is not a complete representation of the portfolio/trading product and the local preview is not an interactive implementation.

Three findings matter most:

1. `local-preview/` is intentionally script-free. It preserves the rendered DOM, including buttons and forms, but none of the paper portfolio controls, searches, dialogs, mutations, selectors, charts, or route-state transitions execute.
2. Every captured paper portfolio is empty. The reference therefore covers table shells and zero states, but not a populated position, order, fill, run detail, attribution result, risk result, or close-position flow.
3. “Runs” is a sub-sidebar over the current main pane, not a standalone main page. The saved Runs state correctly retains Orders behind it, but the saved “Strategy” page is a duplicate of that same Runs-over-Orders state and is mislabeled/missing.

The redesign should treat the capture as evidence, reconstruct the state model from structured fixtures, and separately label capabilities that are only evidenced in compiled API clients or Atlas renderers.

## Scope and evidence model

This audit covers paper portfolio summary and time ranges, positions, orders, Runs, schedule, simulated funding, version/stage selection, promotion/archive/live availability, performance/risk metadata, dialogs, actions, and navigation.

Evidence labels used below:

| Label | Meaning |
| --- | --- |
| **Visible** | Present in captured HTML or screenshot from the authenticated product. |
| **Bundle** | Present in a compiled client, route parser, schema, or renderer, but not necessarily reachable in the captured UI. |
| **Static** | Present in `local-preview/` as frozen HTML. It is visual evidence, not working behavior. |
| **Missing** | No representative captured state and no reliable way to exercise it locally. |
| **Gated** | Product deliberately presents it as unavailable/coming soon. |

Primary evidence:

- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/{portfolio,positions,orders,runs,strategy}/`
- `site-mirror/authenticated-screenshots/champion--{portfolio,positions,orders,runs,strategy}.png`
- `site-mirror/ui-states/champion/`
- `site-mirror/ui-states/mutations/`
- `site-mirror/ui-states/champions/all/`
- `site-mirror/local-preview/dashboard/champions/`
- `site-mirror/local-preview/preview/states/`
- `site-mirror/build-local-preview.mjs`
- compiled chunks listed in the evidence appendix

## Route and captured-state inventory

### Canonical product route model

| Surface | Captured product URL shape | What the capture proves | Local representation | Assessment |
| --- | --- | --- | --- | --- |
| Portfolio | `/dashboard/champions/{championId}?view=paper-trading&version={versionId}&sub=portfolio` | Main paper overview is visible. | `/dashboard/champions/example-detail/portfolio/` plus seven range snapshots. | Visually represented; inert. |
| Positions | Same route with `sub=positions` | Empty Positions table and search shell are visible. | `/dashboard/champions/example-detail/positions/` | Empty-state only; inert. |
| Orders | Same route with `sub=orders` | Empty Orders table and search shell are visible. | `/dashboard/champions/example-detail/orders/` | Empty-state only; inert. |
| Runs | Orders route plus `subSidebar=runs&subSidebarVersion={versionId}&runSource=sidebar` | Runs opens a sub-sidebar while the Orders main pane remains mounted. | `/dashboard/champions/example-detail/runs/` | Capture is semantically valid, but synthetic path makes it look like a standalone page. |
| Paper Strategy | Expected to be a distinct Strategy route/state for the selected version. | The saved `strategy` inventory actually has the same Runs-over-Orders URL as Runs. | `/dashboard/champions/example-detail/strategy/` | **Mishandled:** duplicate/mislabeled capture; paper Strategy content is missing. |
| Add funds dialog | Portfolio with dialog state | Amount field, bounds/help, submit state, and product copy are visible. | `/preview/states/champion/add-funds/` | Dialog appearance represented; form is inert. |
| Add funds result | Mutation result state | Success toast and a changed paper-version/account state are visible. | `/preview/states/mutations/add-funds-submitted/` | Result is disconnected from the dialog. |
| Edit schedule dialog | Portfolio with dialog state | Daily/market-open defaults and market-holiday setting are visible. | `/preview/states/champion/edit-schedule/` | Default state represented; controls are inert. |
| Schedule result | Mutation result state | “Schedule updated” feedback is visible. | `/preview/states/mutations/schedule-saved/` | Result is disconnected from the dialog. |
| Promote to paper | Draft-to-paper modal | Description, starting buying power, schedule, and holiday choice are visible. | `/preview/states/mutations/paper-trade-after-click/` | Modal represented; promotion is inert. |
| Promoted paper state | Post-promotion state | Paper v2/read-only transition and progress feedback are visible. | `/preview/states/mutations/paper-trade-promoted/` | Separate snapshot; no real transition. |
| Get Started | Champion onboarding overlay | Six lifecycle steps and 4/6 progress are visible. | `/preview/states/champion/get-started/` | Visually represented; dismissal/navigation inert. |

The representative source route is the Champion `ace6a70b-fcdc-47be-9ceb-009ed2e72526`, version `2865794d-429c-406c-9f95-7a2e283d1d07`.

### Champion data coverage

There are 12 Champion-detail captures. Seven are draft/onboarding-oriented and five reach a paper-trading portfolio:

- `2a0abd3b-c96b-4cf8-a4fb-c065ca238493`
- `2ffa9ceb-44ed-428f-abb0-851e9a18da45`
- `ace6a70b-fcdc-47be-9ceb-009ed2e72526`
- `ae763334-8be0-4049-bc71-6235c4442238`
- `c7fc4bc5-285d-4e28-bb74-ae7d86c7ca31`

All five paper captures have zero open positions and zero orders. They vary in paper version, buying power, and schedule availability, but none supplies the positive trading fixture needed to verify populated tables or analytics.

## Surface and action matrix

| Area | Visible product evidence | Bundle-evidenced behavior | Local-preview behavior | Coverage verdict |
| --- | --- | --- | --- | --- |
| Stage rail | Draft, Paper, and Live cards; selected Paper version; version labels. | Stage/version selection and per-stage version dropdowns. | Frozen at captured selection. | Partial. Multiple visual versions exist, but selection cannot change locally. |
| Paper status | “READ-ONLY,” Archive, Get Started, disabled Deploy Live. | Paper session/history clients and archive/promote lifecycle. | Frozen labels/buttons. | Core status represented; actions absent. |
| Portfolio value | Account value, dollar/percent P&L, SPY benchmark, ahead/behind. | Version performance, benchmark, summary, snapshots. | Frozen values and chart DOM. | Visible, but only zero-trade/flat-account data. |
| Time range | `1D`, `1W`, `1M`, `3M`, `YTD`, `1Y`, `ALL`. | Windowed performance/benchmark requests; hover time/series; version markers. | Seven disconnected snapshots; clicking does nothing. | Appearance complete, interaction missing. |
| Buying power | Cash/buying power, percent deployed, Add funds. | Paper-session capital and `add-funds` mutation. | Button/form inert. | Dialog/result captured separately; no working flow. |
| Schedule | Next run, cron summary, Edit; current daily/market-open setup. | Daily/weekly/monthly forms; time presets; holiday flag; pause/no-schedule display states. | Edit form inert. | Default only. Variants and lifecycle states missing. |
| Gainers/detractors | Empty cards. | Top five positions by unrealized P&L; row navigates to filtered Positions. | No rows and no navigation. | Empty-state only. |
| Asset composition | Cash-only total-assets card. | Asset-class allocation, cash, holding drill-down, “Other,” back navigation, link to filtered Positions. | No drill-down. | Shell only; populated composition missing. |
| Recent orders card | Empty card. | Six recent orders; row navigates to Orders search. | No rows/navigation. | Empty-state only. |
| Positions list | Count, search, columns, “No open positions.” | Debounced search, paging, retry/no-match, populated rows and Close action. | Search is inert. | Table skeleton only. |
| Close position | Not visible because no position exists. | Full/partial quantity validation, optimistic update/rollback, success/error messaging, market close order. | No state exists. | Missing high-value action state. |
| Orders list | Count, search, columns, “No orders yet.” | Paging, retry/no-match, rich order/status rendering, bracket children, run links. | Search and row links are inert. | Table skeleton only. |
| Cancel order | No user-facing action captured. | An Atlas `cancel_order` schema/name exists, but policy marks order tools unavailable to chat; no manual cancel endpoint or rendered cancel UI was found. | None. | Do **not** present as a supported feature without a product decision. |
| Runs list | Runs sidebar with two historical entries over Orders. | Run list/detail routing and paper version-run queries. | Sidebar is frozen; rows do not select a run. | List appearance only. |
| Run detail | No selected paper-run detail captured. | Run detail/events/orders/buying-power and run cancellation are bundle-evidenced. | None. | Missing. |
| Run now | No reachable control found. | `POST .../paper-trading/{sessionId}/run-now` client exists. | None. | Bundle-only; not proof of product UI. |
| What-if replay | No reachable control/state found. | `POST .../paper-trading/{sessionId}/what-if` client exists. | None. | Bundle-only; not proof of product UI. |
| Paper promotion | Modal and promoted Paper v2 state captured. | `cut-to-paper`/promotion mutations and deployment payload. | Two disconnected static snapshots. | Visually strong, behavior absent. |
| Archive/demote | Archive control visible. No result in this domain capture. | Version archive and paper-session demote clients. | Inert. | Archive incomplete; demote bundle-only. |
| Deploy Live | Disabled control with “Coming soon” semantics. | Promotion clients include live-related paths. | Remains visually disabled. | Correctly gated; do not make it look active. |
| Backtests | Product marks it Coming Soon. | Placeholder/lifecycle strings exist in bundle. | Static placeholder only. | Correctly gated; not a functional flow. |
| Risk/analytics | Only account P&L, SPY comparison, allocation shell, and empty winners/losers are visible. | Composition, attribution, trade blotter, risk metrics, drawdown, and strategy comparison endpoints/renderers exist. | No analytics interactions or result states. | Major capability/coverage gap. |

## Detailed findings

### 1. Portfolio summary and performance

The representative Portfolio capture shows:

- account value of `$100,000` with zero account P&L;
- SPY benchmark comparison and an ahead/behind label;
- all seven time windows;
- `$100,000` buying power and `0%` deployed;
- a scheduled next run and daily-at-market-open summary;
- empty gainers, detractors, positions, and orders;
- total assets represented as cash.

The compiled Portfolio component supports more than this frozen case:

- a hovered timestamp and per-series values;
- portfolio and benchmark series;
- benchmark live-point indication;
- version markers/reference lines;
- loading and unavailable-chart messaging;
- populated allocation drill-down;
- top winner/loser navigation;
- recent-order navigation.

The seven saved range states correctly serialize a different `aria-pressed=true` selection, but they are independent pages under the preview catalog. The local Portfolio page does not switch windows or request new data.

**Remediation:** build one fixture-backed Portfolio route with range state in the URL, at least one populated time series, one sparse/error series, and a version marker. Add keyboard-accessible tooltips and deterministic timestamps so visual tests are stable.

### 2. Funding

The Add funds dialog visibly documents a `$1 – $100,000 per deposit` range and defaults to `$1,000`. The compiled mutation posts an amount in cents to:

`/api/dashboard/champions/{championId}/paper-trading/{sessionId}/add-funds`

It also carries an idempotency key, exposes “Adding funds…”/success/error feedback, and invalidates portfolio, analytics, and position queries.

The post-submit capture is not a trustworthy end-to-end transition. It shows a success toast and an account value of `$11,000`, while serialized card content in that capture still contains `$10,000`; a later schedule state shows `$11,000`. This can be capture timing/query invalidation rather than a production defect, but it makes the fixture internally inconsistent.

**Remediation:** represent funding as a deterministic mock mutation with validation, pending, success, duplicate-submit protection, and failure states. Update all dependent cards atomically in the fixture store before taking the result screenshot.

### 3. Schedule and session controls

The visible Edit schedule dialog covers only the daily/market-open default and the market-holiday checkbox. Compiled components support daily, weekly, and monthly schedules, additional time presets, day/week selection, and validation. The Schedule card can display active, paused, and no-session/no-schedule copy.

The paper-session client additionally exposes pause, resume, stop, toggle-market-hours, run-now, and what-if methods. Those methods are not evidence of reachable UI: the current Schedule card exposes only Edit, and no rendered controls for those actions were found in the captured surface.

**Remediation:** first decide which session controls are product-supported. For supported controls, add explicit permission/availability conditions and confirmation/result states. For unsupported or internal methods, omit them from the redesign instead of surfacing dead affordances.

### 4. Positions and close-position behavior

The captured Positions view proves the layout but no row behavior. Bundle evidence shows a populated row includes:

- symbol, asset name/logo, and quantity;
- cost basis per unit;
- current value;
- unrealized dollar and percentage return;
- profit-allocation contribution;
- a Close action.

Close opens a “Close {symbol}” dialog, defaults to the full quantity, permits a validated partial quantity, and submits a market close through:

`POST /api/dashboard/champions/{championId}/positions/sell`

The implementation includes optimistic full removal or partial projection, rollback on error, and success messaging. None of this is represented by a captured populated row or dialog.

**Remediation:** add fixtures for a profitable long, losing long, fractional quantity, and partially closed position. Capture full-close, partial-close, invalid quantity, pending, success, and server-rejection states. Keep the mock transition local; do not point the redesign preview at production trading APIs.

### 5. Orders

The captured Orders page includes only search, table headers, and the empty state. Compiled renderers support:

- buy/sell direction;
- market, limit, stop, stop-limit, trailing-stop, and bracket structures;
- pending, filled, partially filled, rejected, cancelled, and expired outcomes;
- filled progress, requested quantity, and fill price;
- day/open/close/IOC/FOK/GTC time-in-force labels;
- nested bracket exits;
- a linked originating run and created time;
- loading, paging, no-match, error, and retry states.

No direct order-cancel workflow should be inferred. `cancel_order` appears in Atlas tool metadata, but the Atlas policy states that chat cannot place/cancel/modify orders, and the tool is not chat-active. No corresponding manual cancel-order request path or rendered action was found. Run cancellation is a different capability.

**Remediation:** create an order fixture set that exercises each display family and links at least one order to a selected paper run. Treat manual order cancellation as out of scope until product confirms an execution boundary and user flow.

### 6. Runs are a secondary navigation surface

Both the Runs and mislabeled Strategy inventories resolve to:

`?view=paper-trading&version={versionId}&sub=orders&subSidebar=runs&subSidebarVersion={versionId}&runSource=sidebar`

That explains why the main pane remains Orders. Runs should be modeled as a sub-sidebar/drawer that preserves the active main subview, includes a selected version, and can optionally carry a selected run ID. It should not be reimplemented as a replacement full-page route merely because the mirror uses `/example-detail/runs/` as a convenience path.

The capture shows two historical run rows, but no selected paper-run detail or event stream. Source inventories show the paper run list request; event/buying-power calls appear in captured draft dry-run states, not as proof of a complete paper-run detail capture.

**Remediation:** implement Runs as URL-addressable overlay state. Add list loading/empty/error and pending/running/completed/failed/cancelled rows, then selected-run details with events, generated orders, buying power, and cancellation only where the product permits it.

### 7. Paper Strategy is missing, not merely static

`site-mirror/app.vantheon.ai/dashboard/champions/example-detail/strategy/asset-inventory.json` records the same Runs query as the Runs asset inventory, and its HTML/screenshot match the Orders-behind-Runs state. It therefore provides no evidence for the paper version’s locked/read-only Strategy document.

**Remediation:** recapture the actual selected paper Strategy state, preserve its canonical route/query, and store its document as structured section data with version/stage metadata. Until then, the local `strategy/` convenience page should be labeled “capture unavailable” rather than silently displaying Orders/Runs.

### 8. Version and lifecycle metadata

Visible captures cover Draft v2, Paper v1, Live, and later Draft v3/Paper v2 after promotion. The stage rail and bundle support selecting among multiple versions, showing a version description and performance summary, opening version details, undo/reset behavior in Draft, archiving Paper, and promotion.

Local query strings do not drive version state because the runtime is removed. Adding or changing `version={id}` returns the same frozen file. The synthetic per-section directories similarly do not model version identity.

**Remediation:** define `Champion`, `Version`, `PaperSession`, and `Portfolio` fixtures separately. Make stage, version, subview, sub-sidebar, and selected run explicit route state. A version switch must update Strategy, account metrics, positions, orders, schedule, and run list as one coherent context.

### 9. Analytics, risk, attribution, and blotter

The dashboard capture exposes only a light overview. The compiled analytics query family contains:

| Capability | Endpoint evidence | Visible dashboard state |
| --- | --- | --- |
| Trade blotter | `/api/dashboard/portfolios/{portfolioId}/analytics/trade-blotter` | Missing. |
| Position attribution | `/api/dashboard/portfolios/{portfolioId}/analytics/position-attribution` | Only empty gainers/detractors proxy. |
| Risk metrics | `/api/dashboard/portfolios/{portfolioId}/analytics/risk-metrics?startDate=...&endDate=...` | Missing. |
| Strategy comparison | `/api/dashboard/portfolios/{portfolioId}/analytics/compare?otherPortfolioId=...` | Missing; SPY benchmark is not this workflow. |
| Portfolio composition | `/api/dashboard/portfolios/{portfolioId}/analytics/composition` | Cash-only overview card; populated analysis missing. |
| Drawdown series | `/api/dashboard/portfolios/{portfolioId}/analytics/drawdown?startDate=...&endDate=...` | Missing. |

Atlas also registers read-only tools and custom result renderers for trade blotter, position attribution, composition, risk metrics, drawdown, and strategy comparison. Bundle policy describes risk metrics as Sharpe, maximum drawdown, volatility, win rate, and profit factor. There is no evidence for Sortino in the inspected capture.

This is **bundle-evidenced analytical capability**, not proof of dedicated dashboard pages or a captured successful Atlas invocation. The redesign must decide whether these belong in a first-class Analytics surface, Atlas conversation results, or both.

**Remediation:** create a product-owned analytics information architecture. At minimum, add populated fixtures and result-state captures for composition, attribution, risk, drawdown, comparison, and blotter. Clearly distinguish benchmark comparison from portfolio-to-portfolio strategy comparison.

### 10. Static-preview behavior

`site-mirror/build-local-preview.mjs` removes every `<script>` and script preload. The five representative source pages each contain 77 script tags; their local copies contain zero. The visible interactive DOM remains:

| Page | Source scripts | Local scripts | Source/local buttons | Source/local forms |
| --- | ---: | ---: | ---: | ---: |
| Portfolio | 77 | 0 | 68 / 68 | 1 / 1 |
| Positions | 77 | 0 | 87 / 87 | 1 / 1 |
| Orders | 77 | 0 | 87 / 87 | 1 / 1 |
| Runs | 77 | 0 | 87 / 87 | 1 / 1 |
| Strategy capture | 77 | 0 | 87 / 87 | 1 / 1 |

Consequences:

- stage/version/subview buttons do not navigate;
- range controls do not change data;
- search inputs do not filter;
- Add funds, Edit schedule, Close, Archive, Paper Trade, and Get Started do not open or submit;
- Runs rows and order-to-run links do not select details;
- chart hover and version markers do not respond;
- dialog close/cancel buttons do not act;
- query-string changes do not reconstruct state.

Normal captured `<a>` links can still navigate to another static file, but most Champion workspace navigation is button/router-driven. The `/preview/states/...` catalog is a gallery of frozen outcomes, not an interaction model.

## Prioritized gaps

### P1 if the mirror is represented as interactive — Use an actual local runtime

The current preview cannot validate a product flow. Use the route-reachable
application under `src/` as the local runtime and retain this mirror as evidence.
Do not re-enable captured production bundles against the live service; they are
minified deployment artifacts tied to production auth/data contracts.

Acceptance criteria:

- stage, version, main subview, Runs overlay, selected run, range, filter, and dialog state are URL-addressable;
- browser back/forward restores the state;
- all visible controls either work or are explicitly disabled with a reason;
- mutations update a local fixture store and expose pending/success/error states;
- no preview action reaches a production trading endpoint.

### P1 — Correct the route/state model in the replacement source

Replace synthetic assumptions with the actual hierarchy:

`Champion → Stage → Version → Main subview → Optional sub-sidebar → Optional selected record/dialog`

Runs must preserve the main pane. Paper Strategy must become its own view and receive a correct capture. Version identity must propagate through every portfolio/trading child.

### P1 — Add populated trading fixtures

The absence of any position/order/fill is the largest content-coverage hole. Add at least:

- long profitable, long losing, and fractional positions;
- partial and full close states;
- market, limit, stop, trailing, and bracket orders;
- pending, partial-fill, fill, rejection, cancellation, and expiry outcomes;
- linked run/order records;
- non-zero deployed allocation, gainers/detractors, and recent orders.

### P1 — Capture and implement paper-run detail

Add a selected paper run with status, timestamps, activity/events, proposed/submitted orders, buying power, failure details, and any allowed cancellation state. Keep Runs as the overlay/sub-sidebar shown by the canonical query model.

### P1 — Make lifecycle flows coherent

Connect Paper Trade promotion, Add funds, Edit schedule, Archive, stage/version selection, and Get Started into deterministic transitions. Include validation, permission/gate, pending, success, and failure states instead of only open-dialog and post-result screenshots.

### P1 — Decide the analytics product surface

Composition, attribution, blotter, risk, drawdown, and comparison are real bundle-evidenced capabilities but absent from the dashboard capture. Product/design must explicitly choose dashboard, Atlas, both, or hidden. Then capture populated and empty/error states for the chosen presentation.

### P2 — Cover secondary states

- Performance loading, unavailable, sparse, and populated history.
- Positions/Orders loading, no-search-match, pagination, error, and retry.
- Schedule weekly/monthly, paused, no schedule, validation, and holiday behavior.
- Funding min/max/invalid, duplicate submit, pending, and failure.
- Allocation drill-down/back and filtered-position navigation.
- Version switching and unavailable-stage states.
- Run list loading, empty, active, failed, cancelled, and selected.

### P2 — Preserve product gates

Deploy Live and Backtests are visibly unavailable/Coming Soon. Keep them disabled with explanatory copy until a verified flow exists. A compiled method or lifecycle string is not sufficient reason to enable them.

### P2 — Resolve capture consistency

Fix the post-funding `$10,000`/`$11,000` mixed snapshot, add a central state manifest, and record the canonical route, entity IDs, active version, fixture revision, action, expected result, and known limitations for every capture.

### P3 — Accessibility and regression hardening

- Preserve search labels, table headers, run-link labels, and dialog focus/escape behavior.
- Give chart values a keyboard/screen-reader alternative; do not rely only on hover.
- Test focus return after dialogs and sub-sidebars close.
- Add route/action tests and visual snapshots for every manifest entry.
- Use deterministic time and market data in fixtures.

## Concrete implementation sequence

1. Define typed fixtures for Champion, Version, PaperSession, PortfolioSnapshot, Position, Order, VersionRun, Schedule, and AnalyticsResult.
2. Define a route-state manifest with canonical product query parameters and local fixture IDs.
3. Build the Champion stage/version shell and Portfolio/Positions/Orders main navigation.
4. Build Runs as a persistent overlay/sub-sidebar with selected-run routing.
5. Recreate Portfolio cards and charts from populated and empty fixtures.
6. Implement search, allocation drill-down, order-to-run, and range interactions.
7. Implement safe mock flows for promotion, funding, schedule edits, archive, and close position.
8. Add paper Strategy from a correct recapture and structured document fixture.
9. Implement the chosen Analytics/Atlas presentation.
10. Gate Live and Backtests, then add automated route, action, accessibility, and screenshot coverage.

## Evidence appendix

### Rendered product evidence

- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/portfolio/index.html`
- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/positions/index.html`
- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/orders/index.html`
- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/runs/index.html`
- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/strategy/index.html`
- adjacent `asset-inventory.json` files for their exact source URLs and request inventory
- `site-mirror/authenticated-screenshots/champion--portfolio.png`
- `site-mirror/authenticated-screenshots/champion--positions.png`
- `site-mirror/authenticated-screenshots/champion--orders.png`
- `site-mirror/authenticated-screenshots/champion--runs.png`
- `site-mirror/authenticated-screenshots/champion--strategy.png`
- `site-mirror/ui-states/champion/portfolio-range-{1d,1w,1m,3m,ytd,1y,all}/`
- `site-mirror/ui-states/champion/{add-funds,edit-schedule,get-started}/`
- `site-mirror/ui-states/mutations/{add-funds-submitted,schedule-saved,paper-trade-after-click,paper-trade-promoted}/`
- `site-mirror/ui-states/champions/all/*/`

### Static-preview evidence

- `site-mirror/build-local-preview.mjs`, especially `disableRuntime()`
- `site-mirror/local-preview/dashboard/champions/example-detail/`
- `site-mirror/local-preview/preview/states/champion/`
- `site-mirror/local-preview/preview/states/mutations/`

### Compiled capability evidence

- `site-mirror/app.vantheon.ai/_next/static/chunks/0w0cpap3wh47x.js` — Portfolio cards, chart/range behavior, allocation, funding, and schedule UI
- `site-mirror/app.vantheon.ai/_next/static/chunks/0ed97jxs4ayru.js` — Champion workspace, versions, Positions/Close, run presentation, promotion, Atlas result renderers
- `site-mirror/app.vantheon.ai/_next/static/chunks/15_br8s4q..yo.js` — Orders table and status/type rendering
- `site-mirror/app.vantheon.ai/_next/static/chunks/0phhqc87es-ye.js` — query/mutation clients for paper sessions, positions, versions, and analytics
- `site-mirror/app.vantheon.ai/_next/static/chunks/0xrrimwn82j1e.js` — Atlas capability/policy registry and analytical tool descriptions
- `site-mirror/app.vantheon.ai/_next/static/chunks/03zsd5jj~lzc4.js` — Champion query/sub-sidebar route parsing

## Bottom line

The capture answers “what does an empty Paper portfolio look like?” It does not yet answer “how does trading work?” The replacement will be credible only after it has coherent route state, populated trading records, paper-run detail, connected lifecycle actions, and an explicit analytics information architecture. Bundle-only methods should remain labeled as evidence—not silently promoted into user-facing features.
