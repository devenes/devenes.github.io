/**
 * Enes Turan — Technical Speaker Constellation
 * Pure Vanilla JavaScript Data Architecture & Interactive Canvas System
 */

(function () {
  'use strict';

  const DATA_URL = 'data/events.json';

  // Geographic Coordinates for Vector Map Projection (1000x500 Equirectangular)
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

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Application State
  const state = {
    events: [],
    year: 'all',
    topic: 'all',
    city: 'all',
    query: '',
    selectedId: null,
    hoveredTopic: null,
    hoveredNodeId: null,
    activePhotoIndex: 0,
    positions: new Map(),
    previousFocusedElement: null
  };

  // DOM Elements Cache
  const els = {
    heroTalkCount: document.getElementById('hero-talk-count'),
    heroYearRange: document.getElementById('hero-year-range'),
    yearButtons: document.getElementById('year-buttons'),
    topicStrip: document.getElementById('topic-strip'),
    search: document.getElementById('archive-search'),
    clearSearch: document.getElementById('clear-search'),
    fieldWrap: document.getElementById('field-wrap'),
    canvas: document.getElementById('constellation-canvas'),
    fieldYears: document.getElementById('field-years'),
    fieldNodes: document.getElementById('field-nodes'),
    nodeTooltip: document.getElementById('node-tooltip'),
    fieldStatus: document.getElementById('field-status'),
    yearReadouts: document.getElementById('year-readouts'),
    archiveList: document.getElementById('archive-list'),
    archiveCount: document.getElementById('archive-count'),
    archiveFilterNote: document.getElementById('archive-filter-note'),
    emptyState: document.getElementById('empty-state'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),
    threadGrid: document.getElementById('thread-grid'),
    reachCount: document.getElementById('reach-count'),
    onlineCount: document.getElementById('online-count'),
    mapMarkers: document.getElementById('map-markers'),
    mapTooltip: document.getElementById('map-tooltip'),
    mapViewContainer: document.getElementById('map-view-container'),
    cityRoster: document.getElementById('city-roster'),
    cityInspector: document.getElementById('city-inspector'),
    // Modal Dialog
    dialog: document.getElementById('event-dialog'),
    dialogClose: document.getElementById('dialog-close'),
    dialogIndex: document.getElementById('dialog-index'),
    dialogDate: document.getElementById('dialog-date'),
    dialogLocation: document.getElementById('dialog-location'),
    dialogEvent: document.getElementById('dialog-event'),
    dialogTitle: document.getElementById('dialog-title'),
    dialogDescription: document.getElementById('dialog-description'),
    dialogTopics: document.getElementById('dialog-topics'),
    dialogResourcesBlock: document.getElementById('dialog-resources-block'),
    dialogResources: document.getElementById('dialog-resources'),
    galleryCounter: document.getElementById('gallery-counter'),
    galleryStage: document.getElementById('gallery-stage'),
    galleryNavRow: document.getElementById('gallery-nav-row'),
    galleryPrevBtn: document.getElementById('gallery-prev-btn'),
    galleryNextBtn: document.getElementById('gallery-next-btn'),
    galleryThumbnails: document.getElementById('gallery-thumbnails')
  };

  // ==========================================================================
  // Helper Utilities
  // ==========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function yearOf(event) {
    return event && event.date ? event.date.substring(0, 4) : '';
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${MONTH_NAMES[m]} ${y}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  }

  function formatDateFull(dateStr) {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length >= 3) {
        const y = parts[0];
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${FULL_MONTH_NAMES[m]} ${d}, ${y}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  }

  function stableHash(str) {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i += 1) {
      hash = Math.imul(hash ^ str.charCodeAt(i), 16777619);
    }
    return (hash >>> 0) / 4294967295;
  }

  function projectCoordinates(lat, lon) {
    const x = (lon + 180.0) * (1000.0 / 360.0);
    const y = (90.0 - lat) * (500.0 / 180.0);
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  }

  // ==========================================================================
  // Filtering Logic
  // ==========================================================================
  function matchesEvent(event) {
    if (state.year !== 'all' && yearOf(event) !== state.year) return false;
    if (state.topic !== 'all' && !(event.topics || []).includes(state.topic)) return false;
    if (state.city !== 'all' && (event.city || 'Online') !== state.city) return false;

    if (state.query) {
      const q = state.query.toLowerCase();
      const inTalk = (event.talk || '').toLowerCase().includes(q);
      const inEvent = (event.event || '').toLowerCase().includes(q);
      const inCity = (event.city || '').toLowerCase().includes(q);
      const inDesc = (event.description || '').toLowerCase().includes(q);
      const inTopics = Array.isArray(event.topics) && event.topics.some((t) => t.toLowerCase().includes(q));
      if (!inTalk && !inEvent && !inCity && !inDesc && !inTopics) return false;
    }

    return true;
  }

  function getFilteredEvents() {
    return state.events.filter(matchesEvent);
  }

  function getTopicCounts(eventsList) {
    const counts = new Map();
    eventsList.forEach((e) => {
      (e.topics || []).forEach((t) => {
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }

  // ==========================================================================
  // Constellation Calculations
  // ==========================================================================
  function computeNodeLayout(events) {
    const width = els.fieldWrap ? els.fieldWrap.clientWidth || 1000 : 1000;
    const height = els.fieldWrap ? els.fieldWrap.clientHeight || 580 : 580;

    // Sort chronologically ascending for left-to-right flow
    const sorted = events.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length === 0) return new Map();

    const firstTime = new Date(`${sorted[0].date}T12:00:00`).getTime();
    const lastTime = new Date(`${sorted[sorted.length - 1].date}T12:00:00`).getTime();

    // 35 days buffer before and after so nodes never touch boundary walls
    const buffer = 35 * 24 * 60 * 60 * 1000;
    const minTime = firstTime - buffer;
    const maxTime = lastTime + buffer;
    const timeSpan = Math.max(1, maxTime - minTime);

    // Group siblings by identical date to distribute into vertical lanes
    const byDate = new Map();
    sorted.forEach((e) => {
      const arr = byDate.get(e.date) || [];
      arr.push(e);
      byDate.set(e.date, arr);
    });

    const positions = new Map();
    const paddingX = 64;
    const availableWidth = Math.max(1, width - paddingX * 2);

    sorted.forEach((e) => {
      const t = new Date(`${e.date}T12:00:00`).getTime();
      const x = paddingX + ((t - minTime) / timeSpan) * availableWidth;

      const siblings = byDate.get(e.date) || [e];
      const sibIdx = siblings.indexOf(e);
      const laneOffset = (sibIdx - (siblings.length - 1) / 2) * 28;

      // Deterministic vertical placement based on topics hash
      const topicStr = (e.topics || []).slice(0, 3).join('|');
      const seed = stableHash(e.id + topicStr);

      // Clamp y comfortably inside field
      const minY = 72;
      const maxY = height - 76;
      let y = minY + seed * (maxY - minY) + laneOffset;
      if (y < minY) y = minY + 10;
      if (y > maxY) y = maxY - 10;

      positions.set(e.id, {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        event: e,
        year: yearOf(e)
      });
    });

    return positions;
  }

  // Draw Glowing Network Threads & Canvas Guidelines
  function drawConstellation() {
    if (!els.canvas || !els.fieldWrap) return;

    const wrapRect = els.fieldWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = wrapRect.width;
    const height = wrapRect.height;

    els.canvas.width = Math.round(width * dpr);
    els.canvas.height = Math.round(height * dpr);
    els.canvas.style.width = `${width}px`;
    els.canvas.style.height = `${height}px`;

    const ctx = els.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    state.positions = computeNodeLayout(state.events);
    const posMap = state.positions;
    if (posMap.size === 0) return;

    // Draw Subtle Year Grid Guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    const years = Array.from(new Set(state.events.map(yearOf))).sort();
    years.forEach((yr) => {
      const yrEvents = state.events.filter((e) => yearOf(e) === yr);
      if (yrEvents.length > 0 && posMap.has(yrEvents[0].id)) {
        const xPos = posMap.get(yrEvents[0].id).x;
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(xPos, 28);
        ctx.lineTo(xPos, height - 32);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Topic Connections
    const activeHighlightTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);
    const hoveredNode = state.hoveredNodeId ? state.events.find((e) => e.id === state.hoveredNodeId) : null;
    const hoveredNodeTopics = hoveredNode ? new Set(hoveredNode.topics || []) : null;

    const topicGroups = new Map();
    state.events.forEach((ev) => {
      (ev.topics || []).forEach((top) => {
        const arr = topicGroups.get(top) || [];
        arr.push(ev);
        topicGroups.set(top, arr);
      });
    });

    const renderedConnections = new Set();

    topicGroups.forEach((groupEvents, topicName) => {
      const isTopicActive = activeHighlightTopic === topicName;
      const isTopicConnectedToHoveredNode = hoveredNodeTopics && hoveredNodeTopics.has(topicName);

      const sortedInTopic = groupEvents.slice().sort((a, b) => a.date.localeCompare(b.date));

      for (let i = 1; i < sortedInTopic.length; i += 1) {
        const e1 = sortedInTopic[i - 1];
        const e2 = sortedInTopic[i];
        const p1 = posMap.get(e1.id);
        const p2 = posMap.get(e2.id);
        if (!p1 || !p2) continue;

        const connectionKey = `${e1.id}__${e2.id}`;
        const reverseKey = `${e2.id}__${e1.id}`;

        if (renderedConnections.has(connectionKey) || renderedConnections.has(reverseKey)) {
          if (!isTopicActive && !isTopicConnectedToHoveredNode) continue;
        }

        renderedConnections.add(connectionKey);

        const midX = (p1.x + p2.x) / 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(midX, p1.y, midX, p2.y, p2.x, p2.y);

        if (isTopicActive) {
          ctx.strokeStyle = 'rgba(136, 161, 255, 0.95)';
          ctx.lineWidth = 2.4;
          ctx.shadowColor = 'rgba(136, 161, 255, 0.8)';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (isTopicConnectedToHoveredNode) {
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(96, 165, 250, 0.6)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (!activeHighlightTopic && !hoveredNode) {
          ctx.strokeStyle = 'rgba(90, 115, 155, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Draw Subtle Node Halos on Canvas for Luminous Depth
    state.events.forEach((ev) => {
      const p = posMap.get(ev.id);
      if (!p) return;
      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;
      const isHighlighted = (activeHighlightTopic && (ev.topics || []).includes(activeHighlightTopic)) ||
                            (hoveredNodeTopics && (ev.topics || []).some((t) => hoveredNodeTopics.has(t)));

      if (isMatch && (isHighlighted || isSelected)) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.35)' : 'rgba(136, 161, 255, 0.25)';
        ctx.fill();
      }
    });

    renderFieldDOMOverlays(posMap);
  }

  // Render DOM Buttons and Year Markings in Constellation
  function renderFieldDOMOverlays(posMap) {
    if (!els.fieldWrap || !els.fieldYears || !els.fieldNodes) return;

    const width = els.fieldWrap.clientWidth || 1000;
    const height = els.fieldWrap.clientHeight || 580;

    // 1. Year Markers
    const years = Array.from(new Set(state.events.map(yearOf))).sort();
    els.fieldYears.innerHTML = years.map((yr) => {
      const yrEvents = state.events.filter((e) => yearOf(e) === yr);
      if (!yrEvents.length || !posMap.has(yrEvents[0].id)) return '';
      const x = posMap.get(yrEvents[0].id).x;
      const leftPct = (x / width) * 100;
      return `<div class="field-year-mark" style="left:${leftPct.toFixed(2)}%">${yr}</div>`;
    }).join('');

    // 2. Node Buttons
    const activeHighlightTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);
    const hoveredNode = state.hoveredNodeId ? state.events.find((e) => e.id === state.hoveredNodeId) : null;
    const hoveredNodeTopics = hoveredNode ? new Set(hoveredNode.topics || []) : null;

    let nodesHtml = '';
    state.events.forEach((ev) => {
      const pos = posMap.get(ev.id);
      if (!pos) return;

      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;

      let isHighlighted = false;
      if (activeHighlightTopic && (ev.topics || []).includes(activeHighlightTopic)) {
        isHighlighted = true;
      }
      if (hoveredNodeTopics && (ev.topics || []).some((t) => hoveredNodeTopics.has(t))) {
        isHighlighted = true;
      }

      const leftPct = (pos.x / width) * 100;
      const topPct = (pos.y / height) * 100;

      // Smart positioning classes to prevent labels from clipping at container edges
      const flipUp = topPct > 68;
      const shiftLeft = leftPct < 16;
      const shiftRight = leftPct > 84;

      const classes = [
        'field-node-btn',
        isSelected ? 'selected' : '',
        !isMatch ? 'dim' : '',
        isHighlighted ? 'highlighted' : '',
        flipUp ? 'flip-label-up' : '',
        shiftLeft ? 'shift-label-left' : '',
        shiftRight ? 'shift-label-right' : ''
      ].filter(Boolean).join(' ');

      nodesHtml += `
        <button type="button"
          class="${classes}"
          style="left:${leftPct.toFixed(2)}%;top:${topPct.toFixed(2)}%"
          data-id="${escapeHtml(ev.id)}"
          aria-label="${escapeHtml(ev.talk)} — ${escapeHtml(ev.event)} (${escapeHtml(ev.date)})"
          tabindex="0">
          <span class="node-dot" aria-hidden="true"></span>
          <span class="field-node-label" aria-hidden="true">
            <span class="node-label-title">${escapeHtml(ev.talk)}</span>
            <span class="node-label-sub">${escapeHtml(ev.event)} · ${escapeHtml(formatDateShort(ev.date))}</span>
          </span>
        </button>
      `;
    });

    els.fieldNodes.innerHTML = nodesHtml;
    attachNodeEventListeners(posMap);
  }

  function attachNodeEventListeners(posMap) {
    const buttons = els.fieldNodes.querySelectorAll('.field-node-btn');
    buttons.forEach((btn) => {
      const id = btn.getAttribute('data-id');
      const pos = posMap.get(id);
      if (!pos) return;

      const ev = pos.event;

      const onEnter = () => {
        state.hoveredNodeId = id;
        btn.classList.add('preview-active');
        if (els.fieldStatus) {
          els.fieldStatus.textContent = `${ev.talk} · ${ev.event} (${ev.city || 'Online'}) · click to inspect`;
        }
        drawConstellationOnly(posMap);
      };

      const onLeave = () => {
        state.hoveredNodeId = null;
        btn.classList.remove('preview-active');
        updateFieldStatus();
        drawConstellationOnly(posMap);
      };

      btn.addEventListener('mouseenter', onEnter);
      btn.addEventListener('mouseleave', onLeave);
      btn.addEventListener('focus', onEnter);
      btn.addEventListener('blur', onLeave);

      btn.addEventListener('click', (e) => {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
        if (isTouch && !btn.classList.contains('preview-active') && !btn.classList.contains('selected')) {
          e.preventDefault();
          buttons.forEach((b) => b.classList.remove('preview-active'));
          btn.classList.add('preview-active');
          onEnter();
          return;
        }

        state.previousFocusedElement = btn;
        openEvent(id);
      });
    });
  }

  function drawConstellationOnly(posMap) {
    if (!els.canvas || !els.fieldWrap) return;
    const wrapRect = els.fieldWrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = wrapRect.width;
    const height = wrapRect.height;

    const ctx = els.canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    // Subtle guidelines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const years = Array.from(new Set(state.events.map(yearOf))).sort();
    years.forEach((yr) => {
      const yrEvents = state.events.filter((e) => yearOf(e) === yr);
      if (yrEvents.length > 0 && posMap.has(yrEvents[0].id)) {
        const xPos = posMap.get(yrEvents[0].id).x;
        ctx.beginPath();
        ctx.setLineDash([4, 6]);
        ctx.moveTo(xPos, 28);
        ctx.lineTo(xPos, height - 32);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    const activeHighlightTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);
    const hoveredNode = state.hoveredNodeId ? state.events.find((e) => e.id === state.hoveredNodeId) : null;
    const hoveredNodeTopics = hoveredNode ? new Set(hoveredNode.topics || []) : null;

    const topicGroups = new Map();
    state.events.forEach((ev) => {
      (ev.topics || []).forEach((top) => {
        const arr = topicGroups.get(top) || [];
        arr.push(ev);
        topicGroups.set(top, arr);
      });
    });

    const renderedConnections = new Set();

    topicGroups.forEach((groupEvents, topicName) => {
      const isTopicActive = activeHighlightTopic === topicName;
      const isTopicConnectedToHoveredNode = hoveredNodeTopics && hoveredNodeTopics.has(topicName);

      const sortedInTopic = groupEvents.slice().sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 1; i < sortedInTopic.length; i += 1) {
        const e1 = sortedInTopic[i - 1];
        const e2 = sortedInTopic[i];
        const p1 = posMap.get(e1.id);
        const p2 = posMap.get(e2.id);
        if (!p1 || !p2) continue;

        const connectionKey = `${e1.id}__${e2.id}`;
        const reverseKey = `${e2.id}__${e1.id}`;

        if (renderedConnections.has(connectionKey) || renderedConnections.has(reverseKey)) {
          if (!isTopicActive && !isTopicConnectedToHoveredNode) continue;
        }

        renderedConnections.add(connectionKey);

        const midX = (p1.x + p2.x) / 2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(midX, p1.y, midX, p2.y, p2.x, p2.y);

        if (isTopicActive) {
          ctx.strokeStyle = 'rgba(136, 161, 255, 0.95)';
          ctx.lineWidth = 2.4;
          ctx.shadowColor = 'rgba(136, 161, 255, 0.8)';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (isTopicConnectedToHoveredNode) {
          ctx.strokeStyle = 'rgba(96, 165, 250, 0.85)';
          ctx.lineWidth = 1.8;
          ctx.shadowColor = 'rgba(96, 165, 250, 0.6)';
          ctx.shadowBlur = 8;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (!activeHighlightTopic && !hoveredNode) {
          ctx.strokeStyle = 'rgba(90, 115, 155, 0.22)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    // Halos
    state.events.forEach((ev) => {
      const p = posMap.get(ev.id);
      if (!p) return;
      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;
      const isHighlighted = (activeHighlightTopic && (ev.topics || []).includes(activeHighlightTopic)) ||
                            (hoveredNodeTopics && (ev.topics || []).some((t) => hoveredNodeTopics.has(t)));

      if (isMatch && (isHighlighted || isSelected)) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, isSelected ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.35)' : 'rgba(136, 161, 255, 0.25)';
        ctx.fill();
      }
    });

    // Update node button highlighted / selected classes without re-creating DOM
    const buttons = els.fieldNodes.querySelectorAll('.field-node-btn');
    buttons.forEach((btn) => {
      const id = btn.getAttribute('data-id');
      const ev = state.events.find((e) => e.id === id);
      if (!ev) return;

      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;

      let isHighlighted = false;
      if (activeHighlightTopic && (ev.topics || []).includes(activeHighlightTopic)) {
        isHighlighted = true;
      }
      if (hoveredNodeTopics && (ev.topics || []).some((t) => hoveredNodeTopics.has(t))) {
        isHighlighted = true;
      }

      btn.classList.toggle('selected', isSelected);
      btn.classList.toggle('dim', !isMatch);
      btn.classList.toggle('highlighted', isHighlighted);
    });
  }

  // ==========================================================================
  // Render Components
  // ==========================================================================
  function renderYearControls() {
    if (!els.yearButtons) return;
    const years = Array.from(new Set(state.events.map(yearOf))).sort().reverse();

    els.yearButtons.innerHTML = years.map((yr) => `
      <button type="button" class="tool-btn ${state.year === yr ? 'active' : ''}" data-year="${yr}" aria-pressed="${state.year === yr}">
        ${yr}
      </button>
    `).join('');

    const allBtn = document.querySelector('.year-switch .tool-btn[data-year="all"]');
    if (allBtn) {
      allBtn.classList.toggle('active', state.year === 'all');
      allBtn.setAttribute('aria-pressed', state.year === 'all');
    }

    const btns = document.querySelectorAll('.year-switch .tool-btn[data-year]');
    btns.forEach((b) => {
      b.onclick = () => {
        setYear(b.dataset.year);
      };
    });
  }

  function renderTopicStrip() {
    if (!els.topicStrip) return;
    const topics = getTopicCounts(state.events);

    const allBtn = `
      <button type="button" class="topic-chip ${state.topic === 'all' ? 'active' : ''}" data-topic="all">
        ALL TOPICS
      </button>
    `;

    const topicChips = topics.slice(0, 16).map(([topic, count]) => `
      <button type="button" class="topic-chip ${state.topic === topic ? 'active' : ''}" data-topic="${escapeHtml(topic)}">
        ${escapeHtml(topic)} <span>(${count})</span>
      </button>
    `).join('');

    els.topicStrip.innerHTML = allBtn + topicChips;

    const chips = els.topicStrip.querySelectorAll('.topic-chip');
    chips.forEach((c) => {
      const top = c.getAttribute('data-topic');
      c.onclick = () => {
        setTopic(top);
      };
      c.onmouseenter = () => {
        if (top !== 'all') {
          state.hoveredTopic = top;
          drawConstellationOnly(state.positions);
        }
      };
      c.onmouseleave = () => {
        state.hoveredTopic = null;
        drawConstellationOnly(state.positions);
      };
      c.onfocus = () => {
        if (top !== 'all') {
          state.hoveredTopic = top;
          drawConstellationOnly(state.positions);
        }
      };
      c.onblur = () => {
        state.hoveredTopic = null;
        drawConstellationOnly(state.positions);
      };
    });
  }

  function renderYearReadouts() {
    if (!els.yearReadouts) return;
    const years = Array.from(new Set(state.events.map(yearOf))).sort();

    els.yearReadouts.innerHTML = years.map((yr) => {
      const yrEvents = state.events.filter((e) => yearOf(e) === yr);
      const topTopics = getTopicCounts(yrEvents).slice(0, 3).map(([t]) => t).join(' · ');
      return `
        <button type="button" class="year-readout-card ${state.year === yr ? 'active' : ''}" data-year="${yr}">
          <span class="readout-year-count">${yr} · ${yrEvents.length} talks</span>
          <span class="readout-topics">${escapeHtml(topTopics)}</span>
        </button>
      `;
    }).join('');

    const cards = els.yearReadouts.querySelectorAll('.year-readout-card');
    cards.forEach((card) => {
      card.onclick = () => {
        setYear(card.dataset.year === state.year ? 'all' : card.dataset.year);
      };
    });
  }

  function renderArchiveLedger() {
    if (!els.archiveList) return;
    const filtered = getFilteredEvents().sort((a, b) => b.date.localeCompare(a.date));

    if (filtered.length === 0) {
      els.archiveList.innerHTML = '';
      if (els.emptyState) els.emptyState.classList.remove('hidden');
      updateArchiveMeta(0);
      return;
    }

    if (els.emptyState) els.emptyState.classList.add('hidden');

    // Group by year descending
    const grouped = new Map();
    filtered.forEach((ev) => {
      const yr = yearOf(ev);
      const arr = grouped.get(yr) || [];
      arr.push(ev);
      grouped.set(yr, arr);
    });

    let html = '';
    grouped.forEach((yearEvents, yr) => {
      html += `
        <div class="archive-year-group">
          <h3 class="archive-year-header">
            <span>${yr}</span>
            <span class="archive-year-count">${yearEvents.length} ${yearEvents.length === 1 ? 'talk' : 'talks'}</span>
          </h3>
          <div class="archive-year-list">
      `;

      yearEvents.forEach((ev) => {
        const photos = Array.isArray(ev.photos) ? ev.photos : [];
        const hasPhotos = photos.length > 0;
        const formattedDate = formatDateShort(ev.date);

        html += `
          <article class="archive-row" tabindex="0" role="button" aria-haspopup="dialog" data-id="${escapeHtml(ev.id)}" aria-label="View details for ${escapeHtml(ev.talk)} at ${escapeHtml(ev.event)}">
            <div class="archive-row-meta">
              <time class="archive-date">${escapeHtml(formattedDate)}</time>
              <span class="archive-location">${escapeHtml(ev.city || 'Online')}</span>
            </div>

            <div class="archive-row-content">
              <div class="archive-talk-btn">
                <h4 class="archive-talk-title">${escapeHtml(ev.talk)}</h4>
              </div>
              <div class="archive-event-name">${escapeHtml(ev.event)}</div>
              ${ev.description ? `<p class="archive-abstract-snippet">${escapeHtml(ev.description)}</p>` : ''}
              ${
                Array.isArray(ev.topics) && ev.topics.length > 0
                  ? `<div class="archive-topics-list">
                      ${ev.topics.slice(0, 4).map((t) => `<span class="archive-topic-tag">#${escapeHtml(t)}</span>`).join('')}
                    </div>`
                  : ''
              }
            </div>

            <div class="archive-row-action">
              <span class="archive-inspect-btn">
                <span>Inspect</span>
                <span aria-hidden="true">↗</span>
              </span>
              ${
                hasPhotos
                  ? `<span class="archive-photo-badge" aria-label="${photos.length} photographs available">
                      <span>📸</span>
                      <span>${photos.length}</span>
                    </span>`
                  : ''
              }
            </div>
          </article>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    els.archiveList.innerHTML = html;

    // Attach click and keyboard events
    const rows = els.archiveList.querySelectorAll('.archive-row');
    rows.forEach((row) => {
      const id = row.getAttribute('data-id');
      const open = () => {
        state.previousFocusedElement = row;
        openEvent(id);
      };

      row.addEventListener('click', open);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      });
    });

    updateArchiveMeta(filtered.length);
  }

  function updateArchiveMeta(count) {
    if (els.archiveCount) {
      els.archiveCount.textContent = `${count} ${count === 1 ? 'talk' : 'talks'}`;
    }

    if (els.archiveFilterNote) {
      const parts = [];
      if (state.year !== 'all') parts.push(state.year);
      if (state.topic !== 'all') parts.push(`#${state.topic}`);
      if (state.city !== 'all') parts.push(state.city);
      if (state.query) parts.push(`"${state.query}"`);

      els.archiveFilterNote.textContent = parts.length > 0 ? parts.join(' · ') : 'All speaking events';
    }
  }

  function renderTechnicalThreads() {
    if (!els.threadGrid) return;
    const topTopics = getTopicCounts(state.events).slice(0, 9);

    els.threadGrid.innerHTML = topTopics.map(([topic, count], idx) => {
      const activeYears = Array.from(new Set(
        state.events
          .filter((e) => (e.topics || []).includes(topic))
          .map(yearOf)
      )).sort();

      const yearSpan = activeYears.length > 1
        ? `${activeYears[0]} — ${activeYears[activeYears.length - 1]}`
        : activeYears[0];

      return `
        <button type="button" class="thread-card ${state.topic === topic ? 'active' : ''}" data-topic="${escapeHtml(topic)}">
          <div class="thread-card-top">
            <span class="thread-rank">TOPIC ${String(idx + 1).padStart(2, '0')}</span>
            <span class="thread-count">${count}</span>
          </div>
          <div class="thread-card-bottom">
            <h3 class="thread-title">${escapeHtml(topic)}</h3>
            <p class="thread-meta">${activeYears.length} active years (${yearSpan})</p>
          </div>
        </button>
      `;
    }).join('');

    const cards = els.threadGrid.querySelectorAll('.thread-card');
    cards.forEach((c) => {
      const top = c.getAttribute('data-topic');
      c.onclick = () => {
        setTopic(top === state.topic ? 'all' : top);
        const constSec = document.getElementById('constellation');
        if (constSec) constSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      c.onmouseenter = () => {
        state.hoveredTopic = top;
        drawConstellationOnly(state.positions);
      };
      c.onmouseleave = () => {
        state.hoveredTopic = null;
        drawConstellationOnly(state.positions);
      };
    });
  }

  function renderGeographicLayer() {
    const cityCounts = new Map();
    state.events.forEach((e) => {
      const c = e.city || 'Online';
      cityCounts.set(c, (cityCounts.get(c) || 0) + 1);
    });

    const entries = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const nonOnline = entries.filter(([c]) => c !== 'Online');
    const onlineTalks = state.events.filter((e) => e.city === 'Online');

    if (els.reachCount) els.reachCount.textContent = nonOnline.length;
    if (els.onlineCount) els.onlineCount.textContent = onlineTalks.length;

    // 1. Vector World Map Markers
    if (els.mapMarkers) {
      els.mapMarkers.innerHTML = '';
      nonOnline.forEach(([cityName, count]) => {
        const coords = CITY_COORDINATES[cityName];
        if (!coords) return;

        const proj = projectCoordinates(coords.lat, coords.lon);
        const isSelected = state.city === cityName;
        const isDim = state.city !== 'all' && !isSelected;

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const groupClasses = ['map-marker-item', isSelected ? 'selected' : '', isDim ? 'dim' : ''].filter(Boolean).join(' ');
        group.setAttribute('class', groupClasses);
        group.setAttribute('tabindex', '0');
        group.setAttribute('role', 'button');
        group.setAttribute('aria-label', `${cityName}: ${count} ${count === 1 ? 'talk' : 'talks'}`);
        group.setAttribute('data-city', cityName);

        // Invisible large hit circle for easy touch/mouse targets
        const hit = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        hit.setAttribute('class', 'marker-hit');
        hit.setAttribute('cx', proj.x.toString());
        hit.setAttribute('cy', proj.y.toString());
        hit.setAttribute('r', '14');

        const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pulse.setAttribute('class', 'marker-pulse');
        pulse.setAttribute('cx', proj.x.toString());
        pulse.setAttribute('cy', proj.y.toString());
        pulse.setAttribute('r', isSelected ? '14' : '7');

        const point = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('class', 'marker-point');
        point.setAttribute('cx', proj.x.toString());
        point.setAttribute('cy', proj.y.toString());
        point.setAttribute('r', isSelected ? '5.5' : '3.5');

        group.appendChild(hit);
        group.appendChild(pulse);
        group.appendChild(point);

        const showTip = () => {
          if (!els.mapTooltip || !els.mapViewContainer) return;
          const groupRect = group.getBoundingClientRect();
          const containerRect = els.mapViewContainer.getBoundingClientRect();
          const tipX = groupRect.left - containerRect.left + groupRect.width / 2;
          const tipY = groupRect.top - containerRect.top - 8;

          els.mapTooltip.textContent = `${cityName} — ${count} ${count === 1 ? 'talk' : 'talks'}`;
          els.mapTooltip.style.left = `${tipX}px`;
          els.mapTooltip.style.top = `${tipY}px`;
          els.mapTooltip.classList.add('visible');
        };

        const hideTip = () => {
          if (els.mapTooltip) els.mapTooltip.classList.remove('visible');
        };

        group.addEventListener('mouseenter', showTip);
        group.addEventListener('mouseleave', hideTip);
        group.addEventListener('focus', showTip);
        group.addEventListener('blur', hideTip);

        const toggleCity = () => {
          setCity(state.city === cityName ? 'all' : cityName);
          if (els.cityInspector && state.city !== 'all') {
            els.cityInspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        };

        group.addEventListener('click', toggleCity);
        group.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCity();
          }
        });

        els.mapMarkers.appendChild(group);
      });
    }

    // 2. City Roster Buttons
    if (els.cityRoster) {
      els.cityRoster.innerHTML = entries.map(([city, count]) => `
        <button type="button" class="city-pill-btn ${state.city === city ? 'active' : ''}" data-city="${escapeHtml(city)}">
          ${escapeHtml(city)} · ${count}
        </button>
      `).join('');

      const pills = els.cityRoster.querySelectorAll('.city-pill-btn');
      pills.forEach((p) => {
        const c = p.getAttribute('data-city');
        p.onclick = () => {
          setCity(state.city === c ? 'all' : c);
          if (els.cityInspector && state.city !== 'all') {
            els.cityInspector.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        };
      });
    }

    renderCityInspector();
  }

  function renderCityInspector() {
    if (!els.cityInspector) return;

    if (state.city === 'all') {
      els.cityInspector.className = 'city-inspector empty';
      els.cityInspector.innerHTML = `
        <p class="city-inspector-hint">
          Select any city marker on the map above or click a location tag to inspect talks delivered in that community.
        </p>
      `;
      return;
    }

    const cityName = state.city;
    const cityTalks = state.events
      .filter((e) => (e.city || 'Online') === cityName)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));

    els.cityInspector.className = 'city-inspector';
    els.cityInspector.innerHTML = `
      <div class="city-inspector-header">
        <div>
          <span class="city-badge">LOCATION ARCHIVE</span>
          <h3 class="city-name">${escapeHtml(cityName)}</h3>
          <span class="city-count">${cityTalks.length} ${cityTalks.length === 1 ? 'speaking engagement' : 'speaking engagements'} recorded</span>
        </div>
        <div class="city-inspector-actions">
          <a href="#archive" class="city-action-link" id="city-jump-archive">View in Archive Ledger ↓</a>
          <button type="button" class="city-reset-btn" id="city-reset-btn">Reset City Filter ✕</button>
        </div>
      </div>
      <div class="city-talks-grid">
        ${cityTalks.map((talk) => `
          <article class="city-talk-card">
            <div class="city-talk-top">
              <span class="city-talk-date">${escapeHtml(formatDateShort(talk.date))}</span>
              <span class="city-talk-event">${escapeHtml(talk.event)}</span>
            </div>
            <h4 class="city-talk-title">${escapeHtml(talk.talk)}</h4>
            <p class="city-talk-desc">${escapeHtml(talk.description || 'Verified conference session.')}</p>
            <div class="city-talk-bottom">
              <div class="city-talk-topics">
                ${(talk.topics || []).slice(0, 3).map((t) => `<span class="city-topic-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>
              <button type="button" class="city-talk-open-btn" data-id="${escapeHtml(talk.id)}" aria-label="Open dossier for ${escapeHtml(talk.talk)}">
                Open Talk Dossier ↗
              </button>
            </div>
          </article>
        `).join('')}
      </div>
    `;

    const resetBtn = els.cityInspector.querySelector('#city-reset-btn');
    if (resetBtn) {
      resetBtn.onclick = () => setCity('all');
    }

    const jumpLink = els.cityInspector.querySelector('#city-jump-archive');
    if (jumpLink) {
      jumpLink.onclick = (e) => {
        e.preventDefault();
        scrollToArchive();
      };
    }

    const openBtns = els.cityInspector.querySelectorAll('.city-talk-open-btn');
    openBtns.forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        state.previousFocusedElement = btn;
        openEvent(id);
      };
    });
  }

  function scrollToArchive() {
    const arch = document.getElementById('archive');
    if (arch) arch.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function updateHeroMetrics() {
    if (els.heroTalkCount) {
      els.heroTalkCount.textContent = state.events.length;
    }
    const years = Array.from(new Set(state.events.map(yearOf))).sort();
    if (els.heroYearRange && years.length > 0) {
      els.heroYearRange.textContent = years.length > 1
        ? `${years[0]} — ${years[years.length - 1]}`
        : `${years[0]}`;
    }
  }

  function updateFieldStatus() {
    if (!els.fieldStatus) return;
    const filtered = getFilteredEvents();
    const parts = [`${filtered.length} ${filtered.length === 1 ? 'talk' : 'talks'}`];

    if (state.year !== 'all') parts.push(state.year);
    if (state.topic !== 'all') parts.push(`#${state.topic}`);
    if (state.city !== 'all') parts.push(state.city);
    if (state.query) parts.push(`"${state.query}"`);

    els.fieldStatus.textContent = `${parts.join(' · ')} · select any node to inspect details`;
  }

  // ==========================================================================
  // State Mutation & Coordinated Re-rendering
  // ==========================================================================
  function rerender() {
    renderYearControls();
    renderTopicStrip();
    renderYearReadouts();
    renderArchiveLedger();
    renderTechnicalThreads();
    renderGeographicLayer();
    updateFieldStatus();
    drawConstellation();
  }

  function setYear(year) {
    state.year = year;
    state.city = 'all';
    rerender();
  }

  function setTopic(topic) {
    state.topic = topic;
    rerender();
  }

  function setCity(city) {
    state.city = city;
    state.year = 'all';
    rerender();
  }

  function clearAllFilters() {
    state.year = 'all';
    state.topic = 'all';
    state.city = 'all';
    state.query = '';
    if (els.search) els.search.value = '';
    if (els.clearSearch) els.clearSearch.classList.add('hidden');
    rerender();
  }

  // ==========================================================================
  // Event Detail Modal Dossier & Full Photo Support (Phase 10)
  // ==========================================================================
  function openEvent(id) {
    const event = state.events.find((e) => e.id === id);
    if (!event || !els.dialog) return;

    state.selectedId = id;
    state.activePhotoIndex = 0;

    // Chronological index
    const sorted = state.events.slice().sort((a, b) => b.date.localeCompare(a.date));
    const idx = sorted.findIndex((e) => e.id === id) + 1;

    if (els.dialogIndex) {
      els.dialogIndex.textContent = `${String(idx).padStart(2, '0')} / ${state.events.length}`;
    }
    if (els.dialogDate) {
      els.dialogDate.textContent = formatDateFull(event.date);
    }
    if (els.dialogLocation) {
      els.dialogLocation.textContent = event.city || 'Online';
    }
    if (els.dialogEvent) {
      els.dialogEvent.textContent = event.event || 'Speaking Engagement';
    }
    if (els.dialogTitle) {
      els.dialogTitle.textContent = event.talk || 'Technical Session';
    }
    if (els.dialogDescription) {
      els.dialogDescription.textContent = event.description || 'No detailed abstract recorded for this session.';
    }

    // Topics list
    if (els.dialogTopics) {
      els.dialogTopics.innerHTML = (event.topics || []).map((t) => `
        <span class="dialog-topic">#${escapeHtml(t)}</span>
      `).join('');
    }

    // Resources list
    if (els.dialogResources && els.dialogResourcesBlock) {
      const links = [];
      if (event.slidesUrl) links.push({ label: 'Slides Deck', url: event.slidesUrl });
      if (event.recordingUrl) links.push({ label: 'Video Recording', url: event.recordingUrl });
      if (event.eventUrl) links.push({ label: 'Event Website', url: event.eventUrl });
      if (event.linkedinUrl) links.push({ label: 'LinkedIn Post', url: event.linkedinUrl });

      if (links.length > 0) {
        els.dialogResourcesBlock.classList.remove('hidden');
        els.dialogResources.innerHTML = links.map((l) => `
          <a class="dialog-resource-link" href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer">
            <span>${escapeHtml(l.label)}</span>
            <span aria-hidden="true">↗</span>
          </a>
        `).join('');
      } else {
        els.dialogResourcesBlock.classList.add('hidden');
      }
    }

    renderModalGallery(event);

    // Deep link hash update
    if (history.pushState) {
      history.pushState(null, '', `#${encodeURIComponent(event.id)}`);
    } else {
      window.location.hash = `#${encodeURIComponent(event.id)}`;
    }

    if (typeof els.dialog.showModal === 'function') {
      if (!els.dialog.open) els.dialog.showModal();
    } else {
      els.dialog.setAttribute('open', '');
    }

    if (els.dialogClose) {
      els.dialogClose.focus();
    }

    drawConstellationOnly(state.positions);
  }

  function renderModalGallery(event) {
    const photos = Array.isArray(event.photos) ? event.photos : [];
    const total = photos.length;

    if (total <= 1) {
      if (els.galleryNavRow) els.galleryNavRow.classList.add('hidden');
      if (els.galleryThumbnails) els.galleryThumbnails.classList.add('hidden');
    } else {
      if (els.galleryNavRow) els.galleryNavRow.classList.remove('hidden');
      if (els.galleryThumbnails) els.galleryThumbnails.classList.remove('hidden');
    }

    if (els.galleryThumbnails && total > 1) {
      els.galleryThumbnails.innerHTML = photos.map((url, i) => `
        <button type="button" class="gallery-thumb-btn ${i === state.activePhotoIndex ? 'active' : ''}" data-index="${i}" aria-label="Photograph ${i + 1}">
          <img class="gallery-thumb-img" src="${escapeHtml(url)}" alt="Thumbnail ${i + 1}" loading="lazy">
        </button>
      `).join('');

      const thumbBtns = els.galleryThumbnails.querySelectorAll('.gallery-thumb-btn');
      thumbBtns.forEach((tb) => {
        tb.onclick = () => {
          setGalleryPhoto(parseInt(tb.dataset.index, 10));
        };
      });
    }

    updateGalleryStage(event);
  }

  function updateGalleryStage(event) {
    if (!els.galleryStage) return;
    const currentEvent = event || state.events.find((e) => e.id === state.selectedId);
    if (!currentEvent) return;

    const photos = Array.isArray(currentEvent.photos) ? currentEvent.photos : [];
    const total = photos.length;

    els.galleryStage.innerHTML = '';

    if (total === 0) {
      // Authentic Archival Dossier State (Phase 10 requirement)
      if (els.galleryCounter) els.galleryCounter.textContent = '0 / 0';
      els.galleryStage.innerHTML = `
        <div class="gallery-archival-card">
          <div class="archival-icon-badge" aria-hidden="true">🏛️</div>
          <span class="archival-stamp-text">ARCHIVAL RECORD FILED</span>
          <p class="archival-notice">
            Photographic media pending verified upload. This talk record is indexed and preserved in the speaking archive.
          </p>
        </div>
      `;
      return;
    }

    if (els.galleryCounter) {
      els.galleryCounter.textContent = `${state.activePhotoIndex + 1} / ${total}`;
    }

    const currentUrl = photos[state.activePhotoIndex];
    const img = document.createElement('img');
    img.className = 'gallery-img';
    img.src = currentUrl;
    img.alt = `${currentEvent.talk} at ${currentEvent.event} — photograph ${state.activePhotoIndex + 1}`;
    img.loading = 'lazy';

    img.addEventListener('error', () => {
      els.galleryStage.innerHTML = `
        <div class="gallery-archival-card">
          <span class="archival-stamp-text">PHOTOGRAPH ARCHIVED</span>
          <p class="archival-notice">${escapeHtml(currentEvent.event)}</p>
        </div>
      `;
    });

    els.galleryStage.appendChild(img);

    if (els.galleryPrevBtn) els.galleryPrevBtn.disabled = state.activePhotoIndex === 0;
    if (els.galleryNextBtn) els.galleryNextBtn.disabled = state.activePhotoIndex === total - 1;

    if (els.galleryThumbnails) {
      const thumbs = els.galleryThumbnails.querySelectorAll('.gallery-thumb-btn');
      thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === state.activePhotoIndex);
      });
    }
  }

  function setGalleryPhoto(idx) {
    const event = state.events.find((e) => e.id === state.selectedId);
    if (!event) return;
    const photos = Array.isArray(event.photos) ? event.photos : [];
    if (idx >= 0 && idx < photos.length) {
      state.activePhotoIndex = idx;
      updateGalleryStage(event);
    }
  }

  function closeEvent() {
    if (els.dialog && els.dialog.open) {
      els.dialog.close();
    }
    state.selectedId = null;

    // Clean hash from URL
    if (window.location.hash) {
      if (history.pushState) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
    }

    if (state.previousFocusedElement && typeof state.previousFocusedElement.focus === 'function') {
      state.previousFocusedElement.focus();
      state.previousFocusedElement = null;
    }

    drawConstellationOnly(state.positions);
  }

  function handleRouteFromHash() {
    const rawHash = window.location.hash.replace(/^#/, '').trim();
    if (!rawHash) {
      if (els.dialog && els.dialog.open) {
        closeEvent();
      }
      return;
    }

    const eventId = decodeURIComponent(rawHash);
    const target = state.events.find((e) => e.id === eventId);
    if (target) {
      openEvent(target.id);
    }
  }

  // ==========================================================================
  // Initialization & Event Wiring
  // ==========================================================================
  function setupGlobalListeners() {
    // Search input with debounce
    if (els.search) {
      let debounce = null;
      els.search.addEventListener('input', (e) => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          state.query = e.target.value.trim();
          if (els.clearSearch) {
            els.clearSearch.classList.toggle('hidden', !state.query);
          }
          rerender();
        }, 120);
      });
    }

    if (els.clearSearch) {
      els.clearSearch.addEventListener('click', () => {
        state.query = '';
        if (els.search) els.search.value = '';
        els.clearSearch.classList.add('hidden');
        rerender();
        if (els.search) els.search.focus();
      });
    }

    if (els.emptyResetBtn) {
      els.emptyResetBtn.addEventListener('click', clearAllFilters);
    }

    // Modal dialog controls
    if (els.dialogClose) {
      els.dialogClose.addEventListener('click', closeEvent);
    }

    if (els.galleryPrevBtn) {
      els.galleryPrevBtn.addEventListener('click', () => {
        setGalleryPhoto(state.activePhotoIndex - 1);
      });
    }

    if (els.galleryNextBtn) {
      els.galleryNextBtn.addEventListener('click', () => {
        setGalleryPhoto(state.activePhotoIndex + 1);
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Shortcut '/' to focus search
      if (e.key === '/' && document.activeElement !== els.search && (!els.dialog || !els.dialog.open)) {
        e.preventDefault();
        if (els.search) {
          els.search.focus();
          els.search.select();
        }
      }

      // Dialog navigation
      if (els.dialog && els.dialog.open) {
        if (e.key === 'Escape') {
          closeEvent();
        } else if (e.key === 'ArrowLeft') {
          setGalleryPhoto(state.activePhotoIndex - 1);
        } else if (e.key === 'ArrowRight') {
          setGalleryPhoto(state.activePhotoIndex + 1);
        }
      }
    });

    // Hash change for deep links & browser back/forward
    window.addEventListener('hashchange', handleRouteFromHash);

    // Responsive Canvas Resize with ResizeObserver
    let resizeTimer = null;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawConstellation();
      }, 80);
    };

    window.addEventListener('resize', handleResize);

    if (window.ResizeObserver && els.fieldWrap) {
      const ro = new ResizeObserver(() => {
        handleResize();
      });
      ro.observe(els.fieldWrap);
    }

    // Light-dismiss dialog fallback (for browsers without native closedby support)
    if (els.dialog) {
      if (!('closedBy' in HTMLDialogElement.prototype)) {
        els.dialog.addEventListener('click', (event) => {
          if (event.target !== els.dialog) return;
          const rect = els.dialog.getBoundingClientRect();
          const isDialogContent = (
            rect.top <= event.clientY &&
            event.clientY <= rect.top + rect.height &&
            rect.left <= event.clientX &&
            event.clientX <= rect.left + rect.width
          );
          if (isDialogContent) return;
          closeEvent();
        });
      }

      els.dialog.addEventListener('close', () => {
        if (state.selectedId !== null) {
          closeEvent();
        }
      });
    }
  }

  async function initApplication() {
    try {
      const response = await fetch(DATA_URL, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`Failed to load ${DATA_URL}: ${response.status}`);
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Data in events.json is not an array');
      }

      state.events = data;

      updateHeroMetrics();
      rerender();
      handleRouteFromHash();
    } catch (err) {
      console.error('Speaking Archive Initialization Error:', err);
      if (els.archiveCount) {
        els.archiveCount.textContent = 'Error loading archive';
      }
      if (els.emptyState) {
        els.emptyState.classList.remove('hidden');
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    setupGlobalListeners();
    initApplication();
  });
})();
