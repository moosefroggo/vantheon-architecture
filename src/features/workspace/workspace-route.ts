export type DraftView = "summary" | "document"
export type EvaluationView = "summary" | "activity"
export type PaperView = "overview" | "runs" | "positions" | "orders"
export type EvidencePanelView = "activity" | "dry-runs" | "checkpoints" | "data"

type RouteBase = {
  championId: string
  panel?: EvidencePanelView
}

export type WorkspaceRoute =
  | (RouteBase & { kind: "draft"; view: DraftView })
  | (RouteBase & { kind: "draft-change"; changeSetId: string })
  | (RouteBase & { kind: "draft-checkpoint"; checkpointId: string })
  | (RouteBase & {
      kind: "evaluation"
      evaluationId: string
      tab: EvaluationView
    })
  | (RouteBase & { kind: "data" })
  | (RouteBase & { kind: "paper-index" })
  | (RouteBase & {
      kind: "paper-portfolio"
      portfolioId: string
      tab: PaperView
    })
  | (RouteBase & {
      kind: "paper-run"
      portfolioId: string
      runId: string
      tab: EvaluationView
      decisionId?: string
    })
  | (RouteBase & { kind: "paper-compare"; portfolioIds: string[] })
  | (RouteBase & { kind: "paper-archived" })
  | (RouteBase & { kind: "source"; sourceArtifactId: string })
  | (RouteBase & { kind: "live" })
  | (RouteBase & { kind: "unavailable"; requestedPath: string })

type SearchLike = Pick<URLSearchParams, "get">

export function parseWorkspaceRoute(
  pathname: string,
  searchParams: SearchLike = new URLSearchParams()
): WorkspaceRoute {
  const segments = pathname.split("/").filter(Boolean).map(decodeSegment)
  const championIndex = segments.indexOf("champions")
  const championId = championIndex >= 0 ? segments[championIndex + 1] : undefined
  const workspace = championIndex >= 0 ? segments.slice(championIndex + 2) : []
  const panel = parseEnum(searchParams.get("panel"), evidencePanels)

  if (!championId) {
    return {
      kind: "unavailable",
      championId: "",
      requestedPath: pathname,
      panel,
    }
  }

  const base = { championId, panel }
  const [environment, section, id, nested, nestedId] = workspace

  if (environment === "draft" && workspace.length === 1) {
    return {
      ...base,
      kind: "draft",
      view: parseEnum(searchParams.get("view"), draftViews) ?? "summary",
    }
  }

  if (environment === "draft" && section === "changes" && id && workspace.length === 3) {
    return { ...base, kind: "draft-change", changeSetId: id }
  }

  if (
    environment === "draft" &&
    section === "checkpoints" &&
    id &&
    workspace.length === 3
  ) {
    return { ...base, kind: "draft-checkpoint", checkpointId: id }
  }

  if (
    environment === "draft" &&
    section === "evaluations" &&
    id &&
    workspace.length === 3
  ) {
    return {
      ...base,
      kind: "evaluation",
      evaluationId: id,
      tab: parseEnum(searchParams.get("tab"), evaluationViews) ?? "summary",
    }
  }

  if (environment === "draft" && section === "data" && workspace.length === 2) {
    return { ...base, kind: "data" }
  }

  if (environment === "paper" && workspace.length === 1) {
    return { ...base, kind: "paper-index" }
  }

  if (environment === "paper" && section === "compare" && workspace.length === 2) {
    return {
      ...base,
      kind: "paper-compare",
      portfolioIds: uniqueIds(searchParams.get("portfolios")),
    }
  }

  if (environment === "paper" && section === "archived" && workspace.length === 2) {
    return { ...base, kind: "paper-archived" }
  }

  if (
    environment === "paper" &&
    section &&
    id === "runs" &&
    nested &&
    workspace.length === 4
  ) {
    return {
      ...base,
      kind: "paper-run",
      portfolioId: section,
      runId: nested,
      tab: parseEnum(searchParams.get("tab"), evaluationViews) ?? "summary",
      decisionId: cleanId(searchParams.get("decision")),
    }
  }

  if (environment === "paper" && section && workspace.length === 2) {
    return {
      ...base,
      kind: "paper-portfolio",
      portfolioId: section,
      tab: parseEnum(searchParams.get("tab"), paperViews) ?? "overview",
    }
  }

  if (environment === "sources" && section && workspace.length === 2) {
    return { ...base, kind: "source", sourceArtifactId: section }
  }

  if (environment === "live" && workspace.length === 1) {
    return { ...base, kind: "live" }
  }

  void nestedId
  return { ...base, kind: "unavailable", requestedPath: pathname }
}

