# Audit package QA review

> Historical scope note: this review evaluated the initial capture-only report
> set before the source-parity pass existed. Its scope warning led to the
> governing [source parity ledger](source-parity-ledger.md) and the three
> replacement-source reports indexed in [README.md](README.md). Use those newer
> documents for current implementation conclusions.

## Verdict

The five reports are internally useful as an audit of the captured live product
versus `site-mirror/local-preview/`. Their bundle/UI/static evidence labels are
mostly careful, their exact evidence paths resolve, and they correctly identify
the missing Paper Strategy capture, disconnected screenshot-only states, and the
credential exposure.

They do **not**, however, complete the requested comparison against the website
being built in this repository. None of the reports inspects `src/`, `README.md`,
or the accepted product decisions under `docs/`. Treat the package as a reference
capture audit, not yet as a parity audit of “our views.” This scope gap is P1
because several proposed implementation tasks already exist in the actual app.

## Material corrections and confirmations

1. **The actual application was omitted from the comparison.** The source app is
   a stateful Next.js implementation, not `local-preview/`. For example:
   `src/features/workspace/workspace-fixtures.ts` already defines typed Draft,
   evaluation, Paper, populated-position, equity-history, and run fixtures;
   `paper-portfolio-workspace.tsx` already renders a locked Strategy panel and
   selected Paper-run Summary/Activity; `dry-run-workspace.tsx` already renders
   Activity; and `workspace-demo-authority.ts` already validates checkpoint-bound
   rule changes, evaluations, restore-like forks, and Paper launch. Therefore
   recommendations such as “build a client runtime,” “add typed fixtures,” “add
   populated positions,” or “implement run Activity/Paper Strategy” are not valid
   source-code gaps until those existing implementations are compared field by
   field. Real source gaps still include URL-addressable state: `src/app/page.tsx`
   exposes one route and `champion-workspace.tsx` keeps navigation in React state.

2. **The P0 credential finding is confirmed.** Both
   `ui-states/authentication/password-ready-to-save/index.html` and its generated
   `local-preview/preview/states/...` copy contain two non-empty password inputs,
   and the generated page is linked from the catalog. The audit Markdown files do
   not repeat the credential value. Scrubbing/exclusion and a regression check are
   required before the mirror or audit package is shared.

3. **Severity is inconsistent across reports.** The missing static-preview runtime
   and route model are P0 in `capture-integrity.md`/`portfolio-trading.md`, but P1
   in `global-account.md`/`strategy-drafts.md`. Use P1 when the artifact is honestly
   presented as a static reference library; use P0 only if it is being released as
   a functional prototype/product. The serialized credential remains P0 in either
   case. In the actual source app, missing deep-link/back-forward route state is P1.

4. **Several inventory metrics are stale.** Current filesystem scans produce 75,
   not 77, `ui-states/**/screenshot.png` files; 3,822, not 3,819, buttons across
   the 75 generated state pages; and 110, not 95, distinct internal anchor
   destinations across the full generated preview. All 110 destinations resolve.
   The other headline counts are confirmed: 21 source HTML pages, 75 UI-state HTML
   pages, 12 Champion detail captures, 16 authenticated screenshots, 29 primary
   dashboard pages, 110 preview HTML pages, and zero retained preview scripts.

5. **`COVERAGE.md` overstates Paper Strategy coverage.** Its representative-state
   list says Paper Strategy was captured, while all three detailed audits correctly
   establish that the named Strategy HTML/screenshot is the Runs-over-Orders state.
   Paper Strategy must be marked missing until it is recaptured; Paper Runs should
   remain described as a sub-sidebar, not a standalone main view.

6. **Evidence-path QA passes.** Every exact filesystem path cited by the reports
   exists. Brace/glob forms such as `{portfolio,positions,...}` and `checkpoint-v1.*`
   are compact notation rather than literal links. Sampled endpoint claims for
   draft accept/reject/reset, run events/cancel, Paper run-now/what-if, position
   sell, analytics, and skills are present in the cited chunks. The reports also
   consistently distinguish these bundle-only paths from observed UI; preserve
   that distinction and do not automatically turn every compiled client path into
   a product feature.

7. **The mixed funding state is confirmed.** The submitted Add Funds HTML contains
   both `$10,000` and `$11,000`, while the later schedule state consistently shows
   `$11,000`. It is valid capture-integrity evidence, not sufficient proof of a
   production calculation defect.

8. **Distribution hygiene should extend beyond passwords.** The reports repeat a
   callsign, founder number, staging UUIDs, and mutation labels. These are not
   credentials, but externally shared artifacts should replace account-specific
   values with neutral fixture identifiers.

## Recommended top-10 backlog, dependency ordered

1. **Sanitize the artifact (P0):** remove the password-bearing state from source,
   generated preview, and catalog; rotate the test string if it was used; add CI
   rejection for non-empty password fields and common secret patterns.
2. **Create the real parity ledger (P1):** compare live capture, actual `src/`
   implementation, and accepted `docs/` decisions per capability, using statuses
   `implemented`, `partial`, `missing`, `intentional divergence`, `gated`, and
   `bundle-only`. Do not use the static mirror as “our implementation.”
3. **Create an evidence/state manifest (P1):** record canonical URL/query, entity
   IDs, screenshot, HTML fidelity, expected markers, action/preconditions, capture
   time, fixture revision, and sensitivity; correct counts and recapture Paper
   Strategy plus the screenshot-only overlays needed for comparison.
4. **Add canonical application routing (P1):** encode Champion, Draft/Paper/Live,
   version/checkpoint, main surface, optional panel, selected run/record, and tab in
   actual URLs with refresh and back/forward restoration.
5. **Reconcile the existing domain model (P1):** extend current fixtures/contracts
   with immutable version/checkpoint IDs, content hashes, actors, exact timestamps,
   source/data cutoffs, and audit references; do not replace the typed model that
   already exists.
6. **Close Draft/Strategy workflow gaps (P1):** compare current rule editor and demo
   authority against pending diff, accept/reject, checkpoint history/restore,
   datasets, citations, and launch receipts; make current versus proposed state and
   the exact mutation target unambiguous.
7. **Close evaluation/run gaps (P1):** build on the existing Dry Run and Paper-run
   Summary/Activity views to cover queued/running/completed/failed/cancelled states,
   stable run IDs, exact strategy snapshots, diagnostics, orders, and retry/cancel
   rules.
8. **Close portfolio/trading gaps (P1):** retain the existing populated Iris
   positions, equity history, and runs; add representative order families/statuses,
   position close behavior, range/filter state, funding/schedule outcomes, and safe
   fixture-only mutations where product decisions permit them.
9. **Cover missing product surfaces and decide latent scope (P1/P2):** compare or
   implement Champions list/create/search/retire, settings, The First, Leaderboard,
   legal discovery, and branded 404; separately decide the placement or exclusion
   of analytics, Skills, what-if, banking, Backtests, and Live. Keep liquidation
   semantics explicit and gated capabilities disabled.
10. **Automate acceptance (P2):** validate every ledger entry with route/action
    tests, deterministic fixtures, screenshot markers, accessibility checks,
    responsive coverage, no-production-endpoint guarantees, secret scanning, and
    assertions that every enabled control works or explains why it is disabled.
