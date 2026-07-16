# Workspace Layout Review — Making the Test & Validation Loop 10x Faster

> Status: review artifact, not normative. Targets the implemented workspace in
> `src/features/workspace/` as of this branch. Invariant references cite
> `docs/decisions.md`.
>
> Disposition: the research-instrument identity and permanent-loop mechanics
> were accepted into D-035 and D-036; persistent dock behavior was accepted
> into D-037. This file remains the implementation
> critique and ranked build rationale rather than a competing specification.

## Verdict

The current layout is a good *reading* environment and a bad *iterating*
environment. It renders one lap of the loop beautifully and then removes the
loop. Every core verb — edit, test, compare, launch — lives in a different
corner, behind a different interaction, with a different status vocabulary.
A power user's iteration speed is bounded by interactions-per-hypothesis, and
today that number is roughly 6–8 plus a conversation round-trip plus human
memory as the diff tool. It should be 3, with zero memory required.

## The only metric that matters

Cost of one iteration: *change one parameter, know whether it got better.*

| Step | Today | Interactions |
|---|---|---|
| Express the change | Open Champion sheet → type prose → wait for proposal → review → accept | 3–4 + round-trip |
| Run the test | Find `Test Draft Vn` (if it still exists in this state) → click | 1–2 |
| Read the result | Read dock or Tests tab | 1 |
| Compare to baseline | **Remember the previous numbers** | ∞ |

The layout has no baseline, no delta, no evaluation history, and no direct
edit. Those four absences are the whole problem. Everything below is either
a cause or a symptom of them.

## Teardown

### First-glance failures

1. **The screen doesn't say "this is a loop."** Nothing communicates
   edit → test → compare → launch. Mutation hides in a right-rail button that
   opens a modal; testing is a top-right button; evidence is a bottom dock;
   versions are a hidden tab. Four corners, four interaction styles, no arrow
   connecting them.
2. **Five status vocabularies, zero hierarchy.** `Saved`,
   `Developing · V1.2`, `Simulated only`, `All changes saved`,
   `Workspace current · Jul 14`. None of them answer the only first-glance
   question: *is what I'm looking at tested, and did it beat the last
   version?*
3. **~160px of stacked headers before the first rule.** Brand block, champion
   block, breadcrumb+tab row, objective row. On a 900px laptop the artifact
   starts a quarter of the way down the screen. The Paper view is worse:
   title + provenance + 8-metric strip + 240px chart push Runs — the primary
   learning surface per `docs/information-architecture.md` — below the fold.
4. **The inspector is a 288px echo.** It restates the value and constraint
   sitting 20px to its left. Its only unique content is the mutation target
   and one button. A quarter of the content area duplicates what a click just
   highlighted.
5. **Tabs hide loop stages from each other.** Strategy, Tests, and History
   are not peer views — they are one workflow. The Tests tab is a
   near-empty duplicate of the dock (`EvaluationOutput` renders in both);
   switching to it *loses* the rule table the evidence refers to. History
   shows checkpoints with no link to the evidence each one produced.
6. **The only mutation path is a modal that covers the evidence.**
   `Discuss this rule` opens a Sheet over the rules and the evaluation you
   are discussing. You cannot look at the thing you are changing while you
   change it. P-001 already proposes side-by-side panels on wide desktop.
7. **Affordance lies.** Rule rows render chevrons that don't navigate —
   clicking only selects. Buttons state no cost: is `Test Draft V1` two
   seconds or two minutes? Unknown until you commit.
8. **Empty states teach nothing.** The pre-run Tests tab floats four setup
   facts in a void; Paper's zero-history chart is a dashed line and a dot.
   Both are prime real estate for "here is the next action" and say nothing
   actionable.
9. **The rail spends 224px on three labels.** Draft, Paper, Live — no
   checkpoint state, no untested-changes indicator, no portfolio sparkline,
   no eligibility. The loop map the user needs doesn't exist anywhere.
10. **Keyboard surface: zero.** No shortcuts, no palette, no hints, no
    focus-order design for the loop. Power-user speed is measured in
    keystrokes; this layout only has a mouse path.

### Loop-breaking failures

11. **The Test action disappears.** After one evaluation the header CTA
    becomes `Launch Paper V1`; after launch, `primaryAction` is `null`
    (`draft-strategy-workspace.tsx`). Draft V2 — the surface whose entire
    purpose is iteration — has **no test button at all**. The layout removes
    the loop after the first lap.
12. **No baseline anywhere.** The dock shows only the latest result,
    unlabeled with the checkpoint it evaluated. Validation means "did V2.3
    beat V2.2"; the layout provides no place where two evaluations coexist.
13. **Evidence and cause are adjacent but unwired.** TSM's rejection
    ("Position cap would exceed 15%") is caused by the Portfolio rule 200px
    above it. Clicking the decision does nothing; selecting the rule filters
    nothing. Trace-to-cause — the spine of Journey 2 — is a reading
    exercise, not an interaction.
