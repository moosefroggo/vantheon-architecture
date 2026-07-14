# Accessibility and Motion

## Status

WCAG 2.2 AA is the accepted target for every supported demo viewport and both priority journeys. Known exceptions require a documented impact, owner, workaround, and revisit trigger.

## Purpose

Accessibility is part of financial trust. A user must be able to determine what is being viewed, what can change, what is pending, and what controls capital without depending on color, animation, pointer input, or a canvas chart.

This document defines interaction and presentation requirements. It does not replace testing with disabled users or professional accessibility review.

## Core Requirements

- Use native HTML semantics before ARIA.
- Preserve stock shadcn/Radix keyboard and accessibility behavior when composing domain components.
- Expose Draft, Paper, Live, version, checkpoint, operational state, freshness, and authority through text.
- Keep DOM reading order aligned with the meaningful visual order.
- Meet 4.5:1 text contrast and 3:1 large-text and non-text UI contrast where WCAG applies.
- Provide a visible focus indicator with sufficient contrast and area.
- Do not make timing, pointer precision, dragging, hover, color, sound, or motion the only way to complete or understand a task.
- Use stable, plain financial language. Do not announce a proposal or acknowledgement as an executed change.

## Supported Viewport Contract

The minimum usable viewport, unsupported widths, panel-collapse behavior, and any mobile read-only experience are tracked by P-001 and must be recorded before layout implementation.

Regardless of width:

- Source context and Draft mutation target remain discoverable near conversation.
- Collapsing chat or notifications does not remove their status or unread state from the accessibility tree without an alternative control.
- Financially consequential actions remain reachable without horizontal page scanning.
- Zoom to 200% and browser text resizing do not obscure confirmation consequences or focus.
- Reflow and 400% zoom are tested against the declared supported viewport contract; any exception is explicitly documented.

## Page and Landmark Structure

Each workspace exposes:

- A skip link to the active workspace content.
- A skip link to the conversation when it is persistently visible.
- One page-level heading naming the Champion and active context.
- Distinct navigation, main, complementary conversation, and notification regions where those regions exist.
- A programmatic status summary containing `Draft Vn`, `Paper running Vn`, or `Live running Vn` as applicable.

Use headings to make strategy sections, evidence, runs, risk, orders, and promotion review navigable. Avoid using cards or typography alone as structure.

## Keyboard Interaction Model

Follow the relevant WAI-ARIA pattern only when a native control cannot express the interaction.

| Surface | Required behavior |
|---|---|
| Draft/Paper/Live switcher | Implement as navigation or tabs consistently; arrow-key behavior only when it is a true tablist |
| Champion switcher | Searchable keyboard list with an accessible name, current selection, and deterministic focus return |
| Strategy sections | Logical document order; edit controls follow the content they affect |
| Conversation | Composer reachable without traversing every message; history and composer have separate names |
| Virtualized histories | Keyboard traversal loads or scrolls the target item without losing the focused logical record |
| Charts | Keyboard-accessible range and series controls plus a direct path to the textual equivalent |
| Dialogs and sheets | Initial focus on context or the safest action, trapped while modal, restored to the opener on close |
| Paper launch and Live promotion review | Review content precedes confirmation; cancel remains easy to reach; no Enter-key surprise submission |
| Emergency controls | Separate focusable controls for pausing executions and cancelling eligible orders, each with scoped confirmation |

Do not introduce global shortcuts that override browser or assistive-technology conventions. Any product shortcut must be documented, discoverable, remappable where appropriate, and inactive while typing.

## Focus Management

Focus is an application state with explicit transitions, not a side effect of rerendering.

### Navigation and persistent layouts

- On a user-initiated full context change, move focus to the new surface heading or preserve it on the controlling tab when the new panel is immediately adjacent and announced.
- On background updates, never move focus.
- Returning to a warm Champion restores a meaningful control or heading, not a detached DOM node.
- When React `Activity` hides a surface, focus must leave the hidden subtree before it becomes unavailable.
- A cold load may render a shell first; focus stays stable while deeper panels arrive.

### Dialog and command outcomes

- Opening a modal records the invoking control and applies the correct initial focus.
- Closing restores focus to the invoker when it still exists; otherwise use the nearest logical heading or next action.
- Validation errors focus the error summary or first invalid field and link messages to fields.
- After a confirmed Draft change, keep focus on the initiating context and announce the new checkpoint rather than jumping to changed content.
- After a failed or rejected command, return focus only when the user must act; otherwise preserve focus and announce the outcome.

