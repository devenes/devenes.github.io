import { expect, test } from '@playwright/test';

test.describe('Global Speaking Atlas — E2E Verification Suite', () => {
  test('1. Initial Overview Metrics, 3D Earth Presence & Online Event Exclusion', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Verify immediate identity and headline without user interaction
    await expect(page.getByText('GOOGLE DEVELOPER EXPERT').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Ideas travel\./i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Technology connects\./i })).toBeVisible();

    // Verify exact data-driven metrics from data/events.json (44 talks, 12 countries, 23 physical cities)
    await expect(page.getByTestId('metric-talks')).toHaveText('44');
    await expect(page.getByTestId('metric-countries')).toHaveText('12');
    await expect(page.getByTestId('metric-cities')).toHaveText('23');

    // Verify Online events are NOT plotted as physical destinations on the globe
    const globeLabels = page.locator('[data-globe-city-label]');
    await expect(globeLabels).toHaveCount(23);
    await expect(page.locator('[data-globe-city-label="online"]')).toHaveCount(0);

    // Verify default destination overview panel is visible before selecting any city
    await expect(page.getByTestId('city-overview-state')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('2. Selecting Real Cities Displays Accurate Associated Events & Resets Cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Select Istanbul via prominent destination chip
    await page.getByTestId('prominent-city-istanbul-tr').click();

    await expect(page.locator('body')).toHaveAttribute('data-selected-city', 'istanbul-tr');
    const cityPanel = page.getByTestId('selected-city-panel');
    await expect(cityPanel).toBeVisible();
    await expect(page.getByTestId('selected-city-name')).toHaveText('Istanbul');
    await expect(cityPanel).toContainText('7 TALKS');

    const istanbulEvents = page
      .getByTestId('selected-city-events-list')
      .locator('[data-city-event-id]');
    await expect(istanbulEvents).toHaveCount(7);

    // Select Almaty via dropdown selector
    await page.getByTestId('reset-city-btn').click();
    await expect(page.locator('body')).toHaveAttribute('data-selected-city', '');
    await expect(page.getByTestId('city-overview-state')).toBeVisible();

    await page.getByTestId('city-selector-dropdown').selectOption('almaty-kz');
    await expect(page.locator('body')).toHaveAttribute('data-selected-city', 'almaty-kz');
    await expect(page.getByTestId('selected-city-name')).toHaveText('Almaty');
    await expect(cityPanel).toContainText('2 TALKS');
    await expect(cityPanel).toContainText('DevFest Almaty 2025');
  });

  test('3. Discovery Modes (Globe · Regions · Timeline · Topics) & Year/Topic Filtering', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Switch to Regions mode
    await page.getByTestId('mode-btn-regions').click();
    await expect(page.locator('body')).toHaveAttribute('data-view-mode', 'regions');
    await expect(page.getByTestId('view-panel-regions')).toBeVisible();
    await expect(page.getByTestId('view-panel-regions')).toContainText('Central Asia');
    await expect(page.getByTestId('view-panel-regions')).toContainText(
      'Online & Global Broadcasts'
    );

    // Switch to Topics mode and filter by Kubernetes & Platform Engineering
    await page.getByTestId('mode-btn-topics').click();
    await expect(page.getByTestId('view-panel-topics')).toBeVisible();
    await page.getByTestId('topic-card-kubernetes').click();
    await expect(page.locator('body')).toHaveAttribute('data-topic', 'kubernetes');

    // Filter bottom timeline by Year 2025
    await page.getByTestId('timeline-year-2025').click();
    await expect(page.locator('body')).toHaveAttribute('data-year', '2025');

    const visibleTimelineCards = page.locator('[data-timeline-card]:not(.hidden)');
    const count = await visibleTimelineCards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(visibleTimelineCards.nth(i)).toHaveAttribute('data-year', '2025');
    }
  });

  test('4. Event Dossier Drawer, Full Archive Matrix & Responsive Viewports (Desktop, Tablet, Mobile)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Open an event dossier from the timeline strip
    const dubaiCard = page.getByTestId('timeline-card-devfest-dubai-2026');
    await expect(dubaiCard).toBeVisible();
    await dubaiCard.click();

    const drawer = page.getByTestId('signal-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute('aria-hidden', 'false');
    await expect(page.getByTestId('signal-drawer-title')).toHaveText('Kubernetes for AI');
    await expect(drawer).toContainText('Dubai, UAE');

    // Close drawer via Escape
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    // Open Full Archive directly via "Browse all talks" without touching the globe
    await page.getByTestId('browse-all-talks-btn').click();
    const archiveModal = page.getByTestId('archive-matrix-modal');
    await expect(archiveModal).toBeVisible();

    const visibleRows = archiveModal.locator('tbody tr:not(.hidden)');
    await expect(visibleRows).toHaveCount(44);

    // Search for "Almaty" in Archive
    const searchInput = page.getByTestId('archive-search-input');
    await searchInput.fill('Almaty');
    const almatyRows = await visibleRows.count();
    expect(almatyRows).toBe(3);

    // Reset filters and filter by workshop session format
    await page.getByTestId('archive-reset-filters-btn').click();
    await expect(visibleRows).toHaveCount(44);

    await page.getByTestId('archive-type-select').selectOption('workshop');
    const workshopCount = await visibleRows.count();
    expect(workshopCount).toBeGreaterThan(0);
    for (let i = 0; i < workshopCount; i++) {
      await expect(visibleRows.nth(i).getByTestId('archive-row-type')).toHaveText(
        /workshop/i
      );
    }

    await page.getByTestId('close-archive-btn').click();
    await expect(archiveModal).toBeHidden();

    // Tablet viewport check (820x1180)
    await page.setViewportSize({ width: 820, height: 1180 });
    await expect(page.getByTestId('metric-talks')).toBeVisible();
    await expect(page.getByTestId('destination-panel')).toBeVisible();

    // Mobile viewport check (390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('metric-talks')).toBeVisible();
    await expect(page.getByTestId('browse-all-talks-btn')).toBeVisible();
  });
});