14. **Assumptions vanish after the run.** Pre-run, the dock shows
    window/benchmark/capital/cutoff; post-run they are replaced by metrics.
    D-023 requires evidence to carry its test conditions.
15. **Paper → Draft transfer carries nothing.** `Open Draft V2` is bare
    navigation. No `Improve in Draft` on run or decision rows, so observed
    context is dropped at exactly the moment the journey spec says it must
    be carried.

## The 10x layout

Make the loop the layout. One screen, no tabs for loop stages, direct
manipulation with gated validation, keyboard-first.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Mara ▾  Draft V2 · checkpoint V2.3  ● 2 untested edits                   │
│         [ Test  ⌘↵ ]  →  eligibility pending  →  [ Launch Paper — ]      │  ← loop bar
├────────┬───────────────────────────────────────────┬─────────────────────┤
│ LOOP   │ STRATEGY — direct manipulation            │ CONTEXT PANEL       │
│ RAIL   │ Universe   40 large-caps    · 40 eligible │ one of:             │
│        │ Selection  top-quartile 6mo · 12 passed   │ · rule editor       │
│ Draft  │ Portfolio  8 pos · 15% cap  · 3 rejected  │ · change proposal   │
│  V2.3 ●│ Risk       no leverage      · 7 blocked   │   (diff, motivation,│
│ Papers │ Schedule   Fri close                      │    validate, commit)│
│  V1 ▂▄▆│   values are click-to-edit;               │ · champion thread   │
│ Live — │   chips come from the last evaluation     │   (docked, never    │
│        │                                           │    modal on desktop)│
├────────┴───────────────────────────────────────────┴─────────────────────┤
│ EVIDENCE LEDGER   V2.3 vs V2.2:  maxDD 8.4% ▼0.7 · rejections 7 ▲2 · …   │
│ [ equity overlay: V2.3 ── vs V2.2 ┄┄ vs benchmark ··· ]  [drawdown]      │
│ window Jan 2019–Jun 2026 · S&P 500 TR · $100k · cutoff Jun 30 [always]   │
│ ▸ V2.3 ✓ tested   ▸ V2.2 ✓ tested   ▸ V2.1 — untested   ▸ V1.2 ✓ launched│
└──────────────────────────────────────────────────────────────────────────┘
```

### Principles

- **A. The loop is the header.** Replace breadcrumb + badges with a pipeline:
  checkpoint → untested-edit count → Test → eligibility → Launch. `Test` is
  permanent; `Launch` appears beside it when D-027 eligibility is satisfied,
  never instead of it. One glance answers "where am I, what's next, what
  does it cost" (show last run duration on the button).
- **B. Mutation is direct; validation is gated.** Click a rule value to edit
  it in the context panel: current vs proposed diff, motivation field,
  server validation, commit → checkpoint. This honors D-003 (checkpoints
  from any authorized initiator) and D-011 (server-authoritative commands) —
  the gate moves from *conversation* to *validation*, which is where the
  handbook always put it. The Champion becomes an assistant you invoke, not
  a toll booth you queue behind. This single change removes the conversation
  round-trip from every parameter tweak and is worth more than everything
  else combined.
- **C. Evidence lives on the rules.** Each rule row carries chips from the
  latest evaluation (`7 blocked`, `3 rejected`, `12 passed`). Cause and
  effect are visible at rest. Clicking a chip filters the ledger's decisions
  to that rule; clicking a decision selects the responsible rule.
- **D. The dock is a ledger, not a console.** Rows = evaluations per
  checkpoint; columns = behavior and risk metrics; the latest row is pinned
  with deltas against the previous tested checkpoint. Assumptions stay in
  the ledger header permanently (D-023). This kills the Tests tab and gives
  History its missing evidence column — three surfaces collapse into one.
- **E. The rail is the loop map.** Draft entry shows checkpoint + dirty
  indicator; each Paper shows a sparkline, status, and version; multi-select
  Papers → compare (the store's `paperComparison` already exists). Archived
  stays a counted collection. The 224px now earns its keep.
- **F. The Champion docks; it never covers evidence.** A persistent secondary
  column carries `Viewing` / `Changes go to` chips automatically (D-037).
  It remains visible at every supported viewport and never becomes a sheet,
  drawer, modal, or overlay. `Improve in Draft Vn` on every Paper
  run/decision row focuses its composer with the run reference attached.
- **G. Keyboard-first, visibly.** `⌘↵` test, `⌘K` palette, `j/k` rule
  traversal, `e` edit, `d` discuss, `1/2/3` rail contexts. Print the hints
  on the controls. Honor `docs/accessibility-and-motion.md`: documented,
  remappable, inactive while typing.
- **H. One status vocabulary with three registers, each with one home.**
  Artifact state (`edited / tested / eligible`) lives in the loop bar.
  Portfolio state (`running / stopped / archived`) lives in the rail.
  Freshness lives on the data it qualifies. Delete `Saved`,
  `All changes saved`, and `Workspace current` as separate concepts.

### Loop cost after

| Step | After | Interactions |
|---|---|---|
| Express the change | Click value → type → Enter (validated proposal) | 2 |
| Run the test | `⌘↵` | 1 |
| Read + compare | Ledger shows deltas vs baseline automatically | 0 |

Three interactions, no modal, no prose, no memory. That is the 10x.

## Value first: where the charts live

A correction to the ledger as specced above: a table of deltas is still a
reading task. A *picture of money over time* is preattentive — it answers
"did it get better" and "what is my money doing" before the user finishes
fixating on it. The workspace currently has almost no charts: the evaluation
dock is all numbers, and the one equity chart in the Paper view sits below
an 8-metric strip. Meanwhile the production site centers value correctly but
gets the trust mechanics wrong. Take the instinct, not the implementation.

### What the production portfolio center gets right

- **Value + chart as the emotional center.** Big account value, change, and
  a time-range picker is the correct first read for any portfolio context.
- **`Next run: Tomorrow 8:30 AM` as a first-class module.** Anticipation of
  the next event is the best empty-state content there is.
- **"Check back in 22 hours, after your first run completes."** Honest,
  time-bound, tells the user exactly when value arrives.

### What must not be ported

- **A red `▼ BEHIND` verdict against SPY on an account with zero trades and
  +$0.00 return.** That is a ranking without a validity envelope — precisely
  what D-030 prohibits. Day-one flat cash plotted against intraday SPY reads
  as "you are losing" before the strategy has acted once. It converts the
  product's first screen into an argument against itself.
- **The chart manufactures a comparison where no evidence exists.** Drawing
  the benchmark's wiggle against a flat cash line pre-first-run is a fake
  contest. The prototype's dashed zero-history placeholder is more honest —
  keep that, and print the anticipation on the canvas itself
  ("First run Thu 4:15 PM ET").
- **Four of six modules are voids on day one** (no gainers, no detractors,
  no orders, donut = 100% cash). Dashboard-grid thinking reserves space for
  a future it cannot show yet and pushes real content below the fold.
- **`Add funds` as the most prominent action** on a portfolio that has never
  traded. Wrong verb for the trust ladder; the next action is *observe the
  first run*, not *deposit more*.

### Placement in the 10x layout

**Portfolio contexts (Paper, later Live): chart-first, verdict-gated.**

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Paper V1 · Running · Strategy V1 ← Draft V1 · checkpoint V1.2            │
│ $100,000   +0.0%   dd 0.0%   exposure 0%          [1W 1M 3M ALL]         │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │      evidence chart: equity with run markers, sized to history      │ │
│ │      pre-first-run: placeholder + "First run Thu 4:15 PM ET"        │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ Runs (above the fold) · Positions · Orders · Strategy                    │
└──────────────────────────────────────────────────────────────────────────┘
```