### Dynamic collections

- Appending a message, run, or order does not steal focus or force scroll.
- Auto-scroll conversation only when the user is already at the end; otherwise expose a `New messages` control.
- Removing a focused item moves focus to a predictable adjacent item or collection heading.

## Live Regions and Dynamic Updates

High-frequency financial data must not be placed in a live region.

### Announcement priorities

| Event | Treatment |
|---|---|
| Price ticks, P&L fluctuations, chart samples | No automatic announcement; available on demand |
| New chat tokens | Do not announce token by token; announce a completed block or response with batching |
| Champion activity progress | Polite, debounced milestones only; suppress repetitive phases |
| Draft command applied, rejected, or failed | Polite status with Draft/checkpoint identity |
| Connection degraded, stale, recovered | Polite status; include last confirmed time when useful |
| Risk threshold requiring immediate user action | Assertive only when delay creates material harm; also persist visibly |
| Session expired or authorization revoked | Assertive if interaction is blocked; move focus to a safe recovery action when necessary |
| Order or deployment outcome | Polite by default; never describe acknowledgement as execution |

- Maintain one managed announcement service rather than many competing `aria-live` nodes.
- Deduplicate repeated messages and enforce a minimum interval for non-critical announcements.
- Keep important status visible after the announcement; live regions are not an audit trail.
- Offer user-controlled notification preferences where persistent live use warrants them.
- Exact batching intervals and the final critical-event taxonomy are tracked by P-006 and require assistive-technology testing.

## Charts and Non-Text Financial Information

Canvas and SVG charts require a synchronized meaningful equivalent. Visx SVG marks are not automatically accessible, and Lightweight Charts canvas rendering does not change the product's obligation to expose the same material conclusion.

Every material chart provides:

- An accessible name describing metric, entity, range, and currency or unit.
- A concise textual summary of direction, start/end values, high/low, material drawdown, data cutoff, and freshness where relevant.
- An accessible data table or downloadable structured view containing the information needed to reach the same material conclusion.
- Keyboard-accessible range, series, and comparison controls.
- Explicit handling for missing, stale, delayed, and estimated data.
- A legend that does not rely on color alone.

The textual equivalent must use the same normalized source and time range as the visual chart. It cannot be an unrelated summary generated by a model. P-012 must define which sampled points and derived statistics preserve equivalent meaning for very dense series.

Tooltip-only information must also be reachable by focus or through the data table. Pointer crosshairs are an enhancement, not the sole inspection method.

## Tables and Virtualized Collections

- Use semantic tables for genuinely tabular positions, orders, comparisons, and run results.
- Expose header associations and sort state programmatically.
- Communicate total collection size and logical item position with `aria-rowcount`, `aria-rowindex`, or equivalent semantics where supported.
- Do not place interactive descendants inside a row that is itself a conflicting interactive control.
- Preserve stable item identity as rows recycle.
- Ensure the active/focused item is not unmounted until focus is moved safely.
- Provide application-level search because browser find cannot discover unrendered items.
- Search results must identify result count and allow deterministic next/previous navigation.
- Loading more items preserves reading and focus position.

Virtualization may be disabled for smaller collections or assistive-technology modes if that produces a more reliable result. The chosen library and browser/AT behavior must be tested, not assumed.

## Financial Values, Time, and Language

- Include currency codes or an unambiguous local context; do not rely solely on `$` where multiple currencies are possible.
- Programmatic names preserve sign and unit. A visual red `-3.2%` must still be announced as `negative 3.2 percent` or an equivalent clear phrase.
- Use tabular numerals visually without splitting a value into inaccessible spans.
- Distinguish zero, missing, unavailable, delayed, and not applicable.
- Pair relative time with an accessible absolute timestamp and time zone.
- Identify simulated capital and Paper outcomes explicitly.
- Use `No trade` and its reason rather than leaving an empty transaction area.

## Pending, Optimistic, and Confirmed State

The interface exposes authority through persistent words, icons, and programmatic status—not color or motion.

