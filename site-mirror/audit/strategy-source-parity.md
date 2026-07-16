# Strategy Source Parity Audit

Audit date: 2026-07-15
Source audited: the route-reachable application under `src/`
Comparison baseline: `site-mirror/audit/strategy-drafts.md`, the captured live evidence named there, `README.md`, and the accepted domain, IA, decision, lifecycle, and journey documents.

## Executive verdict

The source application is a meaningful interactive prototype, not a reconstruction of the static mirror. It is ahead of the local preview in several important ways: the `Dry Run` action works, Summary and Activity are real tabs, checkpoint restore creates a new append-only checkpoint, Paper launch returns separate frozen-Paper and next-Draft rule snapshots, and a read-only Paper Strategy panel exists.

It is not yet “up to speed” with either the captured product or the repository's accepted architecture. The largest gaps are not visual:

1. **There is no reachable strategy-change workflow.** Edit selects a rule and focuses Atlas, but Atlas only returns canned explanatory text. There is no proposed change set, semantic diff, Accept/Reject, conflict review, or authoritative patch visible in the active app.
2. **Dataset and source provenance are absent.** The navigation item named `Datasets` opens five evaluation setup values. There is no capability catalog, binding/configuration state, provider health, durable citation, or source artifact. Worse, Dry Run Activity labels a column `Source` but fills it with the rule's constraint text.
3. **Runtime identity is label-based.** Rich opaque-reference contracts exist, but the active workspace uses strings such as `V1.2`, `Dry Run 1`, and `Strategy V1`, keeps all state in memory, and exposes no stable Champion/checkpoint/evaluation/portfolio routes.
4. **One shipped fixture has authority drift.** Iris is initialized in the client at Draft checkpoint `V2.0`, while its authority is initialized from fixture checkpoint `V1.1`. Any Draft evaluation or restore for Iris is rejected as stale.
5. **Evidence semantics are too optimistic.** Eligible decisions are counted as orders, and a rule is marked `Passed` whenever no rejected decision happens to reference it. Those are not equivalent to authoritative order records or observed condition results.
6. **The Paper model is single-use.** One nullable `paperSnapshot` allows one Paper launch per Champion. The accepted architecture requires multiple persistent Paper portfolios so later Draft generations can be launched and compared without replacing earlier evidence.

There is no P0 because this repository's app is explicitly simulated and has no real-capital execution path. Items 1–5 are P1 product-truth or core-loop gaps; the remaining completeness gaps are P2.

## Audit boundary

The only application entry point renders `ChampionWorkspace` (`src/app/page.tsx:1-5`). Therefore this report gives parity credit only to code reachable from that workspace. In particular:

- `src/features/onboarding/onboarding-workspace.tsx` and its alternate Paper review are source scaffolds, but are not routed by the app entry point.
- `src/features/workspace/rule-editor.tsx` and `createWorkspaceDemoAuthority().confirmRuleChange()` are also not imported or invoked by the reachable workspace. Their existence is noted as a partial scaffold, not as an implemented user capability.
- Captured compiled chunks remain evidence about the live beta, not evidence that a capability exists in this source application. The distinction is required by the prior audit (`site-mirror/audit/strategy-drafts.md:120-143,244-266`).
- The repository describes itself as an architecture handbook and says it stops short of exact backend payloads (`README.md:3-5`). The active app likewise uses an intentionally in-memory authority (`src/features/workspace/workspace-demo-authority.ts:68-72`), so “implemented” below means operational in this demo, not production-persistent.

## Classification

- **Implemented** — reachable from `src/app/page.tsx` and operational in the current demo.
- **Partial** — reachable, but important fields, states, provenance, or outcomes are absent or semantically weak.
- **Missing** — absent from the route-reachable application.
- **Intentional divergence** — differs from the captured beta in order to follow an accepted repository decision; this is not a parity defect by itself.
- **Gated** — implemented but deliberately available only after a named precondition.
- **Bundle-only** — evidenced only in the captured live bundle or latent source scaffold, not in the route-reachable application.

## Capability-by-capability parity

