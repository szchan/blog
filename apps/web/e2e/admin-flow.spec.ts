import { test, expect } from "@playwright/test";

test("admin login page loads", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator("h1")).toContainText("Admin Login");
});

test("login with wrong credentials shows error", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', "wrong@example.com");
  await page.fill('input[type="password"]', "wrongpassword");
  await page.click('button[type="submit"]');
  await expect(page.locator("text=Incorrect email or password")).toBeVisible({ timeout: 10000 });
});

test("full admin flow: login, create post, verify", async ({ page }) => {
  await page.goto("/admin/login");
  await page.fill('input[type="email"]', "admin@example.com");
  await page.fill('input[type="password"]', "changeme123");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/admin\/posts/);

  await page.click('a[href="/admin/posts/new"]');
  await expect(page).toHaveURL(/\/admin\/posts\/new/);

  await page.fill('input[name="title"], input[id="title"]', "E2E Test Post");
  await page.fill('input[name="slug"], input[id="slug"]', "e2e-test-post");
  await page.fill('textarea', "# E2E Test\n\nThis is a test post.");
  await page.selectOption("select", "published");
  await page.click('button:has-text("Create Post")');
  await expect(page).toHaveURL(/\/admin\/posts/);

  await page.goto("/blog");
  await expect(page.locator("text=E2E Test Post")).toBeVisible({ timeout: 10000 });
});
