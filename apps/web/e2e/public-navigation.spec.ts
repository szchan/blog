import { test, expect } from "@playwright/test";

test("home page loads and shows hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("Building things for the web");
});

test("navigate to blog page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/blog"]');
  await expect(page).toHaveURL(/\/blog/);
});

test("navigate to projects page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/projects"]');
  await expect(page).toHaveURL(/\/projects/);
});

test("navigate to about page", async ({ page }) => {
  await page.goto("/");
  await page.click('a[href="/about"]');
  await expect(page).toHaveURL(/\/about/);
});

test("404 page for non-existent route", async ({ page }) => {
  await page.goto("/nonexistent");
  await expect(page.locator("body")).toContainText(/not found/i);
});