| Capability | Classification | Route-reachable source | Parity assessment |
|---|---|---|---|
| Draft/Paper/Live workbench | **Partial** | `ChampionWorkspace` owns the active context and per-Champion session (`src/features/workspace/champion-workspace.tsx:94-142,144-183`) and can render the three environment states (`src/features/workspace/champion-workspace.tsx:621-679,732-745`). | The workbench is real, but pre-launch Paper readiness has no reachable control, and the Draft sidebar row remains active while Paper is selected because it tests `activeContext !== "live"` (`src/features/workspace/champion-workspace.tsx:647-650`). It also remains one root route with disposable local selection. |
| `Drafting Vn · Checkpoint m` labels | **Intentional divergence** | Labels are normalized by `formatDraftLabel` and `formatCheckpointLabel` (`src/lib/version-labels.ts:1-8`) and shown with tested state (`src/features/workspace/champion-workspace.tsx:642-660`). | Correctly follows D-003 (`docs/decisions.md:108-120`) instead of copying the beta's ambiguous `v2.1`/`v2.0.1` vocabulary. |
| Structured Draft rules | **Implemented** | A rule has `id`, `group`, `name`, `value`, and `constraint` (`src/features/workspace/workspace-fixtures.ts:1-7`); the Summary presents every rule and its constraint (`src/components/domain/strategy/strategy-summary.tsx:31-75`). | This avoids the beta's corrupted inline Markdown diff and makes strategy fields addressable. |
| Complete strategy document | **Partial** | The Document derives Objective, Selection, Portfolio construction, Risk/exits, and Execution from six rules (`src/components/domain/strategy/strategy-document.tsx:19-52`). | It is much thinner than the captured thesis, indicator definitions, entry/exit precedence, sizing examples, data-failure rules, and cooldown logic (`site-mirror/audit/strategy-drafts.md:24-41`). Assumptions and exclusions do not exist in the active `WorkspaceDraftFixture` (`src/features/workspace/workspace-fixtures.ts:9-16`). |
| Draft metadata header | **Partial** | The header shows title, objective, Draft label, and Tested/Untested (`src/features/workspace/draft-strategy-workspace.tsx:67-89`). | Missing exact checkpoint in the main header, schema, projection/sync state, validation state, actor, exact time, changelog, revision, and content identity. Richer conceptual fields exist only in `DraftViewModel` (`src/domain/contracts.ts:65-89`). |
| Saved/autosaved status | **Missing** | The Summary always says `Autosaved` (`src/components/domain/strategy/strategy-summary.tsx:31-36`), while workspace and authority state are React/in-memory state (`src/features/workspace/champion-workspace.tsx:144-165`; `src/features/workspace/workspace-demo-authority.ts:68-92`). | The label is misleading: refresh resets runs, restore results, launch state, and conversation. Remove it until a durable authoritative save state is wired. |
| Select a rule for editing | **Partial** | Edit resolves the rule, stores its selection, and attaches `group · name` to Atlas (`src/features/workspace/draft-strategy-workspace.tsx:58-65`; `src/features/workspace/champion-workspace.tsx:798-817`). The dock renders the selected string above the composer (`src/features/workspace/workspace-champion-dock.tsx:180-203`). | This follows D-035's focus/attachment interaction, but the attachment carries no rule ID, checkpoint reference, or evidence reference; the stored `ruleId` is never consumed by a proposal surface. |
| Current versus proposed strategy | **Missing** | The reachable Draft renders current rules only. | Avoiding the beta's interleaved corrupted diff is good, but omitting proposal review is not parity. The accepted IA requires target, motivation, benefit/downside, unchanged constraints, follow-up test, and lifecycle status (`docs/information-architecture.md:378-390`). |
| Semantic change set | **Missing** | Atlas submission appends a local exchange and returns canned text (`src/features/workspace/champion-workspace.tsx:353-375,1125-1179`). | No typed change-set entity, linked evidence, exact base, status, expected benefit/downside, required test, or independently inspectable result exists, contrary to `docs/domain-model.md:250-263`. |
| Accept/Reject pending changes | **Missing** | No reachable buttons or handler exist. | The live capture visibly exposes Accept/Reject (`site-mirror/audit/strategy-drafts.md:82`) and the accepted architecture expects a reviewable change set. Do not wire the dormant direct editor as a shortcut. |
| Direct rule-change workflow | **Missing, with dormant scaffold** | Unreachable `RuleEditor` code has Current, Proposed, Motivation, base checkpoint, error, and `Validate and apply`; the dormant authority can immediately create the next checkpoint (`src/features/workspace/rule-editor.tsx:53-80,112-175`; `src/features/workspace/workspace-demo-authority.ts:98-155`). | Unreachable source earns no feature parity. Its eager apply semantics also skip the first-class proposal/accept/reject review required by D-035 (`docs/decisions.md:556-566`). Reuse only the validation pieces. |
| Checkpoint list | **Partial** | The tray shows only active checkpoint and one baseline checkpoint (`src/features/workspace/workspace-evidence-panel.tsx:194-244`). | It does not enumerate the full generated history, group generations, expose stable checkpoint IDs, or show semantic summaries. The captured beta showed several historical checkpoints (`site-mirror/audit/strategy-drafts.md:83-85`). |
| Checkpoint metadata | **Partial** | Rows show display label, Active Draft/History, tested state, and a completed time (`src/features/workspace/workspace-evidence-panel.tsx:207-242`). | Missing previous checkpoint, origin/change set, actor, created time, revision, schema, summary, description, and content hash. The domain contract already names most of these (`src/domain/contracts.ts:33-63`). |
| Open checkpoint content | **Missing** | `Open` only sets a string and reveals a small label/action block (`src/features/workspace/workspace-evidence-panel.tsx:207-268`). | No historical strategy snapshot, semantic diff, provenance, or read-only document is rendered. |
| Restore older checkpoint | **Intentional divergence** | UI says `Restore as latest`; confirmation states that it creates the next checkpoint and preserves current history/Paper/Live (`src/features/workspace/workspace-evidence-panel.tsx:245-267,298-339`). The authority copies historical rules into an incremented current checkpoint (`src/features/workspace/workspace-demo-authority.ts:243-279`). | This is the right append-only behavior under D-026 (`docs/decisions.md:430-442`), and is stronger than the unexercised beta capture. It is internally named `forkCheckpoint`, but does not create a second active branch. |
| Exact restore snapshot | **Partial** | Authority seeds both the starting checkpoint and fixture baseline with clones of the starting rules (`src/features/workspace/workspace-demo-authority.ts:90-96`). | The fixture does not contain the baseline checkpoint's actual historical strategy, so the app cannot prove it restores exact old content. In a fresh session, “restore baseline” may simply clone the current fixture rules into a new label. |
| Restore diff/conflict/audit | **Partial** | Stale current base and unknown checkpoint fail closed (`src/features/workspace/workspace-demo-authority.ts:243-263,289-307`); errors appear in Problems (`src/features/workspace/workspace-evidence-panel.tsx:118-142`). | No source/current semantic comparison, schema incompatibility resolution, accepted change-set record, actor/time, or success receipt is shown. Accepted restore requires review and validation, not label-only confirmation (`docs/state-diagrams.md:60-101`). |
| Alternative Draft branches | **Intentional divergence** | There is one `draftState` per Champion session (`src/features/workspace/champion-workspace.tsx:114-136`). | Correct for MVP: accepted D-009 forbids silently creating a second active branch (`docs/decisions.md:192-204`). Do not expose the internal `forkCheckpoint` name as branching. |
| Datasets navigation | **Partial** | Clicking `Datasets` selects Draft and opens the tray's `data` tab (`src/features/workspace/champion-workspace.tsx:683-700`). | Navigation works, but the destination is not a dataset surface. |
| Evaluation setup data | **Implemented** | The Data tab renders Window, Benchmark, Capital, Data cutoff, and Assumptions from the evaluation template (`src/features/workspace/workspace-evidence-panel.tsx:273-294`; `src/features/workspace/workspace-fixtures.ts:234-247`). | These are useful disclosed test inputs and align with D-023, but should be labeled Evaluation setup/assumptions rather than “Datasets.” |
| Dataset capability catalog | **Missing** | No capability entity or catalog exists in `src/`. | The captured product exposes 20 capability cards (`site-mirror/audit/strategy-drafts.md:61-74`). The source also lacks the accepted Data destination's datasets, universes, benchmarks, and advanced assumptions model (`docs/information-architecture.md:219-224`). |
| Dataset binding/configuration/health | **Missing** | No provider, enabled/configured/used distinction, permission, schema, cost/rate, freshness policy, or last success/error fields exist. | This is a source-model gap, not merely a missing view. `DomainObjectKind` has no dataset/capability/source kind (`src/domain/identity.ts:12-33`). |
| Source citations/artifacts | **Missing** | Conversation exchange records only strings for viewed context and mutation target (`src/features/workspace/workspace-champion-dock.tsx:20-26`); there is no source record or citation component. | The live source hovers were shallow, but still showed capability/query/range (`site-mirror/audit/strategy-drafts.md:89-92,208-212`). The source app has less provenance than the capture. |
| Create Dry Run | **Implemented** | `Dry Run` invokes a dedicated action (`src/features/workspace/draft-strategy-workspace.tsx:79-87`; `src/features/workspace/champion-workspace.tsx:466-501`). Authority requires exact current checkpoint and an exact serialized rule snapshot before producing a result (`src/features/workspace/workspace-demo-authority.ts:157-200,289-307`). | This fixes the static capture's failed chat-trigger workflow and correctly models a bounded Evaluation rather than a portfolio run. It still lacks an immutable checkpoint entity ID/hash. |
| Dry Run lifecycle | **Partial** | The action shows `Running…`, disables concurrent authority operations, then opens a completed result or exposes a generic error (`src/features/workspace/draft-strategy-workspace.tsx:54-87`; `src/features/workspace/champion-workspace.tsx:466-535`). | `WorkspaceEvaluationFixture.status` permits only `completed` (`src/features/workspace/workspace-fixtures.ts:64-81`). There are no queued, running record, failed result, partial-data, cancelled, retry, or cancel states. |
| Dry Run list/reopen | **Implemented** | The tray lists every in-session evaluation with run label, source checkpoint, outcome, completion, and Open action (`src/features/workspace/workspace-evidence-panel.tsx:145-191`). | This is functional in the current session and stronger than the stripped preview. It is not persisted or deep-linkable. |
| Dry Run identity/provenance | **Partial** | Authority creates `championId-dry-run-N`, stores champion ID, checkpoint, full rule snapshot, completion string, duration, setup, metrics, baseline, and decisions (`src/features/workspace/workspace-demo-authority.ts:181-199`). | The visible header omits the run ID, champion, completed time, timezone, trigger, schema, source artifact/data snapshot IDs, actor, model/runtime, revision, and content hash (`src/features/workspace/dry-run-workspace.tsx:46-70`). |
| Dry Run Summary | **Partial** | Summary includes outcome, proposed-order rows, near misses, cutoff, takeaway, and metric comparison (`src/features/workspace/dry-run-workspace.tsx:93-227`). | Strong structure, but less diagnostic than the captured per-symbol indicator table (`site-mirror/audit/strategy-drafts.md:43-59`). It omits a declared evaluation type, explicit universe in setup, limitations, provider/freshness detail, warnings, and infrastructure-failure state required by D-023 (`docs/decisions.md:388-400`). |
| Dry Run Activity | **Partial** | Activity is an operational tab with four coarse steps, a rule checklist, and setup values (`src/features/workspace/dry-run-workspace.tsx:231-299`). | It is real UI, unlike the dead preview tab. However, steps have no event IDs/timestamps/statuses, are synthesized from the final fixture, and do not represent a streamed or durable event history. |
| Condition evidence and `Source` | **Partial** | A rule is marked blocked only if any rejected decision references its ID; otherwise it is marked `Passed`. The `Source` cell displays `rule.constraint` (`src/features/workspace/dry-run-workspace.tsx:301-327`). | This is materially misleading. A missing rejection reference does not prove a condition passed, and a strategy constraint is not a market-data source. Activity must carry observed value, result, provider/source artifact, cutoff, and freshness as required by IA (`docs/information-architecture.md:219-224`). |
| Decision versus order semantics | **Partial** | The header counts `eligibleDecisions.length` as `orders` (`src/features/workspace/dry-run-workspace.tsx:35-40,58-64`); Summary renders each eligible decision as a proposed simulated order (`src/features/workspace/dry-run-workspace.tsx:125-149`). | The evaluation model contains decisions but no order entities. Accepted domain semantics allow one decision to produce zero, one, or several orders (`docs/domain-model.md:388-405`), so the header must not equate eligibility with order count. |
| Ask Atlas about a run | **Partial** | The persistent dock automatically uses the current run view as a string context and supplies run-oriented prompts (`src/features/workspace/champion-workspace.tsx:249-262,968-985`; `src/features/workspace/workspace-champion-dock.tsx:236-264`). | There is no explicit typed `evaluationId`, checkpoint reference, rule/source attachment, or link back from an exchange to an authoritative result. |
| Cancel Evaluation | **Bundle-only** | No reachable action exists. | Cancel is evidenced only in the downloaded bundle (`site-mirror/audit/strategy-drafts.md:131-135`); add it only with a durable cancellable lifecycle. |
| Rerun/export/compare Evaluation | **Missing** | No reachable actions exist. | These capabilities are absent from `src/` and were not established as reachable downloaded UI requirements. Product should define them before implementation. |
| Paper launch availability | **Gated** | Review appears only when the current checkpoint has a completed Evaluation and no Paper snapshot exists (`src/features/workspace/champion-workspace.tsx:190-197`; `src/features/workspace/workspace-champion-dock.tsx:158-173`). Authority independently requires a matching evaluated checkpoint (`src/features/workspace/workspace-demo-authority.ts:202-220`). | Appropriate onboarding gate, and it correctly avoids a `Paper eligible` verdict under D-027 (`docs/decisions.md:444-456`). |
| Paper setup review | **Partial** | Dialog shows exact display source, `$100,000 simulated`, Friday schedule, result, no-real-capital copy, pending, cancel, and error (`src/features/workspace/champion-workspace.tsx:1185-1258`). | Capital and schedule are hardcoded rather than read from the current rule/evaluation; no evaluation result, assumptions, destination name, timezone, cadence/time controls, or holiday policy are included. The captured beta's configurable fields are documented at `site-mirror/audit/strategy-drafts.md:95-96,214-218`. |
| Freeze Strategy and start next Draft | **Implemented** | Authority verifies the current snapshot, clones rules into Paper, and creates the next generation checkpoint from the same rules (`src/features/workspace/workspace-demo-authority.ts:202-240`). The UI applies Paper and next Draft together in one state update (`src/features/workspace/champion-workspace.tsx:378-425`). | This follows D-004 and D-025 (`docs/decisions.md:122-134,416-428`) and avoids a partially advanced client success state in the normal path. |
| Paper success receipt/provenance | **Missing** | `PaperLaunchSnapshot` contains only source text and rules (`src/features/workspace/champion-workspace.tsx:102-105`); the authority result adds champion ID and next Draft but no portfolio/strategy/deployment IDs (`src/features/workspace/workspace-demo-authority.ts:24-31`). | No immutable strategy ID, source checkpoint ID, portfolio ID, deployment, actor, time, effective schedule, data/evaluation reference, or durable receipt exists. |
| Multiple Paper portfolios | **Missing** | Session state contains one nullable `paperSnapshot` (`src/features/workspace/champion-workspace.tsx:114-136`), and the availability gate permanently hides launch after it is set (`src/features/workspace/champion-workspace.tsx:183-197`). | Directly conflicts with D-005 and the iteration journey, which require independently retained Paper portfolios (`docs/decisions.md:136-148`; `docs/priority-user-journeys.md:325-339`). |
| Read-only Paper Strategy | **Implemented** | Paper has a Strategy tab that renders a lock, strategy/source labels, and every frozen rule (`src/features/workspace/paper-portfolio-workspace.tsx:273-343,741-765`). | This source implementation fills a genuine gap in the capture, where the named Strategy state was actually Orders (`site-mirror/audit/strategy-drafts.md:97-98,166-170`). It still lacks immutable IDs and semantic-change provenance. |
| Immutable IDs and typed provenance contracts | **Partial** | Opaque typed IDs and references exist (`src/domain/identity.ts:1-50`); checkpoint, immutable strategy, viewed context, activity, and patch contracts are defined (`src/domain/contracts.ts:28-63,143-169,171-213`; `src/domain/patches.ts:10-32`). | The route-reachable feature layer does not consume these contracts. It uses plain strings and fixture types, so the contracts currently document intent rather than secure runtime identity. |
| Stable routes/deep links | **Missing** | The app has one root page (`src/app/page.tsx:1-5`), while run/checkpoint selection lives in React state (`src/features/workspace/champion-workspace.tsx:114-142`). | Refresh loses the selected Champion, checkpoint/run, all new Evaluations, restored state, Paper launch, and attached evidence. This violates IA route identity (`docs/information-architecture.md:173-182`). |
| Backtests | **Bundle-only** | No source route or control exists. | The captured beta says `COMING SOON`; bundle strings are latent and must not be treated as availability (`site-mirror/audit/strategy-drafts.md:99,139,226-230`). Keeping it out is acceptable until deliberately implemented. |
| Skills | **Bundle-only** | No source entity or view exists. | Only compiled live bundle CRUD/schema evidence exists (`site-mirror/audit/strategy-drafts.md:118,143,220-224`). This is not a demonstrated parity requirement until Product places it in scope. |

