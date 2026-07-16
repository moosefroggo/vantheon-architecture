# Capture and preview integrity audit

## Executive finding

The mirror is a strong visual-reference set, but it is not a functional
frontend codebase. This report audits the captured artifact only; it does not
assess the interactive replacement application under `src/`. The original
capture contains deployed HTML and production
bundles; `local-preview/` deliberately removes every script to prevent the live
authentication runtime from taking over. As a result, visible content survives,
but application state, query-driven navigation, data fetching, and mutations do
not.

For redesign reference this is acceptable. The `src/` application is the
replacement runtime and is assessed separately by the source-parity reports.

## Inventory

| Surface | Count | Evidence |
| --- | ---: | --- |
| Original captured HTML pages | 21 | `app.vantheon.ai/**/index.html` |
| Captured UI-state HTML pages | 75 | `ui-states/**/index.html` |
| Champion detail records captured | 12 | `ui-states/champions/all/*/index.html` |
| Authenticated overview screenshots | 16 | `authenticated-screenshots/*.png` |
| State-specific screenshots | 75 | `ui-states/**/screenshot.png` |
| Generated preview HTML pages | 110 | `local-preview/**/index.html` |

The generated preview has 110 distinct internal anchor destinations and all 110
resolve to a captured local route. Core CSS, font, favicon, and captured Next
image URLs return HTTP 200 from the local server.

## What is preserved well

- The rendered dashboard shell, typography, colors, layout, and responsive DOM.
- Visible strategy-document content and tables.
- Representative Champion, portfolio, position, order, dataset, checkpoint,
  dry-run, settings, theme, feedback, and dialog states.
- Twelve Champion detail snapshots and their navigation links.
- A catalog that exposes otherwise disconnected states at `/preview/`.
- The original production chunks, which are useful for inferring capabilities
  and endpoint contracts even though they are not source modules.

## Integrity and behavior gaps

### P1 if represented as interactive — The preview has no application runtime

`build-local-preview.mjs` removes all `<script>` elements. Across the 29 primary
dashboard pages, the resulting DOM still contains 1,595 buttons, 45 forms, 115
inputs, and 13 textareas. None can execute their original behavior. The 75 state
pages contain another 3,822 button instances and 215 forms, also inert.

Impact:

- Champion stage and section tabs cannot switch state.
- Search, time-range filters, theme controls, sidebar toggles, and selectors do
  not update the view.
- Dialogs do not open or close from their parent pages.
- Draft accept/reject, checkpoint restore, paper promotion, funding, scheduling,
  feedback, profile updates, and similar actions cannot run.
- Chat, follow-up suggestions, citations, and source panels are visual only.

Remediation: use the real `src/` application as the product runtime. Keep the
static state catalog as visual regression evidence, not as the product runtime.

### P0 — An excluded authentication state contains populated password fields

`ui-states/authentication/password-ready-to-save/index.html` contains two
password inputs with non-empty serialized values, and the generated copy is
linked from the local preview catalog. The values are intentionally not repeated
in this report. Remove that state from distributable output, scrub both source
and generated HTML, rotate the string if it was used elsewhere, and add a build
check that rejects non-empty password inputs.

A targeted scan for JWT-, bearer-token-, private-key-, cloud-key-, and OpenAI-key
patterns found no other credential-like artifact requiring removal. One compiled
client chunk contains an expected Supabase `anon` client token; it is not a
privileged service credential.

### P1 if represented as interactive — Captured states are disconnected from product navigation

The live product uses query/state combinations on a Champion route. For example,
the paper Strategy action resolves to a URL shaped like
`?view=strategy&version=<id>`, while the Runs control opens a sub-sidebar using
parameters such as `subSidebar=runs`. The mirror instead exposes synthetic paths
such as `/example-detail/strategy/` and `/example-detail/runs/`.

The 75 captured variants are available only through the separate `/preview/`
catalog. Product controls do not route to those captures, so a reviewer cannot
walk the real flow end to end.

Remediation: add a route-state manifest that maps every stage, main view,
sub-sidebar, selected version, record detail, dialog, and filter state to a
fixture-backed URL. Preserve meaningful query parameters or replace them with an
equally explicit local route model.

