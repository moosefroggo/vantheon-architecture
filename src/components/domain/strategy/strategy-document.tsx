import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { StrategyRuleFixture } from "@/features/workspace/workspace-fixtures"

type StrategyDocumentProps = {
  objective: string
  checkpoint: string
  rules: readonly StrategyRuleFixture[]
}

export function StrategyDocument({
  objective,
  checkpoint,
  rules,
}: StrategyDocumentProps) {
  const byGroup = new Map(rules.map((rule) => [rule.group, rule]))
  const universe = byGroup.get("Universe")
  const entry = byGroup.get("Selection")
  const portfolio = byGroup.get("Portfolio")
  const risk = byGroup.get("Risk")
  const exit = byGroup.get("Exit")
  const schedule = byGroup.get("Schedule")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete strategy</CardTitle>
        <CardDescription>
          {checkpoint} · Editable working document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentSection title="Objective">{objective}</DocumentSection>
        <Separator />
        <DocumentSection title="Selection">
          The eligible universe is {sentence(universe?.value)} {universe?.constraint}. At
          each evaluation, the Champion selects {sentence(entry?.value)} {entry?.constraint}.
        </DocumentSection>
        <Separator />
        <DocumentSection title="Portfolio construction">
          The portfolio uses {sentence(portfolio?.value)} {portfolio?.constraint}.
        </DocumentSection>
        <Separator />
        <DocumentSection title="Risk and exits">
          The strategy enforces {sentence(risk?.value)} {risk?.constraint}. Positions exit
          when {sentence(exit?.value)} {exit?.constraint}.
        </DocumentSection>
        <Separator />
        <DocumentSection title="Execution">
          The Champion evaluates the strategy {sentence(schedule?.value)} {schedule?.constraint}.
          Every run preserves its inputs, decisions, rejected orders, and final outcome.
        </DocumentSection>
      </CardContent>
    </Card>
  )
}

function DocumentSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-2 md:grid-cols-[12rem_1fr] md:gap-6">
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm leading-6 text-muted-foreground">{children}</p>
    </section>
  )
}

function sentence(value: string | undefined) {
  if (!value) return "the defined rule."
  return value.charAt(0).toLowerCase() + value.slice(1) + "."
}
import type { ReactNode } from "react"
