import { canonicalJson, hashStrategy } from "./hash";
import type { AnyDomainReference } from "@/domain/identity";
import type {
  DraftCheckpointRecord,
  EntityTable,
  OrderRecord,
  StructuredStrategy,
  WorkspaceScenario,
} from "./types";

export interface WorkspaceScenarioViolation {
  code: string;
  path: string;
  message: string;
}

export class WorkspaceScenarioInvariantError extends Error {
  constructor(readonly violations: WorkspaceScenarioViolation[]) {
    super(
      `Workspace scenario violates ${violations.length} invariant${
        violations.length === 1 ? "" : "s"
      }.`
    );
    this.name = "WorkspaceScenarioInvariantError";
  }
}

export async function assertValidWorkspaceScenario(
  scenario: WorkspaceScenario
): Promise<void> {
  const violations = await validateWorkspaceScenario(scenario);
  if (violations.length > 0) {
    throw new WorkspaceScenarioInvariantError(violations);
  }
}

export async function validateWorkspaceScenario(
  scenario: WorkspaceScenario
): Promise<WorkspaceScenarioViolation[]> {
  const violations: WorkspaceScenarioViolation[] = [];
  const add = (code: string, path: string, message: string) => {
    violations.push({ code, path, message });
  };

  if (!Number.isInteger(scenario.seedVersion) || scenario.seedVersion < 1) {
    add(
      "invalid-seed-version",
      "seedVersion",
      "Seed version must be a positive integer."
    );
  }
  if (!/^rev_[0-9]{6}$/.test(scenario.revision)) {
    add(
      "invalid-scenario-revision",
      "revision",
      "Scenario revision must use the demo authority revision format."
    );
  }
  if (
    Number.isNaN(Date.parse(scenario.seededAt)) ||
    Number.isNaN(Date.parse(scenario.clock))
  ) {
    add(
      "invalid-scenario-clock",
      "clock",
      "Scenario timestamps must be valid ISO timestamps."
    );
  }

  for (const [tableName, records] of scenarioTables(scenario)) {
    for (const [key, record] of Object.entries(records)) {
      if (key !== record.id) {
        add(
          "entity-key-mismatch",
          `${tableName}.${key}`,
          `Entity table key must equal record ID ${record.id}.`
        );
      }
      if (!/^rev_[0-9]{6}$/.test(record.revision)) {
        add(
          "invalid-revision",
          `${tableName}.${key}.revision`,
          "Entity revisions must use the demo authority revision format."
        );
      }
    }
  }

  for (const champion of Object.values(scenario.champions)) {
    const draft = scenario.drafts[champion.currentDraftId];
    if (!draft) {
      add(
        "missing-current-draft",
        `champions.${champion.id}.currentDraftId`,
        "Champion current Draft must resolve."
      );
      continue;
    }
    if (draft.championId !== champion.id || draft.lineageId !== champion.lineageId) {
      add(
        "cross-champion-reference",
        `champions.${champion.id}.currentDraftId`,
        "Champion current Draft must belong to the same Champion and lineage."
      );
    }
    if (draft.status !== "active") {
      add(
        "inactive-current-draft",
        `drafts.${draft.id}.status`,
        "Champion current Draft must be active."
      );
    }
    const activeDrafts = Object.values(scenario.drafts).filter(
      (candidate) =>
        candidate.championId === champion.id && candidate.status === "active"
    );
    if (activeDrafts.length !== 1) {
      add(
        "active-draft-cardinality",
        `champions.${champion.id}`,
        "A Champion must have exactly one active Draft."
      );
    }
  }

  for (const draft of Object.values(scenario.drafts)) {
    const champion = scenario.champions[draft.championId];
    const checkpoint = scenario.checkpoints[draft.currentCheckpointId];
    if (!champion) {
      add(
        "missing-champion",
        `drafts.${draft.id}.championId`,
        "Draft Champion must resolve."
      );
    }
    if (!checkpoint) {
      add(
        "missing-current-checkpoint",
        `drafts.${draft.id}.currentCheckpointId`,
        "Draft current checkpoint must resolve."
      );
    } else if (
      checkpoint.draftId !== draft.id ||
      checkpoint.championId !== draft.championId ||
      checkpoint.generation !== draft.generation
    ) {
      add(
        "checkpoint-draft-mismatch",
        `drafts.${draft.id}.currentCheckpointId`,
        "Current checkpoint must belong to the Draft generation."
      );
    }
  }

  await Promise.all(
    Object.values(scenario.checkpoints).map(async (checkpoint) => {
      const path = `checkpoints.${checkpoint.id}`;
      const draft = scenario.drafts[checkpoint.draftId];
      if (!draft || draft.championId !== checkpoint.championId) {
        add(
          "checkpoint-owner-mismatch",
          `${path}.draftId`,
          "Checkpoint Draft and Champion must resolve consistently."
        );
      }
      if (checkpoint.label !== `V${checkpoint.generation}.${checkpoint.ordinal}`) {
        add(
          "checkpoint-label-mismatch",
          `${path}.label`,
          "Checkpoint label must derive from generation and ordinal."
        );
      }
      if (
        checkpoint.previousCheckpointId &&
        !scenario.checkpoints[checkpoint.previousCheckpointId]
      ) {
        add(
          "missing-previous-checkpoint",
          `${path}.previousCheckpointId`,
          "Previous checkpoint must resolve."
        );
      }
      const actualHash = await hashStrategy(checkpoint.strategy);
      if (actualHash !== checkpoint.strategyHash) {
        add(
          "checkpoint-hash-mismatch",
          `${path}.strategyHash`,
          "Checkpoint hash must match its canonical strategy content."
        );
      }
      validateStrategy(checkpoint.strategy, path, add);
      validateActor(scenario, checkpoint.createdBy, `${path}.createdBy`, add);

      if (checkpoint.origin.kind === "accepted-change-set") {
        const changeSet = scenario.changeSets[checkpoint.origin.changeSetId];
        if (
          !changeSet ||
          changeSet.status !== "accepted" ||
          changeSet.resultCheckpointId !== checkpoint.id
        ) {
          add(
            "invalid-change-set-origin",
            `${path}.origin`,
            "Accepted-change origin must resolve to the accepting change set."
          );
        }
      }
      if (checkpoint.origin.kind === "paper-launch-clone") {
        const portfolio = scenario.portfolios[checkpoint.origin.portfolioId];
        const source = scenario.checkpoints[checkpoint.origin.sourceCheckpointId];
        if (!portfolio || !source || source.strategyHash !== checkpoint.strategyHash) {
          add(
            "invalid-paper-clone-origin",
            `${path}.origin`,
            "Paper clone must resolve to its portfolio and exact source strategy."
          );
        }
      }
    })
  );

  await Promise.all(
    Object.values(scenario.strategies).map(async (strategy) => {
      const path = `strategies.${strategy.id}`;
      const source = scenario.checkpoints[strategy.sourceCheckpointId];
      const actualHash = await hashStrategy(strategy.strategy);
      if (
        !source ||
        source.championId !== strategy.championId ||
        source.strategyHash !== strategy.strategyHash ||
        actualHash !== strategy.strategyHash
      ) {
        add(
          "immutable-strategy-source-mismatch",
          path,
          "Immutable strategy must exactly match its source checkpoint."
        );
      }
      validateStrategy(strategy.strategy, path, add);
    })
  );

  for (const changeSet of Object.values(scenario.changeSets)) {
    const path = `changeSets.${changeSet.id}`;
    const draft = scenario.drafts[changeSet.draftId];
    const base = scenario.checkpoints[changeSet.baseCheckpointId];
    if (
      !draft ||
      !base ||
      draft.championId !== changeSet.championId ||
      base.championId !== changeSet.championId
    ) {
      add(
        "change-set-owner-mismatch",
        path,
        "Change set Draft, base checkpoint, and Champion must agree."
      );
    }
    if (changeSet.kind === "restore") {
      const source = changeSet.restoreSourceCheckpointId
        ? scenario.checkpoints[changeSet.restoreSourceCheckpointId]
        : undefined;
      if (!source || source.championId !== changeSet.championId) {
        add(
          "invalid-restore-source",
          `${path}.restoreSourceCheckpointId`,
          "Restore source must resolve within the Champion lineage."
        );
      }
    }
    if (
      changeSet.status === "accepted" &&
      !changeSet.resultCheckpointId
    ) {
      add(
        "accepted-change-without-checkpoint",
        `${path}.resultCheckpointId`,
        "Accepted change sets must identify their resulting checkpoint."
      );
    }
    if (
      changeSet.status !== "accepted" &&
      changeSet.resultCheckpointId !== undefined
    ) {
      add(
        "unaccepted-change-with-checkpoint",
        `${path}.resultCheckpointId`,
        "Only accepted change sets may produce checkpoints."
      );
    }
    validateActor(scenario, changeSet.createdBy, `${path}.createdBy`, add);
  }

  for (const evaluation of Object.values(scenario.evaluations)) {
    const path = `evaluations.${evaluation.id}`;
    const checkpoint = scenario.checkpoints[evaluation.checkpointId];
    if (
      !checkpoint ||
      checkpoint.draftId !== evaluation.draftId ||
      checkpoint.championId !== evaluation.championId ||
      checkpoint.strategyHash !== evaluation.strategyHash
    ) {
      add(
        "evaluation-target-mismatch",
        path,
        "Evaluation must retain the exact checkpoint and strategy hash tested."
      );
    }
    if (!scenario.benchmarks[evaluation.setup.benchmarkId]) {
      add(
        "missing-evaluation-benchmark",
        `${path}.setup.benchmarkId`,
        "Evaluation benchmark must resolve."
      );
    }
    if (evaluation.summary.decisions !== evaluation.decisionIds.length) {
      add(
        "decision-count-mismatch",
        `${path}.summary.decisions`,
        "Decision count must derive from decision references."
      );
    }
    const uniqueReferenceGroups: Array<[string, readonly string[]]> = [
      ["decision", evaluation.decisionIds],
      ["order", evaluation.orderIds],
      ["event", evaluation.eventIds],
      ["source", evaluation.sourceArtifactIds],
    ];
    for (const [label, references] of uniqueReferenceGroups) {
      if (new Set(references).size !== references.length) {
        add(
          `duplicate-evaluation-${label}-reference`,
          path,
          `Evaluation ${label} references must be unique.`
        );
      }
    }
    if (evaluation.summary.submittedOrders !== evaluation.orderIds.length) {
      add(
        "order-count-mismatch",
        `${path}.summary.submittedOrders`,
        "Submitted-order count must derive from order references."
      );
    }
    for (const decisionId of evaluation.decisionIds) {
      if (scenario.decisions[decisionId]?.evaluationId !== evaluation.id) {
        add(
          "evaluation-decision-mismatch",
          `${path}.decisionIds`,
          "Evaluation decisions must resolve back to the Evaluation."
        );
      }
    }
    for (const orderId of evaluation.orderIds) {
      const order = scenario.orders[orderId];
      if (
        order?.provenance.kind !== "evaluation" ||
        order.provenance.evaluationId !== evaluation.id
      ) {
        add(
          "evaluation-order-mismatch",
          `${path}.orderIds`,
          "Evaluation orders must resolve back to the Evaluation."
        );
      }
    }
    for (const eventId of evaluation.eventIds) {
      if (scenario.evaluationEvents[eventId]?.evaluationId !== evaluation.id) {
        add(
          "evaluation-event-mismatch",
          `${path}.eventIds`,
          "Evaluation events must resolve back to the Evaluation."
        );
      }
    }
    for (const sourceId of evaluation.sourceArtifactIds) {
      if (!scenario.sourceArtifacts[sourceId]) {
        add(
          "missing-source-artifact",
          `${path}.sourceArtifactIds`,
          "Evaluation source artifacts must resolve."
        );
      }
    }
    for (const ruleResult of evaluation.ruleEvaluations) {
      if (
        checkpoint &&
        !strategyRuleIds(checkpoint.strategy).has(ruleResult.ruleId)
      ) {
        add(
          "unknown-evaluated-rule",
          `${path}.ruleEvaluations`,
          "Every rule result must refer to the tested strategy."
        );
      }
      if (
        ruleResult.sourceArtifactId &&
        !scenario.sourceArtifacts[ruleResult.sourceArtifactId]
      ) {
        add(
          "missing-rule-source",
          `${path}.ruleEvaluations`,
          "Rule evidence source must resolve to a source artifact."
        );
      }
    }
  }

  for (const portfolio of Object.values(scenario.portfolios)) {
    const path = `portfolios.${portfolio.id}`;
    const strategy = scenario.strategies[portfolio.strategyId];
    const checkpoint = scenario.checkpoints[portfolio.sourceCheckpointId];
    const deployment = scenario.deployments[portfolio.deploymentId];
    const schedule = scenario.schedules[portfolio.scheduleId];
    const currentAccount =
      scenario.accountSnapshots[portfolio.currentAccountSnapshotId];
    if (
      Object.values(scenario.portfolios).filter(
        (candidate) => candidate.strategyId === portfolio.strategyId
      ).length !== 1
    ) {
      add(
        "strategy-paper-cardinality-mismatch",
        `${path}.strategyId`,
        "One immutable strategy version must resolve to exactly one Paper portfolio."
      );
    }
    if (
      !strategy ||
      !checkpoint ||
      strategy.sourceCheckpointId !== checkpoint.id ||
      strategy.championId !== portfolio.championId
    ) {
      add(
        "portfolio-strategy-mismatch",
        path,
        "Paper must retain one immutable strategy and source checkpoint."
      );
    }
    if (
      !deployment ||
      deployment.portfolioId !== portfolio.id ||
      deployment.strategyId !== portfolio.strategyId
    ) {
      add(
        "portfolio-deployment-mismatch",
        `${path}.deploymentId`,
        "Portfolio deployment must resolve and use the same strategy."
      );
    }
    if (!schedule || schedule.portfolioId !== portfolio.id) {
      add(
        "portfolio-schedule-mismatch",
        `${path}.scheduleId`,
        "Portfolio schedule must resolve."
      );
    }
    if (
      schedule &&
      strategy &&
      canonicalJson(schedule.definition) !==
        canonicalJson(strategy.strategy.schedule)
    ) {
      add(
        "portfolio-schedule-strategy-mismatch",
        `${path}.scheduleId`,
        "Deployment schedule must retain the launched strategy semantics."
      );
    }
    if (!scenario.benchmarks[portfolio.benchmarkId]) {
      add(
        "missing-portfolio-benchmark",
        `${path}.benchmarkId`,
        "Portfolio launch benchmark must resolve."
      );
    }
    if (!currentAccount || currentAccount.portfolioId !== portfolio.id) {
      add(
        "portfolio-account-snapshot-mismatch",
        `${path}.currentAccountSnapshotId`,
        "Portfolio current account snapshot must resolve to the same portfolio."
      );
    }
    if (
      portfolio.state === "active" &&
      deployment?.state !== "active"
    ) {
      add(
        "active-portfolio-without-deployment",
        path,
        "An active portfolio must have an active deployment."
      );
    }
    if (
      portfolio.state !== "active" &&
      deployment?.state === "active"
    ) {
      add(
        "inactive-portfolio-with-active-deployment",
        path,
        "Stopped or archived portfolios cannot retain an active deployment."
      );
    }
    if (portfolio.state !== "active" && schedule?.nextRunAt) {
      add(
        "inactive-portfolio-has-next-run",
        `${path}.scheduleId`,
        "Stopped or archived portfolios cannot advertise a future run."
      );
    }
    const activeDeployments = Object.values(scenario.deployments).filter(
      (candidate) =>
        candidate.portfolioId === portfolio.id && candidate.state === "active"
    );
    if (activeDeployments.length > 1) {
      add(
        "multiple-active-deployments",
        path,
        "A Paper portfolio may have at most one active deployment."
      );
    }
  }

  for (const deployment of Object.values(scenario.deployments)) {
    const portfolio = scenario.portfolios[deployment.portfolioId];
    if (
      !portfolio ||
      portfolio.strategyId !== deployment.strategyId ||
      portfolio.scheduleId !== deployment.scheduleId
    ) {
      add(
        "deployment-provenance-mismatch",
        `deployments.${deployment.id}`,
        "Deployment must resolve to a portfolio with the same strategy and schedule."
      );
    }
  }

  for (const run of Object.values(scenario.runs)) {
    const path = `runs.${run.id}`;
    const portfolio = scenario.portfolios[run.portfolioId];
    const deployment = scenario.deployments[run.deploymentId];
    const schedule = scenario.schedules[run.scheduleId];
    const observation =
      scenario.benchmarkObservations[run.benchmarkObservationId];
    const beforeAccount =
      scenario.accountSnapshots[run.beforeAccountSnapshotId];
    const afterAccount = scenario.accountSnapshots[run.afterAccountSnapshotId];
    if (
      !portfolio ||
      !deployment ||
      !schedule ||
      portfolio.deploymentId !== run.deploymentId ||
      portfolio.strategyId !== run.strategyId ||
      portfolio.scheduleId !== run.scheduleId ||
      portfolio.benchmarkId !== run.benchmarkId
    ) {
      add(
        "run-provenance-mismatch",
        path,
        "Run must match its portfolio, deployment, strategy, schedule, and benchmark."
      );
    }
    if (
      !observation ||
      observation.runId !== run.id ||
      observation.benchmarkId !== run.benchmarkId ||
      observation.observedAt !== run.completedAt
    ) {
      add(
        "run-benchmark-mismatch",
        `${path}.benchmarkObservationId`,
        "Each run must have one same-time observation from its launch benchmark."
      );
    }
    if (
      !beforeAccount ||
      !afterAccount ||
      beforeAccount.portfolioId !== run.portfolioId ||
      afterAccount.portfolioId !== run.portfolioId ||
      afterAccount.sourceRunId !== run.id ||
      afterAccount.asOf !== run.completedAt
    ) {
      add(
        "run-account-snapshot-mismatch",
        path,
        "Run must connect ordered before/after account snapshots and own its after snapshot."
      );
    }
    if (
      beforeAccount &&
      (Date.parse(beforeAccount.asOf) > Date.parse(run.startedAt) ||
        (afterAccount &&
          Date.parse(beforeAccount.asOf) > Date.parse(afterAccount.asOf)))
    ) {
      add(
        "run-account-time-order",
        path,
        "Run account snapshots must be ordered around execution."
      );
    }
    if (
      Date.parse(run.dataCutoff) > Date.parse(run.startedAt) ||
      Date.parse(run.startedAt) > Date.parse(run.completedAt)
    ) {
      add(
        "run-time-order",
        path,
        "Run cutoff, start, and completion timestamps must be ordered."
      );
    }
    if (
      schedule?.definition.cadence === "monthly-first-business-day" &&
      !isFirstBusinessDay(run.scheduledFor, schedule.definition.timezone)
    ) {
      add(
        "monthly-cadence-mismatch",
        `${path}.scheduledFor`,
        "Monthly run must occur on the first business day in schedule timezone."
      );
    }
    if (
      new Set(run.decisionIds).size !== run.decisionIds.length ||
      new Set(run.orderIds).size !== run.orderIds.length
    ) {
      add(
        "duplicate-run-reference",
        path,
        "Run decision and order references must be unique."
      );
    }
    for (const decisionId of run.decisionIds) {
      if (scenario.decisions[decisionId]?.runId !== run.id) {
        add(
          "run-decision-mismatch",
          `${path}.decisionIds`,
          "Run decisions must resolve back to the run."
        );
      }
    }
  }

  for (const observation of Object.values(scenario.benchmarkObservations)) {
    const run = scenario.runs[observation.runId];
    if (!run || run.benchmarkObservationId !== observation.id) {
      add(
        "orphan-benchmark-observation",
        `benchmarkObservations.${observation.id}`,
        "Benchmark observation must be owned by exactly one run."
      );
    }
  }

  for (const portfolio of Object.values(scenario.portfolios)) {
    const sequences = Object.values(scenario.runs)
      .filter((run) => run.portfolioId === portfolio.id)
      .map((run) => run.sequence);
    if (new Set(sequences).size !== sequences.length) {
      add(
        "duplicate-run-sequence",
        `portfolios.${portfolio.id}`,
        "Run sequence must be unique within a portfolio."
      );
    }
  }

  for (const decision of Object.values(scenario.decisions)) {
    const provenanceCount = Number(Boolean(decision.evaluationId)) + Number(Boolean(decision.runId));
    if (provenanceCount !== 1) {
      add(
        "decision-provenance-cardinality",
        `decisions.${decision.id}`,
        "A decision must belong to exactly one Evaluation or run."
      );
    }
  }

  for (const order of Object.values(scenario.orders)) {
    validateOrder(scenario, order, add);
  }

  validateAccountsPositionsAndFills(scenario, add);

  for (const champion of Object.values(scenario.champions)) {
    const exchanges = Object.values(scenario.atlasExchanges).filter(
      (exchange) => exchange.championId === champion.id
    );
    if (new Set(exchanges.map((exchange) => exchange.sequence)).size !== exchanges.length) {
      add(
        "duplicate-atlas-sequence",
        `champions.${champion.id}`,
        "Sent Atlas exchange sequence must be unique within a Champion."
      );
    }
  }
  for (const exchange of Object.values(scenario.atlasExchanges)) {
    const path = `atlasExchanges.${exchange.id}`;
    if (!scenario.champions[exchange.championId]) {
      add("missing-atlas-champion", path, "Atlas exchange Champion must resolve.");
    }
    if (!exchange.userText.trim() || exchange.sequence < 1) {
      add(
        "invalid-atlas-exchange",
        path,
        "Persisted Atlas exchanges require sent text and a positive sequence."
      );
    }
    if (
      exchange.status === "completed" &&
      (!exchange.assistantText?.trim() || !exchange.completedAt)
    ) {
      add(
        "incomplete-atlas-response",
        path,
        "Completed Atlas exchanges require persisted response text and completion time."
      );
    }
    for (const reference of exchange.references) {
      if (!domainReferenceResolves(scenario, reference)) {
        add(
          "missing-atlas-reference",
          `${path}.references`,
          "Atlas exchange references must resolve to canonical domain records."
        );
      } else {
        const ownerChampionId = domainReferenceChampionId(scenario, reference);
        if (ownerChampionId && ownerChampionId !== exchange.championId) {
          add(
            "cross-champion-atlas-reference",
            `${path}.references`,
            "Atlas exchange cannot retain a reference owned by another Champion."
          );
        }
      }
    }
  }

  const idempotencyKeys = new Set<string>();
  for (const receipt of Object.values(scenario.receipts)) {
    if (idempotencyKeys.has(receipt.idempotencyKey)) {
      add(
        "duplicate-idempotency-key",
        `receipts.${receipt.id}.idempotencyKey`,
        "Each idempotency key may resolve to only one receipt."
      );
    }
    idempotencyKeys.add(receipt.idempotencyKey);
    if (receipt.outcome === "applied" && !receipt.result) {
      add(
        "applied-receipt-without-result",
        `receipts.${receipt.id}`,
        "Applied receipts must carry a result."
      );
    }
    if (
      ["rejected", "failed", "conflicted"].includes(receipt.outcome) &&
      !receipt.failure
    ) {
      add(
        "failed-receipt-without-failure",
        `receipts.${receipt.id}`,
        "Rejected, failed, and conflicted receipts must explain the failure."
      );
    }
    if (
      receipt.lifecycle[0]?.state !== "submitted" ||
      receipt.lifecycle.at(-1)?.state !== receipt.outcome ||
      receipt.lifecycle[0]?.occurredAt !== receipt.submittedAt
    ) {
      add(
        "invalid-command-lifecycle",
        `receipts.${receipt.id}.lifecycle`,
        "Receipt lifecycle must preserve submission order and its final authority truth."
      );
    }
    const acceptedTransition = receipt.lifecycle.find(
      (transition) => transition.state === "accepted"
    );
    if (
      (acceptedTransition && receipt.acceptedAt !== acceptedTransition.occurredAt) ||
      (!acceptedTransition && receipt.acceptedAt)
    ) {
      add(
        "invalid-command-acceptance-time",
        `receipts.${receipt.id}`,
        "Receipt accepted time must match its accepted lifecycle transition."
      );
    }
    if (
      ["applied", "rejected", "failed", "conflicted"].includes(
        receipt.outcome
      ) &&
      !receipt.completedAt
    ) {
      add(
        "missing-command-completion-time",
        `receipts.${receipt.id}`,
        "Terminal receipts require a completion time."
      );
    }
  }

  return violations;
}