## Detailed correctness findings

### SP-01 — Reachable strategy editing stops at conversation (P1)

The Draft Summary renders an Edit button for every structured rule (`src/components/domain/strategy/strategy-summary.tsx:49-71`). Selecting it stores the rule ID and focuses Atlas (`src/features/workspace/draft-strategy-workspace.tsx:58-65`), but the selected ID is never read afterward. Conversation submission appends a local string exchange with a canned response (`src/features/workspace/champion-workspace.tsx:353-375,1125-1179`).

The dormant `RuleEditor` should not simply be wired in. It directly submits `Validate and apply`, and the dormant authority immediately creates a checkpoint (`src/features/workspace/rule-editor.tsx:71-80,167-175`; `src/features/workspace/workspace-demo-authority.ts:98-155`). The accepted design instead requires a domain-level semantic proposal with current base, evidence/motivation, benefit/downside, unchanged constraints, follow-up evidence, Accept/Reject, and a visible lifecycle (`docs/information-architecture.md:378-390`; `docs/priority-user-journeys.md:288-303`).

Required correction:

1. Keep Edit's rule attachment/focus behavior.
2. Have Atlas/direct editing create a typed change-set proposal against an immutable current checkpoint reference.
3. Render Current and Proposed in structured domain language, never interleaved raw Markdown.
4. Add Accept, Reject, validating, accepted, rejected, failed, stale, conflicted, cancelled, and superseded outcomes.
5. Apply only the authoritative response; show the resulting checkpoint reference and audit receipt.

