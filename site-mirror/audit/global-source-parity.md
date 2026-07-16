# Global/account source parity audit

Audited 2026-07-15 against the replacement application in `src/`, the captured
global/account contract in `site-mirror/audit/global-account.md`, the old deployed
bundle capability map, and the accepted architecture decisions. This report is
about the **actual replacement source**, not the scriptless `local-preview/`.

## Executive result

The replacement source is a credible, interactive **Champion-workspace vertical
slice**, but it is not yet a replacement for the complete global Vantheon site.
It has only one App Router page, keeps all navigation state in component memory,
and implements no Champions index, create/search/retire flow, The First, settings
forms, legal routes, feedback/help, or branded not-found route.

The strongest global implementation is Champion scoping inside the running
workspace:

- Two sanitized Champions can be selected from a shell-level selector
  (`src/features/workspace/champion-workspace.tsx:600-618`).
- Most Draft/Paper/Live selection and conversation state is stored per Champion
  (`src/features/workspace/champion-workspace.tsx:114-142`) and selecting another
  Champion restores that session (`src/features/workspace/champion-workspace.tsx:292-315`).
- The redesigned workbench, persistent Atlas dock, and fixture-backed
  work surfaces are real React interactions rather than captured mockups
  (`src/features/workspace/champion-workspace.tsx:621-708`,
  `src/features/workspace/champion-workspace.tsx:749-1003`).

The most important source problems are:

1. **There is no route/state model.** `/` is the only product page and directly
   renders `ChampionWorkspace` (`src/app/page.tsx:1-5`). Champion, environment,
   version, subview, run, dialog, and settings state cannot be deep-linked,
   refreshed, shared, or restored with Back/Forward.
2. **The pre-launched Iris fixture is operationally inconsistent.** Its UI session
   is advanced to Draft V2.0, while its in-memory authority is initialized at the
   fixture's Draft V1.1. Draft mutations/evaluations issued from that UI will be
   rejected as stale.
3. **The captured global product is largely absent.** The full Champions list,
   Create, search, Champion retirement, recent list UI, The First, settings,
   theme control, feedback/help, legal, and custom 404 are not implemented.
4. **Cross-Champion panel state leaks remain.** The bottom panel's tab/expanded
   state and its open/restore checkpoint selections are not Champion-scoped.
5. **Environment navigation is incomplete.** Pre-launch Paper readiness has no
   reachable control, and Draft stays highlighted while Paper is selected.
6. **The header contains an ambient market-status widget that conflicts with the
   accepted research-instrument direction.** This should not be treated as legacy
   parity to preserve.

## Status vocabulary

| Status | Meaning in this report |
| --- | --- |
| **Implemented** | Usable in the current `src/` application, including a coherent interaction path. |
| **Partial** | Some UI/state exists, but important contract, state, or behavior is absent. |
| **Missing** | Required by the captured contract or accepted architecture and absent from `src/`. |
| **Intentional divergence** | Deliberately omitted or redesigned because the current request/accepted product direction supersedes the capture. |
| **Gated** | Must not be exposed until a product, safety, or evidence decision is resolved. |
| **Bundle-only** | Evidenced in the old deployed JavaScript, but absent from the replacement `src/`; it is not automatically a redesign requirement. |

When capture parity and an accepted decision disagree, the accepted decision
wins. The repository explicitly gives accepted decisions precedence over general
summaries and planning history (`README.md:77-87`).

## Source shape and routing boundary

The complete `src/app/` route inventory is:

```text
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/providers.tsx
```

The root page directly renders the workspace (`src/app/page.tsx:1-5`), and the
root layout supplies only fonts, metadata, global CSS, and generic providers
(`src/app/layout.tsx:17-35`). `Providers` contains TanStack Query and tooltip
providers only (`src/app/providers.tsx:1-16`). There are no nested route segments,
route layouts, `not-found.tsx`, route handlers, middleware, or source references
to `next/link`, `next/navigation`, `useRouter`, `usePathname`, or
`useSearchParams`.

This is narrower than both:

- the captured surface inventory (`site-mirror/audit/global-account.md:38-59`),
  and
- the accepted route contract requiring stable Champion and nested object IDs,
  persistent Champion layout, addressable Paper portfolios, and restorable deep
  links (`docs/information-architecture.md:173-182`).

## Complete surface matrix