function validateOrder(
  scenario: WorkspaceScenario,
  order: OrderRecord,
  add: (code: string, path: string, message: string) => void
) {
  const path = `orders.${order.id}`;
  if (
    !Number.isFinite(order.requestedQuantity) ||
    order.requestedQuantity <= 0 ||
    !Number.isFinite(order.filledQuantity) ||
    order.filledQuantity < 0 ||
    order.filledQuantity > order.requestedQuantity
  ) {
    add(
      "invalid-order-quantity",
      path,
      "Requested and filled quantities must be finite and filled cannot exceed requested."
    );
  }
  for (const [label, price] of [
    ["requestedPrice", order.requestedPrice],
    ["averageFillPrice", order.averageFillPrice],
  ] as const) {
    if (price !== undefined && (!Number.isFinite(price) || price <= 0)) {
      add("invalid-order-price", `${path}.${label}`, "Order prices must be positive.");
    }
  }

  if (order.provenance.kind === "evaluation") {
    const evaluation = scenario.evaluations[order.provenance.evaluationId];
    const decision = scenario.decisions[order.provenance.decisionId];
    if (
      !evaluation ||
      !decision ||
      decision.evaluationId !== evaluation.id ||
      !evaluation.orderIds.includes(order.id)
    ) {
      add(
        "evaluation-order-provenance-mismatch",
        path,
        "Evaluation order must resolve to its Evaluation and decision."
      );
    }
  } else if (order.provenance.kind === "portfolio-run") {
    const run = scenario.runs[order.provenance.runId];
    const decision = scenario.decisions[order.provenance.decisionId];
    if (
      !run ||
      !decision ||
      decision.runId !== run.id ||
      !run.orderIds.includes(order.id) ||
      order.portfolioId !== run.portfolioId
    ) {
      add(
        "run-order-provenance-mismatch",
        path,
        "Run order must resolve to its portfolio, run, and decision."
      );
    }
  } else {
    if (
      !scenario.portfolios[order.provenance.portfolioId] ||
      order.portfolioId !== order.provenance.portfolioId ||
      !order.provenance.reason.trim()
    ) {
      add(
        "manual-order-provenance-mismatch",
        path,
        "Manual Paper orders require a matching portfolio, actor, and reason."
      );
    }
    validateActor(scenario, order.provenance.actor, `${path}.provenance.actor`, add);
  }

  const fills = Object.values(scenario.fills).filter(
    (fill) => fill.orderId === order.id
  );
  const filledQuantity = fills.reduce((sum, fill) => sum + fill.quantity, 0);
  if (!closeEnough(filledQuantity, order.filledQuantity)) {
    add(
      "order-fill-quantity-mismatch",
      path,
      "Order filled quantity must derive from normalized fills."
    );
  }
  if (fills.length > 0) {
    const weightedPrice =
      fills.reduce((sum, fill) => sum + fill.quantity * fill.price, 0) /
      filledQuantity;
    if (
      order.averageFillPrice === undefined ||
      !closeEnough(weightedPrice, order.averageFillPrice)
    ) {
      add(
        "order-average-fill-price-mismatch",
        path,
        "Average fill price must be quantity-weighted from fills."
      );
    }
  }
  if (
    order.status === "filled" &&
    (!closeEnough(order.filledQuantity, order.requestedQuantity) ||
      !order.submittedAt ||
      !order.filledAt)
  ) {
    add(
      "invalid-filled-order",
      path,
      "Filled orders require full quantity plus submitted and filled timestamps."
    );
  }
  if (
    order.status === "partially-filled" &&
    (order.filledQuantity <= 0 ||
      order.filledQuantity >= order.requestedQuantity)
  ) {
    add(
      "invalid-partial-order",
      path,
      "Partially filled orders require a quantity strictly between zero and requested."
    );
  }
}