### SP-02 — `Autosaved` asserts persistence that does not exist (P1)

`StrategySummary` unconditionally renders `Autosaved` (`src/components/domain/strategy/strategy-summary.tsx:31-36`). The app initializes all domain behavior from `useState(createInitialRuntime)` and in-memory authority instances (`src/features/workspace/champion-workspace.tsx:144-165`); the authority explicitly calls itself an in-memory stand-in (`src/features/workspace/workspace-demo-authority.ts:68-72`).

This is not harmless placeholder metadata. Refresh discards newly created Evaluations, restore outcomes, Paper launch, next-Draft advancement, and conversation. Replace `Autosaved` with truthful demo language or wire a real projection/sync state from `DraftViewModel.projectionState`, `validationState`, and `lastConfirmedAt` (`src/domain/contracts.ts:65-89`).

### SP-03 — Iris's visible Draft and authority disagree (P1)

All authorities are initialized from each fixture's original Draft (`src/features/workspace/champion-workspace.tsx:155-165`). Iris's fixture Draft is `V1.1` and `initialPaper: true` (`src/features/workspace/workspace-fixtures.ts:327-338`). The client session, however, rewrites every initial-Paper Champion's visible Draft checkpoint to `V2.0` (`src/features/workspace/champion-workspace.tsx:1055-1073`).

