# Strategy and Draft Surfaces Audit

Audit date: 2026-07-15
Scope: the representative `ETF Swing Trader` Champion, its Draft/Paper strategy surfaces, checkpoints, datasets, dry runs, Atlas conversation/source affordances, and the corresponding static preview.
Evidence roots: `site-mirror/app.vantheon.ai/`, `site-mirror/authenticated-screenshots/`, `site-mirror/ui-states/`, `site-mirror/local-preview/`, and captured Next.js chunks in `site-mirror/app.vantheon.ai/_next/static/chunks/`.

## Executive answer

The strategy *document body* is substantially represented. The capture includes a long-form, sectioned strategy with thesis, universe/screening, indicators, entry rules, exits, position sizing, and risk management. It also includes a useful completed dry-run summary and a broad datasets capability catalog.

The strategy *product model and workflows* are not yet represented reliably in the local views. The local preview is intentionally a static reference: `build-local-preview.mjs:10-28` removes every script and `build-local-preview.mjs:112-118` copies serialized state HTML into a catalog. Consequently, controls still look enabled but cannot navigate, accept/reject edits, create or cancel a run, restore a checkpoint, inspect Activity, promote a draft, or open source details. Several important substates exist only in screenshots; their serialized HTML is identical to a base view, so the corresponding local catalog entries do not show the named state.

The highest-risk product gap is state identity. The UI shows human labels such as `v2.1`, `v2.0.1`, and `Initial version`, but it does not consistently expose which immutable version/checkpoint/content hash a run or promotion uses. In the captured example, the center document, pending diff, assistant summary, and completed dry run refer to different universes (three ETFs versus a proposed 14-instrument universe). That ambiguity must be eliminated before any real-money implementation. It is P1 in this static redesign audit; it would become P0 if an executable product could trade without immutable version binding.

No P0 was found in the static preview itself. There are six P1 fidelity/workflow gaps, seven P2 completeness gaps, and two P3 capture/polish gaps below.

## Severity rubric

- **P0** — unsafe execution, security issue, or unrecoverable data integrity failure.
- **P1** — core strategy workflow or state fidelity is absent, incorrect, or materially misleading.
- **P2** — important metadata, secondary workflow, or diagnostic depth is missing.
- **P3** — capture QA, discoverability, or polish issue.

## What is well represented

### Strategy document content

The captured Draft contains all core trading-policy sections:

- Thesis.
- Universe and screening: instrument list, volatility tiers, daily timeframe, EMA/SMA/RSI definitions, and daily screening cadence.
- Entry rules: fresh EMA10/EMA20 crossover, RSI 35–65, close above SMA50, next-open execution, long-only, per-instrument uniqueness, and concurrent-position cap.
- Exit rules: EMA crossdown, tiered stop/target, 20-trading-day time stop, precedence, gap behavior, and no partial exits.
- Position sizing: target allocation, whole-share rounding, cash handling, no pyramiding, slot/capital priority, and worked examples.
- Risk management: max-drawdown pause, daily-loss halt, cooldown/re-entry, data-failure safeguards, stale-data handling, and dividend treatment.

Evidence:

- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/draft-strategy/index.html`
- `site-mirror/authenticated-screenshots/champion--draft-strategy.png`
- Clean accepted snapshot: `site-mirror/ui-states/champion/checkpoint-v2.0/screenshot.png`

### Completed dry-run result

The `v2.0.1` dry-run detail is the strongest captured operational view. It includes:

- Status `COMPLETED`, duration `1m 16s`, `0 orders`, and `$10,000 buying power`.
- Summary/Activity tabs.
- Outcome narrative (`No trade`) and takeaway.
- Per-symbol table with close, previous/current EMA10 and EMA20, crossover state, RSI14, RSI-band pass, and close-versus-SMA50 pass.
- Next actions: `Ask Atlas` and `Paper Trade`.

The table covers SPY, QQQ, and IWM and explains that the missing fresh EMA crossover was the gating condition.

Evidence:

- `site-mirror/ui-states/champion/draft-dry-run-v2.0.1/index.html`
- `site-mirror/ui-states/champion/draft-dry-run-v2.0.1/screenshot.png`
- Original URL and immutable IDs: `site-mirror/ui-states/champion/draft-dry-run-v2.0.1/asset-inventory.json`

### Dataset capability catalog

The Datasets screen clearly catalogs 20 capabilities:

- Portfolio: Positions, Buying Power.
- Research & News: Asset Search, Web Search, Deep Research, Stock Screener, News, Fundamentals, Market Info, Macro Economics.
- Prices & Charts: Price History, Live Quotes, Technical Indicators.
- Options: Options Chains, Options Greeks, Volatility Surface, Options Flow.
- Who's Buying & Selling: Dark Pool, Congressional Trades, Insider Trades.

Evidence:

- `site-mirror/app.vantheon.ai/dashboard/champions/example-detail/draft-datasets/index.html`
- `site-mirror/authenticated-screenshots/champion--draft-datasets.png`

## Route and state inventory

The Draft Checkpoints and Draft Dry Runs captures are correctly understood as **subsidebar states**: the main pane intentionally remains Strategy until an item is selected. The issue is not that the main pane remains Strategy; the issue is that the subsidebar itself is not serialized into the HTML used by the local preview.

| Surface/state | Captured live behavior | Primary evidence | Local representation | Assessment |
|---|---|---|---|---|
| Draft Strategy (`v2.1`, pending changes) | Strategy body, inline pending diff, `Dry Run`, `Accept changes`, `Reject changes`, Atlas pane | `app.vantheon.ai/dashboard/champions/example-detail/draft-strategy/index.html`; `authenticated-screenshots/champion--draft-strategy.png` | `/dashboard/champions/example-detail/draft-strategy/` | Content present; controls inert; pending/current state ambiguous. |
| Checkpoints subsidebar | Main pane remains Strategy; sidebar groups `v2` and `v1`, shows `v2.0`, `v1.3`…`v1.0`, relative time, current dot, Restore controls | `authenticated-screenshots/champion--draft-checkpoints.png`; URL in `app.vantheon.ai/dashboard/champions/example-detail/draft-checkpoints/asset-inventory.json` | `/dashboard/champions/example-detail/draft-checkpoints/` | Selected checkpoint document is present, but the serialized HTML has none of `Checkpoints are snapshots`, `21h ago`, or `Restore`; the local subsidebar is therefore absent. |
| Checkpoint `v2.0` | Current checkpoint; clean 14-instrument strategy | `ui-states/champion/checkpoint-v2.0/screenshot.png`; `asset-inventory.json` contains checkpoint ID `627420ca-…` | `/preview/states/champion/checkpoint-v2.0/` | Document present; list metadata/current state is screenshot-only. |
| Checkpoints `v1.3`, `v1.2`, `v1.1`, `v1.0` | Historical strategy snapshots with Restore affordance | `ui-states/champion/checkpoint-v1.*/screenshot.png`; each `asset-inventory.json` has a distinct checkpoint ID | `/preview/states/champion/checkpoint-v1.x/` | Snapshot views present, but navigation/restore are inert and metadata is extremely thin. |
| Datasets | Capability catalog while Atlas pane stays visible | `app.vantheon.ai/dashboard/champions/example-detail/draft-datasets/index.html`; screenshot | `/dashboard/champions/example-detail/draft-datasets/` | Strong static content; no binding/config/status model. |
| Dry Runs subsidebar | Main pane remains Strategy; list contains `v2.0.1` with relative time | `authenticated-screenshots/champion--draft-dry-runs.png`; URL in `draft-dry-runs/asset-inventory.json` | `/dashboard/champions/example-detail/draft-dry-runs/` | Subsidebar is screenshot-only. Non-script DOM equals Draft Strategy, so the named local page does not show the run list. |
| Dry run `v2.0.1` | Completed Summary with metrics, table, narrative, next actions | `ui-states/champion/draft-dry-run-v2.0.1/{index.html,screenshot.png,asset-inventory.json}` | `/preview/states/champion/draft-dry-run-v2.0.1/` | Best-preserved deep state. Activity is not captured and all actions are inert. |
| Source hover: Live Quotes | Citation tooltip with tool name, symbols, snapshot label, description | `ui-states/champion/source-data-panel/screenshot.png` | `/preview/states/champion/source-data-panel/` | Tooltip is screenshot-only; HTML equals base Datasets. |
| Source hover: Price History | Symbols, May–Jul 2026 range, `1Day`, capability description | `ui-states/champion/source-price-history/screenshot.png` | `/preview/states/champion/source-price-history/` | Screenshot-only; HTML equals base Datasets. |
| Source hover: Asset Search | ARKK query and capability description | `ui-states/champion/source-asset-search/screenshot.png` | `/preview/states/champion/source-asset-search/` | Screenshot-only; HTML equals base Datasets. |
| Source hover: ARKK quotes | ARKK latest-bars citation | `ui-states/champion/source-arkk-quotes/screenshot.png` | `/preview/states/champion/source-arkk-quotes/` | Screenshot-only; HTML equals base Datasets. |
| Restore attempt | Historical checkpoint Restore control was opened/focused; no restore result was produced | `ui-states/mutations/checkpoint-restore-confirmation/screenshot.png`; `COVERAGE.md:53-54` | `/preview/states/mutations/checkpoint-restore-confirmation/` | No confirmation copy or completed outcome is preserved in HTML. Do not treat this as an exercised restore. |
| Dry-run chat trigger/submitted/response | Prompt typed/submitted; Atlas response ultimately did not launch a run | Three screenshots under `ui-states/mutations/dry-run-*`; `COVERAGE.md:53` | Three `/preview/states/mutations/dry-run-*` pages | Screenshots differ, but all three non-script DOM fingerprints are identical. The local pages do not preserve the actual transition. |
| Paper Trade setup | Modal: description, starting capital, frequency/time, holiday toggle, Promote | `ui-states/mutations/paper-trade-after-click/screenshot.png` | `/preview/states/mutations/paper-trade-after-click/` | Dialog is screenshot-only and absent from serialized HTML. |
| Paper promotion progress/result | `Promoting…`, then a Paper `v2` was created per coverage notes | `ui-states/mutations/paper-trade-promoted/screenshot.png`; `COVERAGE.md:52` | `/preview/states/mutations/paper-trade-promoted/` | Only a visually incomplete progress frame is captured; no stable success receipt or error/rollback state. |
| Paper Runs subsidebar | Main pane remains the previously selected Orders view until a run is selected; sidebar shows Paper runs | `authenticated-screenshots/champion--runs.png` | `/dashboard/champions/example-detail/runs/` | The subsidebar shell is captured in the screenshot, but it is absent from serialized HTML and no selected Paper run detail was captured. |
| Paper Strategy | Intended read-only strategy for Paper version | Sidebar affordance in `authenticated-screenshots/champion--orders.png` | `/dashboard/champions/example-detail/strategy/` | Not actually captured: the named HTML and screenshot show Orders with the Runs subsidebar rather than read-only Strategy. |
| Backtests | Navigation label with `COMING SOON` | Draft screenshots; `COVERAGE.md:68` | Only as static label in captured pages | Not available. Bundle strings do not establish product availability. |
| Live strategy/deployment | Live ladder exists; Deploy Live disabled | Paper screenshots; `COVERAGE.md:67,75` | Static only | Not covered and should not be claimed. |

## Field representation matrix

| Field/domain | What is represented | What is missing or misleading | Severity |
|---|---|---|---|
| Champion/stage identity | Champion name, Draft/Paper/Live ladder, major/minor-style labels | Stable IDs exist only in captured URLs; no canonical state banner ties page, selected stage, selected checkpoint, and pending revision together | P1 |
| Version label and description | Labels such as `v2.1`, `v2.0`, `v2.0.1`; `Initial version` subtitle | `Initial version` appears on later revisions and promoted versions; no author, exact timestamp, changelog, base version, or content hash | P2 |
| Strategy body | Thesis, universe/screening, entries, exits, sizing, risk management | Stored/rendered body is not exposed as structured data; no schema/version or validation summary | P2 |
| Current versus proposed content | Pending diff and Accept/Reject controls are visible | The center document interleaves old three-ETF content and proposed 14-instrument content. It contains 132 private-use diff marker characters (`U+F8F0`–`U+F8F3`) and 10 literal `**` markers, visible as tofu/raw Markdown in screenshots. There is no clear `Current`/`Proposed` split | P1 |
| Pending revision metadata | Pending state can be inferred from Accept/Reject | No `pending`, `saved`, `accepted`, `rejected`, `conflicted`, or `last saved` status; no originating message/actor | P1 |
| Checkpoint identity | Version/minor label, relative creation time, current dot, Restore | No exact timestamp, actor, summary/changelog, reason, message link, content hash, comparison, or restore audit | P2 |
| Run identity | `v2.0.1`, status, duration, order count, buying power | No visible immutable `versionId`, `checkpointId`, strategy hash, trigger source, data snapshot, agent/model build, started/completed timestamps, or timezone | P1 |
| Run result | Summary narrative, signal table, takeaway, next actions | Activity/log stream not captured; no warnings/errors, provider requests, data-as-of, export, rerun, compare, or cancellation state | P2 |
| Dataset capabilities | Broad capability catalog and short descriptions | “Everything your champion has access to” conflates platform availability with enabled/configured/actually used. Missing provider, permissions, schema, cost/rate limit, freshness, last success/error, parameters, and strategy-field mapping | P2 |
| Source provenance | Hover cards expose capability, symbols/query, and limited range/frequency | Links are generic `?view=data`, not durable source records. Captured anchors include Source 1, Source 2 twice, Source 4, Source 5 (no Source 3). No provider, retrieval time, as-of time, immutable response, or run/message linkage | P2 |
| Atlas conversation | Long history, choices, suggested prompts, Copy/Good/Bad, inline source icons | Current mutation transitions are not serialized; no explicit context boundary showing which version/checkpoint Atlas is editing; controls dead locally | P1 |
| Paper promotion config | Description, starting capital, cadence, time, market-holiday behavior | Modal/progress only in screenshots; no stable confirmation receipt, resulting Paper version ID, effective schedule, or rollback/error capture | P2 |
| Skills | No visible skills management surface in the captures | Bundle contains version-bindable skill CRUD and chat `list_skills`/`use_skill` traces; none is documented or represented in local views | P2 |

## Action and feature matrix

“Observed” means visible in a screenshot or serialized DOM. “Bundle-evidenced” means compiled client code contains a UI branch, schema, or API call; it does **not** prove the server enabled the feature in this account.

| Action/feature | Observed UI | Bundle evidence | Local preview | Required treatment |
|---|---|---|---|---|
| Switch Draft/Paper/Live and views | Yes, stage ladder and Draft/Paper navigation | `0ed97jxs4ayru.js` defines Draft Strategy/Checkpoints/Datasets/Dry Runs/Backtests and Paper/Live Portfolio/Positions/Orders/Runs/read-only Strategy | Inert buttons | Wire to stable URLs and explicit selected state, or visually disable in reference mode. |
| Open Checkpoints/Dry Runs subsidebar | Yes in screenshots | `03zsd5jj~lzc4.js` stores `subSidebar`, `subSidebarVersion`, `checkpointId`, `runSource`; `0ed97jxs4ayru.js` builds the subsidebars | Missing because subsidebar DOM was not serialized | Reconstruct as real components; do not rely on static page naming. |
| Accept pending strategy changes | Yes | POST `/versions/draft/accept`; optimistic `pendingPlan` commit in `0ed97jxs4ayru.js`/`0phhqc87es-ye.js` | Button looks enabled but does nothing | Add pending state, confirmation/undo policy, success receipt, and error recovery. |
| Reject pending strategy changes | Yes | POST `/versions/draft/reject` | Inert | Same as accept; preserve rejected revision/audit rather than silently losing it. |
| Reset draft | Not observed | POST `/versions/draft/reset` in `0phhqc87es-ye.js` | Absent | Treat as latent; decide whether product should expose it, with destructive-action confirmation. |
| Create Dry Run | `Dry Run` button and one completed result observed | POST `/version-runs` with `versionId` and optional `executionMode`; schema allows `mode=dry|paper|live`, `executionMode=sim|regular` | Inert | Bind request to immutable version/checkpoint/hash; show pending/running/complete/failed/cancelled. |
| Cancel run | Not observed | POST `/version-runs/:runId/cancel` | Absent | Latent; add only when pending/running and record cancellation actor/time. |
| View run Summary | Yes | Run fetch, orders, buying power APIs | Static detail is good | Keep; add provenance header. |
| View run Activity | Tab observed, state not captured | SSE `/version-runs/:runId/events` exists in `15_br8s4q..yo.js` | Dead tab | Implement event timeline and terminal/error states before claiming parity. |
| Ask Atlas about run | Yes | Champion chat/stream endpoints | Inert | Carry `runId`, `versionId`, `checkpointId`, and source artifacts into explicit chat context. |
| Restore checkpoint | Restore controls observed; no completed restore | POST `/versions/checkpoints/:checkpointId/restore`; bundle synthesizes an applied checkpoint with snapshot, summary, description, timestamps, user/message fields | Inert and list absent | Show diff, target/base IDs, confirmation, outcome, and restore audit entry. |
| Promote Draft to Paper | Modal/progress and resulting Paper v2 noted | POST `/versions/:versionId/cut-to-paper` with deployment + description; schedule supports daily/weekly/monthly, time, starting capital, holiday toggle | Modal absent; button inert | Implement a transactional state machine and link success to new Paper version/portfolio. |
| Generic cut/promote/archive/demote/what-if | Some stage/archive affordances observed; most not exercised | Endpoints exist in `0phhqc87es-ye.js` | Mostly absent/inert | Bundle-only features must remain labeled latent until exercised and designed. |
| Backtest | `COMING SOON` only | Bundle contains backtest statuses/guardrail strings | No usable view | Keep disabled/roadmapped; do not infer availability from bundle code. |
| Deploy Live | Disabled | Live-stage code exists | Inert | Out of current coverage; requires separate risk/approval audit. |
| Inspect source citation | Hover tooltips observed in screenshots | Generic Dataset navigation and inline citation UI | Query link returns same static page; tooltip variants collapse to base HTML | Give every source a durable ID and details route/drawer. |
| Copy / Good / Bad / suggested reply | Yes | Chat score/tool-result endpoints exist | Inert | Either wire in implementation or disable/annotate in reference preview. |
| Skill create/update/remove | Not observed | POST/PATCH/DELETE `/champions/:id/skills`; create schema has `path`, `name`, `description`, `content`, optional metadata `{type,tags}` and optional `versionId` | Absent | Model explicitly and bind skills to strategy versions; do not claim captured parity. |

## Evidence-backed gaps

### SD-01 — Enabled-looking static controls are nonfunctional (P1)

`build-local-preview.mjs:10-28` strips all scripts, while the captured buttons remain in the DOM without serialized React handlers. A representative Draft Strategy page retains 72 buttons, 40 of which are not marked `disabled`, but has zero scripts. This makes `Dry Run`, `Accept changes`, `Reject changes`, source links, Copy/feedback, navigation, and Atlas controls appear usable when they are not.

Recommendation: put the preview in an explicit `reference` mode. Add a persistent banner, remove pointer/hover affordances from inert controls, and provide catalog links beside each control. For the production redesign, implement components against a real state layer rather than treating mirrored HTML as a codebase.

### SD-02 — Named substates often exist only in screenshots (P1)

After removing scripts/styles/SVG and normalizing whitespace, the serialized DOM fingerprints show:

- Draft Strategy and Draft Dry Runs: same fingerprint prefix `560040c4b62908ef` (expected same main pane, but the screenshot-only Dry Runs subsidebar is lost).
- Datasets plus all four source-hover states: same prefix `a001276a808229cc`.
- Dry-run trigger, submitted, and response-complete mutation pages: same prefix `9ca4ac2a408f302e`.
- Paper Orders, Runs, and named Strategy capture: same prefix `02c7052ae8469766`. Orders remaining in the main pane for an unselected Runs subsidebar is valid; the problems are that the Runs subsidebar is screenshot-only and the named Strategy capture is not Strategy.

The local builder faithfully preserves the non-script DOM text (representative source/local pairs compare equal), so it also faithfully preserves these omissions. The catalog label implies a distinct state even when the page content does not contain it.

Recommendation: maintain a state manifest with `stateId`, original URL, screenshot, serialized HTML, expected visible markers, and interaction notes. Use screenshots as the reference artifact when DOM markers fail validation, or reconstruct the state in a real mock component.

### SD-03 — Paper read-only Strategy was not captured; Runs is only a subsidebar shell (P1)

`app.vantheon.ai/dashboard/champions/example-detail/strategy/index.html`, `runs/index.html`, and `orders/index.html` have identical non-script DOM text and show `v1 Orders`. For `runs/`, Orders remaining in the main pane is expected because no run is selected; its screenshot does capture the Runs subsidebar shell. For `strategy/`, however, both its asset inventory and `authenticated-screenshots/champion--strategy.png` still show the Orders view with `subSidebar=runs`, so the read-only Paper Strategy view is genuinely missing. No selected Paper run detail was captured either.

Recommendation: recapture Paper read-only Strategy and a selected Paper run as distinct states. Until then, mark coverage as Paper Portfolio/Positions/Orders plus the Runs subsidebar shell; do not claim Paper Strategy or Paper run-detail parity.

### SD-04 — Current/proposed strategy rendering is ambiguous and visibly corrupted (P1)

The Draft `v2.1` screenshot interleaves current three-ETF text with proposed 14-instrument text. Raw diff markers render as squares and Markdown markers remain visible. The serialized document contains 132 private-use marker characters and 10 literal `**` markers. Meanwhile, the Atlas pane summarizes the 14-instrument proposal as if it were the current strategy.

Recommendation: show `Current` and `Proposed` in a split or toggleable diff, render Markdown before diffing, label every side with checkpoint/content hash, and keep Accept/Reject in a sticky review bar with an explicit pending-status chip.

### SD-05 — Version, checkpoint, run, and promotion provenance is insufficient (P1)

The completed dry run visibly evaluated SPY/QQQ/IWM, while a nearby clean checkpoint and Atlas summary describe 14 instruments. The run label alone (`v2.0.1`) is not enough to prove which snapshot ran. IDs are present only in `asset-inventory.json` URLs, not the product view.

Recommendation: every run/promotion header must display and persist `versionId`, `checkpointId`, strategy content hash, mode, trigger source, data snapshot/as-of, and creation timestamps. The action request and result must echo those exact identifiers. Block execution if the displayed draft has unaccepted changes unless the user explicitly selects current-versus-proposed.

### SD-06 — Dry-run mutation states do not demonstrate a successful create-run workflow (P1)

The trigger/submitted/response screenshots show a chat request, but `COVERAGE.md:53` records that Atlas reported chat could not launch the actual run. Their serialized HTML states are indistinguishable, and no new run detail linked to the v3 prompt was captured.

Recommendation: route `Dry Run` through a dedicated action, not an ambiguous chat prompt. Capture and implement idle → confirm → queued → running → complete/failed/cancelled, then link the resulting `runId` into Atlas.

### SD-07 — Metadata headers are too thin (P2)

Checkpoint UI renders a generated version/minor label, relative `createdAt`, a current dot, and Restore. Bundle code shows the underlying checkpoint entity can carry `id`, `versionId`, `championId`, `userId`, `messageId`, `snapshot`, `summary`, `description`, `status`, `appliedAt`, `createdAt`, and `updatedAt`, but most of it is not surfaced. The repeated `Initial version` description is actively misleading on later versions.

Recommendation: add a consistent metadata header and a checkpoint details drawer using the richer entity fields already implied by the bundle.

### SD-08 — Dry-run Activity and diagnostics are missing (P2)

Only Summary was captured. The bundle exposes an event stream, run orders, and buying power, but the Activity tab is a dead local control. Error, timeout, cancelled, partial-data, and nonzero-order states are not represented.

Recommendation: build an Activity timeline with tool/data calls, decision events, orders, warnings, and errors; add empty/loading/failed/cancelled examples to the state catalog.

### SD-09 — Datasets is a capability brochure, not a data contract (P2)

The catalog is visually strong but cannot answer which capabilities this strategy actually uses, whether they are enabled, their providers, their fields, or their freshness. This matters because the strategy has explicit data-failure and stale-data rules.

Recommendation: introduce `DataCapabilityBinding` records and a `Used by this strategy` subset. Show status, parameters, provider, asset coverage, refresh cadence, last success/error, and the strategy sections/runs that depend on each binding.

### SD-10 — Citations are not durable source artifacts (P2)

Inline source anchors all navigate to generic `?view=data`; the static preview cannot resolve that query to a different artifact. Numbering is inconsistent (Source 2 appears twice; Source 3 is absent), and tooltip-only details disappear from serialized HTML.

Recommendation: create immutable `SourceArtifact` records with provider, capability, request parameters, retrieved/as-of timestamps, response hash/snapshot, related message/run, and a stable details URL.

### SD-11 — Promotion is captured only as an unstable screenshot state (P2)

The setup modal is comprehensive, and bundle code confirms description (max 50), starting capital, cadence, hour, holiday behavior, deployment payload, optimistic update, and rollback. But the local HTML omits the dialog and the `Promoting…` screenshot has incomplete/occluded text. No durable success receipt identifies the resulting Paper version and schedule.

Recommendation: add review, submitting, success, and failure screens; include the destination Paper version ID, starting capital, schedule/timezone, first-run status, and link to the new portfolio.

### SD-12 — Champion Skills are latent, not represented (P2)

Compiled code contains champion skill list/create/update/remove APIs, schemas, chat tool traces (`list_skills`, `use_skill`), and version-binding support. No skills UI or skills state appears in the captured HTML/screenshots.

Recommendation: decide whether Skills belong in Strategy or Datasets. If in scope, model `path`, `name`, `description`, `content`, metadata/tags, ownership, `versionId`, created/updated timestamps, and install/use history. Label this as a parity gap, not as an observed live feature.

### SD-13 — Backtests and Live must remain explicitly out of scope (P2)

Backtests is visibly `COMING SOON`; Deploy Live is disabled and no representative Live view was available. Compiled backtest/live branches and statuses are latent code, not evidence of usable flows.

Recommendation: keep these routes disabled with roadmap copy. Conduct separate execution, approval-threshold, brokerage, and risk-state audits before implementing Live.

### SD-14 — The preview catalog lacks evidence context (P3)

`local-preview/preview/index.html` lists paths only. It omits original URLs, screenshots, whether a state is DOM-backed or screenshot-only, expected markers, status, and interaction notes.

Recommendation: generate catalog cards from a manifest with thumbnail, title, surface, stage, original URL, captured-at, data sensitivity, fidelity (`interactive`, `static DOM`, `screenshot only`), and known gaps.

### SD-15 — Capture QA is incomplete (P3)

Some screenshots contain black/occluded regions (notably checkpoint and promotion/source states). Mobile/responsive behavior and several loading/empty/error variants were not captured.

Recommendation: add screenshot validation (non-black-pixel bounds, expected OCR/DOM markers), desktop/tablet/mobile breakpoints, and state coverage assertions.

## Bundle-evidenced capability map

The following compiled files are useful implementation evidence, but they are not source code and do not prove server/account availability:

- `site-mirror/app.vantheon.ai/_next/static/chunks/03zsd5jj~lzc4.js`
  - URL/workspace state: `subSidebar`, `subSidebarVersion`, `checkpointId`, `runSource`.
  - Actions: open/close checkpoint or run subsidebar, select checkpoint, view run.
- `site-mirror/app.vantheon.ai/_next/static/chunks/0ed97jxs4ayru.js`
  - Observed navigation definitions and labels.
  - Pending-plan diff, Accept/Reject, checkpoint grouping/deduplication/current dot/Restore.
  - Runs list status, trigger-source icon, and relative creation time.
  - Paper promotion form and optimistic/error behavior.
- `site-mirror/app.vantheon.ai/_next/static/chunks/0phhqc87es-ye.js`
  - Version APIs: list/fetch draft, accept/reject/reset draft, restore checkpoint, cut/cut-to-paper/promote/archive.
  - Run APIs: create/cancel/list/fetch, buying power, orders.
  - Paper APIs: add funds, run now, demote/promote, runs, what-if.
  - Skill APIs: list/create/update/remove.
- `site-mirror/app.vantheon.ai/_next/static/chunks/15_br8s4q..yo.js`
  - Run event stream and run/checkpoint label formatting.
- `site-mirror/app.vantheon.ai/_next/static/chunks/0xrrimwn82j1e.js`
  - Run schema: `versionId`, optional `executionMode=sim|regular`; list mode `dry|paper|live`.
  - Skill schema: required path/name/content, optional description/metadata/version binding.
  - Backtest/skill strings are latent and must not be treated as observed functionality.

## Recommended view and data-model changes

### 1. Canonical strategy header

Every Strategy, Checkpoint, Run, and promotion view should share a header with:

```text
Champion / stage / major version / checkpoint
state: clean | pending changes | read-only | archived
description/changelog
created/updated timestamps and actor
base version + source checkpoint
content hash
deployment/schedule summary
```

Never use only `v2.1` as identity.

### 2. Structured entities

Recommended minimum records:

```text
ChampionStrategyVersion
  id, championId, stage, versionNumber, status
  description, planMarkdown, renderedPlan, contentHash
  baseVersionId, currentCheckpointId, createdBy
  createdAt, updatedAt, acceptedAt, archivedAt
  deploymentConfigId, capabilityBindingIds, skillIds