function validateAccountsPositionsAndFills(
  scenario: WorkspaceScenario,
  add: (code: string, path: string, message: string) => void
) {
  for (const snapshot of Object.values(scenario.accountSnapshots)) {
    const path = `accountSnapshots.${snapshot.id}`;
    const monetaryValues = [
      snapshot.cash,
      snapshot.reservedCash,
      snapshot.buyingPower,
      snapshot.positionsMarketValue,
      snapshot.grossExposureValue,
      snapshot.netExposureValue,
      snapshot.accountValue,
      snapshot.netContributions,
      snapshot.realizedPnl,
      snapshot.unrealizedPnl,
      snapshot.income,
      snapshot.fees,
      snapshot.dailyPnlExFlows,
      snapshot.cumulativeTimeWeightedReturn,
    ];
    if (!scenario.portfolios[snapshot.portfolioId]) {
      add("missing-account-portfolio", path, "Account snapshot portfolio must resolve.");
    }
    if (monetaryValues.some((value) => !Number.isFinite(value))) {
      add("invalid-account-number", path, "Account snapshot numbers must be finite.");
    }
    if (
      !closeEnough(
        snapshot.accountValue,
        snapshot.cash + snapshot.positionsMarketValue
      )
    ) {
      add(
        "account-balance-mismatch",
        path,
        "Account value must equal cash plus positions market value."
      );
    }
    if (
      !closeEnough(
        snapshot.buyingPower,
        Math.max(0, snapshot.cash - snapshot.reservedCash)
      )
    ) {
      add(
        "buying-power-mismatch",
        path,
        "Buying power must derive from cash less reserved cash."
      );
    }
    if (
      !closeEnough(
        snapshot.accountValue,
        snapshot.netContributions +
          snapshot.realizedPnl +
          snapshot.unrealizedPnl +
          snapshot.income -
          snapshot.fees
      )
    ) {
      add(
        "account-pnl-mismatch",
        path,
        "Account value must reconcile contributions and investment P&L."
      );
    }
    if (snapshot.grossExposureValue < Math.abs(snapshot.netExposureValue)) {
      add(
        "invalid-account-exposure",
        path,
        "Gross exposure cannot be smaller than absolute net exposure."
      );
    }
    if (snapshot.sourceRunId) {
      const run = scenario.runs[snapshot.sourceRunId];
      if (
        !run ||
        run.portfolioId !== snapshot.portfolioId ||
        run.afterAccountSnapshotId !== snapshot.id
      ) {
        add(
          "account-run-provenance-mismatch",
          path,
          "Run-produced account snapshot must resolve back to that run."
        );
      }
    }
  }

  for (const position of Object.values(scenario.positions)) {
    const path = `positions.${position.id}`;
    const portfolio = scenario.portfolios[position.portfolioId];
    const snapshot = scenario.accountSnapshots[position.accountSnapshotId];
    if (
      !portfolio ||
      !snapshot ||
      snapshot.portfolioId !== position.portfolioId ||
      portfolio.currentAccountSnapshotId !== snapshot.id
    ) {
      add(
        "position-account-mismatch",
        path,
        "Current position must resolve to its portfolio current account snapshot."
      );
    }
    if (
      position.quantity <= 0 ||
      position.availableToClose < 0 ||
      position.availableToClose > position.quantity ||
      position.averageCost < 0 ||
      position.markPrice < 0
    ) {
      add("invalid-position-quantity", path, "Position quantities and prices are invalid.");
    }
    if (!closeEnough(position.marketValue, position.quantity * position.markPrice)) {
      add(
        "position-market-value-mismatch",
        path,
        "Position market value must derive from quantity and mark."
      );
    }
    if (
      !closeEnough(
        position.unrealizedPnl,
        position.marketValue - position.quantity * position.averageCost
      )
    ) {
      add(
        "position-pnl-mismatch",
        path,
        "Position unrealized P&L must reconcile cost basis and market value."
      );
    }
    if (
      snapshot &&
      !closeEnough(position.weight, position.marketValue / snapshot.accountValue, 0.000001)
    ) {
      add(
        "position-weight-mismatch",
        path,
        "Position weight must derive from current account value."
      );
    }
  }

  for (const portfolio of Object.values(scenario.portfolios)) {
    const snapshot = scenario.accountSnapshots[portfolio.currentAccountSnapshotId];
    const positions = Object.values(scenario.positions).filter(
      (position) => position.portfolioId === portfolio.id
    );
    if (
      snapshot &&
      !closeEnough(
        positions.reduce((sum, position) => sum + position.marketValue, 0),
        snapshot.positionsMarketValue
      )
    ) {
      add(
        "portfolio-position-total-mismatch",
        `portfolios.${portfolio.id}`,
        "Current account positions value must derive from normalized positions."
      );
    }
    const symbols = positions.map((position) => position.symbol);
    if (new Set(symbols).size !== symbols.length) {
      add(
        "duplicate-portfolio-position",
        `portfolios.${portfolio.id}`,
        "A portfolio may have only one current position per symbol."
      );
    }
    const snapshots = Object.values(scenario.accountSnapshots)
      .filter((candidate) => candidate.portfolioId === portfolio.id)
      .sort((left, right) => left.asOf.localeCompare(right.asOf));
    if (snapshots.at(-1)?.id !== portfolio.currentAccountSnapshotId) {
      add(
        "stale-current-account-snapshot",
        `portfolios.${portfolio.id}.currentAccountSnapshotId`,
        "Portfolio current account snapshot must be its latest confirmed snapshot."
      );
    }
    const runs = Object.values(scenario.runs)
      .filter((run) => run.portfolioId === portfolio.id)
      .sort((left, right) => left.sequence - right.sequence);
    for (let index = 1; index < runs.length; index += 1) {
      if (
        runs[index].beforeAccountSnapshotId !==
        runs[index - 1].afterAccountSnapshotId
      ) {
        add(
          "broken-account-snapshot-chain",
          `runs.${runs[index].id}`,
          "Each run must begin from the prior run's confirmed after snapshot."
        );
      }
    }
    if (
      runs.length > 0 &&
      runs.at(-1)?.afterAccountSnapshotId !== portfolio.currentAccountSnapshotId
    ) {
      add(
        "current-account-run-mismatch",
        `portfolios.${portfolio.id}.currentAccountSnapshotId`,
        "Portfolio current account must be the latest completed run output."
      );
    }
  }

  for (const fill of Object.values(scenario.fills)) {
    const path = `fills.${fill.id}`;
    const order = scenario.orders[fill.orderId];
    if (
      !order ||
      order.portfolioId !== fill.portfolioId ||
      !scenario.portfolios[fill.portfolioId]
    ) {
      add(
        "fill-order-provenance-mismatch",
        path,
        "Fill must resolve to an order and the same Paper portfolio."
      );
    }
    if (
      fill.runId &&
      (order?.provenance.kind !== "portfolio-run" ||
        order.provenance.runId !== fill.runId)
    ) {
      add(
        "fill-run-provenance-mismatch",
        path,
        "Run fill must match the originating order run."
      );
    }
    if (
      !Number.isFinite(fill.quantity) ||
      fill.quantity <= 0 ||
      !Number.isFinite(fill.price) ||
      fill.price <= 0 ||
      !Number.isFinite(fill.fees) ||
      fill.fees < 0
    ) {
      add("invalid-fill", path, "Fill quantity, price, and fees are invalid.");
    }
  }
}

