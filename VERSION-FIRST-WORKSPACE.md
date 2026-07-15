# Version-First Champion Workspace — Design Specification

> Status: standalone design artifact, not yet normative. It proposes changes
> that touch accepted decisions (noted in "Decisions this implies") but does
> not modify the handbook. If accepted, record the ledger entries and update
> affected documents in one change, per the handbook's own rule.

## Summary

Strategy versions (V2, V3, V4 …) become the top-level hierarchy under a
Champion. Each version is a container bundling everything that belongs to
one lap of the loop: its Draft generation and checkpoints, the immutable
strategy frozen at launch, its evaluations and datasets, its Paper
portfolio(s), and — for the promoted version — the Champion's single Live
portfolio's current deployment period. The workspace reads like an IDE
(VS Code / Visual Studio): explorer, editor, source control, run controls,
problems/output panels, status bar. Distinctions are carried by structure
and glyphs, not instructional text.

Why a version is the right container: the handbook already binds these
objects together — Draft generation Vn with checkpoints Vn.x (D-003), the
immutable Strategy Vn frozen at launch (D-004), transparent evaluations
(D-023), Paper pinned to the version (D-005), Live following Paper evidence
(D-007). A version is one loop lap, so the version list is the product
story at a glance: intent → iterate → evidence → promote.

## The hierarchy

```text
Champion: Mara            (a strategy switcher sits above this level only
│                          if a champion holds more than one idea; the
│                          level collapses when n=1)
│
├─ STATUS BAR (never scrolls away):
│    mutation target `Draft V4 · checkpoint V4.3` · ● LIVE $25k on V2 ·
│    data freshness · connection state
│
└─ VERSIONS (explorer rail, grouped: Current / Deployed / Older-collapsed)
   ├─ ● V4  current · untested-edit count        ← the ONLY mutable node
   │    ├─ Definition       editable rules            ("editor")
   │    ├─ Checkpoints                                ("source control")
   │    │    ├─ V4.3 ● current · untested
   │    │    ├─ V4.2 ✓ evaluated                  ← default baseline
   │    │    ├─ V4.1 ✓ evaluated
   │    │    └─ V4.0 ⚑ generation start (exact clone of V3 launch)
   │    ├─ Evaluations      dry runs / backtests per checkpoint
   │    └─ Datasets         universe, benchmark, cutoffs (draft-editable)
   ├─ 🔒 V3  frozen · Paper running
   │    ├─ Definition       read-only · `source checkpoint V3.2 ⚑ launched`
   │    ├─ Evaluations      the evidence that justified launch
   │    ├─ Paper V3         runs → decisions → orders / positions
   │    └─ Datasets         frozen with the version
   ├─ 🔒 V2  frozen · ● LIVE $25k · Paper archived
   │    ├─ Definition
   │    ├─ Live period      since launch date · deployment history · controls
   │    └─ Paper V2         archived; evidence preserved
   └─ Compare…              cross-version surface, validity-envelope gated
```

## IDE grammar mapping

| IDE concept | Vantheon meaning |
|---|---|
| Explorer | Version tree above |
| Editor | Definition (rules); editable only in the current version |
| Read-only editor (tag checkout) | Frozen version definitions — fully inspectable, inert |
| Source control | Checkpoints Vn.x: list, semantic diff, restore-as-new-checkpoint (D-026) |
| Run button | `▶ Test` — dry run / backtest of the current checkpoint |
| Deploy | `Launch to Paper` (D-027 gated) / `Promote to Live` (from a Paper-tested version) |
| Problems panel | Validation errors, unresolved assumptions, eligibility gaps — blocking items with jump-to-rule |
| Output panel | Evaluation ledger: results with baseline deltas and pinned assumptions |
| Terminal / debug console | Runs panel: unified run console (dry runs + portfolio runs), filtered by explorer selection |
| Status bar | Mutation target, live capital, freshness, connection |
| Command palette | `⌘K`: jump to version / portfolio / run; trigger Test / Deploy |

The Problems panel deserves emphasis: unresolved assumptions and missing
eligibility criteria are exactly "problems" in the IDE sense — enumerable,
navigable, and blocking specific actions. This gives D-027 eligibility a
natural, familiar surface instead of a bespoke checklist page.

## Checkpoint model

Checkpoints are the commits of the workspace. First-class inside their
version, never at explorer top level (that stays versions-only — the two
levels of versioning must not compete for the same navigation tier).

- **Entry anatomy**: ordinal (Vn.x), origin (accepted change set /
  generation initialization / restore — the `DraftCheckpointOrigin` union
  already defined in `src/domain/contracts.ts`), evaluation status
  (✓ evaluated / untested), and role markers (● current, ⚑ launched,
  ⚑ generation start).
- **Selecting a checkpoint** opens its definition snapshot read-only, a
  semantic diff against its predecessor, and the evidence that tested it.
  Only the current checkpoint is editable.
- **Restore** follows D-026: `Restore V4.1` opens a review diff against
  V4.3; acceptance creates V4.4 with the restored content. History never
  rewinds. The flow is an explicit state machine:
  requested → reviewing → validating → applied | rejected | stale.