### App entry, shell, and Champion management

| Surface or action | Source status | Classification | Exact source evidence and parity assessment |
| --- | --- | --- | --- |
| Root application entry | `/` immediately renders the workspace. | **Implemented; intentional divergence** | `src/app/page.tsx:1-5`. This correctly skips sign-in for the requested auth-free demo. It does not redirect to a canonical Champion URL. |
| App route hierarchy | Only `/` exists. | **Missing — P1 foundation for this demo** | `src/app/page.tsx:1-5` is the only page component. All meaningful selection is local state (`src/features/workspace/champion-workspace.tsx:144-150`). This fails the accepted stable-ID/deep-link contract in `docs/information-architecture.md:173-180`. |
| Vantheon shell identity | Text brand, sidebar, trigger, workspace header, and skip link are present. | **Partial** | Brand and navigation shell: `src/features/workspace/champion-workspace.tsx:583-619`; sidebar trigger and header: `src/features/workspace/champion-workspace.tsx:711-747`. The captured Create, Champions, The First, Leaderboard, Theme, Feedback, Help Me, and account row are absent. |
| Selected Champion identity | Two fixture Champions can be selected by name. | **Implemented for the demo; partial metadata** | Selector: `src/features/workspace/champion-workspace.tsx:604-618`; fixtures: `src/features/workspace/workspace-fixtures.ts:176-183`, `src/features/workspace/workspace-fixtures.ts:327-334`, `src/features/workspace/workspace-fixtures.ts:557-560`. It shows no availability, activity, lifecycle, updated time, or user/account relationship. |
| Full Champions index | No index/table/list route exists. | **Missing observed downloaded surface** | The downloaded site visibly includes the Champions index (`site-mirror/audit/global-account.md:38-42`). The only replacement collection UI is the two-option selector at `src/features/workspace/champion-workspace.tsx:604-618`. Its fixture type has only `id`, `name`, `initials`, and `workspace` (`src/features/workspace/workspace-fixtures.ts:88-96`), while the domain contract also expects availability and activity (`src/domain/contracts.ts:11-26`). The old endpoint shape is additionally bundle-evidenced (`site-mirror/audit/bundle-capability-map.md:43-52`). |
| Recent Champions list | Recency is tracked but never rendered. | **Partial — state-only** | `recentChampionIds` exists (`src/features/workspace/champion-workspace.tsx:138-142`), updates on switch (`src/features/workspace/champion-workspace.tsx:292-307`), and initializes with one Champion (`src/features/workspace/champion-workspace.tsx:1040-1051`). There is no fifth reference that reads it, so the captured five-item recent list has no UI. |
| Create Champion | No button, form, command, or empty-new-Champion route. | **Missing observed downloaded action** | The source has no Champion-create state or mutation. Create is visibly captured and its API shape is bundle-evidenced (`site-mirror/audit/global-account.md:120-124`; `site-mirror/audit/bundle-capability-map.md:47`). Do not recreate the captured immediate side effect: simply activating it produced a durable `Champion #12`. |
| Search Champions | No search input, query state, filtering, zero-result state, or URL query. | **Missing** | The selector maps all fixtures without filtering (`src/features/workspace/champion-workspace.tsx:611-616`). Search requirements from the capture are documented at `site-mirror/audit/global-account.md:69-72`. |
| Edit Champion name | No editable name or validation. | **Missing; update is bundle-only** | Champion names are readonly fixture strings (`src/features/workspace/workspace-fixtures.ts:90-95`) rendered inside the selector (`src/features/workspace/champion-workspace.tsx:608-615`). Old read/update capability appears only in `site-mirror/audit/bundle-capability-map.md:47`. |
| Retire/archive Champion | No Champion lifecycle action or model. | **Missing observed action, but gated from implementation** | The only replacement `Archive` control is a disabled **Archived Paper** entry (`src/features/workspace/champion-workspace.tsx:666-680`). The downloaded Champion action is observed and its API is bundle-evidenced, but it liquidated positions and was irreversible despite being named Archive (`site-mirror/audit/global-account.md:126-130`; `site-mirror/audit/bundle-capability-map.md:47`). Define Champion retirement, portfolio effects, recovery, and audit semantics before exposing it. |
| Draft/Paper/Live navigation | Draft and Live are reachable; Paper becomes reachable only after a Paper snapshot exists. | **Partial / mishandled selection** | Environment controls: `src/features/workspace/champion-workspace.tsx:621-680`, `src/features/workspace/champion-workspace.tsx:729-745`; the empty Paper/Live component exists at `src/features/workspace/champion-workspace.tsx:860-884`, but no pre-launch control can select Paper. The Draft sidebar row also uses `activeContext !== "live"` (`src/features/workspace/champion-workspace.tsx:647-650`), so it stays highlighted while Paper is active. Make all three environments truthfully reachable and independently selected. |
| Archived Paper | A label appears only after Paper exists, and it is disabled. | **Partial / gated UI stub** | `src/features/workspace/champion-workspace.tsx:666-680`. Accepted behavior requires a searchable archived collection and explicit stop/archive/unarchive lifecycle (`docs/information-architecture.md:262-284`); none of those behaviors exist here. |
| Sidebar collapse | Real interaction with keyboard shortcut and cookie persistence. | **Implemented** | Trigger wiring: `src/components/ui/sidebar.tsx:254-277`; controlled state, cookie, and shortcut: `src/components/ui/sidebar.tsx:56-110`. This is stronger than the static preview. |
| Account identity in shell | No callsign, Founder number, user avatar, or faction appears. | **Missing** | The sidebar footer has only Datasets and a generic Profile button (`src/features/workspace/champion-workspace.tsx:683-708`). The only user domain reference is a type-level actor option (`src/domain/identity.ts:48-50`); there is no user/account fixture. |
| Current Champion activity/status | Not surfaced in the shell. | **Missing** | The domain contract can represent current activity and availability (`src/domain/contracts.ts:17-26`, `src/domain/contracts.ts:171-213`), but the fixture shape cannot (`src/features/workspace/workspace-fixtures.ts:88-96`) and the selector renders only the name (`src/features/workspace/champion-workspace.tsx:604-618`). This misses accepted shell responsibilities at `docs/information-architecture.md:43-53`. |

