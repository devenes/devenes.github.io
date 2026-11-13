import { expect, test } from '@playwright/test';

test.describe('Enes Turan Speaking Portfolio — E2E Verification Suite', () => {
  test('1. Initial Identity, Editorial Hierarchy, Real Metrics & Online Event Exclusion', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Verify immediate personal identity without generic AI slogans
    await expect(page.getByText(/Google Developer Expert/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Enes Turan' })).toBeVisible();
    await expect(page.getByText(/Ideas travel\./i)).toHaveCount(0);
    await expect(page.locator('#speaking-impact-card')).toHaveCount(0);

    // Verify exact data-driven metrics from data/events.json (44 talks, 12 countries, 23 physical cities)
    await expect(page.getByTestId('metric-talks')).toHaveText('44');
    await expect(page.getByTestId('metric-countries')).toHaveText('12');
    await expect(page.getByTestId('metric-cities')).toHaveText('23');

    // Verify Online events are NOT plotted as physical destinations on the globe
    const globeLabels = page.locator('[data-globe-city-label]');
    await expect(globeLabels).toHaveCount(23);
    await expect(page.locator('[data-globe-city-label="online"]')).toHaveCount(0);

    // Verify default places overview panel is visible before selecting any city
    await expect(page.getByTestId('city-overview-state')).toBeVisible();

    expect(pageErrors).toEqual([]);
  });

  test('2. Selecting Real Cities Displays Talks, Hides Empty Photos Tab & Resets Cleanly', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Select Istanbul via frequent stop chip
    await page.getByTestId('prominent-city-istanbul-tr').click();

    await expect(page.locator('body')).toHaveAttribute('data-selected-city', 'istanbul-tr');
    const cityPanel = page.getByTestId('selected-city-panel');
    await expect(cityPanel).toBeVisible();
    await expect(page.getByTestId('selected-city-name')).toHaveText('Istanbul');
    await expect(cityPanel).toContainText(/7 talks/i);

    // Verify empty Photos tab stays hidden when city has 0 photos (no data/events.json prompt leak)
    await expect(page.locator('#city-tab-btn-photos')).toBeHidden();
    await expect(cityPanel).not.toContainText('data/events.json');

    const istanbulEvents = page
      .getByTestId('selected-city-events-list')
      .locator('[data-city-event-id]');
    await expect(istanbulEvents).toHaveCount(7);

    // Switch to Details sub-tab and verify regional metadata renders cleanly
    await page.locator('#city-tab-btn-about').click();
    await expect(page.locator('#city-tab-content-about')).toBeVisible();
    await expect(page.locator('#city-tab-content-about')).toContainText('Topics covered in Istanbul');

    // Reset and select Almaty via dropdown selector
    await page.getByTestId('reset-city-btn').click();
    await expect(page.locator('body')).toHaveAttribute('data-selected-city', '');
    await expect(page.getByTestId('city-overview-state')).toBeVisible();

    await page.getByTestId('city-selector-dropdown').selectOption('almaty-kz');
    await expect(page.locator('body')).toHaveAttribute('data-selected-city', 'almaty-kz');
    await expect(page.getByTestId('selected-city-name')).toHaveText('Almaty');
    await expect(cityPanel).toContainText(/2 talks/i);
    await expect(cityPanel).toContainText('DevFest Almaty 2025');
  });

  test('3. Discovery Modes (Places · Regions · Years · Topics) & Year/Topic Filtering', async ({
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

  test('4. Session Drawer, First-Person About Modal, Full Archive & Responsive Viewports', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Open About modal and verify first-person human bio + JumpCloud role + Speaker Kit link
    await page.getByTestId('nav-about-btn').click();
    const aboutModal = page.getByTestId('about-modal');
    await expect(aboutModal).toBeVisible();
    await expect(aboutModal).toContainText('Software Engineer at JumpCloud');
    await expect(aboutModal).toContainText('cloud and platform engineer in Istanbul');
    await expect(aboutModal).not.toContainText('SPEAKER DOSSIER');
    await expect(aboutModal.getByTestId('modal-speaker-kit-link')).toBeVisible();
    await page.getByTestId('close-about-btn').click();
    await expect(aboutModal).toBeHidden();

    // Open a session details sheet from the timeline strip
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

    // Open Full Archive directly via "Browse all talks"
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

    // Mobile viewport check (390x844) & 320px reflow check (single-row header, no horizontal overflow)
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByTestId('metric-talks')).toBeVisible();
    await expect(page.getByTestId('browse-all-talks-btn')).toBeVisible();
    const mobileHeaderBox390 = await page.getByTestId('site-header').boundingBox();
    expect(mobileHeaderBox390).not.toBeNull();
    expect(mobileHeaderBox390!.height).toBeLessThanOrEqual(68);

    await page.setViewportSize({ width: 320, height: 700 });
    const mobileHeaderBox320 = await page.getByTestId('site-header').boundingBox();
    expect(mobileHeaderBox320).not.toBeNull();
    expect(mobileHeaderBox320!.height).toBeLessThanOrEqual(68);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('5. Layout Geometry, Western Coordinates, Archive Filter Reset & Non-Occluding Labels', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    // Ensure 4-mode view selector tablist sits completely below the desktop header
    const tablistBox = await page.locator('#view-mode-tablist').boundingBox();
    expect(tablistBox).not.toBeNull();
    expect(tablistBox!.y).toBeGreaterThanOrEqual(80);

    // Select Agadir (Morocco, -9.5981 longitude) and verify Western coordinate formatting (W, not -E)
    await page.getByTestId('city-selector-dropdown').selectOption('agadir-ma');
    await expect(page.getByTestId('selected-city-name')).toHaveText('Agadir');
    await expect(page.locator('#selected-city-coords')).toHaveText('30.43°N, 9.60°W');

    // Open city-scoped archive ("View all talks in Agadir →") -> 1 talk
    await page.locator('#selected-city-archive-btn').click();
    const archiveModal = page.getByTestId('archive-matrix-modal');
    await expect(archiveModal).toBeVisible();
    const visibleRows = archiveModal.locator('tbody tr:not(.hidden)');
    await expect(visibleRows).toHaveCount(1);
    await page.getByTestId('close-archive-btn').click();

    // Click global "Browse all talks" and verify archive resets city filter back to all 44 talks
    await page.getByTestId('browse-all-talks-btn').click();
    await expect(visibleRows).toHaveCount(44);
    await page.getByTestId('close-archive-btn').click();

    // Verify visible 2D globe city labels never overlap the right-hand destination panel
    const panelBox = await page.getByTestId('destination-panel').boundingBox();
    expect(panelBox).not.toBeNull();
    const visibleLabels = page.locator('[data-globe-city-label][data-visible="true"]');
    const visibleCount = await visibleLabels.count();
    for (let i = 0; i < visibleCount; i++) {
      const box = await visibleLabels.nth(i).boundingBox();
      if (box) {
        const overlapsPanel =
          box.x + box.width > panelBox!.x &&
          box.x < panelBox!.x + panelBox!.width &&
          box.y + box.height > panelBox!.y &&
          box.y < panelBox!.y + panelBox!.height;
        expect(overlapsPanel).toBe(false);
      }
    }
  });

  test('6. URL Hash Deep-Linking, Slash Keyboard Shortcut, Active Topic Filter Pill & Static Asset Serving', async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify root static assets and async land geometry are served with 200 OK
    const landRes = await request.get('/data/land.json');
    expect(landRes.status()).toBe(200);
    const eventsAssetRes = await request.get('/assets/events/README.md');
    expect(eventsAssetRes.status()).toBe(200);

    // Deep-link directly to a talk via #<event-id>
    await page.goto('/#devfest-dubai-2026');
    const drawer = page.getByTestId('signal-drawer');
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId('signal-drawer-title')).toHaveText('Kubernetes for AI');
    await expect(page.locator('body')).toHaveAttribute('data-selected-city', 'dubai-ae');

    // Close drawer via Escape and verify hash falls back to selected city
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();

    // Select a topic and verify the active topic filter pill appears in the timeline bar and clears cleanly
    await page.getByTestId('mode-btn-topics').click();
    await page.getByTestId('topic-card-kubernetes').click();
    const topicPill = page.locator('#active-topic-filter-pill');
    await expect(topicPill).toBeVisible();
    await expect(topicPill).toContainText('Topic:');
    await topicPill.click();
    await expect(topicPill).toBeHidden();
    await expect(page.locator('body')).toHaveAttribute('data-topic', 'all');

    // Press '/' shortcut to open the full archive dialog
    await page.keyboard.press('/');
    const archiveModal = page.getByTestId('archive-matrix-modal');
    await expect(archiveModal).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(archiveModal).toBeHidden();
  });

  test('7. Dedicated Speaker Kit Page (/speaker/), Copy Buttons, Profile Photos, Social Links & SEO Assets', async ({
    page,
    context,
    request,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify OpenGraph images, robots.txt, sitemap.xml, and profile headshots return 200 OK
    for (const assetPath of [
      '/images/og-home.jpg',
      '/images/og-speaker.jpg',
      '/robots.txt',
      '/sitemap.xml',
      '/assets/profile/enes-turan-pp-2.jpg',
      '/assets/profile/enes-turan-pp.jpg',
    ]) {
      const res = await request.get(assetPath);
      expect(res.status(), `Expected 200 for ${assetPath}`).toBe(200);
    }

    // Navigate from home page Speaker Kit link to /speaker/
    await page.goto('/');
    await page.getByTestId('nav-speaker-kit-link').click();
    await expect(page).toHaveURL(/\/speaker\/?$/);
    await expect(page.locator('body')).toHaveAttribute('data-copy-ready', 'true');

    // Verify speaker identity, standard bio, and featured session proposal
    await expect(page.getByRole('heading', { level: 1, name: 'Enes Turan' })).toBeVisible();
    await expect(page.getByTestId('speaker-bio-standard')).toContainText(
      'Enes Turan is a Software Engineer at JumpCloud and a Google Developer Expert.'
    );
    await expect(page.getByTestId('featured-talk-title')).toHaveText(
      'Kubernetes for AI at Scale on Google Kubernetes Engine'
    );
    await expect(page.getByTestId('featured-talk-description')).toContainText(
      'As AI agents and inference workloads become increasingly dynamic and resource-intensive'
    );

    // Verify downloadable high-res photo attributes
    const studioDownload = page.getByTestId('download-photo-portrait-studio');
    await expect(studioDownload).toHaveAttribute(
      'download',
      'Enes-Turan-Portrait-Headshot-1254x1254.jpg'
    );
    const stageDownload = page.getByTestId('download-photo-keynote-stage');
    await expect(stageDownload).toHaveAttribute(
      'download',
      'Enes-Turan-Keynote-Stage-1254x1254.jpg'
    );

    // Verify all 4 requested social links are present on the Speaker Kit page
    const socialGrid = page.getByTestId('social-links-grid');
    for (const expectedUrl of [
      'https://www.linkedin.com/in/devenes/',
      'https://www.instagram.com/enes.ai/',
      'https://x.com/thedevenes',
      'https://www.facebook.com/profile.php?id=100087441315629',
    ]) {
      await expect(socialGrid.locator(`a[href="${expectedUrl}"]`)).toBeVisible();
    }

    // Verify one-click copy button writes exact speaker bio to clipboard and announces status
    const copyBioBtn = page.getByTestId('copy-standard-bio-btn');
    await copyBioBtn.click();
    await expect(copyBioBtn).toHaveAttribute('data-copied', '');
    const copiedBio = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedBio).toContain(
      'Enes Turan is a Software Engineer at JumpCloud and a Google Developer Expert.'
    );

    // Verify full session proposal copy button
    const copyProposalBtn = page.getByTestId('copy-full-talk-btn');
    await copyProposalBtn.click();
    await expect(copyProposalBtn).toHaveAttribute('data-copied', '');
    const copiedProposal = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedProposal).toContain('Kubernetes for AI at Scale on Google Kubernetes Engine');

    // Verify mobile responsiveness on /speaker/ (no horizontal overflow at 320px)
    await page.setViewportSize({ width: 320, height: 700 });
    const speakerOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(speakerOverflow).toBe(false);

    // Verify navigating to /#talks opens the full archive dialog directly
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/#talks');
    await expect(page.getByTestId('archive-matrix-modal')).toBeVisible();
  });

  test('8. Session Proposals Catalog (/sessions/), Track & Format Filtering, Expand All Outlines & Copy Proposal', async ({
    page,
    context,
    request,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.setViewportSize({ width: 1440, height: 900 });

    // Verify /images/og-sessions.jpg returns 200 OK and sitemap lists /sessions/
    const ogRes = await request.get('/images/og-sessions.jpg');
    expect(ogRes.status()).toBe(200);
    const sitemapRes = await request.get('/sitemap.xml');
    expect(sitemapRes.status()).toBe(200);
    expect(await sitemapRes.text()).toContain('/sessions/');

    // Navigate from home page Topics & Abstracts link to /sessions/
    await page.goto('/');
    await page.getByTestId('nav-sessions-link').click();
    await expect(page).toHaveURL(/\/sessions\/?$/);
    await expect(page.locator('body')).toHaveAttribute('data-copy-ready', 'true');

    // Verify all 13 session proposal cards are rendered and visible initially
    const visibleCards = page.locator('[data-session-card]:not([hidden])');
    await expect(visibleCards).toHaveCount(13);
    await expect(page.getByTestId('sessions-visible-count')).toHaveText('Showing 13 of 13');

    // Filter by AI Agents track chip -> 3 proposals
    await page.getByTestId('track-chip-ai-agents').click();
    await expect(visibleCards).toHaveCount(3);
    await expect(page.getByTestId('sessions-visible-count')).toHaveText('Showing 3 of 13');

    // Reset back to All tracks and filter by Workshop format -> 3 hands-on workshops
    await page.locator('[data-track-filter="all"]').click();
    await expect(visibleCards).toHaveCount(13);
    await page.getByTestId('session-format-select').selectOption('Workshop');
    await expect(visibleCards).toHaveCount(3);
    await expect(page.getByTestId('sessions-visible-count')).toHaveText('Showing 3 of 13');

    // Search for "Cloud Service Mesh" within Workshops -> 1 card
    await page.getByTestId('session-search-input').fill('Cloud Service Mesh');
    await expect(visibleCards).toHaveCount(1);
    await expect(page.getByTestId('session-card-model-deployment-canary-csm-gke')).toBeVisible();

    // Trigger empty state and reset via button
    await page.getByTestId('session-search-input').fill('nonexistent-xyz-topic');
    await expect(visibleCards).toHaveCount(0);
    await page.locator('#sessions-reset-filters-btn').click();
    await expect(visibleCards).toHaveCount(13);

    // Expand all outlines and collapse all outlines
    const toggleAllBtn = page.getByTestId('toggle-all-outlines-btn');
    await expect(toggleAllBtn).toHaveAttribute('aria-expanded', 'false');
    await toggleAllBtn.click();
    await expect(toggleAllBtn).toHaveAttribute('aria-expanded', 'true');
    const openDetails = page.locator('details.session-details[open]');
    await expect(openDetails).toHaveCount(13);
    await toggleAllBtn.click();
    await expect(toggleAllBtn).toHaveAttribute('aria-expanded', 'false');
    await expect(openDetails).toHaveCount(0);

    // Verify one-click full proposal copy writes formatted CFP text to clipboard
    const copyProposalBtn = page.getByTestId('copy-proposal-gke-ai-infrastructure-next-gen');
    await copyProposalBtn.click();
    await expect(copyProposalBtn).toHaveAttribute('data-copied', '');
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiedText).toContain(
      'Session Title: Kubernetes for AI at Scale: Building the Next Generation of AI Infrastructure'
    );
    expect(copiedText).toContain('GKE Inference Gateway');

    // Verify mobile responsiveness on /sessions/ (single-row compact header & zero horizontal overflow)
    await page.setViewportSize({ width: 390, height: 844 });
    const header390 = await page.getByTestId('sessions-header').boundingBox();
    expect(header390).not.toBeNull();
    expect(header390!.height).toBeLessThanOrEqual(68);

    await page.setViewportSize({ width: 320, height: 700 });
    const header320 = await page.getByTestId('sessions-header').boundingBox();
    expect(header320).not.toBeNull();
    expect(header320!.height).toBeLessThanOrEqual(68);
    const sessionsOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(sessionsOverflow).toBe(false);
  });

  test('9. Top Navigation Hrefs Across All Pages (/ · /sessions/ · /speaker/) & Slides Button Commented Out', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    for (const route of ['/', '/sessions/', '/speaker/']) {
      await page.goto(route);
      const header = page.locator('header').first();

      // Slides button must not be rendered in top navigation on any page
      await expect(header.getByRole('link', { name: /^Slides/i })).toHaveCount(0);

      // Every anchor inside the header must have a non-empty valid href
      const anchors = header.locator('a');
      const anchorCount = await anchors.count();
      expect(anchorCount).toBeGreaterThan(0);
      for (let i = 0; i < anchorCount; i++) {
        const href = await anchors.nth(i).getAttribute('href');
        expect(href, `Empty href on ${route} anchor #${i}`).toBeTruthy();
      }

      await expect(header.getByTestId('nav-brand-link')).toHaveAttribute('href', '/');
      await expect(header.getByTestId('nav-overview-link')).toHaveAttribute('href', '/');
      await expect(header.getByTestId('nav-talks-btn')).toHaveAttribute('href', '/#talks');
      await expect(header.getByTestId('nav-about-btn')).toHaveAttribute('href', '/#about');
      await expect(header.getByTestId('nav-sessions-link')).toHaveAttribute('href', '/sessions/');
      await expect(header.getByTestId('nav-speaker-kit-link')).toHaveAttribute('href', '/speaker/');
    }

    // Navigate cross-page via top nav links: /sessions/ -> Overview (/) -> Speaker Kit (/speaker/) -> About (/#about) -> Talks (/#talks)
    await page.goto('/sessions/');
    await page.getByTestId('nav-overview-link').click();
    await expect(page).toHaveURL(/\/$/);

    await page.getByTestId('nav-speaker-kit-link').click();
    await expect(page).toHaveURL(/\/speaker\/?$/);

    await page.getByTestId('nav-about-btn').click();
    await expect(page).toHaveURL(/\/#about$/);
    await expect(page.getByTestId('about-modal')).toBeVisible();
    await page.getByTestId('close-about-btn').click();
    await expect(page.getByTestId('about-modal')).toBeHidden();

    await page.goto('/sessions/');
    await page.getByTestId('nav-talks-btn').click();
    await expect(page).toHaveURL(/\/#talks$/);
    await expect(page.getByTestId('archive-matrix-modal')).toBeVisible();

    // Verify mobile navigation links and 320px single-row header on /speaker/ and /sessions/
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/speaker/');
    const speakerHeader320 = await page.getByTestId('speaker-header').boundingBox();
    expect(speakerHeader320).not.toBeNull();
    expect(speakerHeader320!.height).toBeLessThanOrEqual(68);
    await page.getByTestId('mobile-nav-map-link').click();
    await expect(page).toHaveURL(/\/$/);
  });
});
