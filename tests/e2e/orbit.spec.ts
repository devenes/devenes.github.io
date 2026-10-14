import { expect, test } from '@playwright/test';

test.describe('ORBIT — The Speaker Network E2E Suite', () => {
  test('1. Zero-Click Overview & Telemetry Render', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // Assert initial mode is overview
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'overview');

    // Assert header & editorial headlines are immediately visible
    await expect(page.getByText('GOOGLE DEVELOPER EXPERT').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Ideas travel\./i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Technology connects\./i })).toBeVisible();

    // Assert telemetry counters display non-zero numeric values
    const talksCounter = page.getByTestId('metric-talks');
    const countriesCounter = page.getByTestId('metric-countries');
    const citiesCounter = page.getByTestId('metric-cities');

    await expect(talksCounter).toBeVisible();
    await expect(countriesCounter).toBeVisible();
    await expect(citiesCounter).toBeVisible();

    const talksValue = parseInt((await talksCounter.innerText()).replace(/\D/g, ''), 10);
    const countriesValue = parseInt(
      (await countriesCounter.innerText()).replace(/\D/g, ''),
      10
    );
    const citiesValue = parseInt((await citiesCounter.innerText()).replace(/\D/g, ''), 10);

    expect(talksValue).toBeGreaterThan(0);
    expect(countriesValue).toBeGreaterThanOrEqual(18);
    expect(citiesValue).toBeGreaterThan(0);

    // Assert all 3 RECENT SIGNALS cards are visible with titles, locations, and dates
    const recentStrip = page.getByTestId('recent-signals-strip');
    await expect(recentStrip).toBeVisible();

    await expect(recentStrip.getByText('DevFest Almaty')).toBeVisible();
    await expect(recentStrip.getByText('AI Agents in the Cloud Native Era')).toBeVisible();
    await expect(recentStrip.getByText('Almaty, Kazakhstan')).toBeVisible();
    await expect(recentStrip.getByText('MAR 15, 2025')).toBeVisible();

    await expect(recentStrip.getByText('KCD Istanbul')).toBeVisible();
    await expect(recentStrip.getByText('Platform Engineering with Kubernetes')).toBeVisible();
    await expect(recentStrip.getByText('Istanbul, Türkiye')).toBeVisible();
    await expect(recentStrip.getByText('FEB 8, 2025')).toBeVisible();

    await expect(recentStrip.getByText('Build with AI')).toBeVisible();
    await expect(recentStrip.getByText('From LLMs to Real-World Agents')).toBeVisible();
    await expect(recentStrip.getByText('Pristina, Kosovo')).toBeVisible();
    await expect(recentStrip.getByText('JAN 25, 2025')).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('2. Overview → Explore Mode & Cluster Filtering', async ({ page }) => {
    await page.goto('/');

    const exploreBtn = page.getByTestId('explore-network-btn');
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    // Assert body transitions to explore mode
    await expect(page.locator('body')).toHaveAttribute('data-mode', 'explore');

    // Assert compact Telemetry HUD Pill and Explore Control Dock become visible
    await expect(page.getByTestId('telemetry-hud-pill')).toBeVisible();
    const dock = page.getByTestId('explore-control-dock');
    await expect(dock).toBeVisible();

    await expect(page.getByTestId('cluster-pill-ai')).toBeVisible();
    await expect(page.getByTestId('cluster-pill-k8s')).toBeVisible();
    await expect(page.getByTestId('cluster-pill-cloud')).toBeVisible();
    await expect(page.getByTestId('cluster-pill-workshops')).toBeVisible();

    // Click Kubernetes cluster filter pill
    await page.getByTestId('cluster-pill-k8s').click();

    await expect(page.locator('body')).toHaveAttribute('data-cluster', 'k8s');
    await expect(page.getByTestId('cluster-pill-k8s')).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    await expect(page.getByTestId('cluster-status-banner')).toContainText(
      /KUBERNETES CLUSTER:\s*\d+\s*Sessions across\s*\d+\s*Countries/i
    );
  });

  test('3. Signal Detail Drawer Interaction', async ({ page }) => {
    await page.goto('/');

    const almatyCard = page.getByTestId('signal-card-devfest-almaty-2025-keynote');
    await expect(almatyCard).toBeVisible();
    await almatyCard.click();

    const drawer = page.getByTestId('signal-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(page.getByTestId('signal-drawer-title')).toHaveText(
      'AI Agents in the Cloud Native Era'
    );
    await expect(drawer).toContainText('Almaty, Kazakhstan');

    // Press Escape and assert drawer closes cleanly
    await page.keyboard.press('Escape');
    await expect(drawer).toHaveAttribute('aria-hidden', 'true');
    await expect(drawer).toBeHidden();
  });

  test('4. Full Archive Matrix Search & Filtering', async ({ page }) => {
    await page.goto('/');

    const viewAllBtn = page.getByTestId('view-all-talks-btn');
    await viewAllBtn.click();

    const archiveModal = page.getByTestId('archive-matrix-modal');
    await expect(archiveModal).toBeVisible();
    await expect(archiveModal).toHaveAttribute('aria-hidden', 'false');

    // Verify 3D loop is paused while archive modal is open
    const isPaused = await page.evaluate(() => window.__orbitScene?.isRenderPaused());
    expect(isPaused).toBe(true);

    const visibleRows = archiveModal.locator('tbody tr:not(.hidden)');
    const initialCount = await visibleRows.count();
    expect(initialCount).toBeGreaterThanOrEqual(36);

    // Search for "Almaty"
    const searchInput = page.getByTestId('archive-search-input');
    await searchInput.fill('Almaty');

    const almatyRows = await visibleRows.count();
    expect(almatyRows).toBeGreaterThan(0);
    expect(almatyRows).toBeLessThan(initialCount);

    for (let i = 0; i < almatyRows; i++) {
      await expect(visibleRows.nth(i)).toContainText('Almaty');
    }

    // Clear search and filter by Session Type "workshop"
    await searchInput.fill('');
    await expect(visibleRows).toHaveCount(initialCount);

    const typeSelect = page.getByTestId('archive-type-select');
    await typeSelect.selectOption('workshop');

    const workshopRowsCount = await visibleRows.count();
    expect(workshopRowsCount).toBeGreaterThan(0);
    expect(workshopRowsCount).toBeLessThan(initialCount);

    for (let i = 0; i < workshopRowsCount; i++) {
      const badge = visibleRows.nth(i).getByTestId('archive-row-type');
      await expect(badge).toHaveText(/workshop/i);
    }
  });
});
