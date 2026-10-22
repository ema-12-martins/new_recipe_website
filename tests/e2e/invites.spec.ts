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
import { createTestUser } from "../helpers/supabase-admin";

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

  test("the owner revokes an active invite and its link stops working", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    test.setTimeout(60_000);
    const label = `Revogar ${unique(testInfo, "convite")}`;
    const link = await createInviteLink(page, label);

    const row = page.getByTestId("invite-row").filter({ hasText: label });
    page.once("dialog", (dialog) => dialog.accept());
    await row
      .getByRole("button", { name: members.revokeLabel.replace("{label}", label), exact: true })
      .click();
    await expect(row.getByText(members.status.revoked)).toBeVisible();
    await expect(row.getByRole("button")).toHaveCount(0);

    const visitor = await openDevice(browser, baseURL, testInfo);
    await visitor.page.goto(new URL(link).pathname);
    await expect(visitor.page.getByText(join.invalid)).toBeVisible();
    await expect(visitor.page.getByLabel(join.email, { exact: true })).toHaveCount(0);
    await visitor.context.close();
  });

  test("a used invite link shows the no-longer-valid message", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    test.setTimeout(60_000);
    const link = await createInviteLink(page, `Usado ${unique(testInfo, "convite")}`);

    const first = await openDevice(browser, baseURL, testInfo);
    await joinThroughUi(first.page, link, `${unique(testInfo, "primeiro")}@example.com`);
    await first.page.waitForURL("**/pt/recipes");
    await first.context.close();

    const second = await openDevice(browser, baseURL, testInfo);
    await second.page.goto(new URL(link).pathname);
    await expect(second.page.getByText(join.invalid)).toBeVisible();
    await expect(second.page.getByLabel(join.email, { exact: true })).toHaveCount(0);
    await second.context.close();
  });

  test("a member sees no Members link and cannot open the Members page", async ({
    browser,
    baseURL,
  }, testInfo) => {
    const email = `${unique(testInfo, "membro")}@example.com`;
    await createTestUser({ email, password: PASSWORD, role: "member" });

    const { context, page } = await openDevice(browser, baseURL, testInfo);
    await page.goto("/pt/sign-in");
    await page.getByLabel(pt.auth.signIn.email, { exact: true }).fill(email);
    await page.getByLabel(pt.auth.signIn.password, { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: pt.auth.signIn.submit, exact: true }).click();
    await page.waitForURL("**/pt/recipes");

    await expect(page.getByRole("link", { name: members.navLink })).toHaveCount(0);
    const response = await page.goto("/pt/members");
    expect(response?.status()).toBe(404);
    await expect(page.getByText(members.createLink)).toHaveCount(0);
    await context.close();
  });

  test("opening an invite while signed in asks to sign out first, then offers the invite", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    test.setTimeout(60_000);
    const link = await createInviteLink(page, `Sessão ${unique(testInfo, "convite")}`);
    const email = `${unique(testInfo, "outra")}@example.com`;
    await createTestUser({ email, password: PASSWORD, role: "member" });

    // A separate device: signing out revokes the session, and the owner's is shared by other tests.
    const { context, page: device } = await openDevice(browser, baseURL, testInfo);
    await device.goto("/pt/sign-in");
    await device.getByLabel(pt.auth.signIn.email, { exact: true }).fill(email);
    await device.getByLabel(pt.auth.signIn.password, { exact: true }).fill(PASSWORD);
    await device.getByRole("button", { name: pt.auth.signIn.submit, exact: true }).click();
    await device.waitForURL("**/pt/recipes");

    const invitePath = new URL(link).pathname;
    await device.goto(invitePath);
    await expect(device.getByText(join.signedInAs.replace("{email}", email))).toBeVisible();
    await expect(device.getByLabel(join.email, { exact: true })).toHaveCount(0);

    await device.getByRole("button", { name: pt.auth.signOut, exact: true }).click();
    await device.waitForURL(`**${invitePath}`);
    await expect(device.getByLabel(join.email, { exact: true })).toBeVisible();
    await context.close();
  });
});
