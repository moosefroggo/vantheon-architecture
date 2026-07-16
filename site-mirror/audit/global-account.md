# Global, navigation, and account surface audit

Audited 2026-07-15 from the captured Vantheon HTML, UI-state snapshots, screenshots, and the generated `local-preview/`. This report covers the global shell, Champions list and detail shell, create/search/archive, The First, Leaderboard, settings/account surfaces, themes, feedback/help, and public/legal routes. Strategy-document internals, portfolios, datasets, checkpoints, and dry-run content are covered by the other section audits.

Authentication bypass is intentional in the local preview. A missing sign-in or recovery flow is therefore **not** a parity defect. Passkey enrollment/removal is also explicitly out of scope and is not recommended for implementation here.

## Executive result

The visual capture is broad, but the local preview is not an interactive reconstruction. It is a set of mutually inconsistent, time-separated snapshots presented behind working anchor links:

- `local-preview/` contains 110 HTML pages and zero retained `<script>` elements. `build-local-preview.mjs` deliberately strips the application runtime.
- All internal anchor paths currently resolve to a local file, so page-to-page links are the strongest part of the preview.
- Button-, form-, input-, menu-, dialog-, and query-driven behavior does not run. Create, search, archive, theme, feedback, sidebar controls, settings saves, notifications, password update, sign-out, and Champion mode/subview switching are visual only.
- The primary settings route is an early/loading snapshot, while the later saved profile/faction/personalization state is available only in the state catalog.
- Captures made before and after the accidental `Champion #12` creation/archive are mixed together, so the preview does not represent one coherent account state.

### Comparison boundary

The original live product and the local preview must be evaluated separately:

| Layer | What it represents | Behavior status |
| --- | --- | --- |
| Original live product | The signed-in app at capture time. The untouched HTML under `app.vantheon.ai/` retains Next/React bundles, and the interactions recorded in `COVERAGE.md` were exercised against the live staging account. | Create, archive, search, themes, settings saves, feedback, and shell navigation were live application behavior; unavailable/excluded flows are explicitly listed in `COVERAGE.md`. |
| Source/UI-state capture | Serialized DOM and screenshots taken at specific times before, during, or after interactions. | Useful visual and metadata evidence, but individual captures are not necessarily a mutually consistent dataset. |
| Local preview | Generated output under `local-preview/`; scripts are removed to prevent live authentication redirects. | Static reference only. A path audit across every local HTML file found **zero missing internal anchor targets**, but all runtime-driven controls are inert. Query-only anchors can reload a page without changing its captured view. Every local form also lacks a native `action`, so it cannot reproduce the original submit behavior. |

The following are **intentional exclusions**, not defects: root/login/recovery redirecting to Champions, no sign-in requirement, and no passkey enrollment/removal implementation. The following are **accidental scope leaks or unresolved product decisions**: authentication states still listed in the preview catalog, the Passkeys block still visible on Settings, inert Password/Sign Out/Notifications controls, and Privacy/Terms becoming undiscoverable after the auth screen was removed.

Severity scale:

| Level | Meaning |
| --- | --- |
| P0 | Release blocker: credential/data exposure, destructive risk, or unusable critical deliverable. |
| P1 | Core product/parity failure that blocks a primary journey or makes the preview materially misleading. |
| P2 | Material missing state, metadata, accessibility, or secondary behavior. |
| P3 | Polish, naming, resilience, or documentation improvement. |

## Surface inventory and parity