### Legacy global destinations

| Surface | Source status | Classification | Exact source evidence and parity assessment |
| --- | --- | --- | --- |
| The First | No route, content, release card, external SPY link, or feedback form. | **Missing relative to capture; outside current core IA** | The source route inventory contains only `src/app/page.tsx`. The captured contract is at `site-mirror/audit/global-account.md:50`. Nothing in the accepted Champion-workspace hierarchy requires this founder-content route, so product must explicitly decide whether it remains part of the replacement site. |
| Leaderboard | No route or fixture. | **Missing relative to the global capture / product decision** | The downloaded site has an observed locked Leaderboard (`site-mirror/audit/global-account.md:51`). Accepted D-036 forbids rankings in the Champion research workspace (`docs/decisions.md:570-582`) but does not by itself settle whether a separate global product surface survives. Do not port it into the workspace; decide the separate route explicitly. |
| Global feedback | No trigger, dialog, validation, submit, success, or retry state. | **Missing relative to capture** | The only source forms are workspace conversation/rule actions, not product feedback. Captured contract: `site-mirror/audit/global-account.md:47-48`, `site-mirror/audit/global-account.md:150-154`. |
| Help Me / support | No support link or first-party fallback. | **Missing relative to capture** | Sidebar footer ends after Profile (`src/features/workspace/champion-workspace.tsx:683-708`). The captured external Slack behavior and fallback requirement are documented at `site-mirror/audit/global-account.md:49`, `site-mirror/audit/global-account.md:200-203`. |
| Legal discovery and pages | No Privacy or Terms route/link. | **Missing — P2** | No legal segment exists under `src/app/`; the running shell has no legal links (`src/features/workspace/champion-workspace.tsx:683-708`). Auth removal makes persistent legal discovery more important, as noted in `site-mirror/audit/global-account.md:138-142`. |
| Branded 404 | No `not-found.tsx` or custom missing-resource state at the app-router level. | **Missing — P2** | `src/app/` contains only `layout.tsx`, `page.tsx`, `providers.tsx`, and CSS. The domain workspace throws for an unknown fixture rather than rendering a safe state (`src/features/workspace/champion-workspace.tsx:1099-1105`). Accepted IA requires missing/unauthorized resources to fail closed inside the shell (`docs/information-architecture.md:175-180`). |

### Settings and account