When the user opens Iris's Draft and runs an Evaluation, the client submits `V2.0` (`src/features/workspace/champion-workspace.tsx:466-481`), while the authority still expects `V1.1`; `assertCheckpoint` rejects it as stale (`src/features/workspace/workspace-demo-authority.ts:289-295`). Restore has the same bad base.

Required correction: initialize the authority from the same post-launch Draft snapshot used by the session, including generation origin and exact cloned rules. Add a test that opens every `initialPaper` fixture's current Draft and successfully evaluates/restores against its authority. Existing authority tests pass because they call Iris with the original fixture checkpoint, not the route-reachable session checkpoint (`src/features/workspace/workspace-demo-authority.test.ts:116-147`).

### SP-04 — Checkpoint history is labels plus synthetic snapshots (P1)

The checkpoint UI shows active plus one baseline row (`src/features/workspace/workspace-evidence-panel.tsx:194-244`). The authority has no supplied historical checkpoint fixture; it seeds the baseline key with a clone of the starting checkpoint's current rules (`src/features/workspace/workspace-demo-authority.ts:90-96`). Thus the app cannot demonstrate that opening or restoring `V1.1` yields the actual historical `V1.1` strategy.

Append-only restore itself is correct: the dialog explicitly creates the next checkpoint and preserves current/deployed states, and the authority increments rather than rewinds (`src/features/workspace/workspace-evidence-panel.tsx:298-339`; `src/features/workspace/workspace-demo-authority.ts:243-279`). The missing part is truthful source content and provenance.

