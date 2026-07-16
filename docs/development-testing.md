# Development Testing Checkpoints

Status: Accepted for frontend implementation.

## Purpose

Founder testing is a required development gate at the moments when product behavior is still inexpensive to change. Automated checks establish technical correctness; they do not establish that Vantheon feels understandable, trustworthy, or fast to use.

At each checkpoint, development pauses before the next major product slice. The handoff must include:

- one command to run the application;
- a short task-based script expressed as user goals, not implementation details;
- the deterministic fixture or scenario and any known limitations;
- the viewport or device conditions that materially affect the experience;
- the questions the checkpoint is intended to answer; and
- a place to record accepted feedback, defects, and decisions.

The checkpoint is complete only after the user has tried the application or explicitly chooses to defer the test. Feedback that changes an accepted architectural decision is recorded in `docs/decisions.md` before implementation continues.

Until a production backend exists, interactive demo commands use the contract-level authority simulator described in `PLAN.md`. Client components may display the same pending, rejected, or confirmed states expected in production, but they may do so only from simulator responses—not by manufacturing authoritative patches, Live eligibility, or evidence inside React setters. Every checkpoint handoff names the active simulator scenario so demo evidence cannot be mistaken for brokerage or production evidence.

## Checkpoints

### 1. Onboarding to Paper value

Test the first-session path from understandable intent to a structured Draft, disclosed evaluation evidence, explicit Paper launch review, active Paper V1, and safely separate Draft V2.

Questions:

- Is useful value visible before the user needs to understand the full system?
- Is the strategy artifact more prominent than conversation?
- Is the difference between Draft V2 and immutable Paper V1 unmistakable?
- Does the evaluation disclose enough evidence and limitation to justify Paper without implying Live readiness?
- Is the next action obvious at every step?
- Before launch, do Paper and Live clearly say that no portfolio exists; after launch, does Paper switch to a running portfolio count without implying that Live or the new Draft changed?
- Can the Draft/Paper/Live statuses be understood with color removed, and does compact navigation retain their full accessible names?

Do not proceed into the full iteration workspace until this model has been tested.

### 2. Rigorous iteration loop

Test a complete Paper observation to improved Draft loop: inspect a run, understand a trade or no-trade decision, attach its evidence to conversation, propose a semantic change against the current Draft, review and accept the change set, rerun evaluation, compare evidence, and launch the next Paper version.

Questions:

- Can a user move from outcome to cause without losing context?
- Is conversation acting as control and explanation while canonical artifacts carry the substance?
- Are pending, rejected, and authoritative changes visibly different?
- Can an observation from an older Paper version improve the current Draft without suggesting that Paper changed in place?
- Does comparison support a reasoned decision rather than reward headline return alone?

### 3. Live trust and capital controls

Test defined Live eligibility, semantic and independent risk review, explicit promotion confirmation, active-version visibility, authorization loss, and the separate controls for pausing future runs and cancelling eligible open orders.

Questions:

- Can the user identify exactly which immutable strategy controls capital?
- Does every consequential action state scope, impact, authority, and reversibility before confirmation?
- Are Draft suggestions visibly incapable of modifying Live directly?
- Do degraded, disconnected, stale, paused, and unauthorized states remain distinguishable without relying on color?

No production brokerage connection or real capital is used for this checkpoint.

### 4. Live-data performance and recovery

Run the deterministic simulator while switching active, warm, and cold Champions; streaming market and portfolio data; rendering both chart families; editing the Draft; and using conversation. Exercise bursts, latency, jitter, disconnect, replay, and stale snapshots. Confirm each switch restores only the selected Champion's last environment, thread, mutation target, and domain references; no prior-Champion state may flash, remain interactive, or submit under the new identity.

Questions:

- Does the workspace remain responsive and comprehensible under representative load?
- Does visible freshness remain truthful during delay and recovery?
- After replay, does browser state equal the deterministic oracle without duplicated effects?
- Do chart, summary, and accessible equivalent agree on the same normalized data?
- Which measured baselines should become reviewed performance budgets?

### 5. Release-candidate journeys

Repeat both priority journeys across the supported responsive viewports with keyboard-only, reduced-motion, and representative screen-reader checks. Include failure and recovery paths, archived Paper portfolios, long histories, and a production build.

Questions:

- Can a user complete both priority journeys without expert guidance?
- Is any interface state mistaken for business truth or current authorization?
- Are hidden or secondary controls still discoverable when needed?
- Are the remaining limitations disclosed clearly enough for the intended demo?

## Feedback record

Each checkpoint handoff records:

```text
Checkpoint:
Build or commit:
Scenario and seed:
Tested date and environment:
Observed friction:
Trust or comprehension concerns:
Defects:
Accepted changes:
Deferred questions:
Outcome: accepted | changes requested | deferred
```

Do not reinterpret informal feedback as approval. Record the outcome explicitly, and preserve unresolved safety or authority concerns until they are resolved.

## Recorded user-testing issues

### UT-001 — Strategy hierarchy is unclear in the Draft workbench

**Checkpoint:** Founder Checkpoint 1 — onboarding to Paper value

**Observed friction:** A user could not immediately tell how the strategy-level Objective relates to the `Selected Rule` inspector. It took too long to infer that the center table contains the strategy's component rules and that selecting a row changes the inspector.

**Risk:** Users may read the Objective and Selected Rule as unrelated content, weakening comprehension of the strategy artifact and making direct editing feel arbitrary.

**Required design response:** Make the hierarchy legible through layout and interaction, not a wall of instructional copy: Objective → structured strategy → selected rule inspector. The selected row, inspector title, and transition between them must visibly communicate ownership and selection.

**Status:** Open