| Surface or field | Source status | Classification | Exact source evidence and parity assessment |
| --- | --- | --- | --- |
| Settings destination | No settings route. Profile opens a local dialog. | **Partial** | Trigger: `src/features/workspace/champion-workspace.tsx:701-705`; dialog: `src/features/workspace/champion-workspace.tsx:1020-1035`. The dialog description promises account, security, brokerage, and notifications, but its only content is a generic “Personal workspace” card. This is misleading affordance copy. |
| Profile data model | No user/profile fixture, username availability, revision, pending state, or errors. | **Missing; old contract is bundle-only** | The workspace fixture contains Champion data only (`src/features/workspace/workspace-fixtures.ts:88-167`). Old profile read/update and username-availability endpoints are only bundle-evidenced (`site-mirror/audit/bundle-capability-map.md:117-125`). |
| Wallpaper and avatar | No upload, preview, crop, replace/remove, or validation state. | **Missing** | The profile dialog has no form controls (`src/features/workspace/champion-workspace.tsx:1020-1035`). Captured fields and required states: `site-mirror/audit/global-account.md:82-87`. |
| Callsign and Founder Flair | No fields, length constraints, save/cancel, validation, or canonical fixture. | **Missing** | The only account-like text is static placeholder copy (`src/features/workspace/champion-workspace.tsx:1023-1032`). Captured max lengths and contract: `site-mirror/audit/global-account.md:84-87`. |
| Faction | No model, accessible text metadata, selection, card detail, or save state. | **Missing** | No faction value exists in `src/`; account fixture is absent. Captured choices and accessibility requirement: `site-mirror/audit/global-account.md:88`. |
| Atlas personality | No Adaptive/WallStreetBets/Professional/Casual preference model or UI. | **Missing** | `WorkspaceChampionDock` hardcodes the assistant name and contextual response behavior (`src/features/workspace/workspace-champion-dock.tsx:53-70`, `src/features/workspace/workspace-champion-dock.tsx:236-265`) rather than reading a profile preference. |
| Response style | No Conversational/Verbose preference or deterministic account sample. | **Missing** | Responses are selected only by viewed-context strings (`src/features/workspace/champion-workspace.tsx:1125-1162`) and are not user-configurable. |
| Notifications | No permission model, enable/disable control, denied/blocked/retry state, or notifications center. | **Missing** | The profile dialog merely names “notification preferences” (`src/features/workspace/champion-workspace.tsx:1023-1026`). Accepted shell responsibilities include notifications that may collapse (`docs/information-architecture.md:43-53`). |
| Password, sign-out, passkeys | No security UI exists. | **Intentional divergence for this auth-free redesign** | This is correct for the requested local flow and matches the explicit audit exclusion (`site-mirror/audit/global-account.md:3-5`, `site-mirror/audit/global-account.md:92-94`). Do not restore passkeys. Password/sign-out should also remain absent from the auth-free demo unless a production session boundary is introduced. Old auth endpoints are bundle-only (`site-mirror/audit/bundle-capability-map.md:121-124`). |
| Production authorization/session handling | No identity provider, authorization gate, expiry state, logout cleanup, or protected cache/stream boundary. | **Missing for production; intentionally absent only in local demo** | `Providers` includes Query and Tooltip providers only (`src/app/providers.tsx:1-16`); root renders protected-looking fixtures without a guard (`src/app/page.tsx:1-5`). Accepted D-019 still requires session expiry, reconnect re-authentication, revocation, cache/stream cleanup, and unauthorized UI (`docs/decisions.md:332-344`). Auth-free UI is not a substitute for that contract. |

### Themes, URLs, and shared state