function domainReferenceResolves(
  scenario: WorkspaceScenario,
  reference: AnyDomainReference
) {
  switch (reference.kind) {
    case "user":
      return Boolean(scenario.users[reference.id]);
    case "champion":
      return Boolean(scenario.champions[reference.id]);
    case "workspace-scenario":
      return scenario.id === reference.id;
    case "draft":
      return Boolean(scenario.drafts[reference.id]);
    case "draft-checkpoint":
      return Boolean(scenario.checkpoints[reference.id]);
    case "immutable-strategy":
      return Boolean(scenario.strategies[reference.id]);
    case "paper-portfolio":
      return Boolean(scenario.portfolios[reference.id]);
    case "portfolio-account-snapshot":
      return Boolean(scenario.accountSnapshots[reference.id]);
    case "position":
      return Boolean(scenario.positions[reference.id]);
    case "deployment":
      return Boolean(scenario.deployments[reference.id]);
    case "portfolio-run":
      return Boolean(scenario.runs[reference.id]);
    case "schedule":
      return Boolean(scenario.schedules[reference.id]);
    case "benchmark":
      return Boolean(scenario.benchmarks[reference.id]);
    case "benchmark-observation":
      return Boolean(scenario.benchmarkObservations[reference.id]);
    case "evaluation":
      return Boolean(scenario.evaluations[reference.id]);
    case "evaluation-event":
      return Boolean(scenario.evaluationEvents[reference.id]);
    case "source-artifact":
      return Boolean(scenario.sourceArtifacts[reference.id]);
    case "decision":
      return Boolean(scenario.decisions[reference.id]);
    case "order":
      return Boolean(scenario.orders[reference.id]);
    case "fill":
      return Boolean(scenario.fills[reference.id]);
    case "change-set":
      return Boolean(scenario.changeSets[reference.id]);
    case "command":
      return Object.values(scenario.receipts).some(
        (receipt) => receipt.commandId === reference.id
      );
    case "command-receipt":
      return Boolean(scenario.receipts[reference.id]);
    case "atlas-exchange":
      return Boolean(scenario.atlasExchanges[reference.id]);
    case "strategy-rule":
      return Object.values(scenario.checkpoints).some((checkpoint) =>
        strategyRuleIds(checkpoint.strategy).has(reference.id)
      );
    default:
      return false;
  }
}