export function draftHref(championId: string, view: DraftView = "summary") {
  return withQuery(`/champions/${encodeURIComponent(championId)}/draft`, {
    view: view === "summary" ? undefined : view,
  })
}

export function evaluationHref(
  championId: string,
  evaluationId: string,
  tab: EvaluationView = "summary"
) {
  return withQuery(
    `/champions/${encodeURIComponent(championId)}/draft/evaluations/${encodeURIComponent(evaluationId)}`,
    { tab: tab === "summary" ? undefined : tab }
  )
}

export function checkpointHref(championId: string, checkpointId: string) {
  return `/champions/${encodeURIComponent(championId)}/draft/checkpoints/${encodeURIComponent(checkpointId)}`
}

export function changeSetHref(championId: string, changeSetId: string) {
  return `/champions/${encodeURIComponent(championId)}/draft/changes/${encodeURIComponent(changeSetId)}`
}

export function dataHref(championId: string) {
  return `/champions/${encodeURIComponent(championId)}/draft/data`
}

export function paperIndexHref(championId: string) {
  return `/champions/${encodeURIComponent(championId)}/paper`
}

export function paperPortfolioHref(
  championId: string,
  portfolioId: string,
  tab: PaperView = "overview"
) {
  return withQuery(
    `/champions/${encodeURIComponent(championId)}/paper/${encodeURIComponent(portfolioId)}`,
    { tab: tab === "overview" ? undefined : tab }
  )
}

export function paperRunHref(
  championId: string,
  portfolioId: string,
  runId: string,
  tab: EvaluationView = "summary",
  decisionId?: string
) {
  return withQuery(
    `/champions/${encodeURIComponent(championId)}/paper/${encodeURIComponent(portfolioId)}/runs/${encodeURIComponent(runId)}`,
    {
      tab: tab === "summary" ? undefined : tab,
      decision: decisionId,
    }
  )
}

export function paperCompareHref(championId: string, portfolioIds: readonly string[]) {
  return withQuery(`/champions/${encodeURIComponent(championId)}/paper/compare`, {
    portfolios: uniqueIds(portfolioIds.join(",")).join(",") || undefined,
  })
}

export function paperArchivedHref(championId: string) {
  return `/champions/${encodeURIComponent(championId)}/paper/archived`
}

export function sourceArtifactHref(championId: string, sourceArtifactId: string) {
  return `/champions/${encodeURIComponent(championId)}/sources/${encodeURIComponent(sourceArtifactId)}`
}

export function liveHref(championId: string) {
  return `/champions/${encodeURIComponent(championId)}/live`
}

function withQuery(pathname: string, values: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value) searchParams.set(key, value)
  }
  const query = searchParams.toString()
  return query ? `${pathname}?${query}` : pathname
}

function parseEnum<const T extends readonly string[]>(
  value: string | null,
  allowed: T
): T[number] | undefined {
  return value && allowed.includes(value) ? (value as T[number]) : undefined
}

function uniqueIds(value: string | null) {
  if (!value) return []
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 2)
}

function cleanId(value: string | null) {
  const cleaned = value?.trim()
  return cleaned || undefined
}

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const draftViews = ["summary", "document"] as const
const evaluationViews = ["summary", "activity"] as const
const paperViews = ["overview", "runs", "positions", "orders"] as const
const evidencePanels = ["activity", "dry-runs", "checkpoints", "data"] as const
