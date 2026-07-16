# Bundle-evidenced capability map

## How to read this document

These capabilities are evidenced by strings, schemas, analytics events, and API
client paths in the captured production JavaScript. They are not all proven to
be reachable in the current staged UI. The section reports use this map to avoid
mistaking an uncaptured or gated feature for an unimplemented one.

Primary evidence:

- `app.vantheon.ai/_next/static/chunks/0phhqc87es-ye.js`
- `app.vantheon.ai/_next/static/chunks/0ed97jxs4ayru.js`
- `app.vantheon.ai/_next/static/chunks/15_br8s4q..yo.js`
- `app.vantheon.ai/_next/static/chunks/071ap63kf_z1p.js`
- `app.vantheon.ai/_next/static/chunks/03zsd5jj~lzc4.js`
- `app.vantheon.ai/_next/static/chunks/0w0cpap3wh47x.js`

## Recoverable data contracts

The bundle contains more metadata than the current views expose. The version
schema includes `id`, `userId`, `championId`, `versionNumber`, `description`,
`plan`, `status`, `isPristine`, `currentCheckpointId`,
`currentCheckpointIndex`, `pendingPlan`, `pendingCheckpointId`,
`pendingDescription`, `createdAt`, and `updatedAt`. Status is one of `draft`,
`paper`, `live`, or `archived`; the description has a 50-character maximum.

The structured Strategy document contract is intentionally small: an ordered,
non-empty `sections` array where each section has a non-empty `heading` and
`body`. The redesigned UI should preserve those sections as data instead of
flattening them into one HTML transcript.

Paper deployment/session contracts include Champion version ID, cron expression,
starting capital, benchmark ticker, run-on-market-holidays, mirror, and portfolio
type. Session updates support pause, resume, stop, market-hours toggle, and
schedule update. The captured UI shows only a subset of those controls.

What-if replay accepts symbol, asset class, side, and quantity, and returns
buying power, market value, cost basis, unrealized P&L, realized P&L, open
position count, and an optional warning. This is a concrete basis for a missing
what-if view rather than a speculative redesign feature.

## Champion and workspace

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| List/create/read/update/archive Champions | `/api/dashboard/champions`, `/${id}` | List, create side effect, detail, and archive states captured; edit metadata not clearly captured |
| Provision Champion | `ensure-provisioning` | Not explicitly represented |
| Dismiss Get Started | `get-started/dismiss` | Panel captured; dismissal result not captured |
| Champion chat and streaming | `chat`, `chat/stream`, `messages` | Rich transcript captured; new streaming interaction is inert locally |
| Score responses and submit tool results | `chat/score`, `chat/tool-result` | Good/bad/copy controls visible; behavior not local |
| Champion skills | `skills`, `skills/${id}`, `list_skills`, `use_skill` | Bundle-evidenced; no dedicated captured skills-management view |

## Version and draft lifecycle

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| List and read versions | `versions`, `versions/${id}`, `versions/version/${id}` | Version/stage selectors and several versions captured |
| Read/create draft | `versions/draft`, `Create the initial draft...` | Draft captured |
| Accept or reject pending draft checkpoint | `versions/draft/accept`, `/reject` | Inline accept/reject controls visible in draft capture; transitions are not wired locally |
| Reset draft | `versions/draft/reset`, `resetDraft` | Bundle-evidenced; no dedicated result state |
| Cut draft to paper/live | `versions/${id}/cut`, `/cut-to-paper`, `cutDraftToPaper`, `cutDraftToLive` | Paper promotion captured; live was disabled |
| Promote version | `versions/${id}/promote` | Paper promotion captured; live promotion not completed |
| Archive version | `versions/${id}/archive` | Confirmation/result coverage is incomplete at version level |
| List/restore checkpoints | `checkpoints`, `versions/${id}/checkpoints`, `versions/checkpoints/${id}/restore` | Five checkpoint detail states and restore confirmation captured; restored result not captured |
| Version performance and benchmark | `versions/${id}/performance`, `/benchmark`, `/portfolio-summary` | Some portfolio chart/benchmark presentation captured; structured responses are not fixtures |