| Surface | Source contract captured | Local-preview status | Evidence |
| --- | --- | --- | --- |
| Global application shell | Vantheon brand; Create Champion; Champions; five-item recent Champion list; The First; Leaderboard; Theme; Feedback; Help Me; account identity; sidebar toggle | Primary anchors work. All button/menu/sidebar/dialog behavior is inert. | `app.vantheon.ai/dashboard/champions/index.html`; `local-preview/dashboard/champions/index.html` |
| Champions index | Search; Champion name; relative modified time; archive icon; 11 rows in the base index | Rows link to local detail pages. Search and archive are inert. The list exposes no mode/version/performance metadata. | `app.vantheon.ai/dashboard/champions/index.html`; `ui-states/champions/search-etf/index.html` |
| Create Champion | Source action immediately created a blank `Champion #12`; empty Champion has editable name, six-step onboarding, Atlas starters, Draft/Paper/Live shell | The captured empty page exists, but Create does not navigate or create anything locally. | `app.vantheon.ai/dashboard/champions/new-empty/index.html`; `authenticated-screenshots/dashboard--champions--new-empty.png`; `COVERAGE.md` |
| Archive Champion | Per-row archive; confirmation dialog with Cancel, Archive, Close; confirmed removal state | Confirmation and post-archive pages exist only as catalog snapshots. The action cannot be reached from the list. | `ui-states/mutations/archive-champion-after-click/index.html`; `ui-states/mutations/archive-champion-confirmed/index.html` |
| Champion detail shell | Editable Champion name; back link; Draft/Paper/Live modes with version titles; selected version; archive Paper version; disabled Deploy Live; onboarding progress; collapsible shell; subview controls | Back/global anchors work. Name edit, modes, versions, archive, deploy, onboarding, shell collapse, and subview controls are inert. Query-driven source links such as `?view=data` reload the same static DOM. | `app.vantheon.ai/dashboard/champions/example-detail/index.html`; `ui-states/champions/all/*/index.html` |
| Global themes | Menu plus Dawn, Dusk, and Auto visual states | Captured states render from the catalog, but Theme cannot open or persist a selection on a primary page. | `ui-states/global/theme-menu/index.html`; `ui-states/global/theme-{dawn,dusk,auto}/index.html` |
| Global feedback | Dialog, message textarea, Ship It, Close | Dialog and submitted snapshots exist, but there is no reachable interaction or visible success/error contract. | `ui-states/global/feedback-dialog/index.html`; `ui-states/mutations/feedback-submitted/index.html` |
| Help Me | External Slack invite, new-tab safety attributes, external destination capture | Link remains functional and the destination was captured. | `external-links/help-me-slack/index.html`; global shell HTML |
| The First | Dated founder manifesto; SPY comparison link; feedback form; New Releases/The Beta card | Static content and external link render. Feedback submit is inert; submitted capture provides no visible outcome. | `app.vantheon.ai/dashboard/thefirst/index.html`; `ui-states/mutations/thefirst-submitted/index.html` |
| Leaderboard | Locked state: 0 Live Champions; unlock after 1,000 live Champions; top five by total gains (%) | Faithful static locked state. No populated Leaderboard contract is available. | `app.vantheon.ai/dashboard/leaderboard/index.html`; `authenticated-screenshots/dashboard--leaderboard.png` |
| Settings — profile | Wallpaper and avatar `image/*` inputs; Callsign, max 20; Founder Flair, max 320; Cancel/Save | Primary route shows blank/initial data. Saved values exist only in mutation captures. Upload/edit/save behavior is inert. | `app.vantheon.ai/dashboard/settings/index.html`; `ui-states/mutations/settings-profile-saved/index.html` |
| Settings — faction | Boring/no faction plus Bluecrest, The Foundry, The Wardens, Verdance, Zenith; previous/next; card flip; Cancel/Save | Visual states captured; primary route shows Boring while later state is Zenith. No interaction. Back-card metadata is image-only. | `ui-states/settings/faction-{next,previous,details}/index.html`; `ui-states/mutations/settings-faction-saved/index.html` |
| Settings — Atlas personalization | Personality: Adaptive, WallStreetBets, Professional, Casual. Response: Conversational, Verbose. Previous/next, sample chat, Cancel/Save | All options have snapshots and final saved state is Professional + Conversational. Primary route still shows Adaptive + Conversational. No interaction. Several sample responses were captured mid-animation. | `ui-states/settings/*/index.html`; `ui-states/mutations/settings-personalization-saved/index.html` |
| Settings — notifications | Description and Enable Notifications; one Enabling… state | Permission completion was intentionally not performed. Allowed, denied, browser-blocked, already-enabled, disable, and error states are absent. | `app.vantheon.ai/dashboard/settings/index.html`; `ui-states/authentication/notifications-after-click/index.html` |
| Settings — password/sign-out | New Password, Confirm Password, Cancel/Save; Sign Out | Still visible in the auth-free preview but inert. This needs an explicit keep/hide decision. Passkeys remain out of scope. | `local-preview/dashboard/settings/index.html`; `ui-states/authentication/password-ready-to-save/index.html` |
| Public/auth entry | Root, login, and recovery source captures exist | Intentionally replaced with redirects to Champions. Correct for this preview. | `app.vantheon.ai/{index.html,auth/login/index.html,auth/recover/index.html}`; `local-preview/{index.html,auth/login/index.html,auth/recover/index.html}` |
| Privacy/terms | Full Privacy Policy and Terms of Service, updated June 18, 2026; legal email and cross-links | Direct local routes work. Removing auth also removed the only ordinary in-product discovery path to these pages. | `app.vantheon.ai/legal/{privacy,tos}/index.html`; matching `local-preview/legal/` files |
| Not found | Branded Page not found and Back to dashboard | Direct snapshot works, but no host/router fallback maps arbitrary missing URLs to it. | `app.vantheon.ai/dashboard/not-found/index.html`; `local-preview/dashboard/not-found/index.html` |

