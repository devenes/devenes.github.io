/**
 * Enes Turan — Speaking Archive
 * Modern Vanilla JavaScript Architecture
 */

(function () {
  'use strict';

  // Application State
  let allEvents = [];
  let filteredEvents = [];
  let activeYearFilter = 'all';
  let activeEvent = null;
  let activePhotoIndex = 0;

  // DOM Elements
  const eventsGrid = document.getElementById('events-grid');
  const filterBar = document.getElementById('filter-bar');
  const eventCounter = document.getElementById('event-counter');
  const emptyState = document.getElementById('empty-state');
  const emptyStateMessage = document.getElementById('empty-state-message');
  const currentYearSpan = document.getElementById('current-year');

  // Modal DOM Elements
  const eventModal = document.getElementById('event-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const galleryStage = document.getElementById('gallery-stage');
  const galleryNavBar = document.getElementById('gallery-nav-bar');
  const galleryThumbnails = document.getElementById('gallery-thumbnails');
  const galleryPrevBtn = document.getElementById('gallery-prev-btn');
  const galleryNextBtn = document.getElementById('gallery-next-btn');
  const galleryCounter = document.getElementById('gallery-counter');
  const modalDate = document.getElementById('modal-date');
  const modalCity = document.getElementById('modal-city');
  const modalTitle = document.getElementById('modal-title');
  const modalTalk = document.getElementById('modal-talk');
  const modalExtra = document.getElementById('modal-extra');

  // Set footer copyright year
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  /**
   * Format ISO date string (YYYY-MM-DD) into display string (e.g., "SEP 2025")
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
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${months[monthIndex]} ${year}`;
        }
      }
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
    } catch {
      return dateStr;
    }
  }

  /**
   * Format ISO date string into a full readable date (e.g., "September 15, 2025")
   * @param {string} dateStr
   * @returns {string}
   */
  function formatFullDate(dateStr) {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(year, parseInt(month, 10) - 1, parseInt(day, 10));
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  /**
   * Create placeholder element for missing or pending event photographs
   * @param {string} eventName
   * @returns {string} HTML markup
   */
  function createPlaceholderMarkup(eventName) {
    const safeName = escapeHtml(eventName || 'Speaking Event');
    return `
      <div class="card-placeholder" aria-label="Photo placeholder for ${safeName}">
        <div class="placeholder-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <span>PHOTO</span>
        </div>
        <span class="placeholder-subtext">${safeName}</span>
      </div>
    `;
  }

  /**
   * Escape HTML special characters to prevent XSS
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
   * Fetch events data from data/events.json
   */
  async function loadEvents() {
    try {
      eventCounter.textContent = 'Loading archive...';
      const response = await fetch('data/events.json', { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid data format: expected an array of events.');
      }

      // Sort newest events first
      allEvents = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      filteredEvents = [...allEvents];

      setupFilters(allEvents);
      renderEvents(filteredEvents);
      handleInitialRoute();
    } catch (err) {
      console.error('Failed to load speaking events:', err);
      eventCounter.textContent = 'Unable to load events';
      emptyState.classList.remove('hidden');
      emptyStateMessage.textContent = 'Could not load event data from data/events.json. Please check that the file exists and is valid JSON.';
    }
  }

  /**
   * Setup dynamic year filter buttons based on dates in the events list
   * @param {Array} events
   */
  function setupFilters(events) {
    if (!filterBar) return;
    filterBar.innerHTML = '';

    if (events.length === 0) {
      filterBar.style.display = 'none';
      return;
    }
    filterBar.style.display = 'flex';

    // Extract unique years
    const years = Array.from(
      new Set(
        events
          .map((e) => (e.date ? e.date.substring(0, 4) : null))
          .filter(Boolean)
      )
    ).sort((a, b) => b - a);

    // Build "All" button
    const allBtn = document.createElement('button');
    allBtn.type = 'button';
    allBtn.className = `filter-btn ${activeYearFilter === 'all' ? 'active' : ''}`;
    allBtn.textContent = `All (${events.length})`;
    allBtn.setAttribute('data-year', 'all');
    allBtn.setAttribute('aria-pressed', activeYearFilter === 'all' ? 'true' : 'false');
    allBtn.addEventListener('click', () => applyFilter('all'));
    filterBar.appendChild(allBtn);

    // Build Year buttons
    years.forEach((year) => {
      const count = events.filter((e) => e.date && e.date.startsWith(year)).length;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-btn ${activeYearFilter === year ? 'active' : ''}`;
      btn.textContent = `${year} (${count})`;
      btn.setAttribute('data-year', year);
      btn.setAttribute('aria-pressed', activeYearFilter === year ? 'true' : 'false');
      btn.addEventListener('click', () => applyFilter(year));
      filterBar.appendChild(btn);
    });
  }

  /**
   * Apply year filter
   * @param {string} year
   */
  function applyFilter(year) {
    activeYearFilter = year;

    // Update button states
    const buttons = filterBar.querySelectorAll('.filter-btn');
    buttons.forEach((btn) => {
      const btnYear = btn.getAttribute('data-year');
      const isActive = btnYear === year;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    if (year === 'all') {
      filteredEvents = [...allEvents];
    } else {
      filteredEvents = allEvents.filter((e) => e.date && e.date.startsWith(year));
    }

    renderEvents(filteredEvents);
  }

  /**
   * Render event cards into grid
   * @param {Array} events
   */
  function renderEvents(events) {
    if (!eventsGrid) return;
    eventsGrid.innerHTML = '';

    const count = events.length;
    eventCounter.textContent = `${count} ${count === 1 ? 'event' : 'events'} recorded`;

    if (count === 0) {
      emptyState.classList.remove('hidden');
      if (allEvents.length === 0) {
        emptyStateMessage.innerHTML = 'Add your speaking events to <code>data/events.json</code> following the 5-step guide in README.md.';
      } else {
        emptyStateMessage.textContent = `No events found for year ${activeYearFilter}.`;
      }
      return;
    }

    emptyState.classList.add('hidden');

    const fragment = document.createDocumentFragment();
    events.forEach((event) => {
      const card = renderEventCard(event);
      fragment.appendChild(card);
    });

    eventsGrid.appendChild(fragment);
  }

  /**
   * Render an individual event card element
   * @param {Object} event
   * @returns {HTMLElement}
   */
  function renderEventCard(event) {
    const card = document.createElement('article');
    card.className = 'event-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View details for ${event.event}: ${event.talk}`);
    card.setAttribute('data-id', event.id);

    const isDemo = event.id.includes('demo') || (event.event && event.event.includes('[DEMO]'));
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const photoCount = photos.length;
    const hasPhotos = photoCount > 0;
    const firstPhoto = hasPhotos ? photos[0] : null;

    // Image section
    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-image-wrap';

    if (isDemo) {
      const demoBadge = document.createElement('span');
      demoBadge.className = 'demo-tag';
      demoBadge.textContent = 'DEMO';
      imgWrap.appendChild(demoBadge);
    }

    if (photoCount > 1) {
      const badge = document.createElement('div');
      badge.className = 'photo-badge';
      badge.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>${photoCount}</span>
      `;
      imgWrap.appendChild(badge);
    }

    if (firstPhoto) {
      const img = document.createElement('img');
      img.className = 'card-img';
      img.src = firstPhoto;
      img.alt = `${event.event} — ${event.talk}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      
      // Graceful fallback if image does not exist yet
      img.addEventListener('error', () => {
        imgWrap.innerHTML = '';
        if (isDemo) {
          const dTag = document.createElement('span');
          dTag.className = 'demo-tag';
          dTag.textContent = 'DEMO';
          imgWrap.appendChild(dTag);
        }
        const ph = document.createElement('div');
        ph.innerHTML = createPlaceholderMarkup(event.event);
        imgWrap.appendChild(ph.firstElementChild);
      });

      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.innerHTML = createPlaceholderMarkup(event.event);
      imgWrap.appendChild(ph.firstElementChild);
    }

    card.appendChild(imgWrap);

    // Content section
    const content = document.createElement('div');
    content.className = 'card-content';

    const formattedDate = formatMonthYear(event.date);

    content.innerHTML = `
      <div class="card-meta">
        <span class="card-date">${escapeHtml(formattedDate)}</span>
        <span class="card-city" title="${escapeHtml(event.city)}">${escapeHtml(event.city)}</span>
      </div>
      <h3 class="card-event-name">${escapeHtml(event.event)}</h3>
      <p class="card-talk-title">${escapeHtml(event.talk)}</p>
    `;

    card.appendChild(content);

    // Event Listeners for Interaction
    card.addEventListener('click', () => {
      openEventDetails(event);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEventDetails(event);
      }
    });

    return card;
  }

  /**
   * Open event details modal
   * @param {Object} event
   */
  function openEventDetails(event) {
    if (!eventModal || !event) return;

    activeEvent = event;
    activePhotoIndex = 0;

    // Populate modal text
    modalDate.textContent = formatFullDate(event.date);
    modalCity.textContent = event.city || '';
    modalTitle.textContent = event.event || '';
    modalTalk.textContent = event.talk || '';

    // Extensible fields (description, topics, links)
    renderModalExtras(event);

    // Populate gallery
    renderModalGallery(event);

    // Update URL hash without jumping
    if (history.pushState) {
      history.pushState(null, '', `#${encodeURIComponent(event.id)}`);
    } else {
      window.location.hash = `#${encodeURIComponent(event.id)}`;
    }

    // Open native dialog modal
    if (!eventModal.open) {
      eventModal.showModal();
    }

    // Focus close button for accessibility
    if (modalCloseBtn) {
      modalCloseBtn.focus();
    }
  }

  /**
   * Render extra fields if present in the event schema
   * @param {Object} event
   */
  function renderModalExtras(event) {
    if (!modalExtra) return;
    modalExtra.innerHTML = '';

    // Description
    if (event.description) {
      const desc = document.createElement('p');
      desc.className = 'modal-description';
      desc.textContent = event.description;
      modalExtra.appendChild(desc);
    }

    // Topics
    if (Array.isArray(event.topics) && event.topics.length > 0) {
      const topicsRow = document.createElement('div');
      topicsRow.className = 'modal-topics';
      event.topics.forEach((topic) => {
        const tag = document.createElement('span');
        tag.className = 'modal-topic-tag';
        tag.textContent = `#${topic}`;
        topicsRow.appendChild(tag);
      });
      modalExtra.appendChild(topicsRow);
    }

    // Optional Links
    const links = [];
    if (event.slidesUrl) links.push({ label: 'Slides', url: event.slidesUrl });
    if (event.recordingUrl) links.push({ label: 'Recording', url: event.recordingUrl });
    if (event.eventUrl) links.push({ label: 'Event Website', url: event.eventUrl });
    if (event.linkedinUrl) links.push({ label: 'LinkedIn Post', url: event.linkedinUrl });

    if (links.length > 0) {
      const linksRow = document.createElement('div');
      linksRow.className = 'modal-links-row';
      links.forEach((link) => {
        const a = document.createElement('a');
        a.className = 'modal-ext-link';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `
          <span>${escapeHtml(link.label)}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        `;
        linksRow.appendChild(a);
      });
      modalExtra.appendChild(linksRow);
    }
  }

  /**
   * Render photograph gallery inside modal
   * @param {Object} event
   */
  function renderModalGallery(event) {
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const total = photos.length;

    if (total <= 1) {
      galleryNavBar.style.display = 'none';
      galleryThumbnails.style.display = 'none';
    } else {
      galleryNavBar.style.display = 'flex';
      galleryThumbnails.style.display = 'flex';
    }

    // Build thumbnails
    galleryThumbnails.innerHTML = '';
    if (total > 1) {
      photos.forEach((photoUrl, idx) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = `gallery-thumb ${idx === activePhotoIndex ? 'active' : ''}`;
        thumb.setAttribute('aria-label', `Photo ${idx + 1} of ${total}`);
        
        const img = document.createElement('img');
        img.src = photoUrl;
        img.alt = `Thumbnail ${idx + 1}`;
        img.loading = 'lazy';
        img.addEventListener('error', () => {
          thumb.style.display = 'none';
        });

        thumb.appendChild(img);
        thumb.addEventListener('click', () => {
          setGalleryPhoto(idx);
        });
        galleryThumbnails.appendChild(thumb);
      });
    }

    updateGalleryStage();
  }

  /**
   * Update active photo in modal stage
   */
  function updateGalleryStage() {
    if (!activeEvent) return;
    const photos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    const total = photos.length;

    galleryStage.innerHTML = '';

    if (total === 0) {
      const ph = document.createElement('div');
      ph.innerHTML = createPlaceholderMarkup(activeEvent.event);
      galleryStage.appendChild(ph.firstElementChild);
      return;
    }

    const currentUrl = photos[activePhotoIndex];
    const mainImg = document.createElement('img');
    mainImg.className = 'gallery-stage-img';
    mainImg.src = currentUrl;
    mainImg.alt = `${activeEvent.event} — Photo ${activePhotoIndex + 1}`;
    
    mainImg.addEventListener('error', () => {
      galleryStage.innerHTML = '';
      const ph = document.createElement('div');
      ph.innerHTML = createPlaceholderMarkup(activeEvent.event);
      galleryStage.appendChild(ph.firstElementChild);
    });

    galleryStage.appendChild(mainImg);

    // Update Counter & Controls
    galleryCounter.textContent = `${activePhotoIndex + 1} / ${total}`;
    galleryPrevBtn.disabled = activePhotoIndex === 0;
    galleryNextBtn.disabled = activePhotoIndex === total - 1;

    // Update Active Thumbnail
    const thumbs = galleryThumbnails.querySelectorAll('.gallery-thumb');
    thumbs.forEach((th, idx) => {
      th.classList.toggle('active', idx === activePhotoIndex);
    });
  }

  /**
   * Change gallery photo index
   * @param {number} newIndex
   */
  function setGalleryPhoto(newIndex) {
    if (!activeEvent) return;
    const photos = Array.isArray(activeEvent.photos) ? activeEvent.photos : [];
    if (newIndex >= 0 && newIndex < photos.length) {
      activePhotoIndex = newIndex;
      updateGalleryStage();
    }
  }

  /**
   * Close the event modal and clean up URL hash
   */
  function closeEventModal() {
    if (eventModal && eventModal.open) {
      eventModal.close();
    }
    activeEvent = null;

    // Clean URL hash without reloading page
    if (window.location.hash) {
      if (history.pushState) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }
  }

  /**
   * Check URL hash on initial load or back/forward navigation
   */
  function handleInitialRoute() {
    const rawHash = window.location.hash.replace(/^#/, '').trim();
    if (!rawHash) return;

    const eventId = decodeURIComponent(rawHash);
    const target = allEvents.find((e) => e.id === eventId);
    if (target) {
      openEventDetails(target);
    }
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Modal close button
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeEventModal);
    }

    // Modal Prev/Next buttons
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

    // Keyboard navigation
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

    // Handle hash changes (back/forward browser buttons)
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
    // Follows Modern Web Guidance best practices
    if (eventModal) {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        eventModal.addEventListener('click', (event) => {
          if (event.target !== eventModal) return;
          const rect = eventModal.getBoundingClientRect();
          const isDialogContent = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          );
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

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadEvents();
  });
})();