function domainReferenceChampionId(
  scenario: WorkspaceScenario,
  reference: AnyDomainReference
) {
  switch (reference.kind) {
    case "champion":
      return reference.id;
    case "draft":
      return scenario.drafts[reference.id]?.championId;
    case "draft-checkpoint":
      return scenario.checkpoints[reference.id]?.championId;
    case "immutable-strategy":
      return scenario.strategies[reference.id]?.championId;
    case "paper-portfolio":
      return scenario.portfolios[reference.id]?.championId;
    case "portfolio-account-snapshot": {
      const snapshot = scenario.accountSnapshots[reference.id];
      return snapshot
        ? scenario.portfolios[snapshot.portfolioId]?.championId
        : undefined;
    }
    case "position": {
      const position = scenario.positions[reference.id];
      return position
        ? scenario.portfolios[position.portfolioId]?.championId
        : undefined;
    }
    case "portfolio-run": {
      const run = scenario.runs[reference.id];
      return run
        ? scenario.portfolios[run.portfolioId]?.championId
        : undefined;
    }
    case "evaluation":
      return scenario.evaluations[reference.id]?.championId;
    case "decision": {
      const decision = scenario.decisions[reference.id];
      if (decision?.evaluationId) {
        return scenario.evaluations[decision.evaluationId]?.championId;
      }
      if (decision?.runId) {
        const run = scenario.runs[decision.runId];
        return run
          ? scenario.portfolios[run.portfolioId]?.championId
          : undefined;
      }
      return undefined;
    }
    case "change-set":
      return scenario.changeSets[reference.id]?.championId;
    case "atlas-exchange":
      return scenario.atlasExchanges[reference.id]?.championId;
    default:
      return undefined;
  }
}