- Compact value strip (4 numbers, not 8) + `PortfolioEquityChart` directly
  beneath; the other metrics move behind the chart or into tabs. Runs — the
  primary learning surface — rise above the fold.
- **The chart is an evidence record, not a price display.** Run and
  decision markers are annotated on the curve; clicking one opens that
  run's trace. Its height grows with its history — a strategy with three
  weekly runs gets a modest strip, not a 40%-viewport hero rendered as if
  it were an intraday ticker. Cadence honesty: a Friday-close strategy is
  drawn as discrete run points joined by value, never as a fake continuous
  intraday line.
- Benchmark overlay is *descriptive and gated*: no line until at least one
  completed run, a neutral `vs SPY` line once the validity envelope is met,
  and never an AHEAD/BEHIND badge until D-030 thresholds pass.
- Drawdown as a toggle via `DrawdownEvidenceChart`.

**Draft context: the comparison chart is the loop's verdict surface.**

- The ledger's visual anchor is an equity overlay of the candidate
  checkpoint vs the baseline (and optionally the benchmark), with a
  drawdown ribbon — `AnalyticalEvidencePlot` (Visx), the correct engine for
  analytical evidence under D-033. The delta table annotates the picture,
  not the reverse.
- Sparklines are *earned by evidence*: an evaluation row gets one because a
  backtest has hundreds of points; a rail Paper gets one only after enough
  completed runs to have a shape (roughly five). Before that the rail shows
  status and next run. A three-point sparkline is decoration pretending to
  be evidence — exactly the dashboard reflex this product must not have.

**Chart trust rules (every chart, both contexts):**

- Assumptions and freshness render in-frame — `ChartFrame` already carries
  the accessible summary, status, and freshness contracts (D-023).
