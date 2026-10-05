/**
 * Enes Turan — Technical Speaker Archive & Data Visualizations
 * Pure Vanilla JavaScript Architecture: The Technical River & Regional Reach
 */

(function () {
  'use strict';

  const DATA_URL = 'data/events.json';

  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const FULL_MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // ==========================================================================
  // Core Technical Streams Definition (The Technical River)
  // ==========================================================================
  const STREAMS = [
    {
      id: 'cloud',
      label: 'Cloud & Infrastructure',
      color: '#3b82f6',
      stroke: '#60a5fa',
      fill: 'rgba(59, 130, 246, 0.28)',
      highlightFill: 'rgba(59, 130, 246, 0.55)',
      keywords: ['google cloud', 'cloud architecture', 'serverless', 'cloud run', 'cloud computing', 'infrastructure', 'architecture']
    },
    {
      id: 'kubernetes',
      label: 'Kubernetes & Platforms',
      color: '#0ea5e9',
      stroke: '#38bdf8',
      fill: 'rgba(14, 165, 233, 0.28)',
      highlightFill: 'rgba(14, 165, 233, 0.55)',
      keywords: ['kubernetes', 'gke', 'gke enterprise', 'platform engineering', 'devops', 'sre', 'reliability', 'developer experience', 'scheduling']
    },
    {
      id: 'aiml',
      label: 'AI/ML & MLOps',
      color: '#8b5cf6',
      stroke: '#a78bfa',
      fill: 'rgba(139, 92, 246, 0.28)',
      highlightFill: 'rgba(139, 92, 246, 0.55)',
      keywords: ['ai/ml', 'mlops', 'vertex ai', 'machine learning', 'ai infrastructure', 'build with ai']
    },
    {
      id: 'agents',
      label: 'GenAI & AI Agents',
      color: '#ec4899',
      stroke: '#f472b6',
      fill: 'rgba(236, 72, 153, 0.28)',
      highlightFill: 'rgba(236, 72, 153, 0.55)',
      keywords: ['ai agents', 'generative ai', 'langgraph', 'adk', 'agent', 'genai', 'ai']
    }
  ];

  // ==========================================================================
  // Regional Groupings Definition (Geographic Secondary Signal)
  // ==========================================================================
  const REGION_DEFINITIONS = [
    {
      id: 'turkiye',
      name: 'Türkiye',
      color: '#3b82f6',
      matches: (city) => city.includes('Türkiye')
    },
    {
      id: 'central-asia',
      name: 'Central Asia',
      color: '#0ea5e9',
      matches: (city) => city.includes('Kazakhstan') || city.includes('Uzbekistan') || city.includes('Kyrgyzstan') || city.includes('Mongolia')
    },
    {
      id: 'mena',
      name: 'Middle East & North Africa',
      color: '#a855f7',
      matches: (city) => city.includes('UAE') || city.includes('Egypt') || city.includes('Tunisia') || city.includes('Morocco')
    },
    {
      id: 'balkans-caucasus',
      name: 'Balkans & Caucasus',
      color: '#f59e0b',
      matches: (city) => city.includes('Kosovo') || city.includes('Bosnia and Herzegovina') || city.includes('Azerbaijan')
    },
    {
      id: 'online',
      name: 'Online & Global',
      color: '#10b981',
      matches: (city) => city === 'Online'
    }
  ];

  // ==========================================================================
  // Contextual Era Narratives (For Timeline & Play History Mode)
  // ==========================================================================
  const ERA_NARRATIVES = {
    all: {
      badge: 'OVERVIEW · 2023–2026',
      text: 'Tracing 43 speaking engagements across 4 years: from enterprise Kubernetes and cloud architectures to autonomous AI agents and global reliability engineering.'
    },
    '2023': {
      badge: 'FOUNDATIONS · 2023',
      text: '2023 — Cloud & Kubernetes Foundations: Deep dives into GKE Enterprise, scheduler internals, and serverless architectures across Türkiye, Central Asia, and the Balkans.'
    },
    '2024': {
      badge: 'CONVERGENCE · 2024',
      text: '2024 — Containers Meet AI/ML: Container orchestration converges with high-scale AI/ML workloads, introducing MLOps pipelines and multi-cloud GKE architectures.'
    },
    '2025': {
      badge: 'EXPANSION · 2025',
      text: '2025 — The Autonomous Agent Wave: Rapid transition into Generative AI and autonomous AI Agents, building with LangGraph, ADK, and Vertex AI across international stages.'
    },
    '2026': {
      badge: 'MODERN ARCHITECTURE · 2026',
      text: '2026 — AI Infrastructure & Global Reliability: High-scale AI infrastructure, Kubernetes for AI workloads, developer experience, and SRE at Google scale.'
    }
  };

  // ==========================================================================
  // Application State
  // ==========================================================================
  const state = {
    events: [],
    year: 'all',
    topic: 'all',
    stream: 'all',
    city: 'all',
    region: 'all',
    query: '',
    selectedId: null,
    hoveredTopic: null,
    hoveredStreamId: null,
    hoveredEventId: null,
    activePhotoIndex: 0,
    isPlaying: false,
    playTimer: null,
    playStep: 0,
    previousFocusedElement: null
  };

  // ==========================================================================
  // DOM Elements Cache
  // ==========================================================================
  const els = {
    heroTalkCount: document.getElementById('hero-talk-count'),
    heroYearRange: document.getElementById('hero-year-range'),
    yearButtons: document.getElementById('year-buttons'),
    topicStrip: document.getElementById('topic-strip'),
    search: document.getElementById('archive-search'),
    clearSearch: document.getElementById('clear-search'),
    playHistoryBtn: document.getElementById('play-history-btn'),
    riverEraCard: document.getElementById('river-era-card'),
    eraBadge: document.getElementById('era-badge'),
    eraText: document.getElementById('era-text'),
    eraProgressBar: document.getElementById('era-progress-bar'),
    eraProgressFill: document.getElementById('era-progress-fill'),
    riverFieldWrap: document.getElementById('river-field-wrap'),
    riverSvg: document.getElementById('river-svg'),
    riverDefs: document.getElementById('river-defs'),
    riverBackgroundGrid: document.getElementById('river-background-grid'),
    riverStreamsLayer: document.getElementById('river-streams-layer'),
    riverEventsLayer: document.getElementById('river-events-layer'),
    riverNodesOverlay: document.getElementById('river-nodes-overlay'),
    riverTooltip: document.getElementById('river-tooltip'),
    fieldStatus: document.getElementById('field-status'),
    yearReadouts: document.getElementById('year-readouts'),
    archiveList: document.getElementById('archive-list'),
    archiveCount: document.getElementById('archive-count'),
    archiveFilterNote: document.getElementById('archive-filter-note'),
    emptyState: document.getElementById('empty-state'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),
    threadGrid: document.getElementById('thread-grid'),
    reachCount: document.getElementById('reach-count'),
    countriesCount: document.getElementById('countries-count'),
    onlineCount: document.getElementById('online-count'),
    regionalBar: document.getElementById('regional-bar'),
    regionalCardsGrid: document.getElementById('regional-cards-grid'),
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
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 1000) / 1000;
  }

  // Assign Event to Primary Technical Stream
  function assignStream(event) {
    const topics = (event.topics || []).map((t) => t.toLowerCase());

    // Priority: Specific cutting-edge topics first
    if (topics.some((t) => t.includes('agent') || t.includes('generative ai') || t.includes('langgraph') || t.includes('adk'))) {
      return 'agents';
    }
    if (topics.some((t) => t.includes('ai/ml') || t.includes('mlops') || t.includes('vertex ai') || t.includes('build with ai'))) {
      return 'aiml';
    }
    if (topics.some((t) => t.includes('kubernetes') || t.includes('gke') || t.includes('platform') || t.includes('sre') || t.includes('scheduling'))) {
      return 'kubernetes';
    }
    if (topics.some((t) => t === 'ai')) {
      return 'agents';
    }
    return 'cloud';
  }

  // Assign Event to Geographic Region
  function getRegion(event) {
    const city = event.city || 'Online';
    for (const def of REGION_DEFINITIONS) {
      if (def.matches(city)) return def;
    }
    return { id: 'international', name: 'International', color: '#64748b' };
  }

  // ==========================================================================
  // Filtering & Search
  // ==========================================================================
  function matchesEvent(event) {
    if (state.year !== 'all' && yearOf(event) !== state.year) return false;
    if (state.topic !== 'all' && !(event.topics || []).includes(state.topic)) return false;
    if (state.stream !== 'all' && assignStream(event) !== state.stream) return false;
    if (state.city !== 'all' && (event.city || 'Online') !== state.city) return false;
    if (state.region !== 'all') {
      const reg = getRegion(event);
      if (reg.id !== state.region) return false;
    }

    if (state.query) {
      const q = state.query.toLowerCase();
      const searchable = [
        event.talk || '',
        event.event || '',
        event.city || '',
        event.date || '',
        event.description || '',
        (event.topics || []).join(' ')
      ].join(' ').toLowerCase();

      if (!searchable.includes(q)) return false;
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
  // 01 The Technical River Visualization Engine
  // ==========================================================================
  function renderTechnicalRiver() {
    if (!els.riverSvg || !state.events.length) return;

    const svgWidth = 1100;
    const svgHeight = 520;
    const paddingX = 90;
    const usableWidth = svgWidth - paddingX * 2;

    // Distinct unique years sorted ascending
    const years = Array.from(new Set(state.events.map(yearOf))).sort();
    if (!years.length) return;

    // Horizontal X positions for each year column
    const yearPositions = new Map();
    years.forEach((yr, idx) => {
      const x = paddingX + (idx / Math.max(1, years.length - 1)) * usableWidth;
      yearPositions.set(yr, Math.round(x));
    });

    // 1. Calculate Stream Volumes per Year
    // Count talks per stream in each year
    const yearlyCounts = new Map();
    years.forEach((yr) => {
      const map = new Map();
      STREAMS.forEach((s) => map.set(s.id, 0));
      yearlyCounts.set(yr, map);
    });

    state.events.forEach((ev) => {
      const yr = yearOf(ev);
      const sId = assignStream(ev);
      if (yearlyCounts.has(yr)) {
        const streamMap = yearlyCounts.get(yr);
        streamMap.set(sId, (streamMap.get(sId) || 0) + 1);
      }
    });

    // Compute vertical geometry: stream thickness & ribbon boundaries at each year
    // Center the whole river vertically around Y = 250
    const centerY = 250;
    const streamGeometry = new Map(); // streamId -> array of { year, x, yTop, yBot, yCenter }
    STREAMS.forEach((s) => streamGeometry.set(s.id, []));

    years.forEach((yr) => {
      const x = yearPositions.get(yr);
      const streamMap = yearlyCounts.get(yr);
      const yearEvents = state.events.filter((e) => yearOf(e) === yr);
      const totalInYear = Math.max(1, yearEvents.length);

      // Total ribbon height per stream based on share of talks in that year
      const streamHeights = STREAMS.map((s) => {
        const count = streamMap.get(s.id) || 0;
        const baseThickness = 14;
        const dynamicThickness = Math.round((count / totalInYear) * 160);
        return {
          id: s.id,
          height: baseThickness + dynamicThickness
        };
      });

      const gap = 12;
      const totalStackHeight = streamHeights.reduce((sum, item) => sum + item.height, 0) + (STREAMS.length - 1) * gap;
      let currentY = centerY - totalStackHeight / 2;

      streamHeights.forEach((item) => {
        const yTop = currentY;
        const yBot = currentY + item.height;
        const yCenter = (yTop + yBot) / 2;

        streamGeometry.get(item.id).push({
          year: yr,
          x: x,
          yTop: yTop,
          yBot: yBot,
          yCenter: yCenter
        });

        currentY = yBot + gap;
      });
    });

    // 2. Render SVG Definitions (Gradients & Filters)
    let defsHtml = '';
    STREAMS.forEach((s) => {
      defsHtml += `
        <linearGradient id="grad-${s.id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${s.color}" stop-opacity="0.32" />
          <stop offset="50%" stop-color="${s.color}" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${s.stroke}" stop-opacity="0.35" />
        </linearGradient>
      `;
    });
    els.riverDefs.innerHTML = defsHtml;

    // 3. Render Background Grid Lines & Year Marks
    let gridHtml = '';
    years.forEach((yr) => {
      const x = yearPositions.get(yr);
      const isYearActive = state.year === yr || state.year === 'all';
      gridHtml += `
        <line class="river-year-line" x1="${x}" y1="36" x2="${x}" y2="${svgHeight - 40}"></line>
        <text class="river-year-label ${state.year === yr ? 'active' : ''}" x="${x}" y="24">${yr}</text>
      `;
    });
    els.riverBackgroundGrid.innerHTML = gridHtml;

    // 4. Render Fluid Stream Ribbons
    let streamsHtml = '';
    const activeStreamId = state.hoveredStreamId || (state.stream !== 'all' ? state.stream : null);
    const activeTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);

    STREAMS.forEach((s) => {
      const points = streamGeometry.get(s.id);
      if (!points || points.length < 2) return;

      // Construct Cubic Bézier Upper Boundary
      let pathD = `M ${points[0].x - 40} ${points[0].yTop}`;
      pathD += ` L ${points[0].x} ${points[0].yTop}`;

      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dx = p1.x - p0.x;
        const cp1x = p0.x + dx * 0.45;
        const cp2x = p1.x - dx * 0.45;
        pathD += ` C ${cp1x} ${p0.yTop}, ${cp2x} ${p1.yTop}, ${p1.x} ${p1.yTop}`;
      }

      // Extension past the last year
      const last = points[points.length - 1];
      pathD += ` L ${last.x + 40} ${last.yTop}`;
      pathD += ` L ${last.x + 40} ${last.yBot}`;
      pathD += ` L ${last.x} ${last.yBot}`;

      // Construct Cubic Bézier Lower Boundary (Reversed)
      for (let i = points.length - 1; i > 0; i -= 1) {
        const p0 = points[i];
        const p1 = points[i - 1];
        const dx = p0.x - p1.x;
        const cp1x = p0.x - dx * 0.45;
        const cp2x = p1.x + dx * 0.45;
        pathD += ` C ${cp1x} ${p0.yBot}, ${cp2x} ${p1.yBot}, ${p1.x} ${p1.yBot}`;
      }

      pathD += ` L ${points[0].x - 40} ${points[0].yBot} Z`;

      // Construct Centerline Stream
      let centerD = `M ${points[0].x - 30} ${points[0].yCenter} L ${points[0].x} ${points[0].yCenter}`;
      for (let i = 0; i < points.length - 1; i += 1) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const dx = p1.x - p0.x;
        const cp1x = p0.x + dx * 0.45;
        const cp2x = p1.x - dx * 0.45;
        centerD += ` C ${cp1x} ${p0.yCenter}, ${cp2x} ${p1.yCenter}, ${p1.x} ${p1.yCenter}`;
      }
      centerD += ` L ${last.x + 30} ${last.yCenter}`;

      let isDim = false;
      let isHighlighted = false;

      if (activeStreamId) {
        if (activeStreamId === s.id) isHighlighted = true;
        else isDim = true;
      } else if (activeTopic) {
        const topicStream = STREAMS.find((st) => st.keywords.some((kw) => activeTopic.toLowerCase().includes(kw)));
        if (topicStream && topicStream.id === s.id) isHighlighted = true;
        else isDim = true;
      }

      const ribbonClasses = [
        'river-stream-ribbon',
        isHighlighted ? 'highlighted' : '',
        isDim ? 'dim' : ''
      ].filter(Boolean).join(' ');

      streamsHtml += `
        <g class="river-stream-channel" data-stream="${s.id}">
          <path class="${ribbonClasses}"
            d="${pathD}"
            fill="url(#grad-${s.id})"
            stroke="${s.stroke}"
            stroke-width="${isHighlighted ? '2' : '1'}"
            role="button"
            tabindex="0"
            aria-label="${s.label} stream">
          </path>
          <path class="river-stream-centerline"
            d="${centerD}"
            fill="none"
            stroke="${s.stroke}"
            stroke-width="1.5">
          </path>
        </g>
      `;
    });
    els.riverStreamsLayer.innerHTML = streamsHtml;

    // Attach stream click listeners
    const streamChannels = els.riverStreamsLayer.querySelectorAll('.river-stream-channel');
    streamChannels.forEach((ch) => {
      const sId = ch.getAttribute('data-stream');
      ch.onclick = () => {
        setStream(state.stream === sId ? 'all' : sId);
      };
      ch.onmouseenter = () => {
        state.hoveredStreamId = sId;
        updateRiverVisualClasses();
      };
      ch.onmouseleave = () => {
        state.hoveredStreamId = null;
        updateRiverVisualClasses();
      };
    });

    // 5. Render Event Signals along the River
    // Place each talk at its exact chronological position along its topic stream
    let eventsHtml = '';
    const sorted = state.events.slice().sort((a, b) => a.date.localeCompare(b.date));

    // Group talks by date to calculate lane offsets for simultaneous talks
    const byDate = new Map();
    sorted.forEach((e) => {
      const arr = byDate.get(e.date) || [];
      arr.push(e);
      byDate.set(e.date, arr);
    });

    sorted.forEach((ev) => {
      const yr = yearOf(ev);
      const yrIdx = years.indexOf(yr);
      if (yrIdx === -1) return;

      const sId = assignStream(ev);
      const streamPoints = streamGeometry.get(sId);
      if (!streamPoints) return;

      const curPoint = streamPoints[yrIdx];
      const nextPoint = streamPoints[yrIdx + 1] || curPoint;

      // Fraction of the year (0.0 to 1.0)
      let dayFraction = 0.5;
      try {
        const parts = ev.date.split('-');
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        dayFraction = (month * 30 + day) / 365;
      } catch {
        // fallback
      }

      // Calculate smooth X & Y on stream
      const xSpan = nextPoint.x - curPoint.x;
      const xPos = Math.round(curPoint.x + (dayFraction - 0.5) * (xSpan * 0.72));

      // Calculate Y interpolated on center line with small siblings lane offset
      const siblings = byDate.get(ev.date) || [ev];
      const sibIdx = siblings.indexOf(ev);
      const sibOffset = (sibIdx - (siblings.length - 1) / 2) * 14;

      const yBase = curPoint.yCenter + (nextPoint.yCenter - curPoint.yCenter) * dayFraction;
      const yMin = curPoint.yTop + 6;
      const yMax = curPoint.yBot - 6;
      let yPos = Math.round(yBase + sibOffset);
      if (yPos < yMin) yPos = yMin;
      if (yPos > yMax) yPos = yMax;

      const streamObj = STREAMS.find((s) => s.id === sId) || STREAMS[0];
      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;

      let isHighlighted = false;
      if (activeStreamId && activeStreamId === sId) isHighlighted = true;
      if (activeTopic && (ev.topics || []).includes(activeTopic)) isHighlighted = true;

      const groupClasses = [
        'river-signal-group',
        isSelected ? 'selected' : '',
        !isMatch ? 'dim' : '',
        isHighlighted ? 'highlighted' : ''
      ].filter(Boolean).join(' ');

      eventsHtml += `
        <g class="${groupClasses}"
          data-id="${escapeHtml(ev.id)}"
          data-x="${xPos}"
          data-y="${yPos}"
          tabindex="0"
          role="button"
          aria-label="${escapeHtml(ev.talk)} (${escapeHtml(formatDateShort(ev.date))}, ${escapeHtml(ev.city || 'Online')})">
          <circle class="river-signal-halo" cx="${xPos}" cy="${yPos}" r="11"></circle>
          <circle class="river-signal-point" cx="${xPos}" cy="${yPos}" r="4.5" fill="#ffffff" stroke="${streamObj.color}" stroke-width="2.5"></circle>
          <circle class="river-signal-hit" cx="${xPos}" cy="${yPos}" r="16"></circle>
        </g>
      `;
    });
    els.riverEventsLayer.innerHTML = eventsHtml;

    // Attach Signal Interactive Listeners (Hover, Focus, Click to open dossier)
    const signalGroups = els.riverEventsLayer.querySelectorAll('.river-signal-group');
    signalGroups.forEach((grp) => {
      const id = grp.getAttribute('data-id');
      const ev = state.events.find((e) => e.id === id);
      if (!ev) return;

      const onEnter = () => {
        state.hoveredEventId = id;
        showRiverTooltip(ev, grp);
      };

      const onLeave = () => {
        if (state.hoveredEventId === id) {
          state.hoveredEventId = null;
          hideRiverTooltip();
        }
      };

      grp.addEventListener('mouseenter', onEnter);
      grp.addEventListener('mouseleave', onLeave);
      grp.addEventListener('focus', onEnter);
      grp.addEventListener('blur', onLeave);

      grp.addEventListener('click', () => {
        state.previousFocusedElement = grp;
        openEvent(id);
      });

      grp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state.previousFocusedElement = grp;
          openEvent(id);
        }
      });
    });

    updateEraReadout();
  }

  function updateRiverVisualClasses() {
    if (!els.riverSvg) return;

    const activeStreamId = state.hoveredStreamId || (state.stream !== 'all' ? state.stream : null);
    const activeTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);

    // Update Ribbons
    const ribbons = els.riverSvg.querySelectorAll('.river-stream-ribbon');
    ribbons.forEach((ribbon) => {
      const channel = ribbon.closest('.river-stream-channel');
      const sId = channel ? channel.getAttribute('data-stream') : null;

      let isDim = false;
      let isHighlighted = false;

      if (activeStreamId) {
        if (activeStreamId === sId) isHighlighted = true;
        else isDim = true;
      } else if (activeTopic) {
        const topicStream = STREAMS.find((st) => st.keywords.some((kw) => activeTopic.toLowerCase().includes(kw)));
        if (topicStream && topicStream.id === sId) isHighlighted = true;
        else isDim = true;
      }

      ribbon.classList.toggle('highlighted', isHighlighted);
      ribbon.classList.toggle('dim', isDim);
      ribbon.setAttribute('stroke-width', isHighlighted ? '2' : '1');
    });

    // Update Event Signals
    const signalGroups = els.riverSvg.querySelectorAll('.river-signal-group');
    signalGroups.forEach((grp) => {
      const id = grp.getAttribute('data-id');
      const ev = state.events.find((e) => e.id === id);
      if (!ev) return;

      const sId = assignStream(ev);
      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;

      let isHighlighted = false;
      if (activeStreamId && activeStreamId === sId) isHighlighted = true;
      if (activeTopic && (ev.topics || []).includes(activeTopic)) isHighlighted = true;

      grp.classList.toggle('selected', isSelected);
      grp.classList.toggle('dim', !isMatch);
      grp.classList.toggle('highlighted', isHighlighted);
    });
  }

  function showRiverTooltip(event, signalGroup) {
    if (!els.riverTooltip || !els.riverFieldWrap) return;

    const rect = signalGroup.getBoundingClientRect();
    const wrapRect = els.riverFieldWrap.getBoundingClientRect();

    const tipX = rect.left - wrapRect.left + rect.width / 2;
    const tipY = rect.top - wrapRect.top;

    els.riverTooltip.innerHTML = `
      <div class="tooltip-date-row">
        <span>${escapeHtml(formatDateShort(event.date))}</span>
        <span>${escapeHtml(event.city || 'Online')}</span>
      </div>
      <div class="tooltip-title">${escapeHtml(event.talk)}</div>
      <div class="tooltip-event">${escapeHtml(event.event)}</div>
      <div class="tooltip-topics">
        ${(event.topics || []).slice(0, 3).map((t) => `<span class="tooltip-topic-tag">#${escapeHtml(t)}</span>`).join('')}
      </div>
      <div class="tooltip-inspect-hint">
        <span>CLICK TO OPEN DOSSIER</span>
        <span aria-hidden="true">↗</span>
      </div>
    `;

    els.riverTooltip.style.left = `${tipX}px`;
    els.riverTooltip.style.top = `${tipY}px`;
    els.riverTooltip.classList.add('visible');
  }

  function hideRiverTooltip() {
    if (els.riverTooltip) {
      els.riverTooltip.classList.remove('visible');
    }
  }

  // Update Era Commentary Card
  function updateEraReadout() {
    if (!els.riverEraCard || !els.eraBadge || !els.eraText) return;

    const narrative = ERA_NARRATIVES[state.year] || ERA_NARRATIVES.all;
    els.eraBadge.textContent = narrative.badge;
    els.eraText.textContent = narrative.text;
  }

  // ==========================================================================
  // Timeline & "Play History" Mode
  // ==========================================================================
  function togglePlayHistory() {
    if (state.isPlaying) {
      stopPlayHistory();
    } else {
      startPlayHistory();
    }
  }

  function startPlayHistory() {
    state.isPlaying = true;
    state.playStep = 0;

    if (els.playHistoryBtn) {
      els.playHistoryBtn.classList.add('playing');
      const label = els.playHistoryBtn.querySelector('.play-label');
      if (label) label.textContent = 'PAUSE';
      const icon = els.playHistoryBtn.querySelector('.play-icon');
      if (icon) icon.textContent = '⏸';
    }

    if (els.eraProgressBar) {
      els.eraProgressBar.classList.remove('hidden');
    }

    const sequence = ['2023', '2024', '2025', '2026'];

    const stepForward = () => {
      if (!state.isPlaying) return;

      const yr = sequence[state.playStep];
      setYear(yr);

      const pct = Math.round(((state.playStep + 1) / sequence.length) * 100);
      if (els.eraProgressFill) {
        els.eraProgressFill.style.width = `${pct}%`;
      }

      state.playStep += 1;
      if (state.playStep >= sequence.length) {
        // Conclude playback and settle on all or 2026
        state.playTimer = setTimeout(() => {
          stopPlayHistory();
          setYear('all');
        }, 4000);
      } else {
        state.playTimer = setTimeout(stepForward, 3600);
      }
    };

    stepForward();
  }

  function stopPlayHistory() {
    state.isPlaying = false;
    clearTimeout(state.playTimer);
    state.playTimer = null;

    if (els.playHistoryBtn) {
      els.playHistoryBtn.classList.remove('playing');
      const label = els.playHistoryBtn.querySelector('.play-label');
      if (label) label.textContent = 'PLAY HISTORY';
      const icon = els.playHistoryBtn.querySelector('.play-icon');
      if (icon) icon.textContent = '▶';
    }

    if (els.eraProgressBar) {
      els.eraProgressBar.classList.add('hidden');
    }
    if (els.eraProgressFill) {
      els.eraProgressFill.style.width = '0%';
    }
  }

  // ==========================================================================
  // Controls & Topic Selectors
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
        if (state.isPlaying) stopPlayHistory();
        setYear(b.dataset.year);
      };
    });
  }

  function renderTopicStrip() {
    if (!els.topicStrip) return;
    const topics = getTopicCounts(state.events);

    const allBtn = `
      <button type="button" class="topic-chip ${state.topic === 'all' && state.stream === 'all' ? 'active' : ''}" data-topic="all">
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
          updateRiverVisualClasses();
        }
      };
      c.onmouseleave = () => {
        state.hoveredTopic = null;
        updateRiverVisualClasses();
      };
      c.onfocus = () => {
        if (top !== 'all') {
          state.hoveredTopic = top;
          updateRiverVisualClasses();
        }
      };
      c.onblur = () => {
        state.hoveredTopic = null;
        updateRiverVisualClasses();
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
        if (state.isPlaying) stopPlayHistory();
        setYear(card.dataset.year === state.year ? 'all' : card.dataset.year);
      };
    });
  }

  // ==========================================================================
  // 04 Geographic Reach (Data-Driven Regional Distribution)
  // ==========================================================================
  function renderGeographicReach() {
    const totalEvents = state.events.length;
    if (!totalEvents) return;

    // 1. Regional Statistics
    const regionStats = REGION_DEFINITIONS.map((def) => {
      const talks = state.events.filter((e) => def.matches(e.city || 'Online'));
      const cities = Array.from(new Set(talks.map((e) => e.city || 'Online'))).filter((c) => c !== 'Online');
      const pct = ((talks.length / totalEvents) * 100).toFixed(1);
      return {
        ...def,
        count: talks.length,
        pct: pct,
        cities: cities
      };
    });

    const uniqueCities = Array.from(new Set(state.events.map((e) => e.city || 'Online'))).filter((c) => c !== 'Online');
    const onlineTalks = state.events.filter((e) => (e.city || 'Online') === 'Online');

    // Extract unique countries
    const countries = new Set();
    uniqueCities.forEach((c) => {
      const parts = c.split(',');
      if (parts.length > 1) countries.add(parts[parts.length - 1].trim());
    });

    if (els.reachCount) els.reachCount.textContent = uniqueCities.length;
    if (els.countriesCount) els.countriesCount.textContent = countries.size;
    if (els.onlineCount) els.onlineCount.textContent = onlineTalks.length;

    // 2. Proportion Stacked Ribbon Bar
    if (els.regionalBar) {
      els.regionalBar.innerHTML = regionStats.map((r) => `
        <div class="regional-segment ${state.region === r.id ? 'active' : ''}"
          style="width: ${r.pct}%; background: ${r.color};"
          data-region="${r.id}"
          title="${r.name}: ${r.count} talks (${r.pct}%)"
          role="button"
          tabindex="0"
          aria-label="${r.name}: ${r.count} talks">
        </div>
      `).join('');

      const segments = els.regionalBar.querySelectorAll('.regional-segment');
      segments.forEach((seg) => {
        const rId = seg.getAttribute('data-region');
        seg.onclick = () => {
          setRegion(state.region === rId ? 'all' : rId);
        };
      });
    }

    // 3. Regional Breakdown Cards
    if (els.regionalCardsGrid) {
      els.regionalCardsGrid.innerHTML = regionStats.map((r) => {
        const cityList = r.id === 'online'
          ? 'Global virtual summits & live-streams'
          : r.cities.map((c) => c.split(',')[0]).join(', ');

        return `
          <button type="button" class="regional-card ${state.region === r.id ? 'active' : ''}" data-region="${r.id}">
            <div class="regional-card-header">
              <h3 class="regional-card-title">${escapeHtml(r.name)}</h3>
              <span class="regional-card-pct">${r.pct}%</span>
            </div>
            <div class="regional-card-count" style="color: ${r.color};">${r.count} talks</div>
            <p class="regional-card-cities">${escapeHtml(cityList)}</p>
          </button>
        `;
      }).join('');

      const cards = els.regionalCardsGrid.querySelectorAll('.regional-card');
      cards.forEach((card) => {
        const rId = card.getAttribute('data-region');
        card.onclick = () => {
          setRegion(state.region === rId ? 'all' : rId);
        };
      });
    }

    // 4. Host Community Roster Pills
    if (els.cityRoster) {
      const cityCounts = new Map();
      state.events.forEach((e) => {
        const c = e.city || 'Online';
        cityCounts.set(c, (cityCounts.get(c) || 0) + 1);
      });

      const entries = Array.from(cityCounts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

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

    if (state.city === 'all' && state.region === 'all') {
      els.cityInspector.className = 'city-inspector empty';
      els.cityInspector.innerHTML = `
        <p class="city-inspector-hint">
          Select any region segment above or click a host community tag to inspect talks delivered in that location.
        </p>
      `;
      return;
    }

    let matchingTalks = [];
    let inspectorTitle = '';
    let inspectorBadge = 'LOCATION ARCHIVE';

    if (state.city !== 'all') {
      inspectorTitle = state.city;
      matchingTalks = state.events.filter((e) => (e.city || 'Online') === state.city);
    } else if (state.region !== 'all') {
      const regDef = REGION_DEFINITIONS.find((r) => r.id === state.region);
      inspectorTitle = regDef ? regDef.name : 'Selected Region';
      inspectorBadge = 'REGIONAL ARCHIVE';
      matchingTalks = state.events.filter((e) => regDef && regDef.matches(e.city || 'Online'));
    }

    matchingTalks.sort((a, b) => b.date.localeCompare(a.date));

    els.cityInspector.className = 'city-inspector';
    els.cityInspector.innerHTML = `
      <div class="city-inspector-header">
        <div>
          <span class="city-badge">${escapeHtml(inspectorBadge)}</span>
          <h3 class="city-name">${escapeHtml(inspectorTitle)}</h3>
          <span class="city-count">${matchingTalks.length} ${matchingTalks.length === 1 ? 'speaking engagement' : 'speaking engagements'} recorded</span>
        </div>
        <div class="city-inspector-actions">
          <a href="#archive" class="city-action-link" id="city-jump-archive">View in Archive Ledger ↓</a>
          <button type="button" class="city-reset-btn" id="city-reset-btn">Reset Location Filter ✕</button>
        </div>
      </div>
      <div class="city-talks-grid">
        ${matchingTalks.map((talk) => `
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
      resetBtn.onclick = () => {
        state.city = 'all';
        state.region = 'all';
        rerender();
      };
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

  // ==========================================================================
  // 02 Chronological Archive Ledger
  // ==========================================================================
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

    // Group talks by year
    const byYear = new Map();
    filtered.forEach((e) => {
      const yr = yearOf(e);
      const arr = byYear.get(yr) || [];
      arr.push(e);
      byYear.set(yr, arr);
    });

    let html = '';
    byYear.forEach((eventsInYear, yr) => {
      html += `
        <div class="archive-year-group">
          <div class="archive-year-header">
            <h3 class="archive-year-title">${yr}</h3>
            <span class="archive-year-sub">${eventsInYear.length} ${eventsInYear.length === 1 ? 'talk' : 'talks'}</span>
          </div>
          <div class="archive-rows">
      `;

      eventsInYear.forEach((ev) => {
        const photos = Array.isArray(ev.photos) ? ev.photos : [];
        const hasPhotos = photos.length > 0;
        const stream = assignStream(ev);
        const streamObj = STREAMS.find((s) => s.id === stream) || STREAMS[0];

        html += `
          <article class="archive-row ${ev.id === state.selectedId ? 'active' : ''}"
            data-id="${escapeHtml(ev.id)}"
            role="button"
            tabindex="0"
            aria-label="${escapeHtml(ev.talk)} at ${escapeHtml(ev.event)}, ${escapeHtml(formatDateShort(ev.date))}">
            <div class="archive-row-date">
              <span class="archive-date-main">${escapeHtml(formatDateShort(ev.date))}</span>
              <span class="archive-location">${escapeHtml(ev.city || 'Online')}</span>
            </div>

            <div class="archive-row-main">
              <div class="archive-event-name">${escapeHtml(ev.event)}</div>
              <h4 class="archive-talk-title">${escapeHtml(ev.talk)}</h4>
              <p class="archive-talk-desc">${escapeHtml(ev.description || 'Verified conference session.')}</p>

              <div class="archive-topics">
                <span class="archive-stream-badge" style="color: ${streamObj.color}; border-color: ${streamObj.stroke};">
                  ${streamObj.label}
                </span>
                ${(ev.topics || []).map((t) => `<span class="archive-topic-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>
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
      if (state.stream !== 'all') {
        const st = STREAMS.find((s) => s.id === state.stream);
        if (st) parts.push(st.label);
      }
      if (state.city !== 'all') parts.push(state.city);
      if (state.region !== 'all') {
        const reg = REGION_DEFINITIONS.find((r) => r.id === state.region);
        if (reg) parts.push(reg.name);
      }
      if (state.query) parts.push(`"${state.query}"`);

      els.archiveFilterNote.textContent = parts.length > 0 ? parts.join(' · ') : 'All speaking events';
    }
  }

  // ==========================================================================
  // 03 Technical Threads Grid
  // ==========================================================================
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
        const riverSec = document.getElementById('river');
        if (riverSec) riverSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
      c.onmouseenter = () => {
        state.hoveredTopic = top;
        updateRiverVisualClasses();
      };
      c.onmouseleave = () => {
        state.hoveredTopic = null;
        updateRiverVisualClasses();
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
    if (state.stream !== 'all') {
      const st = STREAMS.find((s) => s.id === state.stream);
      if (st) parts.push(st.label);
    }
    if (state.city !== 'all') parts.push(state.city);
    if (state.region !== 'all') {
      const reg = REGION_DEFINITIONS.find((r) => r.id === state.region);
      if (reg) parts.push(reg.name);
    }
    if (state.query) parts.push(`"${state.query}"`);

    els.fieldStatus.textContent = `${parts.join(' · ')} · select any signal to inspect details`;
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
    renderGeographicReach();
    updateFieldStatus();
    renderTechnicalRiver();
  }

  function setYear(year) {
    state.year = year;
    state.city = 'all';
    state.region = 'all';
    rerender();
  }

  function setTopic(topic) {
    state.topic = topic;
    state.stream = 'all';
    rerender();
  }

  function setStream(streamId) {
    state.stream = streamId;
    state.topic = 'all';
    rerender();
  }

  function setCity(city) {
    state.city = city;
    state.region = 'all';
    state.year = 'all';
    rerender();
  }

  function setRegion(regionId) {
    state.region = regionId;
    state.city = 'all';
    state.year = 'all';
    rerender();
  }

  function clearAllFilters() {
    if (state.isPlaying) stopPlayHistory();
    state.year = 'all';
    state.topic = 'all';
    state.stream = 'all';
    state.city = 'all';
    state.region = 'all';
    state.query = '';
    if (els.search) els.search.value = '';
    if (els.clearSearch) els.clearSearch.classList.add('hidden');
    rerender();
  }

  // ==========================================================================
  // Event Detail Modal Dossier & Full Photo Support
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

    updateRiverVisualClasses();
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

    updateRiverVisualClasses();
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

    // Play History Button
    if (els.playHistoryBtn) {
      els.playHistoryBtn.addEventListener('click', togglePlayHistory);
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

    // Responsive window resize
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        renderTechnicalRiver();
      }, 100);
    });

    // Light-dismiss dialog fallback
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