function closeEnough(left: number, right: number, tolerance = 0.01) {
  return Math.abs(left - right) <= tolerance;
}

function validateStrategy(
  strategy: StructuredStrategy,
  path: string,
  add: (code: string, path: string, message: string) => void
) {
  const sectionIds = new Set<string>();
  const ruleIds = new Set<string>();
  for (const section of strategy.sections) {
    if (sectionIds.has(section.id)) {
      add(
        "duplicate-section-id",
        `${path}.strategy.sections`,
        "Strategy section IDs must be unique."
      );
    }
    sectionIds.add(section.id);
    for (const rule of section.rules) {
      if (ruleIds.has(rule.id)) {
        add(
          "duplicate-rule-id",
          `${path}.strategy.sections`,
          "Strategy rule IDs must be unique."
        );
      }
      ruleIds.add(rule.id);
      if (!rule.value.trim()) {
        add(
          "empty-rule-value",
          `${path}.strategy.sections`,
          "Strategy rule values cannot be empty."
        );
      }
    }
  }
}

function validateActor(
  scenario: WorkspaceScenario,
  actor: DraftCheckpointRecord["createdBy"],
  path: string,
  add: (code: string, path: string, message: string) => void
) {
  const resolves =
    actor.kind === "user"
      ? Boolean(scenario.users[actor.id])
      : Boolean(scenario.champions[actor.id]);
  if (!resolves) {
    add("missing-actor", path, "Actor reference must resolve.");
  }
}