StrategyCheckpoint
  id, versionId, sequence, snapshot, contentHash
  summary, description, status, messageId, createdBy
  createdAt, updatedAt, appliedAt, restoredFromCheckpointId

VersionRun
  id, championId, versionId, checkpointId, strategyHash
  mode, executionMode, triggerSource, status
  createdAt, startedAt, completedAt, cancelledAt, actorId
  initialBuyingPower, dataAsOf, datasetSnapshotIds
  orders, activityEvents, summary, outcome, error
  agentBuild, model, sourceArtifactIds

DataCapabilityBinding
  id, versionId, capability, provider, enabled
  parameters, permissions, schemaVersion, assetCoverage
  freshnessPolicy, lastSuccessAt, lastErrorAt, status

SourceArtifact
  id, capabilityBindingId, provider, requestParameters
  retrievedAt, dataAsOf, responseHash, immutableSnapshotRef
  messageId, runId, displayTitle

ChampionSkill
  id, championId, versionId, path, name, description, content
  metadata, ownerId, createdAt, updatedAt, deletedAt
```

### 3. Explicit state machines

```text
Draft:
clean -> pending_changes -> accepted -> checkpointed
                          -> rejected

Run:
idle -> confirming -> queued -> running -> completed
                                  |       -> failed
                                  -> cancelled

