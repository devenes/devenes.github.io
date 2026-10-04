/**
 * Enes Turan — Speaking Archive Engine
 * Streamlined Vanilla JavaScript Data Architecture
 */

(function () {
  'use strict';

  // ==========================================================================
  // Geographic Coordinates for Vector Map Projection (1000x500 Equirectangular)
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
  let activeCity = 'all';
  let searchQuery = '';
  let activeEvent = null;
  let activePhotoIndex = 0;
  let previousFocusedElement = null;

  // ==========================================================================
  // DOM References
  // ==========================================================================
  const statTalks = document.getElementById('stat-talks');
  const statYears = document.getElementById('stat-years');

  const filterYearsContainer = document.getElementById('filter-years');
  const archiveSearchInput = document.getElementById('archive-search');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const archiveCount = document.getElementById('archive-count');
  const archiveLedger = document.getElementById('archive-ledger');
  const activeCityBar = document.getElementById('active-city-bar');
  const activeCityText = document.getElementById('active-city-text');
  const clearCityBtn = document.getElementById('clear-city-btn');
  const emptyState = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');

  // Map & Locations
  const mapMarkersGroup = document.getElementById('map-markers');
  const mapTooltip = document.getElementById('map-tooltip');
  const mapViewContainer = document.getElementById('map-view-container');
  const citiesRoster = document.getElementById('cities-roster');

  // Modal Dialog
  const eventModal = document.getElementById('event-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalDate = document.getElementById('modal-date');
  const modalLocation = document.getElementById('modal-location');
  const modalTalk = document.getElementById('modal-talk');
  const modalEventName = document.getElementById('modal-event-name');
  const modalDescription = document.getElementById('modal-description');
  const modalTopics = document.getElementById('modal-topics');
  const modalTopicsBlock = document.getElementById('modal-topics-block');
  const modalResources = document.getElementById('modal-resources');
  const modalResourcesBlock = document.getElementById('modal-resources-block');
  const galleryStage = document.getElementById('gallery-stage');
  const galleryCounter = document.getElementById('gallery-counter');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');
  const galleryNavRow = document.getElementById('gallery-nav-row');
  const galleryThumbnails = document.getElementById('gallery-thumbnails');

  // ==========================================================================
  // Date & Text Utilities
  // ==========================================================================
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

  function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function projectCoordinates(lat, lon) {
    const x = (lon + 180.0) * (1000.0 / 360.0);
    const y = (90.0 - lat) * (500.0 / 180.0);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================
  async function initApplication() {
    try {
      if (archiveCount) archiveCount.textContent = 'Loading...';

      const response = await fetch('data/events.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load event data: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Expected array in data/events.json');
      }

      // Sort newest first
      allEvents = data.sort((a, b) => new Date(b.date) - new Date(a.date));

      updateHeroMetrics(allEvents);
      renderYearFilters(allEvents);
      renderGlobalReachMap(allEvents);
      renderLocationsRoster(allEvents);
      applyFilters();
      setupInteractiveTriggers();
      handleInitialRoute();
    } catch (err) {
      console.error('Archive Initialization Error:', err);
      if (archiveCount) archiveCount.textContent = 'Error loading archive';
      if (emptyState) {
        emptyState.classList.remove('hidden');
      }
    }
  }

  // ==========================================================================
  // Hero Metrics Derived from Data
  // ==========================================================================
  function updateHeroMetrics(events) {
    if (statTalks) {
      statTalks.textContent = events.length.toString();
    }

    const years = events
      .map((e) => (e.date ? parseInt(e.date.substring(0, 4), 10) : null))
      .filter((y) => !isNaN(y) && y !== null);

    if (years.length > 0 && statYears) {
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      statYears.textContent = minYear === maxYear ? `${minYear}` : `${minYear} — ${maxYear}`;
    }
  }

  // ==========================================================================
  // Year Filter Buttons
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

    // "ALL" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `year-filter-btn ${activeYear === 'all' ? 'active' : ''}`;
    allBtn.textContent = 'ALL';
    allBtn.setAttribute('data-year', 'all');
    allBtn.setAttribute('aria-pressed', activeYear === 'all' ? 'true' : 'false');
    allBtn.addEventListener('click', () => setYearFilter('all'));
    filterYearsContainer.appendChild(allBtn);

    // Year buttons
    years.forEach((yr) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `year-filter-btn ${activeYear === yr ? 'active' : ''}`;
      btn.textContent = yr;
      btn.setAttribute('data-year', yr);
      btn.setAttribute('aria-pressed', activeYear === yr ? 'true' : 'false');
      btn.addEventListener('click', () => setYearFilter(yr));
      filterYearsContainer.appendChild(btn);
    });
  }

  function setYearFilter(yr) {
    activeYear = yr;
    updateYearButtonStates();
    applyFilters();
  }

  function setCityFilter(city) {
    activeCity = city;
    updateCityBar();
    updateCityRosterStates();
    applyFilters();
  }

  function updateYearButtonStates() {
    if (!filterYearsContainer) return;
    const btns = filterYearsContainer.querySelectorAll('.year-filter-btn');
    btns.forEach((btn) => {
      const yr = btn.getAttribute('data-year');
      const isActive = yr === activeYear;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function updateCityBar() {
    if (!activeCityBar || !activeCityText) return;
    if (activeCity === 'all') {
      activeCityBar.classList.add('hidden');
    } else {
      activeCityBar.classList.remove('hidden');
      activeCityText.textContent = `Showing talks in: ${activeCity}`;
    }
  }

  function updateCityRosterStates() {
    if (!citiesRoster) return;
    const pills = citiesRoster.querySelectorAll('.city-pill-btn');
    pills.forEach((p) => {
      const c = p.getAttribute('data-city');
      p.classList.toggle('active', c === activeCity);
    });
  }

  function clearAllFilters() {
    activeYear = 'all';
    activeCity = 'all';
    searchQuery = '';
    if (archiveSearchInput) archiveSearchInput.value = '';
    if (searchClearBtn) searchClearBtn.classList.add('hidden');
    updateYearButtonStates();
    updateCityBar();
    updateCityRosterStates();
    applyFilters();
  }

  // ==========================================================================
  // Filter Execution
  // ==========================================================================
  function applyFilters() {
    const q = searchQuery.trim().toLowerCase();

    const filtered = allEvents.filter((ev) => {
      // Year filter
      if (activeYear !== 'all') {
        if (!ev.date || !ev.date.startsWith(activeYear)) return false;
      }

      // City filter
      if (activeCity !== 'all') {
        if (ev.city !== activeCity) return false;
      }

      // Search query
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
    updateArchiveCounter(filtered.length);
  }

  function updateArchiveCounter(count) {
    if (!archiveCount) return;
    if (activeYear === 'all' && activeCity === 'all' && !searchQuery) {
      archiveCount.textContent = `${count} talks`;
    } else if (activeYear !== 'all' && activeCity === 'all' && !searchQuery) {
      archiveCount.textContent = `${count} talks in ${activeYear}`;
    } else {
      archiveCount.textContent = `${count} of ${allEvents.length} talks`;
    }
  }

  // ==========================================================================
  // Archive Ledger Rendering
  // ==========================================================================
  function renderArchiveLedger(events) {
    if (!archiveLedger) return;
    archiveLedger.innerHTML = '';

    if (events.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    // Group by year descending
    const grouped = {};
    events.forEach((ev) => {
      const yr = ev.date ? ev.date.substring(0, 4) : 'ARCHIVE';
      if (!grouped[yr]) grouped[yr] = [];
      grouped[yr].push(ev);
    });

    const years = Object.keys(grouped).sort((a, b) => b - a);

    years.forEach((yr) => {
      const yearEvents = grouped[yr];
      const yearGroup = document.createElement('div');
      yearGroup.className = 'archive-year-group';

      const header = document.createElement('h3');
      header.className = 'archive-year-header';
      header.textContent = yr;
      yearGroup.appendChild(header);

      const list = document.createElement('div');
      list.className = 'archive-year-list';

      yearEvents.forEach((ev) => {
        const row = renderArchiveRow(ev);
        list.appendChild(row);
      });

      yearGroup.appendChild(list);
      archiveLedger.appendChild(yearGroup);
    });
  }

  function renderArchiveRow(event) {
    const row = document.createElement('article');
    row.className = 'archive-ledger-row';
    row.setAttribute('tabindex', '0');
    row.setAttribute('role', 'button');
    row.setAttribute('aria-haspopup', 'dialog');
    row.setAttribute('aria-label', `View details for ${event.talk} at ${event.event}`);
    row.setAttribute('data-id', event.id);

    const formattedDate = formatMonthYear(event.date);
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const hasPhotos = photos.length > 0;

    row.innerHTML = `
      <div class="row-meta-col">
        <time class="row-date">${escapeHtml(formattedDate)}</time>
        <span class="row-location">${escapeHtml(event.city || 'ONLINE')}</span>
      </div>

      <div class="row-content-col">
        <h4 class="row-talk-title">${escapeHtml(event.talk)}</h4>
        <div class="row-event-name">${escapeHtml(event.event)}</div>
        ${event.description ? `<p class="row-abstract">${escapeHtml(event.description)}</p>` : ''}
        ${
          Array.isArray(event.topics) && event.topics.length > 0
            ? `<div class="row-topics-line">
                ${event.topics.slice(0, 4).map((t) => `<span class="row-topic-chip">#${escapeHtml(t)}</span>`).join('')}
              </div>`
            : ''
        }
      </div>

      <div class="row-action-col">
        <span class="row-inspect-btn">
          <span>Inspect</span>
          <span aria-hidden="true">↗</span>
        </span>
        ${
          hasPhotos
            ? `<span class="row-photo-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span>${photos.length}</span>
              </span>`
            : ''
        }
      </div>
    `;

    row.addEventListener('click', () => {
      openEventDetails(event);
    });

    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEventDetails(event);
      }
    });

    return row;
  }

  // ==========================================================================
  // Vector Reach Map
  // ==========================================================================
  function renderGlobalReachMap(events) {
    if (!mapMarkersGroup) return;
    mapMarkersGroup.innerHTML = '';

    const cityTalks = {};
    events.forEach((ev) => {
      if (ev.city && ev.city !== 'Online') {
        cityTalks[ev.city] = (cityTalks[ev.city] || 0) + 1;
      }
    });

    Object.entries(cityTalks).forEach(([cityName, count]) => {
      const coords = CITY_COORDINATES[cityName];
      if (!coords) return;

      const proj = projectCoordinates(coords.lat, coords.lon);

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'map-marker-item');
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${cityName}: ${count} ${count === 1 ? 'talk' : 'talks'}`);

      const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pulse.setAttribute('class', 'marker-pulse');
      pulse.setAttribute('cx', proj.x.toString());
      pulse.setAttribute('cy', proj.y.toString());
      pulse.setAttribute('r', '7');

      const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      point.setAttribute('class', 'marker-point');
      point.setAttribute('cx', proj.x.toString());
      point.setAttribute('cy', proj.y.toString());
      point.setAttribute('r', '3');

      group.appendChild(pulse);
      group.appendChild(point);

      const showTooltip = () => {
        if (!mapTooltip || !mapViewContainer) return;
        const svgElem = document.getElementById('world-map-svg');
        if (!svgElem) return;
        const svgRect = svgElem.getBoundingClientRect();
        const scaleX = svgRect.width / 1000;
        const scaleY = svgRect.height / 500;

        mapTooltip.textContent = `${cityName} — ${count} ${count === 1 ? 'talk' : 'talks'}`;
        mapTooltip.style.left = `${proj.x * scaleX}px`;
        mapTooltip.style.top = `${proj.y * scaleY}px`;
        mapTooltip.classList.add('visible');
      };

      const hideTooltip = () => {
        if (mapTooltip) mapTooltip.classList.remove('visible');
      };

      group.addEventListener('mouseenter', showTooltip);
      group.addEventListener('mouseleave', hideTooltip);
      group.addEventListener('focus', showTooltip);
      group.addEventListener('blur', hideTooltip);

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

  function renderLocationsRoster(events) {
    if (!citiesRoster) return;
    citiesRoster.innerHTML = '';

    const cityCounts = {};
    events.forEach((ev) => {
      const c = ev.city || 'Online';
      cityCounts[c] = (cityCounts[c] || 0) + 1;
    });

    const sorted = Object.entries(cityCounts).sort((a, b) => b[1] - a[1]);

    sorted.forEach(([cityName]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `city-pill-btn ${activeCity === cityName ? 'active' : ''}`;
      btn.textContent = cityName;
      btn.setAttribute('data-city', cityName);
      btn.addEventListener('click', () => {
        setCityFilter(activeCity === cityName ? 'all' : cityName);
        scrollToArchive();
      });
      citiesRoster.appendChild(btn);
    });
  }

  function scrollToArchive() {
    const archiveSec = document.getElementById('archive');
    if (archiveSec) {
      archiveSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ==========================================================================
  // Interactive Triggers (Journey & Topics)
  // ==========================================================================
  function setupInteractiveTriggers() {
    // Journey Nodes
    const journeyNodes = document.querySelectorAll('.journey-node');
    journeyNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const yr = node.getAttribute('data-year');
        if (yr) {
          setYearFilter(yr);
          scrollToArchive();
        }
      });
    });

    // Topic Jump Buttons
    const topicJumpBtns = document.querySelectorAll('.topic-jump-btn');
    topicJumpBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const topic = btn.getAttribute('data-topic');
        if (topic) {
          searchQuery = topic;
          if (archiveSearchInput) archiveSearchInput.value = topic;
          if (searchClearBtn) searchClearBtn.classList.remove('hidden');
          applyFilters();
          scrollToArchive();
        }
      });
    });

    // Search Input
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
        }, 120);
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

    if (emptyResetBtn) {
      emptyResetBtn.addEventListener('click', clearAllFilters);
    }

    if (clearCityBtn) {
      clearCityBtn.addEventListener('click', () => {
        setCityFilter('all');
      });
    }
  }

  // ==========================================================================
  // Event Detail Modal
  // ==========================================================================
  function openEventDetails(event) {
    if (!eventModal || !event) return;

    previousFocusedElement = document.activeElement;
    activeEvent = event;
    activePhotoIndex = 0;

    if (modalDate) {
      modalDate.textContent = formatFullMonthYear(event.date);
    }
    if (modalLocation) {
      modalLocation.textContent = event.city || 'ONLINE';
    }
    if (modalTalk) {
      modalTalk.textContent = event.talk || 'Technical Session';
    }
    if (modalEventName) {
      modalEventName.textContent = event.event || 'Speaking Event';
    }

    if (modalDescription) {
      if (event.description) {
        modalDescription.textContent = event.description;
        modalDescription.parentElement.classList.remove('hidden');
      } else {
        modalDescription.parentElement.classList.add('hidden');
      }
    }

    if (modalTopics && modalTopicsBlock) {
      modalTopics.innerHTML = '';
      if (Array.isArray(event.topics) && event.topics.length > 0) {
        modalTopicsBlock.classList.remove('hidden');
        event.topics.forEach((t) => {
          const tag = document.createElement('span');
          tag.className = 'modal-topic-tag';
          tag.textContent = `#${t}`;
          modalTopics.appendChild(tag);
        });
      } else {
        modalTopicsBlock.classList.add('hidden');
      }
    }

    // Resources
    if (modalResources && modalResourcesBlock) {
      modalResources.innerHTML = '';
      const links = [];
      if (event.slidesUrl) links.push({ label: 'Slides Deck', url: event.slidesUrl });
      if (event.recordingUrl) links.push({ label: 'Video Recording', url: event.recordingUrl });
      if (event.eventUrl) links.push({ label: 'Event Website', url: event.eventUrl });
      if (event.linkedinUrl) links.push({ label: 'LinkedIn Post', url: event.linkedinUrl });

      if (links.length > 0) {
        modalResourcesBlock.classList.remove('hidden');
        links.forEach((l) => {
          const a = document.createElement('a');
          a.className = 'modal-resource-link';
          a.href = l.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.innerHTML = `<span>${escapeHtml(l.label)}</span><span aria-hidden="true">↗</span>`;
          modalResources.appendChild(a);
        });
      } else {
        modalResourcesBlock.classList.add('hidden');
      }
    }

    renderModalGallery(event);

    if (history.pushState) {
      history.pushState(null, '', `#${encodeURIComponent(event.id)}`);
    } else {
      window.location.hash = `#${encodeURIComponent(event.id)}`;
    }

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
      if (galleryNavRow) galleryNavRow.style.display = 'none';
      if (galleryThumbnails) galleryThumbnails.style.display = 'none';
    } else {
      if (galleryNavRow) galleryNavRow.style.display = 'flex';
      if (galleryThumbnails) galleryThumbnails.style.display = 'flex';
    }

    if (galleryThumbnails && total > 1) {
      galleryThumbnails.innerHTML = '';
      photos.forEach((url, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `gallery-thumb-btn ${idx === activePhotoIndex ? 'active' : ''}`;
        btn.setAttribute('aria-label', `Photo ${idx + 1}`);

        const img = document.createElement('img');
        img.className = 'gallery-thumb-img';
        img.src = url;
        img.alt = `Thumbnail ${idx + 1}`;
        img.loading = 'lazy';
        img.addEventListener('error', () => {
          btn.style.display = 'none';
        });

        btn.appendChild(img);
        btn.addEventListener('click', () => {
          setGalleryPhoto(idx);
        });
        galleryThumbnails.appendChild(btn);
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
      const p = document.createElement('div');
      p.className = 'gallery-pending';
      p.textContent = 'Photographs pending archival filing.';
      galleryStage.appendChild(p);
      if (galleryCounter) galleryCounter.textContent = '0 / 0';
      return;
    }

    const currentUrl = photos[activePhotoIndex];
    const img = document.createElement('img');
    img.className = 'gallery-img';
    img.src = currentUrl;
    img.alt = `${activeEvent.event} — Photo ${activePhotoIndex + 1}`;

    img.addEventListener('error', () => {
      galleryStage.innerHTML = `
        <div class="gallery-pending">
          ${escapeHtml(activeEvent.event)}
        </div>
      `;
    });

    galleryStage.appendChild(img);

    if (galleryCounter) {
      galleryCounter.textContent = `${activePhotoIndex + 1} / ${total}`;
    }

    if (galleryPrevBtn) galleryPrevBtn.disabled = activePhotoIndex === 0;
    if (galleryNextBtn) galleryNextBtn.disabled = activePhotoIndex === total - 1;

    if (galleryThumbnails) {
      const btns = galleryThumbnails.querySelectorAll('.gallery-thumb-btn');
      btns.forEach((b, i) => {
        b.classList.toggle('active', i === activePhotoIndex);
      });
    }
  }

  function setGalleryPhoto(idx) {
    if (!activeEvent) return;
    const photos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    if (idx >= 0 && idx < photos.length) {
      activePhotoIndex = idx;
      updateGalleryStage();
    }
  }

  function closeEventModal() {
    if (eventModal && eventModal.open) {
      eventModal.close();
    }
    activeEvent = null;

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

  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initApplication();
  });
})();
