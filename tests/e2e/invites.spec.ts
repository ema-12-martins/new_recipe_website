import {
  expect,
  test,
  type Browser,
  type BrowserContext,
  type BrowserContextOptions,
  type Page,
  type TestInfo,
} from "@playwright/test";

import pt from "../../src/i18n/messages/pt.json";

const members = pt.members;
const join = members.join;
const form = pt.recipes.form;
const PASSWORD = "Receitas-Familia-2026";

test.use({ locale: "pt-PT" });

/** The project's device settings. */
function projectDevice(testInfo: TestInfo): BrowserContextOptions {
  const use = testInfo.project.use;
  return {
    viewport: use.viewport,
    userAgent: use.userAgent,
    deviceScaleFactor: use.deviceScaleFactor,
    isMobile: use.isMobile,
    hasTouch: use.hasTouch,
  };
}

/** A signed-out device; Playwright would otherwise apply the owner's storageState. */
async function openDevice(
  browser: Browser,
  baseURL: string | undefined,
  testInfo: TestInfo,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    ...projectDevice(testInfo),
    locale: "pt-PT",
    baseURL,
    storageState: { cookies: [], origins: [] },
  });
  return { context, page: await context.newPage() };
}

function unique(testInfo: TestInfo, prefix: string): string {
  return `${prefix}-${testInfo.project.name}-${Date.now()}`;
}

/** As the owner, creates an invite from the Members page and returns the link shown once. */
async function createInviteLink(page: Page, label: string): Promise<string> {
  await page.goto("/pt/members");
  await page.getByLabel(members.labelField, { exact: true }).fill(label);
  await page.getByRole("button", { name: members.createLink, exact: true }).click();
  const linkField = page.getByLabel(members.linkField, { exact: true });
  await expect(linkField).toHaveValue(/\/pt\/join\/[A-Za-z0-9_-]{43}$/);
  return linkField.inputValue();
}

async function joinThroughUi(page: Page, link: string, email: string) {
  await page.goto(new URL(link).pathname);
  await page.getByLabel(join.email, { exact: true }).fill(email);
  await page.getByLabel(join.password, { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: join.submit, exact: true }).click();
}

async function createRecipe(page: Page, title: string): Promise<string> {
  await page.goto("/pt/recipes/new");
  await page.getByLabel(form.title, { exact: true }).fill(title);
  await page.getByLabel(form.ingredientLine.replace("{n}", "1"), { exact: true }).fill("3 ovos");
  await page.getByRole("button", { name: form.save }).click();
  await page.waitForURL(/\/pt\/recipes\/[0-9a-f-]{36}$/);
  return new URL(page.url()).pathname;
}

test.describe("invite links", () => {
  test("the owner shares an invite link and a relative joins, adds and edits recipes", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    // Two browser contexts and many navigations; WebKit phones are the slowest.
    test.setTimeout(90_000);

    const ownerTitle = `Arroz Doce ${unique(testInfo, "dono")}`;
    const ownerRecipePath = await createRecipe(page, ownerTitle);

    await page.goto("/pt/recipes");
    await page.getByRole("link", { name: members.navLink, exact: true }).click();
    await page.waitForURL("**/pt/members");

    const label = `Tia ${testInfo.project.name}`;
    const link = await createInviteLink(page, label);
    expect(link.startsWith(`${baseURL}/pt/join/`)).toBe(true);
    await expect(page.getByText(members.linkNote)).toBeVisible();
    await expect(
      page.getByTestId("invite-row").filter({ hasText: label }).getByText(members.status.active),
    ).toBeVisible();

    const relative = await openDevice(browser, baseURL, testInfo);
    const email = `${unique(testInfo, "tia")}@example.com`;
    await joinThroughUi(relative.page, link, email);
    await relative.page.waitForURL("**/pt/recipes");

    // AUTH-03: the relative sees the owner's recipes and can add and edit recipes.
    await expect(relative.page.getByRole("link", { name: ownerTitle })).toBeVisible();
    await expect(relative.page.getByRole("link", { name: members.navLink })).toHaveCount(0);

    const relativeTitle = `Bolo da Tia ${unique(testInfo, "tia")}`;
    await createRecipe(relative.page, relativeTitle);
    await expect(relative.page.getByRole("heading", { level: 1 })).toHaveText(relativeTitle);

    const editedTitle = `${ownerTitle} (corrigido)`;
    await relative.page.goto(`${ownerRecipePath}/edit`);
    await relative.page.getByLabel(form.title, { exact: true }).fill(editedTitle);
    await relative.page.getByRole("button", { name: form.save }).click();
    await relative.page.waitForURL(`**${ownerRecipePath}`);
    await expect(relative.page.getByRole("heading", { level: 1 })).toHaveText(editedTitle);

    await page.goto(ownerRecipePath);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(editedTitle);

    await page.goto("/pt/members");
    await expect(
      page.getByTestId("invite-row").filter({ hasText: label }).getByText(members.status.used),
    ).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();

    await relative.context.close();
  });
});