## Runs and tests

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| Create/list/read version runs | `version-runs`, `version-runs/${id}` | Dry-run record and run sub-sidebar captured; paper run record coverage is weak |
| Read run events and orders | `version-runs/${id}/events`, `/orders` | Dry-run narrative captured; raw event/order drill-down not comprehensively captured |
| Cancel a run | `version-runs/${runId}/cancel`, analytics `paper_trading_run_cancel_clicked` | No cancel confirmation/result capture |
| Read run buying power | `version-runs/${id}/buying-power` | Bundle-evidenced; no explicit view state |
| Backtests | labels and lifecycle events (`backtest_started/completed/failed`) | UI says Coming Soon; no usable staged flow |

## Paper and live lifecycle

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| Create/read paper sessions | `paper-trading`, `paper-trading/${id}` | Paper workspace captured |
| Add simulated funds | `paper-trading/${id}/add-funds` | Dialog and submitted state captured |
| Update schedule | session update schema, `update_schedule`, schedule analytics | Dialog and saved state captured |
| Run now | `paper-trading/${id}/run-now` | Bundle-evidenced; a successful manual run was not captured |
| What-if replay | `paper-trading/${id}/what-if`, `WhatIfReplayZod`, `WhatIfResultZod` | Not represented in captured views |
| Paper performance/history | `/performance`, `/performance/history`, `paper-trading/history` | Time ranges captured; history/drill-down coverage incomplete |
| Promote paper to live | `paper-trading/${id}/promote` | Deploy Live visible but disabled |
| Demote/archive paper | `paper-trading/${id}/demote`, `Archive paper version` | Confirmation/result not comprehensively captured |
| Live trading | live labels and promotion paths | Unavailable for representative Champion; no verified live workspace |

## Trading records and actions

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| List/search positions | `positions?...`, `Search positions…` | Empty-state table captured; populated row/action states not captured |
| Close/sell position | `positions/sell`, `ClosePositionBodyZod`, `Place a market order to close this position` | Not captured |
| List/search orders | `orders?...`, `Search orders…` | Empty-state table captured; populated status/filter states not captured |
| Place order | `CreateOrderZod`, `place_order` | Bundle/tool-evidenced; no direct manual order workflow captured |
| Cancel order | `cancel_order` appears in Atlas tool metadata, but inspected policy disables trading tools in chat and no manual cancel request/UI was found | Do not expose without a product decision; this is not equivalent to run cancellation |

## Portfolio analytics

The bundle contains a substantially broader analytics family than the captured
portfolio overview:

| Capability | Endpoint evidence | Capture status |
| --- | --- | --- |
| Portfolio snapshots | `portfolios/${id}/snapshots` | Chart presentation only; snapshot objects absent |
| Composition | `analytics/composition` | High-level Assets card captured; dedicated composition view absent |
| Risk metrics | `analytics/risk-metrics` | Dedicated view absent |
| Drawdown series | `analytics/drawdown` | Dedicated view absent |
| Benchmark/portfolio comparison | `analytics/compare` | SPY comparison appears in chart context; comparison workflow absent |
| Position attribution | `analytics/position-attribution` | Gainers/detractors empty state captured; populated analysis absent |
| Trade blotter/export | `analytics/trade-blotter`, `portfolio_export_clicked` | Not captured |

## Account, funding, and profile

| Capability | Bundle evidence | Capture status |
| --- | --- | --- |
| Profile read/update and username availability | `profile`, `profile/${id}`, `profile/username/available` | Profile/personalization states captured |
| Passkeys, password, recovery, logout | `/api/auth/*` | Excluded from auth-free local flow by request; selected confirmations were captured separately |
| Bank account link/removal | `bank-accounts`, `link-token` | No full captured flow |
| Brokerage application/polling | `brokerage/applications`, `/${id}/poll` | No full captured flow |
| Fund transfers | `fund-transfers`, `fund-transfers/${id}` | Not represented as an account flow; only simulated Champion add-funds is captured |
| Venue balance | `venue-accounts/${id}/balance` | Not explicitly represented |

## Product decision required

For each bundle-only capability, choose one of three outcomes before redesign
implementation:

1. expose it in the replacement UI and add complete states;
2. keep it intentionally hidden/gated and document the condition;
3. remove the dead client path from the future codebase.