| Surface or concern | Source status | Classification | Exact source evidence and parity assessment |
| --- | --- | --- | --- |
| Light/dark styling foundation | Light and `.dark` tokens exist. | **Partial** | Light tokens: `src/app/globals.css:59-94`; dark tokens: `src/app/globals.css:96-128`. This is a styling foundation only. |
| Dawn/Dusk/Auto theme control | No UI, theme provider, system-mode listener, persistence, or no-flash initialization. | **Missing** | Root HTML receives only font/height classes (`src/app/layout.tsx:28-33`), and `Providers` has no theme layer (`src/app/providers.tsx:9-16`). The captured theme contract is at `site-mirror/audit/global-account.md:47`, `site-mirror/audit/global-account.md:76`. |
| Canonical URL/deep links | No source routing API is used; all meaningful views are local state. | **Missing — P1 foundation for this demo** | Root state initialization: `src/features/workspace/champion-workspace.tsx:144-150`; Champion switching: `src/features/workspace/champion-workspace.tsx:292-315`; environment tabs: `src/features/workspace/champion-workspace.tsx:621-745`; run and panel selection: `src/features/workspace/champion-workspace.tsx:760-965`. The only `href` in the component is the skip link (`src/features/workspace/champion-workspace.tsx:588-593`). |
| Refresh and Back/Forward | Reload resets to the first fixture and initial session; browser history cannot restore nested state. | **Missing** | `createInitialRuntime` always chooses `workspaceFixtures[0]` and creates fresh sessions (`src/features/workspace/champion-workspace.tsx:1040-1052`). No selection is initialized from URL or persisted storage. |
| Unknown/deleted Champion | Throws an exception. | **Mishandled / missing safe state** | `getWorkspaceFixture` throws `Unknown Champion workspace` (`src/features/workspace/champion-workspace.tsx:1099-1105`). Accepted IA requires an explicit unavailable state in the selected shell (`docs/information-architecture.md:175-180`, `docs/information-architecture.md:417-438`). |
| Champion-scoped session restoration | Most nested selection, conversation, Draft, and Paper state is keyed by Champion. | **Partial, with panel leaks** | Per-Champion session shape: `src/features/workspace/champion-workspace.tsx:114-142`; initial session map: `src/features/workspace/champion-workspace.tsx:1040-1096`; switch behavior: `src/features/workspace/champion-workspace.tsx:292-315`. This substantially follows D-038, but the panel state below crosses identities (`docs/decisions.md:598-608`). |
| Evidence/data bottom panel isolation | Panel tab/expanded state and selected checkpoint/restore-candidate state are shared across Champion switches. | **Mishandled — P1** | `bottomPanel` is component-global state next to `profileOpen`, outside `ChampionSessionState` (`src/features/workspace/champion-workspace.tsx:114-150`). `WorkspaceEvidencePanel` also stores `openedCheckpoint` and `forkCandidate` locally (`src/features/workspace/workspace-evidence-panel.tsx:74-76`); because the same component instance remains mounted when Champion props change, those selections persist. A restore candidate chosen under one Champion can therefore remain actionable after switching to another, violating D-038 (`docs/decisions.md:604-608`). |
| Recent list limit | Recency is capped to fixture count, not the captured five-item contract. | **Partial / fixture artifact** | `.slice(0, workspaceFixtures.length)` (`src/features/workspace/champion-workspace.tsx:303-307`) currently caps recents at two. Even when rendered later, it would not implement the captured up-to-five contract. |
| Global market session widget | A colored Market open/closed badge is always rendered in the workspace header. | **Mishandled / intentional divergence required** | Global placement: `src/features/workspace/champion-workspace.tsx:711-747`; hard-coded status/time: `src/features/workspace/workspace-fixtures.ts:169-174`; visual implementation: `src/components/domain/market/market-session-status.tsx:11-39`. Accepted D-036 rejects ambient market widgets and says market data belongs only where it explains strategy behavior (`docs/decisions.md:570-582`). Remove it from the global header or bind it to a specific evidence/control need. |

## Fixture and authority coherence

### What is coherent

- `workspaceFixtures` is one small, sanitized inventory with two stable IDs
  (`src/features/workspace/workspace-fixtures.ts:557-560`), avoiding the captured
  account's contradictory 11/12-Champion snapshots.
- Each Champion has distinct Draft rules, evaluation assumptions, Paper facts,
  and Champion-scoped result IDs (`src/features/workspace/workspace-fixtures.ts:176-325`,
  `src/features/workspace/workspace-fixtures.ts:327-555`).
- Runtime sessions are keyed by Champion ID, and the conversation plus most
  Draft/Paper selections stay within that session (`src/features/workspace/champion-workspace.tsx:114-142`,
  `src/features/workspace/champion-workspace.tsx:1040-1096`).
- Demo authority responses carry `championId`; the caller rejects a response for
  the wrong Champion (`src/features/workspace/champion-workspace.tsx:389-423`,
  `src/features/workspace/champion-workspace.tsx:1117-1123`).
