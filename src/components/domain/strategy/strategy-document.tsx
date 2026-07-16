import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { StrategyRuleFixture } from "@/features/workspace/workspace-fixtures"

type StrategyDocumentProps = {
  objective: string
  rules: readonly StrategyRuleFixture[]
  thesis?: string
  sizingExample?: string
  rulePrecedence?: readonly string[]
  assumptions?: readonly string[]
  exclusions?: readonly string[]
  dataFailurePolicy?: string
  cooldownPolicy?: string
}

export function StrategyDocument({
  objective,
  rules,
  thesis,
  sizingExample,
  rulePrecedence = [],
  assumptions = [],
  exclusions = [],
  dataFailurePolicy,
  cooldownPolicy,
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
      </CardHeader>
      <CardContent className="space-y-6">
        <DocumentSection title="Objective">{objective}</DocumentSection>
        {thesis ? (
          <>
            <Separator />
            <DocumentSection title="Thesis">{thesis}</DocumentSection>
          </>
        ) : null}
        <Separator />
        <DocumentSection title="Selection">
          The eligible universe is {sentence(universe?.value)} {universe?.constraint}. At
          each evaluation, the Champion selects {sentence(entry?.value)} {entry?.constraint}.
        </DocumentSection>
        <Separator />
        <DocumentSection title="Portfolio construction">
          The portfolio uses {sentence(portfolio?.value)} {portfolio?.constraint}.
          {sizingExample ? ` Example: ${sizingExample}` : ""}
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
        {rulePrecedence.length ? (
          <>
            <Separator />
            <DocumentSection title="Rule precedence">
              <TextList items={rulePrecedence} ordered />
            </DocumentSection>
          </>
        ) : null}
        {assumptions.length ? (
          <>
            <Separator />
            <DocumentSection title="Assumptions">
              <TextList items={assumptions} />
            </DocumentSection>
          </>
        ) : null}
        {exclusions.length ? (
          <>
            <Separator />
            <DocumentSection title="Exclusions">
              <TextList items={exclusions} />
            </DocumentSection>
          </>
        ) : null}
        {dataFailurePolicy || cooldownPolicy ? (
          <>
            <Separator />
            <DocumentSection title="Failure and cooldown behavior">
              <TextList
                items={[dataFailurePolicy, cooldownPolicy].filter(
                  (value): value is string => Boolean(value)
                )}
              />
            </DocumentSection>
          </>
        ) : null}
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
      <h2 className="font-medium">{title}</h2>
      <div className="text-sm leading-6 text-muted-foreground">{children}</div>
    </section>
  )
}

function TextList({
  items,
  ordered = false,
}: {
  items: readonly string[]
  ordered?: boolean
}) {
  const List = ordered ? "ol" : "ul"
  return (
    <List className={ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </List>
  )
}

function sentence(value: string | undefined) {
  if (!value) return "the defined rule."
  return value.charAt(0).toLowerCase() + value.slice(1) + "."
}
import type { ReactNode } from "react"
