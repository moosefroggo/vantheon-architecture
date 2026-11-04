import type { ReactNode } from "react"

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
    <article className="max-w-[52rem] py-4 sm:py-6">
      <div className="space-y-10">
        <DocumentSection title="Thesis">
          <p>{thesis ?? objective}</p>
        </DocumentSection>

        <DocumentSection title="Universe and selection">
          <DocumentParagraph>
            The investable universe contains <RuleText rule={universe} />
          </DocumentParagraph>
          <DocumentParagraph>
            At each scheduled evaluation, candidates qualify through <RuleText rule={entry} />
          </DocumentParagraph>
        </DocumentSection>

        <DocumentSection title="Portfolio construction">
          <DocumentParagraph>
            Positions follow <RuleText rule={portfolio} />
          </DocumentParagraph>
          {sizingExample ? (
            <aside className="rounded-lg border-l-2 bg-muted/40 px-4 py-3">
              <h3 className="text-sm font-semibold text-foreground">Sizing example</h3>
              <p className="mt-1">{sizingExample}</p>
            </aside>
          ) : null}
        </DocumentSection>

        <DocumentSection title="Risk management and exits">
          <DocumentParagraph>
            The strategy enforces <RuleText rule={risk} />
          </DocumentParagraph>
          <DocumentParagraph>
            Positions follow this exit rule: <RuleText rule={exit} />
          </DocumentParagraph>
        </DocumentSection>

        <DocumentSection title="Execution">
          <DocumentParagraph>
            The decision cadence is <RuleText rule={schedule} lowercase={false} />
          </DocumentParagraph>
        </DocumentSection>

        {rulePrecedence.length ? (
          <DocumentSection title="Rule precedence">
            <p>
              When instructions compete, the strategy applies them in this order:
            </p>
            <TextList items={rulePrecedence} ordered />
          </DocumentSection>
        ) : null}

        {assumptions.length ? (
          <DocumentSection title="Assumptions">
            <TextList items={assumptions} />
          </DocumentSection>
        ) : null}

        {exclusions.length ? (
          <DocumentSection title="Exclusions">
            <TextList items={exclusions} />
          </DocumentSection>
        ) : null}

        {dataFailurePolicy || cooldownPolicy ? (
          <DocumentSection title="Failure and cooldown behavior">
            <TextList
              items={[dataFailurePolicy, cooldownPolicy].filter(
                (value): value is string => Boolean(value)
              )}
            />
          </DocumentSection>
        ) : null}
      </div>
    </article>
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
    <section className="space-y-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-4 text-base leading-7 text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

function DocumentParagraph({ children }: { children: ReactNode }) {
  return <p>{children}</p>
}

function RuleText({
  rule,
  lowercase = true,
}: {
  rule: StrategyRuleFixture | undefined
  lowercase?: boolean
}) {
  if (!rule) return <>the defined rule.</>

  return (
    <>
      <strong className="font-semibold text-foreground">
        {lowercase
          ? lowerFirst(withoutTerminalPunctuation(rule.value))
          : withoutTerminalPunctuation(rule.value)}
      </strong>
      . {asSentence(rule.constraint)}
    </>
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
    <List
      className={
        ordered
          ? "list-decimal space-y-2 pl-6 marker:font-medium marker:text-foreground"
          : "list-disc space-y-2 pl-6 marker:text-muted-foreground"
      }
    >
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </List>
  )
}

function asSentence(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

function withoutTerminalPunctuation(value: string) {
  return value.trim().replace(/[.!?]+$/, "")
}

function lowerFirst(value: string) {
  if (!value) return value
  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`
}