function strategyRuleIds(strategy: StructuredStrategy) {
  return new Set(
    strategy.sections.flatMap((section) =>
      section.rules.map((rule) => rule.id)
    )
  );
}

function isFirstBusinessDay(timestamp: string, timezone: string) {
  const date = new Date(timestamp);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
  const year = parts.year;
  const month = parts.month;
  const day = parts.day;
  if (!year || !month || !day) return false;

  let expected = 1;
  while (true) {
    const weekday = new Date(Date.UTC(year, month - 1, expected)).getUTCDay();
    if (weekday !== 0 && weekday !== 6) break;
    expected += 1;
  }
  return day === expected;
}

function scenarioTables(
  scenario: WorkspaceScenario
): Array<[string, EntityTable<{ id: string; revision: string }>]> {
  return [
    ["users", scenario.users],
    ["champions", scenario.champions],
    ["drafts", scenario.drafts],
    ["checkpoints", scenario.checkpoints],
    ["strategies", scenario.strategies],
    ["changeSets", scenario.changeSets],
    ["evaluations", scenario.evaluations],
    ["evaluationEvents", scenario.evaluationEvents],
    ["sourceArtifacts", scenario.sourceArtifacts],
    ["decisions", scenario.decisions],
    ["orders", scenario.orders],
    ["fills", scenario.fills],
    ["portfolios", scenario.portfolios],
    ["accountSnapshots", scenario.accountSnapshots],
    ["positions", scenario.positions],
    ["deployments", scenario.deployments],
    ["schedules", scenario.schedules],
    ["benchmarks", scenario.benchmarks],
    ["benchmarkObservations", scenario.benchmarkObservations],
    ["runs", scenario.runs],
    ["atlasExchanges", scenario.atlasExchanges],
    ["receipts", scenario.receipts],
  ];
}