Required correction: store actual `DraftCheckpointViewModel` records for every fixture checkpoint, render the selected snapshot and semantic diff, and persist origin, previous checkpoint, accepted change set/restore source, actor, exact time, revision, schema, and resulting checkpoint.

### SP-05 — `Datasets` is actually Evaluation setup (P1)

The footer action says `Datasets` (`src/features/workspace/champion-workspace.tsx:683-700`), but the opened Data tab merely maps `template.setup` into Input/Value rows (`src/features/workspace/workspace-evidence-panel.tsx:273-294`). Those values are valid Evaluation setup facts, not datasets or capabilities.

Compared with the live evidence, the source omits the 20-capability catalog entirely (`site-mirror/audit/strategy-drafts.md:61-74`). Compared with accepted architecture, it also omits dataset/universe/benchmark entities, enabled/configured/used state, permissions, provider/schema, freshness/health, and strategy/run bindings (`docs/information-architecture.md:219-224`).

Required correction: rename the existing tray content to `Evaluation setup`, then add an advanced Data surface backed by explicit `DataCapabilityBinding` and `SourceArtifact` records. Availability, permission, configuration, actual use, health, freshness, and provenance must be separate fields.

### SP-06 — Dry Run Source and result semantics overclaim evidence (P1)

Activity's condition table labels one column `Source`, but `ConditionRow` renders `rule.constraint` there (`src/features/workspace/dry-run-workspace.tsx:265-279,301-327`). It labels a rule `Passed` unless some rejected decision references the rule ID. That is not an observed condition evaluation and cannot establish provider, value, cutoff, or freshness.

The header also counts eligible decisions as orders (`src/features/workspace/dry-run-workspace.tsx:35-40,58-64`) even though `WorkspaceEvaluationFixture` has decisions but no order records (`src/features/workspace/workspace-fixtures.ts:56-81`). The accepted domain explicitly separates a Decision from zero, one, or several Orders (`docs/domain-model.md:388-405`).

Required correction:

- Add per-candidate `RuleEvaluation` records with condition ID, immutable rule/checkpoint reference, observed value, pass/fail/not-evaluated, explanation, cutoff, freshness, and source artifact IDs.
- Add proposed/submitted order records separately; derive order count from those records only.
- Preserve no-trade and rejected decisions without inferring that every unreferenced rule passed.
- Give Activity durable event IDs, verified phases, timestamps, statuses, warnings/errors, and result references.

### SP-07 — Snapshot binding is safer than the beta UI, but still not immutable identity (P1)

The authority correctly rejects a Dry Run or Paper launch if the submitted checkpoint label or serialized rules differ from its current snapshot (`src/features/workspace/workspace-demo-authority.ts:157-164,202-210,289-307`). This is a meaningful safety improvement over the captured view's ambiguous three-ETF versus 14-instrument state (`site-mirror/audit/strategy-drafts.md:172-182`).

However, checkpoint remains a display string and rule equality is a JSON signature. The local FNV-style `hashString` is used only to synthesize demo metric values (`src/features/workspace/workspace-demo-authority.ts:364-375,427-445`); it is not persisted as a strategy content hash or shown as provenance. A visible run label still cannot prove which immutable checkpoint entity, schema, data snapshot, or runtime created it.

Required correction: carry opaque `draftId`, `checkpointId`, checkpoint ordinal/generation, revision, schema version, and content hash from command through authoritative result and visible header. Paper must additionally return immutable strategy, portfolio, and deployment references.

### SP-08 — Paper launch is atomically modeled but permanently single-use (P1)

The good path is sound for Mara: the authority verifies exact rules and a matching Evaluation, clones the launched rules into separate Paper and next-Draft arrays, advances to `V2.0`, and the UI commits both projections in one update (`src/features/workspace/workspace-demo-authority.ts:202-240`; `src/features/workspace/champion-workspace.tsx:378-425`). The read-only Paper Strategy panel then renders the frozen rule set (`src/features/workspace/paper-portfolio-workspace.tsx:741-765`).

But `ChampionSessionState` has only one nullable `paperSnapshot`, and `paperLaunchReviewAvailable` requires that it still be null (`src/features/workspace/champion-workspace.tsx:114-136,183-197`). Once V1 launches, the user can never launch V2 as another Paper portfolio. That breaks the accepted longitudinal loop and comparison model (`docs/decisions.md:136-148`; `docs/priority-user-journeys.md:325-339`).

Required correction: represent Paper as an indexed collection of persistent portfolio entities with stable IDs, names, immutable strategy/deployment references, independent schedules, runs, state, and archive lifecycle. Launch adds a portfolio; it does not replace a nullable singleton.