- The authority clones Paper rules separately from the next Draft and requires an
  exact evaluated checkpoint before launch (`src/features/workspace/workspace-demo-authority.ts:202-240`).

### P1 — Iris UI and authority disagree about the active Draft

Iris declares `initialPaper: true` with source Draft V1.1
(`src/features/workspace/workspace-fixtures.ts:327-337`) and Paper source
`Draft V1 · checkpoint V1.1` (`src/features/workspace/workspace-fixtures.ts:455-470`).
The UI correctly projects that Paper launch has already created Draft V2.0:

- `createChampionSession` changes `draftState.checkpoint` to `V2.0` whenever
  `initialPaper` is true (`src/features/workspace/champion-workspace.tsx:1055-1073`).

But the authority for every fixture is initialized directly from
`fixture.draft`, which remains Iris V1.1:

- authority setup: `src/features/workspace/champion-workspace.tsx:155-164`;
- authority's authoritative checkpoint is cloned from that input:
  `src/features/workspace/workspace-demo-authority.ts:73-96`;
- commands reject any other base checkpoint:
  `src/features/workspace/workspace-demo-authority.ts:98-104`,
  `src/features/workspace/workspace-demo-authority.ts:157-164`.

Therefore a rule change or Dry Run submitted from Iris's visible Draft V2.0 will
send V2.0 to an authority that expects V1.1 and fail with `stale-checkpoint`.
The existing Iris authority test does not catch this because it explicitly sends
`iris.draft.checkpoint` (V1.1), bypassing `createChampionSession`
(`src/features/workspace/workspace-demo-authority.test.ts:116-147`).

Required correction: fixture initialization must provide one canonical lifecycle
snapshot—current Draft checkpoint/rules, Paper immutable source, prior evaluation
history, and authority state—from the same revision. Add a `ChampionWorkspace`
integration test that selects Iris and successfully evaluates or edits the
visible V2.0 Draft.

### P2 — global and account fixture gaps

The source has no canonical `User`, `Profile`, `Faction`, `ThemePreference`,
`NotificationPreference`, Champion lifecycle, or legal-content fixture. The old
mirror's temporal contradictions have been avoided by omission rather than
replaced with a coherent account snapshot. `WorkspaceFixture` contains only
Champion/Draft/evaluation/Paper data (`src/features/workspace/workspace-fixtures.ts:88-167`).

The domain layer is also richer than the demo fixture layer: it brands entity IDs,
models Champion availability and activity, and defines unauthorized/recovering
states (`src/domain/identity.ts:12-42`, `src/domain/contracts.ts:11-26`,
`src/domain/contracts.ts:65-109`). The global UI fixtures use plain strings and do
not exercise those contracts. That is acceptable for a narrow visual demo, but
not for route, authorization, failure-state, or account parity.

## Prioritized findings

### P1 — establish URL and route identity before adding more pages

Current view identity is a nested object graph inside one client component. Adding
Champions, settings, legal, and history as more booleans/tabs would deepen the
problem. Implement a persistent App Router hierarchy first, for example:

```text
/
/champions
/champions/[championId]/draft/[checkpointOrView]
/champions/[championId]/paper/[portfolioId]/[view]
/champions/[championId]/live/[view]
/settings
/legal/privacy
/legal/terms
not-found.tsx
```

Exact syntax is open, but stable Champion/portfolio/run identity and refreshable
selection are accepted requirements (`docs/information-architecture.md:173-182`).
Do not encode canonical state solely as arbitrary tabs or display labels.

### P1 — fix the Iris lifecycle snapshot before relying on multi-Champion behavior

The shell looks correctly Champion-scoped, but one of two Champions cannot safely
mutate/evaluate the Draft state it displays. Correct the initial authority snapshot
and cover the integrated path, not just authority calls with fixture-level inputs.

### P1 — build Champion management as a real surface

The selector is not a substitute for the captured Champions index. Add a routed
inventory with lifecycle, Draft/Paper/Live state, active version, operational
health, next meaningful event, and absolute timestamp metadata. Then implement:

- safe Create with draft/composer, pending, success, duplicate-click, abandonment,
  and error behavior;
- settled search, clear, keyboard behavior, result count, and zero results;
- a recent subset derived from the same canonical inventory;
- name editing with validation and authoritative save behavior;
- direct-link handling for missing, unauthorized, and retired Champions.

