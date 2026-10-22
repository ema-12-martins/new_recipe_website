import { randomUUID } from "node:crypto";

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
import { adminClient, createTestUser, userClient } from "../helpers/supabase-admin";

const members = pt.members;
const removal = members.removal;
const join = members.join;
const signIn = pt.auth.signIn;
const form = pt.recipes.form;
const PASSWORD = "Receitas-Familia-2026";

test.use({ locale: "pt-PT" });

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

/** Creates recipes as the member, so the database records the member as their creator. */
async function seedMemberRecipes(email: string, titles: string[]): Promise<string[]> {
  const { data: cookbook, error } = await adminClient().from("cookbooks").select("id").single();
  if (error) throw error;
  const client = await userClient(email, PASSWORD);
  const ids = titles.map(() => randomUUID());
  const { error: insertError } = await client.from("recipes").insert(
    titles.map((title, index) => ({
      id: ids[index],
      cookbook_id: cookbook.id,
      title,
      ingredients: ["2 ovos"],
      steps: ["Misturar."],
    })),
  );
  if (insertError) throw insertError;
  await client.auth.signOut({ scope: "local" });
  return ids;
}

test.describe("member removal", () => {
  test("the owner reviews a member's recipes, removes their access and can re-invite the same email", async ({
    page,
    browser,
    baseURL,
  }, testInfo) => {
    // Three browser contexts and many navigations; WebKit phones are the slowest.
    test.setTimeout(120_000);

    const email = `${unique(testInfo, "removido")}@example.com`;
    await createTestUser({ email, password: PASSWORD, role: "member" });
    const keepTitle = `Keep ${unique(testInfo, "receita")}`;
    const removeTitle = `Remove ${unique(testInfo, "receita")}`;
    const [keepId, removeId] = await seedMemberRecipes(email, [keepTitle, removeTitle]);

    const member = await openDevice(browser, baseURL, testInfo);
    await member.page.goto("/pt/sign-in");
    await member.page.getByLabel(signIn.email, { exact: true }).fill(email);
    await member.page.getByLabel(signIn.password, { exact: true }).fill(PASSWORD);
    await member.page.getByRole("button", { name: signIn.submit, exact: true }).click();
    await member.page.waitForURL("**/pt/recipes");
    await expect(member.page.getByRole("link", { name: removeTitle, exact: true })).toBeVisible();

    // D-21: a recipe the member created stays theirs in the review even after the owner edits it.
    const keptTitle = `${keepTitle} (editado)`;
    await page.goto(`/pt/recipes/${keepId}/edit`);
    await page.getByLabel(form.title, { exact: true }).fill(keptTitle);
    await page.getByRole("button", { name: form.save }).click();
    await page.waitForURL(`**/pt/recipes/${keepId}`);

    await page.goto("/pt/members");
    await expect(page.getByText(members.forgotPasswordNote)).toBeVisible();
    await page
      .getByRole("link", { name: members.removeLabel.replace("{email}", email), exact: true })
      .click();
    await page.waitForURL("**/pt/members/*/remove");
    await expect(
      page.getByRole("heading", { level: 1, name: removal.heading.replace("{email}", email) }),
    ).toBeVisible();

    const keepGroup = page.getByRole("group", { name: keptTitle, exact: true });
    const removeGroup = page.getByRole("group", { name: removeTitle, exact: true });
    await expect(keepGroup.getByLabel(removal.keep, { exact: true })).toBeChecked();
    await expect(removeGroup.getByLabel(removal.keep, { exact: true })).toBeChecked();
    await removeGroup.getByLabel(removal.remove, { exact: true }).check();
    await page.getByRole("button", { name: removal.confirm, exact: true }).click();

    await page.waitForURL("**/pt/members?removed=1");
    await expect(page.getByRole("status").filter({ hasText: members.removedNotice })).toBeVisible();
    await expect(page.getByText(email)).toHaveCount(0);

    await page.goto("/pt/recipes");
    await expect(page.getByRole("link", { name: keptTitle, exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: removeTitle, exact: true })).toHaveCount(0);
    expect((await page.goto(`/pt/recipes/${removeId}`))?.status()).toBe(404);

    // No contributor attribution on the kept recipe (D-10).
    await page.goto(`/pt/recipes/${keepId}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(keptTitle);
    await expect(page.getByText(email.split("@")[0])).toHaveCount(0);

    // Access ends at once, even for an in-app link tap: the shared layout is not re-rendered on a
    // soft navigation, so the page itself must turn the removed member away (T-01-43).
    const noAccess = member.page.getByRole("status").filter({ hasText: signIn.errors.noAccess });
    await member.page.evaluate(() => {
      (window as unknown as { __softNav?: boolean }).__softNav = true;
    });
    await member.page.getByRole("link", { name: keepTitle, exact: true }).click();
    await member.page.waitForURL(/\/pt\/sign-in\?reason=no-access$/);
    await expect(noAccess).toBeVisible();
    expect(
      await member.page.evaluate(() => (window as unknown as { __softNav?: boolean }).__softNav),
    ).toBe(true);

    // A full load turns them away with the same message while their session is still presented.
    await member.page.goto("/pt/recipes");
    await member.page.waitForURL(/\/pt\/sign-in\?reason=no-access$/);
    await expect(noAccess).toBeVisible();
    await member.context.close();

    // A visitor without any session gets the plain sign-in page.
    const visitor = await openDevice(browser, baseURL, testInfo);
    await visitor.page.goto("/pt/recipes");
    await visitor.page.waitForURL(/\/pt\/sign-in$/);
    await expect(
      visitor.page.getByRole("heading", { level: 1, name: signIn.heading }),
    ).toBeVisible();
    await expect(visitor.page.getByText(signIn.errors.noAccess)).toHaveCount(0);
    await visitor.context.close();

    // D-31: the same email can join again through a new invite.
    await page.goto("/pt/members");
    await page.getByLabel(members.labelField, { exact: true }).fill(`Regresso ${testInfo.project.name}`);
    await page.getByRole("button", { name: members.createLink, exact: true }).click();
    const linkField = page.getByLabel(members.linkField, { exact: true });
    await expect(linkField).toHaveValue(/\/pt\/join\/[A-Za-z0-9_-]{43}$/);
    const link = await linkField.inputValue();

    const returning = await openDevice(browser, baseURL, testInfo);
    await returning.page.goto(new URL(link).pathname);
    await returning.page.getByLabel(join.email, { exact: true }).fill(email);
    await returning.page.getByLabel(join.password, { exact: true }).fill(PASSWORD);
    await returning.page.getByRole("button", { name: join.submit, exact: true }).click();
    await returning.page.waitForURL("**/pt/recipes");
    await expect(returning.page.getByRole("link", { name: keptTitle, exact: true })).toBeVisible();
    await returning.context.close();
  });
});
