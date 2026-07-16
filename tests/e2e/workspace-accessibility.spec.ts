import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./test";

const accessibleScenarios = [
  {
    scenario: "mara-draft" as const,
    path: "/champions/mara/draft?view=document&panel=checkpoints",
  },
  {
    scenario: "iris-paper" as const,
    path: "/champions/iris/paper/portfolio_iris_income?tab=positions",
  },
  {
    scenario: "invalid-resource" as const,
    path: "/champions/missing/draft",
  },
];

for (const { scenario, path } of accessibleScenarios) {
  test.describe(`${scenario} accessibility`, () => {
    test.use({ scenario });

    test("has no automatically detectable accessibility violations", async ({
      page,
      openScenario,
    }) => {
      await openScenario(path);
      const results = await new AxeBuilder({ page }).analyze();
      const violations = results.violations.map(({ id, impact, nodes }) => ({
        id,
        impact,
        targets: nodes.flatMap((node) => node.target),
      }));
      expect(violations).toEqual([]);
    });
  });
}
