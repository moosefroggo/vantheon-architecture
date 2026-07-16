"use client"

import type { Route } from "next"
import Link from "next/link"

import { useWorkspaceDemoScenario } from "@/features/workspace/demo/react"

const championCards = [
  {
    id: "mara",
    name: "Mara",
    initials: "MA",
  },
  {
    id: "iris",
    name: "Iris",
    initials: "IR",
  },
] as const

export default function ChampionsPage() {
  const demo = useWorkspaceDemoScenario()

  return (
    <main className="min-h-svh bg-muted/20 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em]">Vantheon</p>
        <header className="mt-10 border-b pb-5">
          <h1 className="text-3xl font-semibold tracking-tight">Champions</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select a Champion to open its strategy workspace.
          </p>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {championCards.map((champion) => {
            const scenarioChampion = Object.values(demo.scenario?.champions ?? {}).find(
              (candidate) => candidate.displayName === champion.name
            )
            const currentDraft = scenarioChampion
              ? demo.scenario?.drafts[scenarioChampion.currentDraftId]
              : undefined
            const activePaperCount = scenarioChampion
              ? Object.values(demo.scenario?.portfolios ?? {}).filter(
                  (portfolio) =>
                    portfolio.championId === scenarioChampion.id &&
                    portfolio.state === "active"
                ).length
              : null
            const detail = currentDraft && activePaperCount !== null
              ? `${currentDraft.generation} strategy versions · ${activePaperCount} active Paper ${activePaperCount === 1 ? "portfolio" : "portfolios"}`
              : demo.error
                ? "Local demo unavailable"
                : "Loading local demo…"

            return (
              <Link
                key={champion.id}
                href={`/champions/${champion.id}/draft` as Route}
                className="group rounded-xl border bg-background p-5 shadow-sm outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="grid size-10 place-items-center rounded-full border bg-muted text-sm font-semibold"
                  >
                    {champion.initials}
                  </span>
                  <span className="text-lg font-semibold">{champion.name}</span>
                </span>
                <span className="mt-4 block text-sm text-muted-foreground">
                  {detail}
                </span>
                <span className="mt-4 block text-sm font-medium group-hover:underline">
                  Open workspace
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