Champion retirement remains gated. Do not copy the old irreversible
“Archive”/liquidate action until its lifecycle and portfolio consequences are
accepted and named honestly.

### P1 — either implement settings or stop promising them

The current Profile dialog says account, security, brokerage, and notification
preferences exist, but none do. For the auth-free redesign, implement only the
non-auth account surface that product wants—profile media, callsign/flair, faction,
Atlas personality/response style, and notifications—with a shared canonical user
fixture and complete save/error states. Keep passkeys/password/sign-out out of the
demo. Remove brokerage/security claims until those contracts are actually in scope.

### P1 — close cross-Champion state leaks

Move bottom-panel tab/expanded state into `ChampionSessionState` or reset it during
the same atomic Champion transition. Add a switching test that gives Mara and Iris
different environment, run, rule, conversation, attachment, and panel selections,
then repeatedly switches and verifies that no state crosses identities.

### P2 — complete product plumbing

- Add Privacy/Terms discovery outside authentication.
- Add a branded app-router `not-found.tsx` and resource-level missing/unauthorized
  states inside the persistent Champion shell.
- Add Dawn/Dusk/Auto selection only if these remain the desired product themes;
  include persistence, system changes, and no-flash startup.
- Implement feedback with validation, pending, success, failure, retry, and focus
  restoration.
- Replace expiring Slack-only help with a first-party support destination and an
  optional external community link.
- Decide whether The First is retained as a content route; it is captured but not
  part of the accepted Champion-workspace IA.
- Remove the global market-status badge unless it is tied to the currently viewed
  strategy evidence or an operational control where session state materially
  changes the safe action.

## Do not mechanically port these captured features

| Captured feature | Source-parity decision |
| --- | --- |
| Login, recovery, passkeys | **Intentional exclusion** for the auth-free demo. Production authorization remains a separate required contract. |
| Password and Sign Out in Settings | Keep absent while the demo has no session boundary. Do not add inert security chrome. |
| Locked/unlocked Leaderboard | **Do not implement** in the Champion workspace under accepted D-036. Revisit only as an explicitly separate surface. |
| Old `Archive Champion` | **Gated.** It concealed liquidation and irreversible deletion; define honest retirement semantics first. |
| Immediate Create side effect | **Do not copy.** Use an explicit draft/composer and authoritative commit. |
| Ambient market-open widget | **Remove or contextualize.** Accepted D-036 rejects ambient market widgets. |
| Staging founder/account values | **Do not copy.** Use one sanitized canonical user fixture. |

## Acceptance checklist for global/account parity

- The browser URL names Champion ID, environment, and nested selected object; a
  refresh and Back/Forward preserve the same valid context.
- Unknown, unauthorized, retired, and unavailable Champion URLs render explicit
  states inside the shell instead of throwing or silently selecting Mara.
- Champion switching restores only that Champion's environment, nested selection,
  conversation, attachment, bottom panel, and pending state.
- Iris's visible Draft checkpoint equals the authority checkpoint and a source-level
  integration test proves a V2.0 evaluation/edit succeeds.
- A routed Champions index, safe Create flow, search, recent subset, and metadata
  all derive from one canonical inventory fixture/repository.
- Champion retirement remains unavailable until consequences, naming, recovery,
  permissions, pending/partial-failure behavior, and audit records are decided.
- Profile/faction/personality/response/notifications derive from one canonical
  user fixture and expose validation, pending, saved, cancel, and error states.
- No passkey/password/sign-out control appears in the auth-free build.
- Privacy and Terms are reachable without authentication; unknown routes use the
  branded not-found surface.
- Dawn/Dusk/Auto has a checked state, persistence, system behavior, and no-flash
  startup if retained.
- Feedback and help have stable, accessible success/failure/support paths.
- No ambient leaderboard or market-status widget violates D-036 without a recorded
  decision that establishes a separate product surface and job.

## Bottom line

The current source has made a sound architectural choice by building a coherent
evidence-led Champion workspace rather than cloning the old global chrome blindly.
However, the full-site replacement is not close to global/account parity yet. The
next work should be route identity, the Iris lifecycle fix, Champion management,
and a canonical user/account fixture. Authentication/passkeys, the old destructive
Archive behavior, and Leaderboard should remain out or gated rather than being
counted as simple missing UI.