- **Baseline legibility**: the most recent ✓-evaluated checkpoint is the
  default baseline for the next evaluation; the ⚑ generation-start
  checkpoint inherits the launched version's evidence as its generation
  baseline. Evaluation status on every checkpoint row makes baseline
  selection visible at a glance rather than implicit.
- **Frozen versions** show their checkpoint lineage read-only with the
  launched checkpoint marked, so tracing any Paper/Live outcome back to
  `source checkpoint Vn.x` is a tree walk, not a lookup.

## The three distinctions, conveyed without prose

1. **Mutable vs frozen** — working tree vs checked-out tag. Current
   version: filled dot, editable fields, Test/Deploy controls present.
   Frozen: lock glyph, read-only editor treatment, zero edit affordances.
   The "edit" gesture on frozen content is `Apply to V4` — a cherry-pick
   into the working version that opens a proposal against the current
   Draft. This is `Improve in Draft` expressed structurally.
2. **Paper vs Live** — Paper carries a `Simulated` badge in a quiet
   register; Live carries a high-contrast LIVE marker with the capital
   amount always adjacent — in the explorer row, the surface header, and
   the status bar. Never color-alone (D-016).
3. **Dry run vs deployment run** — placement (Evaluations vs
   Portfolio → Runs) plus a distinct icon family; the unified Runs panel
   labels each row's origin.

## Invariants preserved (unchanged)

One mutable Draft per lineage; launch freezes Vn and starts Vn+1.0 as an
exact clone (D-025); restore appends (D-026); Paper and Live never change
from editing; eligibility is server-authoritative and the Champion cannot
override it (D-027); comparisons are envelope-gated (D-030); evidence is
append-only and survives archive (D-029). Selecting anything inside a
frozen version never re-targets mutation — the status-bar target stays
`Draft V4 · checkpoint V4.x` no matter what is being viewed.

## State management (load-bearing)

One owner per client-state domain (D-012):

| State domain | Owner | Keying / shape |
|---|---|---|
| Version containers, checkpoints, evaluations, portfolios, deployment periods | TanStack Query (server read models) | `[champion, lineage, "version", vN, …]` — every key carries the full scope chain |
| Explorer/panel selection, per-version UI memory, compare selection, pinned baseline | Zustand interaction store | disposable projections, never authority |
| Pending Draft commands awaiting server outcome | Dexie recovery (`src/lib/recovery/`) | keyed by champion + lineage + generation + base checkpoint revision |
| Streaming portfolio/market telemetry | external subscription store (`src/lib/state/telemetry-store.ts`) | unchanged (D-014) |

**Authoritative state.** Version-container read models indexed by
generation; `RevisionToken`s (`src/domain/identity.ts`) on every entity;
`AuthoritativePatchEnvelope` (`src/domain/patches.ts`) updates caches by
entity reference + revision. Because every query key carries the scope
chain, a patch for V3 structurally cannot touch a V4 cache entry.

**Interaction state** (extends
`src/lib/state/workspace-interaction-store.ts`):

```ts
destination: WorkspaceDestination          // what is viewed — and ONLY that
perVersionUI: Record<VersionKey, {         // restoration memory
  lastDestination; panelTab; selectedCheckpoint; explorerExpansion
}>
compareSelection: EntityReference<"paper-portfolio">[]  // exists today
pinnedBaseline?: { generation; evaluationRef }          // survives reload;
                                                        // persisted locally;
                                                        // non-authoritative
```

Switching V3 → V4 → V3 restores exactly where you were in V3 — panel tab,
selected checkpoint, expansion — because all per-version UI lives in one
keyed record.

**Two hard rules that make bug classes unrepresentable:**

1. **Mutation target is derived, never navigated.** The composer and
   status-bar target are computed from server authority (the lineage's
   current generation + current checkpoint). Navigation writes
   `destination` only. There is no code path where opening V2's Live
   period changes the mutation target.
2. **Dirty/untested counts are derived, never stored.** "2 untested
   edits" = current checkpoint ordinal minus latest ✓-evaluated ordinal,
   both from read models. No hand-maintained counters to drift.

**Draft mutation lifecycle** (uses `DraftProjectionState` /
`DraftValidationState` from `src/domain/contracts.ts`): compose edit →
proposal (pending overlay; canonical content untouched, D-011) →
validating → authoritative patch creates checkpoint Vn.x+1 | rejected |
stale-base → conflict surface. Pending proposals render as overlays on
the Definition editor and appear in the checkpoint list under a distinct
"pending" affordance — never styled as real checkpoints.

**Recovery.** Extend `src/lib/recovery/draft-recovery.ts` keys with
lineage + generation scope. On reconnect: recover the pending command and
compare its base checkpoint revision with current authority — match →
offer resume; mismatch → the version-conflict surface from the IA
handbook. Paper/Live are read-only cached context while offline; only
Draft work is recoverable, by design.

**Destination type.** Extend the discriminated `WorkspaceDestination`
with version-scoped variants using the typed identity system in
`src/domain/identity.ts` — no raw `string` IDs, so a portfolio reference
cannot be passed where a version reference belongs:

```ts
type WorkspaceDestination =
  | { kind: "version-definition";  version: VersionRef }
  | { kind: "version-checkpoints"; version: VersionRef }
  | { kind: "checkpoint";          version: VersionRef; checkpoint: CheckpointRef }
  | { kind: "version-evaluations"; version: VersionRef }
  | { kind: "version-datasets";    version: VersionRef }
  | { kind: "paper";               version: VersionRef; portfolio: PaperRef }
  | { kind: "live";                portfolio: LiveRef }   // champion-level
  | { kind: "compare" }                                   // selection in store
```

## Live: one portfolio, deployment periods

One real-money portfolio per Champion. Promotion changes the controlling
version and opens a new **deployment period** — a first-class record with
start/end, controlling version reference, and evidence-attribution
boundary. Requirements that follow:

- The Live equity chart segments at period boundaries; returns before the
  boundary attribute to the prior version, after to the new one.
- The evidence layer indexes Live runs by version through their period.
- Viewing Live never re-targets mutation (rule 1 above). "Go to
  controlling version" is an explicit action, not a navigation side
  effect.
- Emergency pause and eligible-order cancellation stay separate from
  strategy editing (D-024) and are reachable from both the Live surface
  and the status bar in ≤2 clicks.
- Add `DeploymentPeriodViewModel` to `src/domain/contracts.ts`.

## Decisions this implies (to record in the ledger if accepted — not made here)

1. **Single Champion-level Live portfolio with first-class deployment
   periods.** Touches the framing of D-004/D-007. This is a product
   decision, not an implementation detail; it must not ship silently
   inside a navigation experiment.
2. **Version as the primary navigational container.** Extends D-003 and
   D-038; supersedes D-010's environment-first navigation *if accepted*.
   Until founder testing decides, the version-first renderer is an
   experiment with an explicit expiry trigger — a named checkpoint
   session and date by which one renderer wins and the other is deleted.

## Implementation sketch

- New renderer `src/features/workspace/version-first-workspace.tsx`,
  swapped via props on the existing `ChampionWorkspace`
  (`src/features/workspace/champion-workspace.tsx`); never mount two
  workspaces or duplicate authority.
- Compose existing primitives (`tabs`, `badge`, `scroll-area`,
  `tooltip` in `src/components/ui/`) and system components
  (`freshness-indicator`, `money`, `percentage`, `status-indicator` in
  `src/components/system/`).
- Charts reuse `PortfolioEquityChart` (run markers; deployment-period
  boundaries on Live) and `AnalyticalEvidencePlot` (evaluation overlays
  vs baseline), per the D-033 engine boundaries and D-036 register.

### Fixtures

One champion, one lineage, three versions exercising every distinction
(new `version-fixtures.ts` beside
`src/features/workspace/workspace-fixtures.ts`):

- **V2**: frozen; controlling Live ($25k, one deployment period with a
  visible boundary on the chart); Paper archived.
- **V3**: frozen; Paper running with 3 completed runs, one of them a
  no-trade run (first-class evidence).
- **V4**: current; checkpoints V4.0–V4.3; one evaluation with a baseline
  delta vs V4.2; one unresolved assumption feeding the Problems panel;
  2 untested edits.

## Risks and mitigations

- **Version proliferation** — explorer groups Current / Deployed / Older
  (collapsed with count); archived Papers stay inside their version, out
  of the everyday tree.
- **Checkpoint vs version confusion** — checkpoints never appear at
  explorer top level; they live only in the source-control view inside a
  version.
- **Comparison crosses containers** — `Compare…` is a dedicated surface
  at the bottom of the explorer (like an IDE search view): multi-select
  across versions, envelope labels per D-030, no ranking when the
  envelope is unmet.
- **Live findability** — the singleton Live is visible twice by design:
  inside its controlling version (provenance) and in the status bar
  (safety).

## Verification

1. `npm run check` and `npm run build` pass.
2. Browser walk of the full loop in the new renderer: edit a rule in V4 →
   Problems shows the unresolved assumption → `▶ Test` → Output shows the
   delta vs baseline → `Launch to Paper` (review dialog) → V5 appears as
   current and V4 freezes with its Paper → select V3 evidence and
   `Apply to V5` opens a proposal targeting the current Draft. The
   status-bar mutation target never lied at any step.
3. State-integrity walk: switch V3 → V4 → V3 and assert full UI
   restoration; open V2's Live period and assert the mutation target did
   not move; fire a checkpoint-scoped patch for V3 and assert no V4
   cache entry changed; simulate offline mid-proposal, reload, and
   assert recovery offers resume against the correct base checkpoint —
   and the conflict surface on a stale base.
4. Keyboard-only pass of the same walk; axe on explorer, panel, and
   status bar; reduced-motion check on panel/explorer transitions.
5. Founder checkpoints (per `docs/development-testing.md`): first-session
   creation; version switching with state restoration; the multi-Paper
   evidence workflow exercised at 8–10 portfolios, not 3; promotion with
   deployment-period continuity and correct attribution.