### SP-09 — Paper review omits authoritative setup and receipt fields (P2)

The reachable dialog is safe in tone and has pending/error controls, but it hardcodes capital and schedule (`src/features/workspace/champion-workspace.tsx:1213-1235`). It neither derives them from `draftState`/Evaluation nor displays the Evaluation result that unlocked review. Its result contains no destination portfolio/strategy/deployment identity (`src/features/workspace/workspace-demo-authority.ts:24-31`).

The accepted onboarding contract requires exact checkpoint, key assumptions, Evaluation result, schedule, simulated capital, and explicit no-real-capital language (`docs/priority-user-journeys.md:134-154`). The live beta additionally exposed description, cadence/time, and holiday behavior (`site-mirror/audit/strategy-drafts.md:95-96`).

Required correction: drive the dialog from one typed launch command, echo those exact parameters through review/pending/success/failure, and render a durable success receipt linking the created Strategy, Paper portfolio, deployment, next Draft, schedule/timezone, and source Evaluation.

### SP-10 — Typed domain contracts are not the runtime model (P2)

The repository already defines opaque entity IDs, checkpoint references, immutable strategy references, provenance-rich checkpoint view models, explicit Draft projection/validation states, viewed-context versus mutation-target references, and authoritative patch envelopes (`src/domain/identity.ts:1-50`; `src/domain/contracts.ts:28-89,143-169`; `src/domain/patches.ts:10-32`).

The active feature layer bypasses them with fixture strings:

- `DraftRuntimeState` is checkpoint string + rules + optional patch (`src/features/workspace/champion-workspace.tsx:96-100`).
- `PaperLaunchSnapshot` is source string + rules (`src/features/workspace/champion-workspace.tsx:102-105`).
- `ConversationExchange` carries viewed context and mutation target as strings (`src/features/workspace/workspace-champion-dock.tsx:20-26`).
- All nested selection is local state under one root route (`src/features/workspace/champion-workspace.tsx:114-142`; `src/app/page.tsx:1-5`).

This makes the architecture appear more complete than the UI contract actually is. Wire route-reachable read models and commands to the typed references before adding more visual metadata.

## Action and state-machine coverage

| Workflow | Current reachable transitions | Missing accepted transitions/outcomes | Assessment |
|---|---|---|---|
| Draft semantic change | Select rule → attach string to Atlas → receive canned response | proposed, submit, validating, accepted/checkpointed, rejected, failed, stale, conflict/resolution, cancelled, superseded | **Missing** |
| Dormant direct editor | Unreachable source scaffold: edit fields → validating-rule → server-confirmed/error | first-class proposal, Accept/Reject, linked evidence, benefit/downside, unchanged constraints, conflict UI | **Missing workflow; scaffold only** |
| Dry Run Evaluation | idle → `Running…` → completed detail or generic workspace error | durable queued/running entity, failed/inconclusive result, partial data, cancel, retry, event progress | **Partial** |
| Checkpoint restore | select/open → confirmation → append-only checkpoint or error | actual snapshot/diff, schema conflict choices, validating state visible after dialog closes, success receipt, audit trail | **Partial; append-only semantics implemented** |
| Paper launch | hidden → gated review → `Launching Paper…` → Paper + next Draft or dialog error | authoritative setup derivation, provisioning stages, retry identity, durable success receipt, multiple destinations/portfolios | **Gated/partial** |
| Conversation | local submit → immediate canned exchange | persisted message, typed source refs, interpreted intent, activity lifecycle, proposal/result refs, reconnect/failure | **Partial** |

Accepted reference state machines are in `docs/state-diagrams.md:60-126,183-279`. The current source intentionally compresses them for a demo, but the UI must not label compressed fixture inference as authoritative evidence.

## Intentional divergences to preserve

These source differences from the captured beta are directionally correct and should not be “fixed” back to screenshot parity:

1. **Use `Drafting Vn · Checkpoint m`, not ambiguous minor-version UI.** This follows D-003 (`docs/decisions.md:108-120`).
2. **Treat a user-requested Dry Run as an Evaluation, not a portfolio run.** D-006 explicitly separates bounded tests from scheduled portfolio executions (`docs/decisions.md:150-160`).
3. **Restore by creating the next checkpoint.** Never move the pointer backward or erase intervening history (`docs/decisions.md:430-442`).
4. **Keep one active Draft rather than exposing branches.** Old evidence proposes forward against the current Draft (`docs/decisions.md:192-204`).
5. **Do not show `Paper eligible`.** A completed transparent Dry Run may gate the onboarding flow, but Paper receives ordinary command validation and explicit confirmation (`docs/decisions.md:444-456`).
6. **Keep domain artifacts primary and Atlas docked.** The source's workbench is closer to D-032/D-035 than the transcript-heavy captured screen (`docs/decisions.md:514-526,556-566`).
7. **Retain the read-only Paper Strategy panel.** It supplies a source surface that was genuinely absent from the capture.

## Bundle-only or deliberately latent scope