## Field and action matrix

### Global shell and Champions

| Field/action | Source behavior or metadata | Captured? | Usable locally? | Required implementation contract |
| --- | --- | --- | --- | --- |
| Account identity | Callsign, `Founder #18`, avatar fallback/image, faction icon | Yes | Display only; differs between snapshots | One sanitized canonical user fixture shared by every page. |
| Create Champion | Source submit immediately creates and opens a blank Champion | Initial and created state | No | Prefer a non-destructive composer or an explicit create confirmation; define pending, success, and error. |
| Recent Champions | Up to five names in the expandable app-nav list | Yes | Links work; collapse does not | Preserve selected row, collapse state, mobile behavior, and a clear relationship to the full list. |
| Full Champion list | Name + relative update time | Yes | Links work | Add lifecycle mode, active version, run/trading status, and optionally performance/next-run metadata; use absolute timestamps in accessible labels/tooltips. |
| Search | Text query; captured `ETF` value | Partially | No | Define debounce, clear, keyboard focus, zero results, result count, and whether search covers archived Champions. |
| Archive | Icon per row | Dialog and confirmed state | No | Clarify destructive semantics, pending/error, cancellation, post-action focus, archived-history access, and restore policy. |
| Champion name | Editable text field on detail shell | Yes | No | Autosave or explicit save, validation, duplicate-name policy, dirty/error state. |
| Draft/Paper/Live | Mode controls and version labels such as `Draft · v3`, `Paper · v2`, `Live · v—` | Yes across Champions | No | URL-addressable mode/version state; disabled reason for unavailable modes; preserve subview during mode switches where valid. |
| Detail subviews | Paper and Draft sidebars plus Get Started | Yes as separate snapshots | No | Real route/query mapping, selected state, back/forward support, and direct links. |
| Theme | Dawn/Dusk/Auto | Yes | No | Menu selection, checked state, persistence, system-theme change handling, and no-flash startup. |
| Feedback | Textarea, submit, close | Open and post-submit snapshots | No | Empty validation, submitting, success acknowledgement, retry/error, and focus restoration. |
| Help | Slack shared invite | Yes | Yes | Add a stable first-party support fallback if the invite expires. |

### Settings/account

| Field/action | Constraints/options observed | Captured? | Usable locally? | Required implementation contract |
| --- | --- | --- | --- | --- |
| Wallpaper | Hidden `image/*` file input | Base only | No | File-size/type validation, preview, crop/position, progress, error, replace/remove. |
| Avatar | Hidden `image/*` file input | Base only | No | Same as wallpaper plus a proper accessible label. |
| Callsign | Text, max 20, autocomplete off, spellcheck false | Blank and saved (`mustafa1`) | No | Required/optional rule, uniqueness, allowed characters, character count, validation and save feedback. Use neutral fixture data in shared previews. |
| Founder Flair | Textarea, max 320 | Blank and saved staging text | No | Character count, line-break behavior, validation and save feedback. |
| Faction | None/Boring plus five named factions | Carousel, flip, saved | No | Text-native name, trait/description metadata, selected semantics, save result, and keyboard/touch carousel behavior. |
| Personality | Adaptive, WallStreetBets, Professional, Casual | All selected states | No | Radio semantics, stable preview response, dirty state, save/cancel. |
| Response | Conversational, Verbose | Both selected states | No | Same contract as Personality; settle sample output before visual capture. |
| Notifications | Enable; Enabling… | Partial | No | Permission preflight, prompt result, denied/blocked instructions, enabled/disable state, error and browser compatibility. |
| Password | Two password inputs, Cancel/Save | Empty and filled state | No | If retained, define strength/match/errors and completion; never serialize input values into fixtures or HTML. |
| Sign Out | Single action | Base only | No | Hide in auth-free preview or implement confirmation/loading/error and a destination in the production product. |
| Passkeys | Enrollment/removal source captures | Captured, but excluded | No; should not be exposed | Remove from the preview catalog and omit from this redesign scope. |

## Prioritized findings

### P0 — credential-like value is serialized and served

`ui-states/authentication/password-ready-to-save/index.html` contains non-empty plaintext `value` attributes on both password inputs. The generated copy at `local-preview/preview/states/authentication/password-ready-to-save/index.html` is linked from `local-preview/preview/index.html` and is therefore served to anyone who can reach the preview. The value is not repeated in this report.

