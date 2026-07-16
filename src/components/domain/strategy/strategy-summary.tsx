import { Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StrategyRuleFixture } from "@/features/workspace/workspace-fixtures"

type StrategySummaryProps = {
  rules: readonly StrategyRuleFixture[]
  onEditRule: (ruleId: string) => void
  saveStatus?: string
}

export function StrategySummary({
  rules,
  onEditRule,
  saveStatus = "Demo session",
}: StrategySummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Strategy summary</CardTitle>
        <CardAction>
          <span className="text-sm text-muted-foreground">{saveStatus}</span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table aria-label="Current structured strategy rules">
          <TableHeader>
            <TableRow>
              <TableHead>Section</TableHead>
              <TableHead>Definition</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  {rule.group === "Selection" ? "Entry" : rule.group}
                </TableCell>
                <TableCell>
                  <div>{rule.value}</div>
                  <div className="text-sm text-muted-foreground">
                    {rule.constraint}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${rule.group} rule`}
                    onClick={() => onEditRule(rule.id)}
                  >
                    <Pencil />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