| State | Required presentation |
|---|---|
| Proposed | Label as a proposal; show what would change and require an action where applicable |
| Submitting | Keep prior confirmed value visible; label request as sending or waiting |
| Accepted/executing | State that processing began; do not present the result as applied |
| Applied | Identify the authoritative result, affected Draft/checkpoint or destination, and confirmation time |
| Rejected/failed | Preserve prior confirmed state; explain whether the user can revise, retry, or must re-authenticate |
| Superseded/cancelled | State that no change was applied and link to the newer controlling operation when available |
| Stale/degraded | Show last confirmed time and which actions are unavailable or uncertain |

Animated value transitions, success colors, checkmarks, or streamed Champion prose must never be the only signal of authority. If an optimistic Draft projection is corrected, announce the correction and show the confirmed value without a silent meaning-changing flicker.

Paper and Live commands should generally wait for authoritative confirmation before changing their primary state. The final list of safe optimistic Draft interactions is tracked by proposed decision P-004.

## Motion and Visual Change

Honor `prefers-reduced-motion: reduce` without requiring an in-product setting.

- Remove or replace non-essential parallax, spring, zoom, continuous pulse, and large spatial transitions.
- Use immediate state replacement, short fades, or static emphasis in reduced-motion mode.
- Preserve information conveyed by motion through text and state labels.
- Pause non-essential animation when its surface is hidden or the document is not visible.
- Provide a way to stop any animation that continues beyond five seconds unless it is essential.
- Avoid rapid flashing. Financial value flashes are bounded, do not exceed seizure thresholds, and are not the only direction cue.
- Do not animate every market tick. Conflate updates and reserve emphasis for meaningful, user-relevant change.
- Motion never advances a business state before the authoritative patch.

Stock shadcn motion is accepted for the demo only after reduced-motion behavior and focus continuity are verified.

## Forms, Errors, and Confirmation

- Inputs have persistent labels; placeholders are not labels.
- Required, format, and domain validation are distinguishable.
- Error summaries link to invalid fields and remain available until resolved.
- Destructive and capital-impacting dialogs name the destination, current state, requested change, and consequence.
- Confirmation labels describe the action, such as `Launch Paper V5` or `Pause future executions`, not `Yes`.
- Do not use disabled controls as the only explanation; expose why an action is unavailable.
- Timeouts or session expiry preserve non-sensitive Draft input when safe and explain recovery.

## Testing and Evidence

### Automated

- Run axe through component tests and `@axe-core/playwright` on Draft, Paper, Live, run detail, promotion, emergency control, offline recovery, and authorization failure.
- Test focus order, focus restoration, accessible names, error associations, and live-region deduplication.
- Run keyboard-only Playwright paths for onboarding to Paper and Paper evidence to tested Draft improvement.
- Capture visual regressions for focus, 200% zoom, supported narrow/wide layouts, dark/light mode, reduced motion, stale/degraded state, and pending/confirmed state.
- Include accessibility checks under deterministic live-data load so frequent updates do not create focus loss or announcement storms.

Automated checks are necessary but cannot establish usability or complete WCAG conformance.

### Manual

- Screen readers: VoiceOver/Safari and at least one Windows combination are required; the final Windows browser/reader matrix is tracked by P-005.
- Keyboard-only completion of both priority journeys.
- Browser zoom, text resize, high contrast/forced colors, and reduced motion.
- Chart summary/table equivalence for representative performance, drawdown, allocation, and comparison charts.
- Session expiry, disconnect/recovery, conflict resolution, promotion, and emergency controls.
- Review with users who rely on assistive technology before production Live-capital use.

## Accessibility Acceptance Criteria

- Both priority journeys can be completed without a pointer.
- A screen-reader user can identify the Champion, viewed context, mutation target, running strategy, freshness, and command authority.
- Frequent prices and tokens do not flood announcements or move focus.
- Every material canvas chart has a synchronized meaningful text/table equivalent.
- Virtualized histories remain searchable and preserve collection position and focus.
- Reduced-motion mode retains all state meaning and contains no continuous non-essential animation.
- A proposed, pending, accepted, and applied financial action cannot be confused through color, motion, or wording.
- Focus returns predictably after dialogs, context switches, errors, and hidden warm surfaces.
- No known AA exception ships without documentation, an owner, workaround, and revisit trigger.

## Proposed Decisions

- P-001: supported viewport and mobile behavior.
- P-004: Draft interactions that may appear optimistically.
- P-005: browser, assistive-technology, forced-colors, and operating-system test matrix.
- P-006: live-region batching, user notification preferences, and critical-event taxonomy.
- P-012: dense-chart table granularity, sampling, and any non-virtualized accessibility mode.