Although the password change was canceled and this is a disposable staging account, a credential-like string in a distributable HTML artifact is a release blocker. Remove the authentication state from the preview, scrub every password value from source and generated HTML, rotate the string if it was used anywhere, and add a build-time check that rejects non-empty password inputs and common secret patterns.

### P1 — the preview advertises actions it cannot perform

`build-local-preview.mjs` removes every script but leaves the original controls and forms in place. Every local form has no native `action`, so clicking a submit control can only reload the current document; non-submit buttons do nothing. This affects Create Champion, search, archive, sidebar toggles, Theme, Feedback, settings, notifications, password, Sign Out, The First feedback, Champion modes, and subviews.

Treat `local-preview/` explicitly as a visual reference library, or build a small fixture-backed application that implements the global state machine. Until then, nonfunctional controls should be visibly marked or disabled, and the catalog should deep-link to the corresponding captured state.

### P1 — temporal snapshots create contradictory account state

The preview combines states from before and after staging mutations:

- The primary Champions index omits `Champion #12`, but many Champion sidebars and direct routes still expose it after its confirmed archive.
- The main settings route has blank profile values, no faction/Boring, Adaptive + Conversational, and `Loading passkeys…`; mutation captures contain callsign/flair, Zenith, and Professional + Conversational.
- Global shell identity alternates between a Verdance icon, a Zenith icon, or an unhydrated blank identity depending on the page.

Create a versioned, sanitized fixture snapshot and regenerate every primary route from it. Keep historical interaction states in the catalog under labels such as `before`, `pending`, `success`, and `error`; do not mix them into primary navigation.

### P1 — Create Champion has an accidental side effect by design

The source `Create Champion` submit immediately created `Champion #12`; the capture notes this as accidental. A prominent global action should not create a durable record merely to open a blank workspace.

Change it to open a composer or create a clearly labeled local draft that is committed only after the user names it or sends a first Atlas message. Specify pending, duplicate-click, failure, abandonment, and cleanup behavior.

### P1 — “Archive” masks liquidation and irreversible deletion semantics

The captured confirmation says archiving pauses trading, liquidates all positions with market orders, and cannot be undone. That is much more consequential than conventional archive semantics.

Rename the action to reflect the outcome (`Retire and liquidate`, for example), separate reversible archive from liquidation/deletion if possible, show affected version/positions, require explicit confirmation for funded Champions, and document pending/partial-failure behavior. The blank-Champion confirmation is captured, but funded and running states are not.

### P1 — Champion mode/version/subview state has no local navigation model

The shell carries meaningful metadata—Champion name, active Paper/Draft version, absent Live version, onboarding progress, and view selection—but these are buttons controlled by the removed runtime. Separate files such as `example-detail/positions/` and `example-detail/draft-checkpoints/` exist, yet the visible controls do not navigate to them.

Define canonical URLs for Champion ID + mode + version + subview, with back/forward support and valid fallbacks when a version or view does not exist. This is required before the portfolio/draft content audits can be implemented cohesively.

### P1 — auth bypass orphaned legal discovery and left account-security chrome behind

Redirecting root/login/recovery to Champions is intentional. However, Privacy and Terms were discoverable from the removed auth screen and are not linked from the authenticated shell or settings. Conversely, Settings still shows Passkeys, Update Password, and Sign Out in an auth-free preview.

Add Privacy/Terms links to a persistent footer or Account section. Filter `authentication/**` from the preview catalog and remove the Passkeys block per scope. Decide explicitly whether password/sign-out are production-only specifications or should also be hidden in the auth-free redesign preview.

### P2 — search reference is not a reliable filtered-result state

`ui-states/champions/search-etf/index.html` has input value `ETF`, but its captured DOM still contains every Champion row. Later snapshots named `champion-list-collapsed` and `sidebar-hidden` contain only ETF Swing Trader, suggesting the useful filtered state was captured after another interaction.

Recapture a settled search result under the correct label, plus unfiltered, zero-result, clear, keyboard-focused, and archived-inclusive/exclusive states.

### P2 — feedback submission lacks an outcome contract

The global dialog and The First form are captured, and “submitted” snapshots exist, but neither shows a success toast/status, validation message, or error/retry state. Closing/resetting a form without acknowledgement is ambiguous.

Add empty-input validation, submitting, success, failure, retry, and duplicate-submit behavior. Use an `aria-live` status and restore focus after the dialog closes.

### P2 — settings uploads and validation are under-specified

The source reveals only `image/*`, Callsign max 20, and Founder Flair max 320. There are no file-size/dimension rules, preview/crop/removal states, progress, errors, callsign validation, dirty-state warnings, or saved acknowledgements. The avatar file input also lacks a meaningful visible or ARIA label in the captured DOM.

