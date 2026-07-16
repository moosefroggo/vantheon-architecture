import {
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from "@playwright/test";

export const workspaceScenarios = {
  "mara-draft": "/champions/mara/draft",
  "mara-evaluated":
    "/champions/mara/draft/evaluations/evaluation_mara_v1_2",
  "iris-paper": "/champions/iris/paper/portfolio_iris_income",
  "invalid-resource": "/champions/missing/draft",
  "transient-reset": "/champions/mara/draft",
} as const;

export type WorkspaceScenarioName = keyof typeof workspaceScenarios;

type ScenarioFixtures = {
  scenario: WorkspaceScenarioName;
  openScenario: (path?: string) => Promise<void>;
  localNetworkOnly: void;
};

export const test = base.extend<ScenarioFixtures>({
  scenario: ["mara-draft", { option: true }],

  localNetworkOnly: [
    async ({ context }, use) => {
      const blockedRequests = new Set<string>();
      const stopWatchingPages = monitorWebSockets(context, blockedRequests);

      await context.route("**/*", async (route) => {
        const requestUrl = route.request().url();
        if (isLocalRuntimeUrl(requestUrl)) {
          await route.continue();
          return;
        }

        blockedRequests.add(describeUrl(requestUrl));
        await route.abort("blockedbyclient");
      });

      await use();

      stopWatchingPages();
      await context.unroute("**/*");
      expect(
        [...blockedRequests],
        "Browser scenarios must not contact production or any non-local endpoint",
      ).toEqual([]);
    },
    { auto: true },
  ],

  openScenario: async ({ page, scenario }, provide, testInfo) => {
    testInfo.annotations.push({ type: "scenario", description: scenario });

    await provide(async (overridePath) => {
      const response = await page.goto(overridePath ?? workspaceScenarios[scenario]);
      expect(response, "Scenario navigation should return a document response").not.toBeNull();
      expect(response?.ok(), "Scenario navigation should return a successful document").toBe(
        true,
      );
      await expect(page.locator("body")).toBeVisible();
      await waitForScenarioProjection(page);
    });
  },
});

export { expect };

function monitorWebSockets(
  context: BrowserContext,
  blockedRequests: Set<string>,
) {
  const listeners = new Map<Page, (socket: { url(): string }) => void>();

  const watchPage = (page: Page) => {
    const listener = (socket: { url(): string }) => {
      const socketUrl = socket.url();
      if (!isLocalRuntimeUrl(socketUrl)) {
        blockedRequests.add(describeUrl(socketUrl));
      }
    };
    listeners.set(page, listener);
    page.on("websocket", listener);
  };

  for (const page of context.pages()) watchPage(page);
  context.on("page", watchPage);

  return () => {
    context.off("page", watchPage);
    for (const [page, listener] of listeners) {
      page.off("websocket", listener);
    }
  };
}

function isLocalRuntimeUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (!["http:", "https:", "ws:", "wss:"].includes(url.protocol)) {
    return true;
  }

  return ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
}

function describeUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}${url.pathname}`;
  } catch {
    return "unparseable URL";
  }
}

async function waitForScenarioProjection(page: Page) {
  const pathname = new URL(page.url()).pathname;
  const navigation = page.getByRole("navigation", {
    name: "Champion workspace navigation",
  });

  if (pathname.startsWith("/champions/mara/")) {
    await expect(
      navigation.getByRole("button", {
        name: /Lower-volatility momentum.*Tested/,
      }),
    ).toBeVisible();
  }

  if (pathname.startsWith("/champions/iris/")) {
    await expect(
      navigation.getByRole("button", {
        name: /Quality income compounders.*Paper V1.*Running/,
      }),
    ).toBeVisible();
  }
}
