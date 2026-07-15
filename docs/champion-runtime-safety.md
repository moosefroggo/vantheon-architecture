# Champion Runtime Safety

## Status

Accepted as the frontend-facing and product-facing safety contract for Champion behavior. Model provider, exact tool inventory, evaluation thresholds, and upgrade policy remain Proposed decision P-009.

## Purpose

The Champion is a useful but fallible collaborator. It consumes content it does not control and can propose changes to strategies that may later control real capital. Its output is never authority, and its explanation cannot independently validate its own proposal.

This document defines the trust boundary around the Champion runtime. It does not prescribe a model provider, orchestration framework, prompt implementation, or backend service topology.

## Governing Rule

> Treat every model input as untrusted data and every model output as a proposal. Only independently validated server state and explicit authorized human actions may change strategy or capital state.

The existing command boundary still applies:

```text
untrusted input
→ Champion interpretation
→ proposed intent, explanation, or typed command
→ independent schema, permission, invariant, risk, and policy validation
→ explicit human review where required
→ authoritative server patch or rejection
```

## Threat Model

Champion inputs may be incorrect, stale, incomplete, malicious, or instruction-bearing:

- User messages and pasted content.
- News, filings, research, websites, and retrieved documents.
- Market-data metadata and third-party descriptions.
- Tool results, run logs, portfolio events, and error text.
- Conversation history, imported strategies, memories, and collaborator content.
- Model-generated content fed back into later model calls.

Primary failure classes include:

- Prompt injection or instruction smuggling through retrieved content.
- Hallucinated facts, citations, capabilities, or completed actions.
- Incorrect strategy interpretation or misleading semantic explanation.
- Unauthorized, over-broad, repeated, or stale tool calls.
- Risk-constraint removal or circumvention.
- Data exfiltration through model prompts, tools, logs, or telemetry.
- Behavioral regression after a model, prompt, tool, schema, or runtime upgrade.
- Automation bias causing a user to accept a proposal because the Champion sounds confident.

## Instruction and Data Separation

- System and policy instructions are supplied by trusted runtime configuration, not retrieved content.
- Retrieved text, tool output, and user-provided documents are delimited and labelled as data. They cannot grant permissions, change tool policy, or declare an operation authoritative.
- The runtime does not place secrets, reusable credentials, or unnecessary account data in model context.
- External citations retain source, retrieval time, and data cutoff. A citation proves where a claim came from, not that the claim is correct.
- Model-generated summaries of market or portfolio state never replace the authoritative structured data rendered beside them.

## Tool Capability Model

Tools are allowlisted and scoped by capability rather than exposed as an undifferentiated toolbox.

| Capability | Champion may do | Required authority |
|---|---|---|
| Read and explain | Query permitted strategy, evaluation, Paper, Live, and market context | Current resource authorization; output remains advisory |
| Research | Retrieve approved external or internal sources | Source policy, input isolation, citation metadata, and bounded access |
| Propose Draft change | Produce typed commands against the current Draft checkpoint | Server validation; semantic review; authoritative patch |
| Run Evaluation | Request an allowed bounded test with explicit assumptions | Server validation, resource limits, and visible execution state |
| Prepare Paper launch | Assemble the Draft snapshot and simulated-portfolio setup | User confirmation and server command validation; no eligibility verdict |
| Prepare Live promotion | Explain eligibility, impact, and unresolved warnings | Champion cannot confirm or activate; explicit authorized human action required |
| Portfolio controls | Explain state and prepare a scoped request | Champion cannot silently queue, confirm, or represent completion; fail-closed server command required |

Tool calls use least privilege, bounded arguments, timeouts, idempotency identities where appropriate, and auditable outcomes. A model cannot call a hidden general-purpose shell, arbitrary network client, database console, brokerage credential, or permission-granting tool in the product runtime.

## Independent Validation

The server validates Champion proposals without trusting the Champion's prose:

- Command schema, field types, ranges, and supported operations.
- Current user, Champion, Draft, portfolio, and destination authorization.
- Base checkpoint or entity-specific concurrency precondition.
- Strategy invariants and risk constraints that cannot be removed conversationally.
- Data freshness and dependencies required to evaluate the proposal.
- Paper launch command validity, Live eligibility, and portfolio-control policy.
- Idempotency, rate limits, resource limits, and duplicate prevention.

The semantic change review is not authored solely from model prose. Its before/after facts are derived from authoritative snapshots and validated commands. The Champion may explain motivation and trade-offs, but the UI separately identifies model-authored interpretation, deterministic domain diff, validation results, and linked evidence.