Specify and capture each state before implementation; do not infer upload rules from the browser accept filter.

### P2 — faction metadata is trapped in artwork

Five faction names are available as front-card alt text, but detail/back-card images have empty alt text and their traits are not represented as text in the DOM. The visual flip state is present, but the actual choice metadata is not accessible, searchable, or reusable.

Model faction name, summary, traits, theme color, and art separately. Render real text over/alongside the art and provide selected/pressed semantics for the carousel.

### P2 — personalization examples were captured mid-animation

Several personality/response snapshots contain visibly truncated Atlas output (for example, a sentence ending after only a few words), while a later saved mutation contains a settled response. These are poor references for copy and layout height.

Use deterministic sample copy and capture after animation completion. Include long-copy wrapping and reduced-motion behavior.

### P2 — notification flow stops at “Enabling…”

Only the initial and pending states exist. Browser permission may be granted, denied, previously blocked, unsupported, or revoked; users also need a way to disable notifications.

Define each permission branch and show browser-specific recovery instructions without repeatedly triggering the native permission prompt.

### P2 — Leaderboard is documented only in its locked state

The gate communicates the threshold and prize cohort but provides no evidence for populated rows or their metadata. Rank, Champion/user identity, return period, total gains calculation, ties, freshness, disqualification, pagination, loading, and errors are unspecified.

Build a fixture-backed unlocked state before implementing the route. At minimum show rank, Champion, founder, lifecycle, return metric and period, last updated, and tie rules.

### P2 — custom not-found page is not a real fallback

`/dashboard/not-found/` is copied as a normal page, but the preview build has no route rewrite or 404 document configuration. Arbitrary bad URLs therefore use the static server’s default 404 rather than Vantheon’s branded page.

Configure a host-level 404 fallback or client router, and test unknown dashboard, Champion, and legal URLs.

### P2 — list metadata is too thin for account management

The full Champions list shows only name and relative age. Users cannot tell Draft vs Paper vs Live, active version, scheduled/running/paused/error status, funded state, or whether attention is required without opening each Champion.

Add lifecycle and health metadata, with performance/next-run information only if it remains legible. Keep relative time for scanning but expose an absolute timestamp.

### P3 — external and legal naming cleanup

- The First links to `http://perplexity.ai/finance/SPY`; use HTTPS directly.
- Help Me depends on a shared Slack invite. Retain the safe new-tab attributes, but add a stable support fallback.
- The legal copy alternates between “Privacy Policy”/“Privacy Notice” and “Terms of Service”/“Terms & Conditions.” Standardize visible names while preserving the legal document titles.
- The account row uses invalid nested interactive markup (`button` containing an `a`) in captured shell HTML. Render a single link/button with one focus target.

## Recommended implementation order

1. **Sanitize and scope the artifact:** remove the credential-like value, exclude every `authentication/**` state, scrub personal/staging fixture data, and rebuild.
2. **Create one canonical fixture:** coherent user, faction, personalization, Champion inventory, versions, and archive status across every primary route.
3. **Implement the global state machine:** anchor routing plus Create, search, archive, sidebar, theme, feedback, settings, and Champion shell navigation. Keep captured state pages as reference fixtures, not substitute interactions.
4. **Complete core UX contracts:** safe create flow; honest retire/liquidate terminology; URL-addressable Champion mode/version/subview; form pending/success/error behavior.
5. **Fill documentation gaps:** uploads, notifications, populated Leaderboard, settled personalization previews, feedback acknowledgements, funded/running archive states, zero-result search.
6. **Restore product plumbing:** persistent legal links, branded 404 fallback, HTTPS external links, accessible faction/profile controls, and stable support destination.

## Acceptance checklist

- No password input in source, fixtures, or built HTML has a non-empty `value`.
- No passkey/authentication state appears in the local preview catalog.
- Every primary page uses the same sanitized user and Champion fixture revision.
- Archived Champions are absent from active lists/quick lists and handled consistently at direct URLs.
- Every visible enabled control either performs its documented action or navigates to a labeled captured state.
- Champion mode, version, and subview are encoded in the URL and survive refresh/back/forward.
- Create and archive/retire have pending, success, cancellation, and error behavior; liquidation is never hidden behind “Archive.”
- Search has settled result, clear, zero-result, and keyboard behavior.
- Settings uploads, validation, save/cancel, notifications, and personalization have complete outcome states.
- Privacy and Terms are discoverable without authentication.
- Unknown routes render the branded not-found view.
- Leaderboard has a fixture-backed unlocked design before the gate is removed.