Promotion:
editing -> reviewing -> promoting -> paper_created -> first_run_seeded
                               -> failed/rolled_back
```

Every transition should have disabled/loading/error/success states and an audit event.

### 4. Stable routes

Prefer resource routes over query-only ephemeral state:

```text
/champions/:championId/versions/:versionId/strategy
/champions/:championId/versions/:versionId/checkpoints/:checkpointId
/champions/:championId/versions/:versionId/runs/:runId?tab=summary
/champions/:championId/versions/:versionId/datasets
/champions/:championId/sources/:sourceArtifactId
/champions/:championId/skills/:skillId
```

Subsidebars can remain contextual UI, but the selected resource must be deep-linkable.

## Prioritized remediation

1. **Truthful preview:** badge every page as static, disable inert controls, and add screenshot thumbnails/original URLs/fidelity labels to the catalog.
2. **Fix capture collisions:** recapture Paper Strategy, selected Paper Run, Draft Dry Runs subsidebar, checkpoint list/restore result, promotion success, and source detail states as actual DOM-backed views or intentional screenshot references.
3. **Resolve canonical strategy state:** separate current/proposed content, fix diff rendering, correct stale descriptions, and show immutable identifiers.
4. **Bind every action to an immutable snapshot:** Dry Run, Restore, Accept/Reject, and Paper promotion must echo version/checkpoint/hash on request and result.
5. **Implement workflow state machines:** include loading, success, error, cancellation, rollback, and audit history.
6. **Add provenance:** run Activity, dataset bindings, durable source artifacts, and exact timestamps/timezones.
7. **Decide latent scope:** document whether Skills, what-if, reset/demote, Backtests, and Live belong in the redesign; do not infer parity from compiled chunks.

## Acceptance criteria for “up to speed”

- A user can always answer: “Which exact strategy snapshot am I viewing, editing, testing, restoring, or promoting?”
- Current and proposed strategy content never appear interleaved without labels.
- All checkpoint and run items have stable URLs and exact metadata.
- A Dry Run produces a visible run ID and passes through queued/running/terminal states.
- Summary and Activity work; failed/cancelled/nonzero-order examples are covered.
- Dataset availability, configuration, use, health, and provenance are distinct concepts.
- Every source citation resolves to a durable source artifact.
- Accept, Reject, Restore, and Promote have confirmations, receipts, and errors.
- Paper read-only Strategy is a real captured/implemented route, not an Orders duplicate.
- Bundle-only capabilities are labeled latent until deliberately designed and verified.
- The local reference catalog never presents a dead control as though it were functional.