- Descriptive lines are allowed early; verdicts (badges, rankings, colors
  implying win/loss) are gated by the validity envelope (D-030).
- An empty chart never fakes a comparison; it shows what will happen and
  when.

All four components already exist — `PortfolioEquityChart`,
`DrawdownEvidenceChart`, `AnalyticalEvidencePlot`, `ChartFrame` in
`src/components/domain/charts/` and `src/lib/charts/` — and the workspace
currently uses exactly one of them, once, below the fold. This is layout
work, not chart engineering.

## What this must not become

Two failure modes sit on either side of this layout. Both are one lazy
sprint away, and "add charts" walks near the first one, so the guardrails
belong in writing.

### Not an exchange (Binance, Robinhood, Polymarket)

Exchange UIs are built to make you *watch the market and act often*. This
product is built to make you *understand a strategy and act deliberately*.
Concretely banned:

- **No naked price charts.** Every curve is annotated with the events that
  explain it — runs, decisions, checkpoint launches. A chart the user
  cannot click through to a decision trace is a television, not evidence.
- **No live-flashing numbers or ticker cadence.** UI update rhythm follows
  run cadence, not tick cadence. A weekly strategy that flickers hourly is
  lying about where its information is.
- **No red/green as ambient identity.** Directional glyphs are neutral ink;
  drawdown going *down* is good, so naive up/green–down/red is semantically
  wrong here anyway. Signal color is reserved for envelope-validated
  verdicts and safety states (D-030, and the existing no-color-alone rule).
- **No KPI-tile walls, streaks, leaderboards, or urgency mechanics.** The
  8-metric strip was already the start of this; four numbers and a chart.
- **Market data appears only in service of explaining a decision** — never
  as ambient content to browse. If a widget would still make sense with the
  strategy deleted, it does not belong in the workspace.

### Not a chat app

Already handbook law (D-032), but the layout must enforce it physically:

- The transcript is never the home surface and the composer is never
  full-width center stage. Champion output lands as domain objects —
  proposals, annotations, linked evidence — in the surfaces they concern;
  prose is commentary on artifacts, not the artifact.
- The Champion conversation remains visible in a persistent secondary dock,
  scoped to the current selection with context carried as chips. It never
  overlays or replaces the strategy or evidence. The entire loop — edit,
  test, compare, launch — materializes as domain state rather than existing
  only in the transcript.
- Conversation history is reachable, but as provenance (linked from
  checkpoints and change sets), not as navigation.

### What it is instead

A **research instrument**: part lab notebook, part version control, part
observability. The center object is always the strategy artifact and the
evidence it produced; every number traces to a run; every change traces to
a checkpoint; every verdict states its envelope. Calm ink, table-and-curve
density, event-annotated time. Closer to Linear crossed with a git client
and a well-kept lab journal than to any trading terminal — which is also
exactly the visual register the current monochrome prototype already has.
Keep it.

## Ranked build order

1. **Permanent Test + ledger deltas** — restore `Test Vn` in all states;
   label results with evaluated checkpoint; add delta-vs-previous column;
   pin assumptions. Files: `draft-strategy-workspace.tsx` (header action,
   `EvaluationOutput`), `workspace-fixtures.ts` (add a second evaluation).
   Highest value per line of code; fixes failures 11, 12, 14.
2. **Charts into the loop** — equity overlay (candidate vs baseline) as the
   ledger's anchor via `AnalyticalEvidencePlot`; Paper goes chart-first with
   a 4-metric strip, run markers, and a gated benchmark line; run-gated
   sparklines in the rail. The components exist; this is composition.
   Delivers the value-first center without the exchange aesthetics banned
   above.
3. **Direct rule editing with validated proposals** — inspector becomes the
   editor/proposal surface. Fixes 4, 6; delivers principle B. Needs the
   change-set review surface the IA doc already specifies.
4. **Loop bar** — replace breadcrumb/badge row with the pipeline header.
   Fixes 1, 2, 7; recovers a header row of vertical space.
5. **Rule ↔ decision cross-wiring + evidence chips.** Fixes 13, and makes
   Journey 2's trace-to-cause a two-click spatial operation.
6. **Docked Champion column + `Improve in Draft` on run rows.** Fixes 6, 15.
7. **Rail as loop map; collapse Tests/History into the ledger.** Fixes 5, 9.
8. **Keyboard layer + command palette.** Fixes 10; cheap once actions are
   centralized by the loop bar.

## What to keep

The bones are right — keep them: the Develop / Portfolios split in the rail,
the persistent bottom evidence dock, provenance in the header, the launch
dialog's fact table, and the `Viewing / Changes go to` treatment in the
Champion panel. The problem is not the skeleton; it is that the loop's verbs
were distributed across it instead of being composed into one circuit.