| Capability | Evidence | Source treatment |
|---|---|---|
| Accept/reject/reset Draft | Captured live UI/bundle (`site-mirror/audit/strategy-drafts.md:128-130`) | Accept/Reject belongs in the future semantic change-set surface; reset remains a separate destructive-scope decision. |
| Cancel a running Evaluation | Live bundle (`site-mirror/audit/strategy-drafts.md:131-135`) | Add only with durable queued/running Evaluation states and cancellation actor/time. |
| Configurable Paper description/capital/cadence/time/holiday | Captured live modal/bundle (`site-mirror/audit/strategy-drafts.md:95-96,137`) | The source's fixed review is partial; select the accepted setup contract before cloning every beta field. |
| Backtests | Captured `COMING SOON` plus latent strings (`site-mirror/audit/strategy-drafts.md:99,139`) | Keep gated/out of navigation until it has transparent assumptions, provenance, and terminal states. |
| Skills | Bundle CRUD/schema only (`site-mirror/audit/strategy-drafts.md:220-224,256-266`) | Do not claim parity or add UI until Product places Skills in Strategy/Data scope. |
| Live deployment | Disabled in capture and not implemented in source (`site-mirror/audit/strategy-drafts.md:100,140`) | Remains out of this strategy-source parity claim. |

## Prioritized remediation

### P1 — Product truth and core loop

1. **Unify visible and authoritative Draft identity.** Fix Iris, then make every Champion session and authority derive from the same typed snapshot. Add cross-fixture invariant tests.
2. **Build semantic change review.** Preserve rule attachment, but replace canned change handling with typed proposal → Accept/Reject → authoritative checkpoint/result.
3. **Stop claiming persistence.** Remove `Autosaved` until query-backed authoritative save/sync/recovery states exist.
4. **Correct Evaluation evidence semantics.** Separate decisions, rule evaluations, proposed/submitted orders, and activity events. Replace the fake `Source` column with durable source artifacts.
5. **Wire immutable IDs through actions and views.** Dry Run, restore, Paper launch, Atlas context, and result headers must carry checkpoint/strategy/run/portfolio/deployment references, schema/revision, and content identity.
6. **Replace synthetic checkpoint history.** Store and render exact snapshots, semantic changes, actor/time, origin, previous checkpoint, and restore audit.
7. **Support multiple Paper portfolios.** Paper launch appends a named persistent portfolio and preserves every prior portfolio for observation and comparison.

### P2 — Completeness and parity depth

8. **Restore full strategy policy depth.** Extend the structured schema to cover thesis/objective, universe, indicators, entry/exit precedence, sizing, risk controls, schedule, assumptions, exclusions, data-failure behavior, and examples without falling back to one opaque Markdown blob.
9. **Split Evaluation setup from Data.** Keep Window/Benchmark/Capital/Cutoff/Assumptions in the evidence ledger; build a separate advanced Data surface for capabilities, bindings, health, freshness, and usage.
10. **Complete state machines.** Add durable loading/queued/running/success/failed/inconclusive/cancelled/conflicted states, receipts, safe retry identities, and audit history.
11. **Add stable routes.** Champion, checkpoint, Evaluation, Paper portfolio, run, and source selections must survive refresh and be deep-linkable.
12. **Make Paper setup authoritative.** Review and receipt must use the same typed configuration, show the Evaluation that unlocked launch, and include timezone/destination provenance.

## Acceptance criteria for source parity

- A visible Edit action can produce a reviewable semantic proposal and an authoritative accepted/rejected result; it never ends only in chat prose.
- Current and Proposed are structured, separately labeled, and bound to an exact base checkpoint.
- Every Draft, checkpoint, Evaluation, Paper strategy, portfolio, and deployment has a stable opaque ID and route; display labels are never used as identity.
- Refresh preserves or reloads authoritative strategy, run, restore, and Paper state; no false `Autosaved` claim remains.
- Historical checkpoints render their actual snapshots and metadata; restore shows a semantic comparison and creates a new audited checkpoint.
- Evaluation Summary and Activity distinguish decisions, condition evaluations, orders, failures, and source data truthfully.
- Each condition result links to a durable source artifact with provider, request parameters, retrieval/as-of time, freshness, and immutable response identity.
- `Datasets` distinguishes capability availability, permission, configuration, use, health, and provenance; Evaluation setup is not mislabeled as a dataset catalog.
- Paper launch echoes an exact reviewed command into a success/failure receipt and can create a second independent Paper portfolio from a later Draft.
- Every `initialPaper` Champion can open and evaluate its current next-generation Draft without a stale-authority error.
- Bundle-only features remain explicitly latent until the source owns a designed, testable workflow.

## Verification performed

Source inspection covered the route entry, active workspace, Draft/strategy components, evidence tray, demo authority, fixtures, Dry Run, Paper launch/read-only strategy, domain identity/contracts/patches, and the accepted documents listed in scope.

Targeted tests passed:

```text
npm test -- src/features/workspace/workspace-demo-authority.test.ts src/features/workspace/paper-portfolio-workspace.test.ts
2 files passed · 10 tests passed
```

Those tests validate the isolated authority and Paper evidence helpers. They do not cover route reachability, the missing semantic edit loop, the `Autosaved` claim, source/citation semantics, or the Iris client/authority checkpoint mismatch identified above.