If explanation and validated change disagree, the interface blocks acceptance and surfaces the discrepancy.

## Human Gates

- Low-risk Draft proposals may be accepted only after their target and semantic effect are visible.
- Paper launch requires server validation of the exact request and explicit user confirmation; it never requires or displays a `Paper eligible` result.
- Live promotion requires the exact Paper-tested strategy, satisfied hard criteria, fresh impact/risk review, current authorization, and explicit human confirmation.
- Pausing future executions and cancelling eligible open orders remain separate human-confirmed operations.
- No conversational phrase, model tool call, generated UI component, or successful acknowledgement substitutes for confirmation.

The design must resist automation bias: confidence language is not evidence, limitations remain visible, and the safest action is not visually subordinate to the Champion's recommendation.

## Runtime Provenance

Every material Champion proposal records enough context to explain and reproduce the runtime conditions:

- Champion identity and runtime version.
- Model provider and model identifier.
- Prompt/policy configuration version.
- Toolset and tool-policy version.
- Strategy schema version.
- Input data references and cutoffs.
- Relevant retrieved-source references.
- Proposed commands, validation outcomes, and authoritative result.

This metadata supports investigation and regression testing; it does not make stochastic output perfectly reproducible.

## Model Evaluation and Upgrade Gates

Maintain a versioned evaluation suite containing representative and adversarial cases:

- Intent-to-strategy correctness and material-assumption clarification.
- Risk-limit preservation and attempts to remove protected constraints.
- Prompt injection in news, filings, tool results, and pasted user content.
- Hallucinated trades, citations, data freshness, tool completion, and authorization.
- Cross-version learning and stale-checkpoint conflicts.
- No-trade explanation and appropriate abstention.
- Tool selection, parameter bounds, duplicate calls, and failure recovery.
- Paper/Live separation and refusal to bypass Live eligibility or human confirmation.
- Privacy, secret-handling, and data-minimization cases.

A model, prompt, tool, schema, or orchestration change does not become the default merely because it appears better qualitatively. It must pass the accepted safety cases, avoid material regression on journey-quality measures, and record the comparison. High-risk failures have zero tolerance; thresholds for non-critical quality and cost remain P-009.

Canary or shadow evaluation should precede broad production rollout when the runtime can affect user-visible strategy proposals.

## Latency and Cost

Champion latency and cost are product measures separate from browser rendering performance:

- Time to first meaningful response part.
- Time to first coherent Draft or semantic proposal.
- Tool-call count and tool round-trip duration.
- Time waiting for Evaluation or other external work.
- Input/output tokens and estimated model cost per journey stage.
- Cancellation, retry, timeout, and abandonment rates.
- Percentage of latency spent in inference, tools, server validation, and frontend presentation.

The UI communicates progress by verified phase—interpreting, researching, validating, evaluating—without fabricating precision. Cost and latency budgets are established from representative journey baselines and model evaluations, not frontend event-rate simulations.

## Observability and Incident Controls

- Audit model/tool decisions with redacted structured metadata rather than unrestricted prompt logging.
- Separate product analytics, model evaluation data, security audit events, and financial audit records.
- Detect abnormal tool volume, repeated rejection, permission failures, protected-constraint changes, and prompt-injection indicators.
- Provide a runtime control to disable Champion mutation tools without changing the Draft or implying that existing portfolio orders were cancelled.
- Preserve evidence needed to investigate a harmful proposal while respecting retention and privacy policy.
- Never use customer conversations or strategies as evaluation fixtures without explicit approved handling.

## Acceptance Criteria

- Untrusted content cannot grant a capability or modify trusted policy instructions.
- The Champion cannot directly confirm Paper launch, Live promotion, execution pause, or order cancellation.
- Every Draft mutation is independently validated and reconciled through an authoritative patch.
- Semantic review facts come from authoritative state, not solely from the proposing model.
- Protected risk constraints cannot be removed through ordinary Champion commands.
- A seeded prompt-injection and hallucination suite runs for every material runtime upgrade.
- Runtime provenance identifies the model, policy, tools, data cutoff, commands, and validation result for a consequential proposal.
- Model latency and cost are measured as part of both priority journeys.

## Proposed Decisions

See P-009 for the model/provider, tool inventory, evaluation thresholds, and upgrade gates. See P-002 for identity and data-retention policy, P-007 for Live evidence thresholds, and P-011 for telemetry retention and redaction.
