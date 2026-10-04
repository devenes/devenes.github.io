/**
 * Enes Turan — Speaking Archive Application Engine
 * Pure Vanilla JavaScript Data Architecture
 */

(function () {
  'use strict';

  // ==========================================================================
  // Known Geographic Coordinates for Map Projection (Equirectangular 1000x500)
  // ==========================================================================
  const CITY_COORDINATES = {
    'Dubai, UAE': { lat: 25.2048, lon: 55.2708, label: 'Dubai' },
    'Cairo, Egypt': { lat: 30.0444, lon: 31.2357, label: 'Cairo' },
    '6th of October City, Egypt': { lat: 29.9870, lon: 30.9416, label: '6th of October City' },
    'Pristina, Kosovo': { lat: 42.6629, lon: 21.1655, label: 'Pristina' },
    'Istanbul, Türkiye': { lat: 41.0082, lon: 28.9784, label: 'Istanbul' },
    'Bursa, Türkiye': { lat: 40.1885, lon: 29.0610, label: 'Bursa' },
    'Denizli, Türkiye': { lat: 37.7765, lon: 29.0864, label: 'Denizli' },
    'Kastamonu, Türkiye': { lat: 41.3887, lon: 33.7827, label: 'Kastamonu' },
    'Konya, Türkiye': { lat: 37.8746, lon: 32.4932, label: 'Konya' },
    'Düzce, Türkiye': { lat: 40.8438, lon: 31.1565, label: 'Düzce' },
    'İzmit, Türkiye': { lat: 40.7654, lon: 29.9408, label: 'İzmit' },
    'Almaty, Kazakhstan': { lat: 43.2220, lon: 76.8512, label: 'Almaty' },
    'Astana, Kazakhstan': { lat: 51.1694, lon: 71.4491, label: 'Astana' },
    'Pavlodar, Kazakhstan': { lat: 52.2872, lon: 76.9674, label: 'Pavlodar' },
    'Taldykorgan, Kazakhstan': { lat: 45.0156, lon: 78.3739, label: 'Taldykorgan' },
    'Tashkent, Uzbekistan': { lat: 41.2995, lon: 69.2401, label: 'Tashkent' },
    'Kashkadarya, Uzbekistan': { lat: 38.8606, lon: 65.7891, label: 'Kashkadarya' },
    'Bishkek, Kyrgyzstan': { lat: 42.8746, lon: 74.5698, label: 'Bishkek' },
    'Sousse, Tunisia': { lat: 35.8256, lon: 10.6084, label: 'Sousse' },
    'Sarajevo, Bosnia and Herzegovina': { lat: 43.8563, lon: 18.4131, label: 'Sarajevo' },
    'Agadir, Morocco': { lat: 30.4278, lon: -9.5981, label: 'Agadir' },
    'Baku, Azerbaijan': { lat: 40.4093, lon: 49.8671, label: 'Baku' },
    'Ulaanbaatar, Mongolia': { lat: 47.8864, lon: 106.9057, label: 'Ulaanbaatar' }
  };

  // Month names for clean editorial display
  const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const MONTH_NAMES_FULL = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ==========================================================================
  // Application State
  // ==========================================================================
  let allEvents = [];
  let activeYear = 'all';
  let activeTopic = 'all';
  let activeCity = 'all';
  let searchQuery = '';
  let activeEvent = null;
  let activePhotoIndex = 0;
  let previousFocusedElement = null;

  // ==========================================================================
  // DOM References
  // ==========================================================================
  // Metrics
  const statTalks = document.getElementById('stat-talks');
  const statYears = document.getElementById('stat-years');
  const statVenues = document.getElementById('stat-venues');

  // Archive Controls
  const filterYearsContainer = document.getElementById('filter-years');
  const filterTopicsContainer = document.getElementById('filter-topics');
  const archiveSearchInput = document.getElementById('archive-search');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const statusCount = document.getElementById('status-count');
  const statusFilters = document.getElementById('status-filters');
  const resetAllFiltersBtn = document.getElementById('reset-all-filters-btn');
  const archiveLedger = document.getElementById('archive-ledger');
  const emptyState = document.getElementById('empty-state');
  const emptyStateMessage = document.getElementById('empty-state-message');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  // Map & Roster
  const mapMarkersGroup = document.getElementById('map-markers');
  const mapTooltip = document.getElementById('map-tooltip');
  const mapViewContainer = document.getElementById('map-view-container');
  const citiesRoster = document.getElementById('cities-roster');
  const rosterResetBtn = document.getElementById('roster-reset-btn');

  // Modal Dialog
  const eventModal = document.getElementById('event-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalRecordId = document.getElementById('modal-record-id');
  const modalDate = document.getElementById('modal-date');
  const modalLocation = document.getElementById('modal-location');
  const modalEventName = document.getElementById('modal-event-name');
  const modalTalk = document.getElementById('modal-talk');
  const modalDescription = document.getElementById('modal-description');
  const modalTopics = document.getElementById('modal-topics');
  const modalResources = document.getElementById('modal-resources');
  const modalResourcesGroup = document.getElementById('modal-resources-group');
  const modalGalleryCol = document.getElementById('modal-photo-col');
  const galleryStage = document.getElementById('gallery-stage');
  const galleryCounter = document.getElementById('gallery-counter');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');
  const galleryThumbnails = document.getElementById('gallery-thumbnails');

  // Footer copyright
  const currentYearSpan = document.getElementById('current-year');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // ==========================================================================
  // Date & Text Formatting Utilities
  // ==========================================================================
  /**
   * Format ISO date string into month & year (e.g., "SEP 2026")
   * Day is intentionally not displayed prominently per editorial specs.
   * @param {string} dateStr
   * @returns {string}
   */
  function formatMonthYear(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${MONTH_NAMES_SHORT[monthIndex]} ${year}`;
        }
      }
      const d = new Date(dateStr);
      return `${MONTH_NAMES_SHORT[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Format date into full month name and year for archival dossiers (e.g., "September 2026")
   * @param {string} dateStr
   * @returns {string}
   */
  function formatFullMonthYear(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${MONTH_NAMES_FULL[monthIndex]} ${year}`;
        }
      }
      const d = new Date(dateStr);
      return `${MONTH_NAMES_FULL[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  }

  /**
   * Sanitize text against XSS
   * @param {string} str
   * @returns {string}
   */
  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Project geographic coordinates to SVG equirectangular plane (1000x500)
   * @param {number} lat
   * @param {number} lon
   * @returns {{x: number, y: number}}
   */
  function projectCoordinates(lat, lon) {
    const x = (lon + 180.0) * (1000.0 / 360.0);
    const y = (90.0 - lat) * (500.0 / 180.0);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  // ==========================================================================
  // Data Fetching & Architecture Initialization
  // ==========================================================================
  async function initApplication() {
    try {
      if (statusCount) {
        statusCount.textContent = 'Loading speaking archive...';
      }

      const response = await fetch('data/events.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load event data. Status: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected array of speaking events in data/events.json');
      }

      // Sort newest events first (chronological archive descending)
      allEvents = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      updateHeroMetrics(allEvents);
      renderYearFilters(allEvents);
      renderTopicFilters(allEvents);
      renderGlobalReachMap(allEvents);
      renderVenuesRoster(allEvents);
      applyFilters();
      setupInteractiveTriggers();
      handleInitialRoute();
    } catch (err) {
      console.error('Archive Initialization Error:', err);
      if (statusCount) {
        statusCount.textContent = 'Error loading archive';
      }
      if (emptyState) {
        emptyState.classList.remove('hidden');
        emptyStateMessage.textContent = 'Could not load event data from data/events.json. Please verify file integrity.';
      }
    }
  }

  // ==========================================================================
  // Metrics Computation
  // ==========================================================================
  function updateHeroMetrics(events) {
    const totalCount = events.length;
    if (statTalks) {
      statTalks.textContent = totalCount.toString();
    }

    // Compute years span
    const years = events
      .map((e) => (e.date ? parseInt(e.date.substring(0, 4), 10) : null))
      .filter((y) => !isNaN(y) && y !== null);

    if (years.length > 0 && statYears) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      statYears.textContent = minYear === maxYear ? `${minYear}` : `${minYear} — ${maxYear}`;
    }

    // Unique venues/cities count (including Online)
    const uniqueLocations = new Set(events.map((e) => e.city).filter(Boolean));
    if (statVenues) {
      statVenues.textContent = uniqueLocations.size.toString();
    }
  }

  // ==========================================================================
  // Year & Topic Filter Controls
  // ==========================================================================
  function renderYearFilters(events) {
    if (!filterYearsContainer) return;
    filterYearsContainer.innerHTML = '';

    const years = Array.from(
      new Set(
        events
          .map((e) => (e.date ? e.date.substring(0, 4) : null))
          .filter(Boolean)
      )
    ).sort((a, b) => b - a);

    // "All" Button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `filter-btn ${activeYear === 'all' ? 'active' : ''}`;
    allBtn.textContent = `ALL (${events.length})`;
    allBtn.setAttribute('data-year', 'all');
    allBtn.setAttribute('aria-pressed', activeYear === 'all' ? 'true' : 'false');
    allBtn.addEventListener('click', () => {
      setYearFilter('all');
    });
    filterYearsContainer.appendChild(allBtn);

    // Year Buttons
    years.forEach((yr) => {
      const count = events.filter((e) => e.date && e.date.startsWith(yr)).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-btn ${activeYear === yr ? 'active' : ''}`;
      btn.textContent = `${yr} (${count})`;
      btn.setAttribute('data-year', yr);
      btn.setAttribute('aria-pressed', activeYear === yr ? 'true' : 'false');
      btn.addEventListener('click', () => {
        setYearFilter(yr);
      });
      filterYearsContainer.appendChild(btn);
    });
  }

  function renderTopicFilters(events) {
    if (!filterTopicsContainer) return;
    filterTopicsContainer.innerHTML = '';

    // Calculate frequency of topics across all events
    const topicCounts = {};
    events.forEach((ev) => {
      if (Array.isArray(ev.topics)) {
        ev.topics.forEach((t) => {
          topicCounts[t] = (topicCounts[t] || 0) + 1;
        });
      }
    });

    // Select curated priority topics with count >= 2
    const sortedTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);

    // Add "All Topics" chip
    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `topic-chip ${activeTopic === 'all' ? 'active' : ''}`;
    allChip.textContent = 'All Topics';
    allChip.addEventListener('click', () => {
      setTopicFilter('all');
    });
    filterTopicsContainer.appendChild(allChip);

    // Render top 12 most frequent topics
    const topTopics = sortedTopics.slice(0, 12);
    topTopics.forEach((t) => {
      const count = topicCounts[t];
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `topic-chip ${activeTopic === t ? 'active' : ''}`;
      chip.textContent = `${t} (${count})`;
      chip.setAttribute('data-topic', t);
      chip.addEventListener('click', () => {
        setTopicFilter(t === activeTopic ? 'all' : t);
      });
      filterTopicsContainer.appendChild(chip);
    });
  }

  // ==========================================================================
  // Filter Application & Execution
  // ==========================================================================
  function setYearFilter(yr) {
    activeYear = yr;
    updateYearButtonStates();
    applyFilters();
  }

  function setTopicFilter(topic) {
    activeTopic = topic;
    updateTopicButtonStates();
    applyFilters();
  }

  function setCityFilter(city) {
    activeCity = city;
    updateCityRosterStates();
    applyFilters();
  }

  function clearAllFilters() {
    activeYear = 'all';
    activeTopic = 'all';
    activeCity = 'all';
    searchQuery = '';
    if (archiveSearchInput) archiveSearchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.add('hidden');
    updateYearButtonStates();
    updateTopicButtonStates();
    updateCityRosterStates();
    applyFilters();
  }

  function updateYearButtonStates() {
    if (!filterYearsContainer) return;
    const btns = filterYearsContainer.querySelectorAll('.filter-btn');
    btns.forEach((btn) => {
      const yr = btn.getAttribute('data-year');
      const isActive = yr === activeYear;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function updateTopicButtonStates() {
    if (!filterTopicsContainer) return;
    const chips = filterTopicsContainer.querySelectorAll('.topic-chip');
    chips.forEach((chip) => {
      const t = chip.getAttribute('data-topic') || 'all';
      const isActive = t === activeTopic;
      chip.classList.toggle('active', isActive);
    });
  }

  function updateCityRosterStates() {
    if (!citiesRoster) return;
    const chips = citiesRoster.querySelectorAll('.city-roster-chip');
    chips.forEach((chip) => {
      const c = chip.getAttribute('data-city');
      const isActive = c === activeCity;
      chip.classList.toggle('active', isActive);
    });
    if (rosterResetBtn) {
      rosterResetBtn.classList.toggle('hidden', activeCity === 'all');
    }
  }

  function applyFilters() {
    const q = searchQuery.trim().toLowerCase();

    const filtered = allEvents.filter((ev) => {
      // Year check
      if (activeYear !== 'all') {
        if (!ev.date || !ev.date.startsWith(activeYear)) return false;
      }

      // Topic check
      if (activeTopic !== 'all') {
        if (!Array.isArray(ev.topics) || !ev.topics.includes(activeTopic)) return false;
      }

      // City check
      if (activeCity !== 'all') {
        if (ev.city !== activeCity) return false;
      }

      // Search query check (talk, event, city, description, topics)
      if (q) {
        const inTalk = (ev.talk || '').toLowerCase().includes(q);
        const inEvent = (ev.event || '').toLowerCase().includes(q);
        const inCity = (ev.city || '').toLowerCase().includes(q);
        const inDesc = (ev.description || '').toLowerCase().includes(q);
        const inTopics = Array.isArray(ev.topics) && ev.topics.some((t) => t.toLowerCase().includes(q));
        if (!inTalk && !inEvent && !inCity && !inDesc && !inTopics) return false;
      }

      return true;
    });

    renderArchiveLedger(filtered);
    updateStatusBar(filtered);
  }

  function updateStatusBar(filtered) {
    const total = allEvents.length;
    const count = filtered.length;

    if (statusCount) {
      if (activeYear === 'all' && activeTopic === 'all' && activeCity === 'all' && !searchQuery) {
        statusCount.textContent = `Showing all ${count} talks`;
      } else {
        statusCount.textContent = `Showing ${count} of ${total} talks`;
      }
    }

    // Active filters display
    if (statusFilters) {
      statusFilters.innerHTML = '';
      const hasFilter = activeYear !== 'all' || activeTopic !== 'all' || activeCity !== 'all' || searchQuery;

      if (resetAllFiltersBtn) {
        resetAllFiltersBtn.classList.toggle('hidden', !hasFilter);
      }

      if (activeYear !== 'all') {
        const badge = createActiveFilterBadge(`Year: ${activeYear}`, () => setYearFilter('all'));
        statusFilters.appendChild(badge);
      }

      if (activeTopic !== 'all') {
        const badge = createActiveFilterBadge(`Topic: #${activeTopic}`, () => setTopicFilter('all'));
        statusFilters.appendChild(badge);
      }

      if (activeCity !== 'all') {
        const badge = createActiveFilterBadge(`Location: ${activeCity}`, () => setCityFilter('all'));
        statusFilters.appendChild(badge);
      }

      if (searchQuery) {
        const badge = createActiveFilterBadge(`Query: "${searchQuery}"`, () => {
          searchQuery = '';
          if (archiveSearchInput) archiveSearchInput.value = '';
          if (searchClearBtn) searchClearBtn.classList.add('hidden');
          applyFilters();
        });
        statusFilters.appendChild(badge);
      }
    }
  }

  function createActiveFilterBadge(label, onRemove) {
    const span = document.createElement('span');
    span.className = 'active-filter-badge';
    span.innerHTML = `
      <span>${escapeHtml(label)}</span>
      <button type="button" class="badge-clear" aria-label="Remove filter">✕</button>
    `;
    const btn = span.querySelector('.badge-clear');
    btn.addEventListener('click', onRemove);
    return span;
  }

  // ==========================================================================
  // Chronological Archive Ledger Rendering
  // ==========================================================================
  function renderArchiveLedger(events) {
    if (!archiveLedger) return;
    archiveLedger.innerHTML = '';

    if (events.length === 0) {
      if (emptyState) {
        emptyState.classList.remove('hidden');
        if (searchQuery) {
          emptyStateMessage.textContent = `No speaking sessions matched "${searchQuery}".`;
        } else {
          emptyStateMessage.textContent = 'No speaking sessions matched your filter criteria.';
        }
      }
      return;
    }

    if (emptyState) {
      emptyState.classList.add('hidden');
    }

    // Group filtered events by year (descending)
    const grouped = {};
    events.forEach((ev) => {
      const yr = ev.date ? ev.date.substring(0, 4) : 'ARCHIVE';
      if (!grouped[yr]) grouped[yr] = [];
      grouped[yr].push(ev);
    });

    const years = Object.keys(grouped).sort((a, b) => b - a);

    years.forEach((year) => {
      const yearEvents = grouped[year];
      const yearGroup = document.createElement('div');
      yearGroup.className = 'year-divider-group';

      // Year Header
      const header = document.createElement('div');
      header.className = 'year-divider-header';

      let statusNote = 'RECORD';
      if (year === '2026') statusNote = 'CURRENT & FORTHCOMING';
      else if (year === '2025') statusNote = 'AGENTIC SYSTEMS';
      else if (year === '2024') statusNote = 'AI/ML ON KUBERNETES';
      else if (year === '2023') statusNote = 'FOUNDATIONAL CLOUD';

      header.innerHTML = `
        <h3 class="year-divider-num">${escapeHtml(year)}</h3>
        <span class="year-divider-meta">${yearEvents.length} ${yearEvents.length === 1 ? 'TALK' : 'TALKS'} · ${statusNote}</span>
      `;
      yearGroup.appendChild(header);

      // List of entries
      const list = document.createElement('div');
      list.className = 'year-entries-list';

      yearEvents.forEach((event, idx) => {
        const itemNumber = (idx + 1).toString().padStart(2, '0');
        const entry = renderArchiveEntry(event, itemNumber);
        list.appendChild(entry);
      });

      yearGroup.appendChild(list);
      archiveLedger.appendChild(yearGroup);
    });
  }

  function renderArchiveEntry(event, itemNumber) {
    const article = document.createElement('article');
    article.className = 'archive-entry';
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'button');
    article.setAttribute('aria-haspopup', 'dialog');
    article.setAttribute('aria-label', `Examine talk record: ${event.talk} at ${event.event}`);
    article.setAttribute('data-id', event.id);

    const formattedDate = formatMonthYear(event.date);
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const hasPhotos = photos.length > 0;

    article.innerHTML = `
      <div class="entry-meta-col">
        <time class="entry-date">${escapeHtml(formattedDate)}</time>
        <span class="entry-location">${escapeHtml(event.city || 'ONLINE')}</span>
        <span class="entry-index-num">RECORD #${itemNumber}</span>
      </div>

      <div class="entry-content-col">
        <h4 class="entry-talk-title">${escapeHtml(event.talk)}</h4>
        <div class="entry-event-name">${escapeHtml(event.event)}</div>
        ${event.description ? `<p class="entry-summary">${escapeHtml(event.description)}</p>` : ''}
        ${
          Array.isArray(event.topics) && event.topics.length > 0
            ? `<div class="entry-topics-row">
                ${event.topics.slice(0, 4).map((t) => `<span class="entry-topic-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>`
            : ''
        }
      </div>

      <div class="entry-action-col">
        <span class="entry-inspect-link">
          <span>Examine Record</span>
          <span aria-hidden="true">↗</span>
        </span>
        ${
          hasPhotos
            ? `<span class="entry-photo-indicator">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>${photos.length} ${photos.length === 1 ? 'photo' : 'photos'}</span>
              </span>`
            : ''
        }
      </div>
    `;

    // Click & Keyboard interactions
    article.addEventListener('click', () => {
      openEventDetails(event);
    });

    article.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEventDetails(event);
      }
    });

    return article;
  }

  // ==========================================================================
  // Global Reach Map Rendering
  // ==========================================================================
  function renderGlobalReachMap(events) {
    if (!mapMarkersGroup) return;
    mapMarkersGroup.innerHTML = '';

    // Count physical speaking engagements per city
    const cityTalks = {};
    events.forEach((ev) => {
      if (ev.city && ev.city !== 'Online') {
        cityTalks[ev.city] = (cityTalks[ev.city] || 0) + 1;
      }
    });

    // Plot markers
    Object.entries(cityTalks).forEach(([cityName, count]) => {
      const coords = CITY_COORDINATES[cityName];
      if (!coords) return;

      const proj = projectCoordinates(coords.lat, coords.lon);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'map-marker-item');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${cityName}: ${count} ${count === 1 ? 'talk' : 'talks'}`);

      // Radar pulse ring
      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('class', 'marker-pulse');
      pulse.setAttribute('cx', proj.x.toString());
      pulse.setAttribute('cy', proj.y.toString());
      pulse.setAttribute('r', '7');

      // Center point
      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('class', 'marker-point');
      point.setAttribute('cx', proj.x.toString());
      point.setAttribute('cy', proj.y.toString());
      point.setAttribute('r', '3');

      group.appendChild(pulse);
      group.appendChild(point);

      // Tooltip handling
      const showTooltip = (e) => {
        if (!mapTooltip || !mapViewContainer) return;
        const rect = mapViewContainer.getBoundingClientRect();
        // Calculate relative position based on SVG coordinates
        const svgElem = document.getElementById('world-map-svg');
        if (!svgElem) return;
        const svgRect = svgElem.getBoundingClientRect();
        const scaleX = svgRect.width / 1000;
        const scaleY = svgRect.height / 500;

        const posX = (proj.x * scaleX);
        const posY = (proj.y * scaleY);

        mapTooltip.textContent = `${cityName} — ${count} ${count === 1 ? 'talk' : 'talks'}`;
        mapTooltip.style.left = `${posX}px`;
        mapTooltip.style.top = `${posY}px`;
        mapTooltip.classList.add('visible');
      };

      const hideTooltip = () => {
        if (mapTooltip) mapTooltip.classList.remove('visible');
      };

      group.addEventListener('mouseenter', showTooltip);
      group.addEventListener('mouseleave', hideTooltip);
      group.addEventListener('focus', showTooltip);
      group.addEventListener('blur', hideTooltip);

      // Click to filter archive
      group.addEventListener('click', () => {
        setCityFilter(cityName);
        scrollToArchive();
      });

      group.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setCityFilter(cityName);
          scrollToArchive();
        }
      });

      mapMarkersGroup.appendChild(group);
    });
  }

  function renderVenuesRoster(events) {
    if (!citiesRoster) return;
    citiesRoster.innerHTML = '';

    // Calculate count per location
    const cityCounts = {};
    events.forEach((ev) => {
      const c = ev.city || 'Online';
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    });

    // Sort locations by frequency
    const sortedCities = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

    sortedCities.forEach(([cityName, count]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `city-roster-chip ${activeCity === cityName ? 'active' : ''}`;
      chip.textContent = `${cityName} (${count})`;
      chip.setAttribute('data-city', cityName);
      chip.addEventListener('click', () => {
        setCityFilter(activeCity === cityName ? 'all' : cityName);
        scrollToArchive();
      });
      citiesRoster.appendChild(chip);
    });
  }

  function scrollToArchive() {
    const archiveSection = document.getElementById('archive');
    if (archiveSection) {
      archiveSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================================================
  // Speaking Journey & Topic Interaction Triggers
  // ==========================================================================
  function setupInteractiveTriggers() {
    // Journey Buttons
    const journeyBtns = document.querySelectorAll('.journey-action-btn');
    journeyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const yr = btn.getAttribute('data-year');
        if (yr) {
          setYearFilter(yr);
          scrollToArchive();
        }
      });
    });

    // Topic Pillar Buttons
    const topicBtns = document.querySelectorAll('.pillar-filter-btn');
    topicBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-topic');
        if (topic) {
          setTopicFilter(topic);
          scrollToArchive();
        }
      });
    });

    // Search Input with Debounce
    if (archiveSearchInput) {
      let debounceTimer = null;
      archiveSearchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchQuery = e.target.value;
          if (searchClearBtn) {
            searchClearBtn.classList.toggle('hidden', !searchQuery);
          }
          applyFilters();
        }, 150);
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchQuery = '';
        if (archiveSearchInput) archiveSearchInput.value = '';
        searchClearBtn.classList.add('hidden');
        applyFilters();
        if (archiveSearchInput) archiveSearchInput.focus();
      });
    }

    // Reset Buttons
    if (resetAllFiltersBtn) {
      resetAllFiltersBtn.addEventListener('click', clearAllFilters);
    }
    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', clearAllFilters);
    }
    if (rosterResetBtn) {
      rosterResetBtn.addEventListener('click', () => {
        setCityFilter('all');
      });
    }
  }

  // ==========================================================================
  // Archival Record Dossier / Modal Dialog
  // ==========================================================================
  function openEventDetails(event) {
    if (!eventModal || !event) return;

    previousFocusedElement = document.activeElement;
    activeEvent = event;
    activePhotoIndex = 0;

    // Header metadata stamps
    if (modalRecordId) {
      modalRecordId.textContent = `SLUG #${event.id}`;
    }
    if (modalDate) {
      modalDate.textContent = formatFullMonthYear(event.date);
    }
    if (modalLocation) {
      modalLocation.textContent = event.city || 'ONLINE';
    }

    // Content
    if (modalEventName) {
      modalEventName.textContent = event.event || 'Speaking Event';
    }
    if (modalTalk) {
      modalTalk.textContent = event.talk || 'Technical Session';
    }
    if (modalDescription) {
      modalDescription.textContent =
        event.description ||
        'Session abstract and presentation record recorded under Enes Turan speaker catalog.';
    }

    // Topics list
    if (modalTopics) {
      modalTopics.innerHTML = '';
      if (Array.isArray(event.topics) && event.topics.length > 0) {
        event.topics.forEach((t) => {
          const chip = document.createElement('span');
          chip.className = 'modal-topic-chip';
          chip.textContent = `#${t}`;
          modalTopics.appendChild(chip);
        });
      } else {
        const chip = document.createElement('span');
        chip.className = 'modal-topic-chip';
        chip.textContent = '#Cloud & Architecture';
        modalTopics.appendChild(chip);
      }
    }

    // Session Resources (Slides, Video, Event, LinkedIn)
    if (modalResources && modalResourcesGroup) {
      modalResources.innerHTML = '';
      const resources = [];

      if (event.slidesUrl) resources.push({ label: 'Presentation Slides', url: event.slidesUrl });
      if (event.recordingUrl) resources.push({ label: 'Video Recording', url: event.recordingUrl });
      if (event.eventUrl) resources.push({ label: 'Conference Page', url: event.eventUrl });
      if (event.linkedinUrl) resources.push({ label: 'LinkedIn Post', url: event.linkedinUrl });

      if (resources.length > 0) {
        modalResourcesGroup.classList.remove('hidden');
        resources.forEach((res) => {
          const a = document.createElement('a');
          a.className = 'modal-resource-link';
          a.href = res.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.innerHTML = `
            <span>${escapeHtml(res.label)}</span>
            <span aria-hidden="true">↗</span>
          `;
          modalResources.appendChild(a);
        });
      } else {
        modalResourcesGroup.classList.add('hidden');
      }
    }

    // Gallery Render
    renderModalGallery(event);

    // Update URL hash without causing viewport jump
    if (history.pushState) {
      history.pushState(null, '', `#${encodeURIComponent(event.id)}`);
    } else {
      window.location.hash = `#${encodeURIComponent(event.id)}`;
    }

    // Show native dialog modal
    if (!eventModal.open) {
      eventModal.showModal();
    }

    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  function renderModalGallery(event) {
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const total = photos.length;

    if (total <= 1) {
      if (galleryPrevBtn) galleryPrevBtn.style.display = 'none';
      if (galleryNextBtn) galleryNextBtn.style.display = 'none';
      if (galleryThumbnails) galleryThumbnails.style.display = 'none';
    } else {
      if (galleryPrevBtn) galleryPrevBtn.style.display = 'inline-flex';
      if (galleryNextBtn) galleryNextBtn.style.display = 'inline-flex';
      if (galleryThumbnails) galleryThumbnails.style.display = 'flex';
    }

    // Render thumbnails
    if (galleryThumbnails && total > 1) {
      galleryThumbnails.innerHTML = '';
      photos.forEach((photoUrl, idx) => {
        const thumbBtn = document.createElement('button');
        thumbBtn.type = 'button';
        thumbBtn.className = `gallery-thumbnail-btn ${idx === activePhotoIndex ? 'active' : ''}`;
        thumbBtn.setAttribute('aria-label', `View photo ${idx + 1} of ${total}`);

        const img = document.createElement('img');
        img.className = 'gallery-thumbnail-img';
        img.src = photoUrl;
        img.alt = `Thumbnail ${idx + 1}`;
        img.loading = 'lazy';
        img.addEventListener('error', () => {
          thumbBtn.style.display = 'none';
        });

        thumbBtn.appendChild(img);
        thumbBtn.addEventListener('click', () => {
          setGalleryPhoto(idx);
        });
        galleryThumbnails.appendChild(thumbBtn);
      });
    }

    updateGalleryStage();
  }

  function updateGalleryStage() {
    if (!galleryStage || !activeEvent) return;
    const photos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    const total = photos.length;

    galleryStage.innerHTML = '';

    if (total === 0) {
      const notice = document.createElement('div');
      notice.className = 'gallery-pending-notice';
      notice.innerHTML = `
        <span class="pending-stamp">PHOTOGRAPHS PENDING</span>
        <span class="pending-sub">Archival photographs for ${escapeHtml(activeEvent.event)} will be filed upon photo acquisition.</span>
      `;
      galleryStage.appendChild(notice);
      if (galleryCounter) galleryCounter.textContent = '0 / 0';
      return;
    }

    const currentUrl = photos[activePhotoIndex];
    const mainImg = document.createElement('img');
    mainImg.className = 'gallery-stage-image';
    mainImg.src = currentUrl;
    mainImg.alt = `${activeEvent.event} — Photo ${activePhotoIndex + 1}`;

    mainImg.addEventListener('error', () => {
      galleryStage.innerHTML = `
        <div class="gallery-pending-notice">
          <span class="pending-stamp">PHOTO RECORD</span>
          <span class="pending-sub">${escapeHtml(activeEvent.event)}</span>
        </div>
      `;
    });

    galleryStage.appendChild(mainImg);

    if (galleryCounter) {
      galleryCounter.textContent = `${activePhotoIndex + 1} / ${total}`;
    }

    if (galleryPrevBtn) galleryPrevBtn.disabled = activePhotoIndex === 0;
    if (galleryNextBtn) galleryNextBtn.disabled = activePhotoIndex === total - 1;

    // Update active thumbnail
    if (galleryThumbnails) {
      const thumbs = galleryThumbnails.querySelectorAll('.gallery-thumbnail-btn');
      thumbs.forEach((th, idx) => {
        th.classList.toggle('active', idx === activePhotoIndex);
      });
    }
  }

  function setGalleryPhoto(index) {
    if (!activeEvent) return;
    const photos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    if (index >= 0 && index < photos.length) {
      activePhotoIndex = index;
      updateGalleryStage();
    }
  }

  function closeEventModal() {
    if (eventModal && eventModal.open) {
      eventModal.close();
    }
    activeEvent = null;

    // Clean hash without reload
    if (window.location.hash) {
      if (history.pushState) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }

    if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
      previousFocusedElement.focus();
    }
  }

  function handleInitialRoute() {
    const rawHash = window.location.hash.replace(/^#/, '').trim();
    if (!rawHash) return;

    const eventId = decodeURIComponent(rawHash);
    const target = allEvents.find((e) => e.id === eventId);
    if (target) {
      openEventDetails(target);
    }
  }

  // ==========================================================================
  // Event Listeners Registration
  // ==========================================================================
  function setupEventListeners() {
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeEventModal);
    }

    if (galleryPrevBtn) {
      galleryPrevBtn.addEventListener('click', () => {
        setGalleryPhoto(activePhotoIndex - 1);
      });
    }

    if (galleryNextBtn) {
      galleryNextBtn.addEventListener('click', () => {
        setGalleryPhoto(activePhotoIndex + 1);
      });
    }

    // Keyboard controls for modal
    window.addEventListener('keydown', (e) => {
      if (!eventModal || !eventModal.open) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setGalleryPhoto(activePhotoIndex - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setGalleryPhoto(activePhotoIndex + 1);
      } else if (e.key === 'Escape') {
        closeEventModal();
      }
    });

    // Hash change support (back/forward browser buttons)
    window.addEventListener('hashchange', () => {
      const rawHash = window.location.hash.replace(/^#/, '').trim();
      if (!rawHash) {
        if (eventModal && eventModal.open) {
          eventModal.close();
          activeEvent = null;
        }
      } else {
        const eventId = decodeURIComponent(rawHash);
        if (!activeEvent || activeEvent.id !== eventId) {
          const target = allEvents.find((e) => e.id === eventId);
          if (target) {
            openEventDetails(target);
          }
        }
      }
    });

    // Fallback light-dismiss for browsers without native closedby support
    if (eventModal) {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        eventModal.addEventListener('click', (event) => {
          if (event.target !== eventModal) return;
          const rect = eventModal.getBoundingClientRect();
          const isDialogContent =
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width;
          if (isDialogContent) return;
          closeEventModal();
        });
      }

      eventModal.addEventListener('close', () => {
        if (window.location.hash) {
          if (history.pushState) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
          } else {
            window.location.hash = '';
          }
        }
        activeEvent = null;
      });
    }
  }

  // Start application on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initApplication();
  });
})();