### P1 — Paper Strategy's primary capture is wrong

`app.vantheon.ai/dashboard/champions/example-detail/strategy/index.html` and
`authenticated-screenshots/champion--strategy.png` show the Orders main view,
not the locked paper Strategy document. The captured accessible content is the
same as the Orders page. A live read-only check confirmed that the actual paper
Strategy view contains:

- `Version 1 Strategy`
- Thesis
- Universe & Screening
- Entry Rules
- Exit Rules
- Position Sizing
- Risk Management

The Runs capture also shows Orders in the main pane, but that is consistent with
Runs behaving as a sub-sidebar rather than a standalone main document.

Remediation: recapture paper Strategy after activating the `Strategy — Locked,
read only` control and store the correct URL/state metadata with it.

### P1 — Captures lack a machine-readable state manifest

Directory names describe many states, but there is no central record of:

- canonical route and query parameters;
- Champion, stage, version, checkpoint, run, and portfolio identifiers;
- active main view and sub-sidebar;
- fixture or API objects used to render the page;
- user action that produced the state;
- preconditions, expected result, and whether a mutation was submitted;
- capture timestamp and known limitations.

This makes similar screenshots easy to misclassify and prevents automated
coverage checks.

Remediation: add a JSON or TypeScript manifest with one entry per page/state and
validate it in the preview build.

### P1 — Several screenshot states are not present in their HTML counterpart

Portal/overlay and tooltip content was not consistently serialized into the
state HTML. Normalized DOM-text comparisons found collisions where screenshots
are visibly different but the saved HTML is effectively the same base page,
including:

- Add Funds vs Edit Schedule dialogs;
- Live Quotes, Price History, Asset Search, and ARKK Quotes source panels;
- dry-run triggered, submitted, and response-complete stages;
- multiple settings/authentication dialog or selection states.

This means the `/preview/` catalog can claim a state name while rendering the
underlying page without that state. The screenshots remain the authoritative
evidence for those variants.

Remediation: serialize the complete composed document including portals, or
recreate overlays from structured fixture state. Add an automated assertion that
every named state changes either DOM semantics, route state, or a declared visual
token relative to its parent.

### P1 — Data is flattened into presentation HTML

Strategy sections, version labels, timestamps, orders, positions, run summaries,
and profile values are present as rendered text, but not as reusable structured
fixtures. The local preview therefore cannot sort, filter, compare, transition,
or validate them.

Remediation: define fixture entities for Champion, Version, StrategyDocument,
Checkpoint, Dataset, VersionRun, PaperSession, Portfolio, Position, Order,
Schedule, ChatMessage, Citation, Profile, and feature availability. Render every
view from those entities.

### P2 — Some serialized captures end with truncated DOM fragments

Several captured HTML files end with literal truncated fragments such as
`[Truncated]`. The preview builder defensively removes unmatched trailing script
content, but it cannot recover omitted DOM. The corresponding screenshots remain
useful visual evidence.

Remediation: recapture affected pages with full-page HTML serialization and add a
build check that rejects unmatched tags or a literal truncation marker.

### P2 — Capability evidence is broader than captured UI coverage

The production bundle references working client paths for version lifecycle,
paper run control, position selling, run cancellation, skills, what-if replay,
and portfolio analytics. Several are absent from the current state catalog or
were unavailable in the staged account. These must be tracked as
`bundle-evidenced`, not silently treated as nonexistent.

Remediation: keep a three-state capability ledger:

1. observed in rendered UI;
2. evidenced in the deployed bundle/API client;
3. unavailable, gated, or not yet verified.

## Recommended implementation order

1. Define the route/state manifest and typed fixture model.
2. Build the Champion workspace shell and stage/view navigation.
3. Render Strategy, Draft, Checkpoint, Dataset, Run, Portfolio, Position, and
   Order views from fixtures.
4. Add deterministic mock actions and state transitions for every observed
   control.
5. Recapture the missing paper Strategy view and any truncated HTML.
6. Add automated route, action, screenshot, and accessibility coverage checks.
