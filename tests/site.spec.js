// @ts-check
import { test, expect } from '@playwright/test';

// How long to wait for the intro animation to fully settle
const INTRO_TIMEOUT = 8000;

// ── Index page ───────────────────────────────────────────────────────────────

test.describe('Index page', () => {
  test('loads and shows signature', async ({ page }) => {
    await page.goto('/wip/');
    await expect(page.locator('#signature')).toBeVisible({ timeout: INTRO_TIMEOUT });
  });

  test('all 6 columns appear after intro', async ({ page }) => {
    await page.goto('/wip/');
    await page.waitForSelector('#portfolio.settled', { timeout: INTRO_TIMEOUT });
    const cols = page.locator('.col');
    await expect(cols).toHaveCount(6);
  });

  test('music island is visible after intro', async ({ page }) => {
    await page.goto('/wip/');
    await page.waitForSelector('#portfolio.settled', { timeout: INTRO_TIMEOUT });
    await expect(page.locator('#music-island')).toBeVisible();
  });

  test('clicking a column navigates to collection', async ({ page }) => {
    await page.goto('/wip/');
    await page.waitForSelector('#portfolio.settled', { timeout: INTRO_TIMEOUT });
    await page.locator('.col').first().click();
    await expect(page).toHaveURL(/collections\//, { timeout: 5000 });
  });
});

// ── Collection page ──────────────────────────────────────────────────────────

test.describe('Music collection', () => {
  test('loader disappears and gallery shows', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await expect(page.locator('#gallery')).toBeVisible();
  });

  test('photos load in', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    // At least one image should be visible
    await expect(page.locator('.gallery__item img.loaded').first()).toBeVisible({ timeout: 10000 });
  });

  test('collection title is shown', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await expect(page.locator('#collection-title')).toContainText(/music/i);
  });

  test('back button navigates home', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await page.locator('#back-btn').click();
    await expect(page).not.toHaveURL(/collections\/music/, { timeout: 10000 });
    await expect(page.locator('#signature')).toBeAttached({ timeout: 10000 });
  });

  test('lightbox opens on photo click', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await page.locator('.gallery__item img.loaded').first().click();
    await expect(page.locator('#lightbox.open')).toBeVisible({ timeout: 3000 });
  });

  test('lightbox closes on escape', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await page.locator('.gallery__item img.loaded').first().click();
    await expect(page.locator('#lightbox.open')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox.open')).toHaveCount(0);
  });
});

// ── About page ───────────────────────────────────────────────────────────────

test.describe('About page', () => {
  test('loads with name visible', async ({ page }) => {
    await page.goto('/wip/about.html');
    await expect(page.locator('.about__name')).toBeVisible({ timeout: 5000 });
  });

  test('back button is present', async ({ page }) => {
    await page.goto('/wip/about.html');
    await expect(page.locator('#back-btn')).toBeVisible();
  });

  test('contact links are present', async ({ page }) => {
    await page.goto('/wip/about.html');
    await expect(page.locator('.about__link')).toHaveCount(2);
  });
});

// ── Mobile-specific ──────────────────────────────────────────────────────────

test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // iPhone 14

  test('column labels visible on mobile', async ({ page }) => {
    await page.goto('/wip/');
    await page.waitForSelector('#portfolio.settled', { timeout: INTRO_TIMEOUT });
    const label = page.locator('.col__label').first();
    await expect(label).toBeVisible();
  });

  test('collection switcher is visible on mobile', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await expect(page.locator('#switcher-menu')).toBeVisible({ timeout: 2000 });
  });

  test('about page photo covers full viewport on mobile', async ({ page }) => {
    await page.goto('/wip/about.html');
    const photo = page.locator('.about__photo');
    const box = await photo.boundingBox();
    expect(box?.width).toBeGreaterThan(380);
  });
});

// ── Visual snapshots (run once to generate, then catch regressions) ──────────

test.describe('Visual snapshots', () => {
  test('index page settled state', async ({ page }) => {
    await page.goto('/wip/');
    await page.waitForSelector('#portfolio.settled', { timeout: INTRO_TIMEOUT });
    await expect(page).toHaveScreenshot('index-settled.png', { fullPage: false });
  });

  test('music collection loaded', async ({ page }) => {
    await page.goto('/wip/collections/music/');
    await page.waitForSelector('#page-loader', { state: 'hidden', timeout: 8000 });
    await page.locator('.gallery__item img.loaded').first().waitFor({ timeout: 10000 });
    await expect(page).toHaveScreenshot('music-collection.png', { fullPage: true });
  });

  test('about page', async ({ page }) => {
    await page.goto('/wip/about.html');
    await page.waitForSelector('.about__name', { timeout: 5000 });
    await expect(page).toHaveScreenshot('about.png', { fullPage: true });
  });
});
