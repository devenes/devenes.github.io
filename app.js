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
      label: 'Cloud Architecture & Serverless',
      shortLabel: 'Cloud & Serverless',
      color: '#2563eb',
      stroke: '#60a5fa',
      fill: 'rgba(37, 99, 235, 0.28)',
      highlightFill: 'rgba(37, 99, 235, 0.55)',
      keywords: ['google cloud', 'cloud architecture', 'serverless', 'cloud run', 'knative', 'cloud computing', 'infrastructure', 'scaling', 'study jam']
    },
    {
      id: 'kubernetes',
      label: 'Kubernetes & GKE Platforms',
      shortLabel: 'Kubernetes & Platforms',
      color: '#0284c7',
      stroke: '#38bdf8',
      fill: 'rgba(2, 132, 199, 0.28)',
      highlightFill: 'rgba(2, 132, 199, 0.55)',
      keywords: ['kubernetes', 'gke', 'gke enterprise', 'gke autopilot', 'platform engineering', 'scheduling', 'containers', 'multi-cluster']
    },
    {
      id: 'devops-sre',
      label: 'DevOps & Global SRE',
      shortLabel: 'DevOps & SRE',
      color: '#d97706',
      stroke: '#fbbf24',
      fill: 'rgba(217, 119, 6, 0.28)',
      highlightFill: 'rgba(217, 119, 6, 0.55)',
      keywords: ['sre', 'reliability', 'observability', 'devops', 'software delivery', 'cloud engineering', 'operations']
    },
    {
      id: 'mlops',
      label: 'AI/ML & MLOps Platforms',
      shortLabel: 'AI/ML & MLOps',
      color: '#6366f1',
      stroke: '#818cf8',
      fill: 'rgba(99, 102, 241, 0.28)',
      highlightFill: 'rgba(99, 102, 241, 0.55)',
      keywords: ['mlops', 'ai/ml', 'vertex ai', 'machine learning', 'ai infrastructure', 'kubernetes for ai', 'ai platform', 'high-scale']
    },
    {
      id: 'genai',
      label: 'Generative AI Systems',
      shortLabel: 'Generative AI',
      color: '#9333ea',
      stroke: '#c084fc',
      fill: 'rgba(147, 51, 234, 0.28)',
      highlightFill: 'rgba(147, 51, 234, 0.55)',
      keywords: ['generative ai', 'genai', 'gemini', 'ai trends', 'frontier']
    },
    {
      id: 'agents',
      label: 'Autonomous AI Agents & ADK',
      shortLabel: 'Autonomous AI Agents',
      color: '#db2777',
      stroke: '#f472b6',
      fill: 'rgba(219, 39, 119, 0.28)',
      highlightFill: 'rgba(219, 39, 119, 0.55)',
      keywords: ['ai agents', 'adk', 'agent', 'intelligent agents', 'build with ai', 'langgraph', 'agentic']
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
  // Geographic Coordinates Dictionary (The Speaking Journey)
  // All 23 physical speaking locations mapped with precision
  // ==========================================================================
  const CITY_COORDINATES = {
    'Dubai, UAE': { lat: 25.2048, lon: 55.2708, label: 'Dubai', country: 'UAE' },
    'Cairo, Egypt': { lat: 30.0444, lon: 31.2357, label: 'Cairo', country: 'Egypt' },
    '6th of October City, Egypt': { lat: 29.9870, lon: 30.9416, label: '6th of October City', country: 'Egypt' },
    'Pristina, Kosovo': { lat: 42.6629, lon: 21.1655, label: 'Pristina', country: 'Kosovo' },
    'Istanbul, Türkiye': { lat: 41.0082, lon: 28.9784, label: 'Istanbul', country: 'Türkiye' },
    'Bursa, Türkiye': { lat: 40.1885, lon: 29.0610, label: 'Bursa', country: 'Türkiye' },
    'Denizli, Türkiye': { lat: 37.7765, lon: 29.0864, label: 'Denizli', country: 'Türkiye' },
    'Kastamonu, Türkiye': { lat: 41.3887, lon: 33.7827, label: 'Kastamonu', country: 'Türkiye' },
    'Konya, Türkiye': { lat: 37.8746, lon: 32.4932, label: 'Konya', country: 'Türkiye' },
    'Düzce, Türkiye': { lat: 40.8438, lon: 31.1565, label: 'Düzce', country: 'Türkiye' },
    'İzmit, Türkiye': { lat: 40.7654, lon: 29.9408, label: 'İzmit', country: 'Türkiye' },
    'Almaty, Kazakhstan': { lat: 43.2220, lon: 76.8512, label: 'Almaty', country: 'Kazakhstan' },
    'Astana, Kazakhstan': { lat: 51.1694, lon: 71.4491, label: 'Astana', country: 'Kazakhstan' },
    'Pavlodar, Kazakhstan': { lat: 52.2872, lon: 76.9674, label: 'Pavlodar', country: 'Kazakhstan' },
    'Taldykorgan, Kazakhstan': { lat: 45.0156, lon: 78.3739, label: 'Taldykorgan', country: 'Kazakhstan' },
    'Tashkent, Uzbekistan': { lat: 41.2995, lon: 69.2401, label: 'Tashkent', country: 'Uzbekistan' },
    'Kashkadarya, Uzbekistan': { lat: 38.8606, lon: 65.7891, label: 'Kashkadarya', country: 'Uzbekistan' },
    'Bishkek, Kyrgyzstan': { lat: 42.8746, lon: 74.5698, label: 'Bishkek', country: 'Kyrgyzstan' },
    'Sousse, Tunisia': { lat: 35.8256, lon: 10.6084, label: 'Sousse', country: 'Tunisia' },
    'Sarajevo, Bosnia and Herzegovina': { lat: 43.8563, lon: 18.4131, label: 'Sarajevo', country: 'Bosnia and Herzegovina' },
    'Agadir, Morocco': { lat: 30.4278, lon: -9.5981, label: 'Agadir', country: 'Morocco' },
    'Baku, Azerbaijan': { lat: 40.4093, lon: 49.8671, label: 'Baku', country: 'Azerbaijan' },
    'Ulaanbaatar, Mongolia': { lat: 47.8864, lon: 106.9057, label: 'Ulaanbaatar', country: 'Mongolia' }
  };

  function getCityCoord(city) {
    if (!city || city === 'Online') return null;
    if (CITY_COORDINATES[city]) return CITY_COORDINATES[city];
    for (const [key, val] of Object.entries(CITY_COORDINATES)) {
      if (city.includes(val.label) || key.includes(city)) return val;
    }
    console.warn(`[Speaking Journey] City "${city}" not mapped in CITY_COORDINATES, using Istanbul fallback.`);
    return CITY_COORDINATES['Istanbul, Türkiye'];
  }

  function validateCoordinates(events) {
    if (!Array.isArray(events)) return;
    const unmapped = new Set();
    events.forEach((ev) => {
      if (!ev || ev.city === 'Online') return;
      if (!CITY_COORDINATES[ev.city]) {
        let found = false;
        for (const [key, val] of Object.entries(CITY_COORDINATES)) {
          if (ev.city.includes(val.label) || key.includes(ev.city)) {
            found = true;
            break;
          }
        }
        if (!found) unmapped.add(ev.city);
      }
    });
    if (unmapped.size > 0) {
      console.warn('[Speaking Journey] Unmapped physical speaking locations detected:', Array.from(unmapped));
    }
  }

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
      text: '2025 — The Autonomous Agent Wave: Rapid transition into Generative AI and autonomous AI Agents, building with Agent Development Kit (ADK), Vertex AI, and enterprise platform architectures across international stages.'
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
    // Speaking Journey Elements
    journeyStageWrap: document.getElementById('journey-stage-wrap'),
    journeyStatusIndicator: document.querySelector('.journey-status-indicator'),
    journeyStatusText: document.getElementById('journey-status-text'),
    journeyCounter: document.getElementById('journey-counter'),
    journeyPrevBtn: document.getElementById('journey-prev-btn'),
    journeyPlayBtn: document.getElementById('journey-play-btn'),
    journeyPlayIcon: document.getElementById('journey-play-icon'),
    journeyPlayLabel: document.getElementById('journey-play-label'),
    journeyNextBtn: document.getElementById('journey-next-btn'),
    journeySvg: document.getElementById('journey-svg'),
    journeyDefs: document.getElementById('journey-defs'),
    journeySpaceBg: document.getElementById('journey-space-bg'),
    journeySphere: document.getElementById('journey-sphere'),
    journeyGraticule: document.getElementById('journey-graticule'),
    journeyLand: document.getElementById('journey-land'),
    journeyRoutesGroup: document.getElementById('journey-routes-group'),
    journeyActiveArc: document.getElementById('journey-active-arc'),
    journeyMarkersGroup: document.getElementById('journey-markers-group'),
    journeyActiveMarkerGroup: document.getElementById('journey-active-marker-group'),
    journeyAtmosphere: document.getElementById('journey-atmosphere'),
    journeyBroadcastGroup: document.getElementById('journey-broadcast-group'),
    journeyOnlineOverlay: document.getElementById('journey-online-overlay'),
    journeyActiveCard: document.getElementById('journey-active-card'),
    journeyCardDate: document.getElementById('journey-card-date'),
    journeyCardCoords: document.getElementById('journey-card-coords'),
    journeyCardLocation: document.getElementById('journey-card-location'),
    journeyCardTitle: document.getElementById('journey-card-title'),
    journeyCardEvent: document.getElementById('journey-card-event'),
    journeyCardDesc: document.getElementById('journey-card-desc'),
    journeyCardTopics: document.getElementById('journey-card-topics'),
    journeyDossierBtn: document.getElementById('journey-dossier-btn'),
    journeyHopDistance: document.getElementById('journey-hop-distance'),
    journeyScrubber: document.getElementById('journey-scrubber'),
    journeySrAnnouncer: document.getElementById('journey-sr-announcer'),
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
    const title = (event.talk || '').toLowerCase();
    const topics = (event.topics || []).map((t) => t.toLowerCase());

    // 1. Autonomous AI Agents & ADK
    if (topics.some((t) => t.includes('agent') || t.includes('adk')) ||
        title.includes('agent') || title.includes('adk')) {
      return 'agents';
    }

    // 2. Generative AI Systems
    if (topics.some((t) => t.includes('generative ai') || t.includes('genai')) ||
        title.includes('generative ai')) {
      return 'genai';
    }

    // 3. AI/ML & MLOps Platforms
    if (topics.some((t) => t.includes('mlops') || t.includes('ai/ml') || t.includes('machine learning')) ||
        title.includes('mlops') || title.includes('ai/ml') || title.includes('kubernetes for ai') ||
        (topics.includes('gke') && topics.includes('ai')) ||
        (topics.includes('ai') && title.includes('ai platform'))) {
      return 'mlops';
    }

    // 4. DevOps & Global SRE
    if (topics.some((t) => t.includes('sre') || t.includes('reliability') || t.includes('observability')) ||
        title.includes('sre') || title.includes('reliability') ||
        (topics.includes('devops') && !topics.includes('kubernetes'))) {
      return 'devops-sre';
    }

    // 5. Kubernetes & GKE Platforms
    if (topics.some((t) => t.includes('kubernetes') || t.includes('gke') || t.includes('scheduling')) ||
        title.includes('kubernetes') || title.includes('gke') || title.includes('platform')) {
      return 'kubernetes';
    }

    // 6. Cloud Architecture & Serverless
    return 'cloud';
  }

  // Identify Cross-Cutting Secondary Streams (Topic Convergence)
  function getSecondaryStreams(event, primaryStreamId) {
    const topics = (event.topics || []).map((t) => t.toLowerCase());
    const secondaries = [];

    const checks = {
      cloud: () => topics.some((t) => t.includes('cloud') || t.includes('serverless')),
      kubernetes: () => topics.some((t) => t.includes('kubernetes') || t.includes('gke')),
      'devops-sre': () => topics.some((t) => t.includes('sre') || t.includes('devops') || t.includes('reliability')),
      mlops: () => topics.some((t) => t.includes('mlops') || t.includes('ai/ml') || t.includes('vertex ai')),
      genai: () => topics.some((t) => t.includes('generative ai') || t.includes('gemini')),
      agents: () => topics.some((t) => t.includes('agent') || t.includes('adk'))
    };

    Object.entries(checks).forEach(([id, fn]) => {
      if (id !== primaryStreamId && fn()) {
        secondaries.push(id);
      }
    });

    return secondaries;
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
    const padLeft = 70;
    const padRight = 70;
    const usableWidth = svgWidth - padLeft - padRight;

    // Timeline domain: from May 1, 2023 to November 1, 2026 (42 calendar months)
    const startEpoch = new Date('2023-05-01T00:00:00Z').getTime();
    const endEpoch = new Date('2026-11-01T00:00:00Z').getTime();
    const totalSpan = endEpoch - startEpoch;

    function timeToX(dateStr) {
      const d = new Date(dateStr + 'T12:00:00Z').getTime();
      return Math.round(padLeft + ((d - startEpoch) / totalSpan) * usableWidth);
    }

    // 1. Generate Monthly Sample Points for Continuous Ribbon Geometry
    const months = [];
    let curMonthDate = new Date('2023-05-01T00:00:00Z');
    const endMonthDate = new Date('2026-11-01T00:00:00Z');
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    while (curMonthDate <= endMonthDate) {
      const y = curMonthDate.getUTCFullYear();
      const m = curMonthDate.getUTCMonth();
      const epoch = curMonthDate.getTime();
      const dStr = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const x = timeToX(dStr);
      const isQuarter = (m === 0 || m === 3 || m === 6 || m === 9); // Jan, Apr, Jul, Oct

      months.push({
        year: y,
        month: m,
        name: monthNames[m],
        epoch: epoch,
        x: x,
        isQuarter: isQuarter
      });
      curMonthDate.setUTCMonth(curMonthDate.getUTCMonth() + 1);
    }

    // Pre-calculate talk metadata & coordinates
    const sigma = 75 * 24 * 3600 * 1000; // 75-day Gaussian smoothing kernel
    const eventRecords = state.events.map((ev) => {
      const pStream = assignStream(ev);
      const sStreams = getSecondaryStreams(ev, pStream);
      return {
        ...ev,
        stream: pStream,
        secondaryStreams: sStreams,
        epoch: new Date(ev.date + 'T12:00:00Z').getTime(),
        x: timeToX(ev.date)
      };
    });

    // 2. Compute Dynamic Stream Thickness & Centers at Each Month Sample
    const centerY = 265;
    const streamSamples = new Map(); // streamId -> array of { x, yTop, yBot, yCenter }
    STREAMS.forEach((s) => streamSamples.set(s.id, []));

    months.forEach((m) => {
      const vols = STREAMS.map((s) => {
        let sum = 0;
        eventRecords.filter((e) => e.stream === s.id).forEach((e) => {
          const dist = Math.abs(e.epoch - m.epoch);
          sum += Math.exp(-Math.pow(dist / sigma, 2));
        });
        return { id: s.id, vol: sum };
      });

      const baseH = 12;
      const heights = vols.map((v) => ({
        id: v.id,
        h: baseH + Math.min(42, Math.round(v.vol * 9.5))
      }));

      const gap = 8;
      const totalStackH = heights.reduce((acc, item) => acc + item.h, 0) + (STREAMS.length - 1) * gap;
      let currentY = centerY - totalStackH / 2;

      heights.forEach((item) => {
        const yTop = currentY;
        const yBot = currentY + item.h;
        const yCenter = (yTop + yBot) / 2;
        streamSamples.get(item.id).push({
          x: m.x,
          yTop: Math.round(yTop * 10) / 10,
          yBot: Math.round(yBot * 10) / 10,
          yCenter: Math.round(yCenter * 10) / 10
        });
        currentY = yBot + gap;
      });
    });

    // Centerline vertical coordinate interpolator
    function getStreamCenterY(streamId, x) {
      const pts = streamSamples.get(streamId);
      if (!pts || !pts.length) return centerY;
      if (x <= pts[0].x) return pts[0].yCenter;
      if (x >= pts[pts.length - 1].x) return pts[pts.length - 1].yCenter;
      for (let i = 0; i < pts.length - 1; i += 1) {
        if (x >= pts[i].x && x <= pts[i + 1].x) {
          const span = pts[i + 1].x - pts[i].x;
          const t = span > 0 ? (x - pts[i].x) / span : 0;
          return pts[i].yCenter + t * (pts[i + 1].yCenter - pts[i].yCenter);
        }
      }
      return pts[0].yCenter;
    }

    // 3. Render SVG Definitions (Gradients)
    let defsHtml = '';
    STREAMS.forEach((s) => {
      defsHtml += `
        <linearGradient id="grad-${s.id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${s.color}" stop-opacity="0.28" />
          <stop offset="50%" stop-color="${s.color}" stop-opacity="0.45" />
          <stop offset="100%" stop-color="${s.stroke}" stop-opacity="0.32" />
        </linearGradient>
      `;
    });
    els.riverDefs.innerHTML = defsHtml;

    // 4. Render Background Grid Lines, Year Focus & Monthly Ticks
    const yearZones = [
      { year: '2023', start: '2023-05-01', end: '2023-12-31', era: 'FOUNDATIONS' },
      { year: '2024', start: '2024-01-01', end: '2024-12-31', era: 'CONVERGENCE' },
      { year: '2025', start: '2025-01-01', end: '2025-12-31', era: 'AGENTIC WAVE' },
      { year: '2026', start: '2026-01-01', end: '2026-11-01', era: 'GLOBAL SCALE' }
    ];

    let gridHtml = '';

    // Active year focus backdrop
    if (state.year !== 'all') {
      const activeZone = yearZones.find((z) => z.year === state.year);
      if (activeZone) {
        const x1 = timeToX(activeZone.start);
        const x2 = timeToX(activeZone.end);
        const w = Math.max(20, x2 - x1);
        gridHtml += `
          <rect class="river-year-focus" x="${x1}" y="14" width="${w}" height="${svgHeight - 28}" rx="4"></rect>
        `;
      }
    }

    // Year boundary vertical lines & labels
    yearZones.forEach((z, idx) => {
      const x = timeToX(z.start);
      const isYearActive = state.year === z.year;
      if (idx > 0) {
        gridHtml += `<line class="river-year-line" x1="${x}" y1="16" x2="${x}" y2="${svgHeight - 36}"></line>`;
      }
      const labelX = x + (idx === 0 ? 30 : 16);
      gridHtml += `
        <text class="river-year-label ${isYearActive ? 'active' : ''}" x="${labelX}" y="24">${z.year}</text>
        <text class="river-era-marker" x="${labelX + 2}" y="36">${z.era}</text>
      `;
    });

    // Monthly tick marks & labels
    months.forEach((m) => {
      const tickClass = m.isQuarter ? 'river-month-tick quarter-tick' : 'river-month-tick';
      const labelClass = m.isQuarter ? 'river-month-label quarter-mark' : 'river-month-label minor-month';
      gridHtml += `
        <line class="${tickClass}" x1="${m.x}" y1="46" x2="${m.x}" y2="${m.isQuarter ? '54' : '50'}"></line>
        <text class="${labelClass}" x="${m.x}" y="43">${m.name}</text>
      `;
    });
    els.riverBackgroundGrid.innerHTML = gridHtml;

    // 5. Render Fluid Stream Ribbons & Centerlines
    const activeStreamId = state.hoveredStreamId || (state.stream !== 'all' ? state.stream : null);
    const activeTopic = state.hoveredTopic || (state.topic !== 'all' ? state.topic : null);

    let streamsHtml = '';
    const areaGen = (typeof d3 !== 'undefined' && d3.area)
      ? d3.area().x((d) => d.x).y0((d) => d.yTop).y1((d) => d.yBot).curve(d3.curveMonotoneX)
      : null;
    const lineGen = (typeof d3 !== 'undefined' && d3.line)
      ? d3.line().x((d) => d.x).y((d) => d.yCenter).curve(d3.curveMonotoneX)
      : null;

    STREAMS.forEach((s) => {
      const points = streamSamples.get(s.id);
      if (!points || points.length < 2) return;

      let pathD = '';
      let centerD = '';

      if (areaGen && lineGen) {
        pathD = areaGen(points);
        centerD = lineGen(points);
      } else {
        pathD = `M ${points[0].x} ${points[0].yTop}`;
        for (let i = 0; i < points.length - 1; i += 1) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const dx = p1.x - p0.x;
          pathD += ` C ${p0.x + dx * 0.45} ${p0.yTop}, ${p1.x - dx * 0.45} ${p1.yTop}, ${p1.x} ${p1.yTop}`;
        }
        pathD += ` L ${points[points.length - 1].x} ${points[points.length - 1].yBot}`;
        for (let i = points.length - 1; i > 0; i -= 1) {
          const p0 = points[i];
          const p1 = points[i - 1];
          const dx = p0.x - p1.x;
          pathD += ` C ${p0.x - dx * 0.45} ${p0.yBot}, ${p1.x + dx * 0.45} ${p1.yBot}, ${p1.x} ${p1.yBot}`;
        }
        pathD += ' Z';

        centerD = `M ${points[0].x} ${points[0].yCenter}`;
        for (let i = 0; i < points.length - 1; i += 1) {
          const p0 = points[i];
          const p1 = points[i + 1];
          const dx = p1.x - p0.x;
          centerD += ` C ${p0.x + dx * 0.45} ${p0.yCenter}, ${p1.x - dx * 0.45} ${p1.yCenter}, ${p1.x} ${p1.yCenter}`;
        }
      }

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
            stroke-width="1.3">
          </path>
        </g>
      `;
    });
    els.riverStreamsLayer.innerHTML = streamsHtml;

    // Attach stream click & hover listeners
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

    // 6. Event Signals, Lanes, Same-Day Brackets & Multi-Topic Convergence
    const sortedEvents = eventRecords.slice().sort((a, b) => a.date.localeCompare(b.date));

    // Collision avoidance lane allocation
    const laneOffsets = [0, -15, 15, -28, 28];
    const streamPlacedEvents = new Map();
    STREAMS.forEach((s) => streamPlacedEvents.set(s.id, []));

    sortedEvents.forEach((ev) => {
      const sArr = streamPlacedEvents.get(ev.stream);
      const occupiedLanes = new Set();
      sArr.forEach((prev) => {
        if (Math.abs(prev.x - ev.x) < 24) {
          occupiedLanes.add(prev.laneIndex);
        }
      });

      let chosenLane = 0;
      for (let l = 0; l < laneOffsets.length; l += 1) {
        if (!occupiedLanes.has(l)) {
          chosenLane = l;
          break;
        }
      }

      ev.laneIndex = chosenLane;
      ev.offsetY = laneOffsets[chosenLane];
      ev.yCenter = getStreamCenterY(ev.stream, ev.x);
      ev.y = Math.round(ev.yCenter + ev.offsetY);
      sArr.push(ev);
    });

    // Group talks by date to identify same-day events
    const byDate = new Map();
    sortedEvents.forEach((ev) => {
      const arr = byDate.get(ev.date) || [];
      arr.push(ev);
      byDate.set(ev.date, arr);
    });

    let eventsHtml = '';

    // A. Multi-Topic Convergence Curves
    sortedEvents.forEach((ev) => {
      if (!ev.secondaryStreams || !ev.secondaryStreams.length) return;
      ev.secondaryStreams.forEach((secId) => {
        const secStreamObj = STREAMS.find((s) => s.id === secId);
        if (!secStreamObj) return;

        const targetY = getStreamCenterY(secId, ev.x);
        const isCurveHigh = (activeStreamId && (activeStreamId === ev.stream || activeStreamId === secId)) ||
                            (state.hoveredEventId && state.hoveredEventId === ev.id);

        const midY = (ev.y + targetY) / 2;
        const curveD = `M ${ev.x} ${ev.y} C ${ev.x} ${midY}, ${ev.x} ${midY}, ${ev.x} ${targetY}`;

        eventsHtml += `
          <path class="river-convergence-link ${isCurveHigh ? 'highlighted' : ''}"
            data-id="${escapeHtml(ev.id)}"
            data-primary="${ev.stream}"
            data-secondary="${secId}"
            d="${curveD}"
            stroke="${secStreamObj.stroke}">
          </path>
        `;
      });
    });

    // B. Same-Day Synchronization Brackets
    byDate.forEach((dayEvents, dateStr) => {
      if (dayEvents.length < 2) return;
      const sortedByY = dayEvents.slice().sort((a, b) => a.y - b.y);
      const topNode = sortedByY[0];
      const botNode = sortedByY[sortedByY.length - 1];
      const midY = (topNode.y + botNode.y) / 2;
      const isSameDayHigh = dayEvents.some((e) => e.id === state.hoveredEventId || e.id === state.selectedId);

      eventsHtml += `
        <g class="river-sameday-group" data-date="${dateStr}">
          <line class="river-sameday-bracket ${isSameDayHigh ? 'highlighted' : ''}"
            x1="${topNode.x}" y1="${topNode.y}"
            x2="${botNode.x}" y2="${botNode.y}">
          </line>
          <circle class="river-sameday-dot" cx="${topNode.x}" cy="${midY}" r="2.5"></circle>
          <text class="river-sameday-tag" x="${topNode.x + 6}" y="${midY + 3}">SAME DAY</text>
        </g>
      `;
    });

    // C. Leader Lines for Offset Lane Nodes
    sortedEvents.forEach((ev) => {
      if (ev.offsetY !== 0) {
        eventsHtml += `
          <line class="river-signal-leader"
            x1="${ev.x}" y1="${ev.yCenter}"
            x2="${ev.x}" y2="${ev.y}">
          </line>
        `;
      }
    });

    // D. Event Signal Nodes
    sortedEvents.forEach((ev) => {
      const streamObj = STREAMS.find((s) => s.id === ev.stream) || STREAMS[0];
      const isMatch = matchesEvent(ev);
      const isSelected = ev.id === state.selectedId;

      let isHighlighted = false;
      if (activeStreamId && activeStreamId === ev.stream) isHighlighted = true;
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
          data-stream="${ev.stream}"
          data-date="${ev.date}"
          data-x="${ev.x}"
          data-y="${ev.y}"
          tabindex="0"
          role="button"
          aria-label="${escapeHtml(ev.talk)} (${escapeHtml(formatDateShort(ev.date))}, ${escapeHtml(ev.city || 'Online')})">
          <circle class="river-signal-halo" cx="${ev.x}" cy="${ev.y}" r="11"></circle>
          <circle class="river-signal-point" cx="${ev.x}" cy="${ev.y}" r="4.5" fill="#ffffff" stroke="${streamObj.color}" stroke-width="2.5"></circle>
          <circle class="river-signal-hit" cx="${ev.x}" cy="${ev.y}" r="16"></circle>
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
        updateRiverVisualClasses();
      };

      const onLeave = () => {
        if (state.hoveredEventId === id) {
          state.hoveredEventId = null;
          hideRiverTooltip();
          updateRiverVisualClasses();
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

    // Attach Legend Button Listeners
    const legendButtons = document.querySelectorAll('#river-legend .legend-item[data-stream]');
    legendButtons.forEach((btn) => {
      const sId = btn.getAttribute('data-stream');
      btn.onclick = () => {
        setStream(state.stream === sId ? 'all' : sId);
      };
      btn.onmouseenter = () => {
        state.hoveredStreamId = sId;
        updateRiverVisualClasses();
      };
      btn.onmouseleave = () => {
        state.hoveredStreamId = null;
        updateRiverVisualClasses();
      };
    });

    updateEraReadout();
    updateRiverVisualClasses();
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
      if (state.hoveredEventId && state.hoveredEventId === id) isHighlighted = true;

      grp.classList.toggle('selected', isSelected);
      grp.classList.toggle('dim', !isMatch);
      grp.classList.toggle('highlighted', isHighlighted);
    });

    // Update Convergence Links
    const convergenceLinks = els.riverSvg.querySelectorAll('.river-convergence-link');
    convergenceLinks.forEach((link) => {
      const linkEvId = link.getAttribute('data-id');
      const primary = link.getAttribute('data-primary');
      const secondary = link.getAttribute('data-secondary');

      const isHigh = (state.hoveredEventId && state.hoveredEventId === linkEvId) ||
                     (state.selectedId && state.selectedId === linkEvId) ||
                     (activeStreamId && (activeStreamId === primary || activeStreamId === secondary));
      link.classList.toggle('highlighted', isHigh);
    });

    // Update Same-Day Brackets
    const sameDayBrackets = els.riverSvg.querySelectorAll('.river-sameday-bracket');
    sameDayBrackets.forEach((bracket) => {
      const grp = bracket.closest('.river-sameday-group');
      const dateStr = grp ? grp.getAttribute('data-date') : null;
      const hoveredEv = state.events.find((e) => e.id === state.hoveredEventId);
      const selectedEv = state.events.find((e) => e.id === state.selectedId);

      const isHigh = (hoveredEv && hoveredEv.date === dateStr) ||
                     (selectedEv && selectedEv.date === dateStr);
      bracket.classList.toggle('highlighted', isHigh);
    });

    // Update Legend Button Active States
    const legendButtons = document.querySelectorAll('#river-legend .legend-item[data-stream]');
    legendButtons.forEach((btn) => {
      const sId = btn.getAttribute('data-stream');
      const isActive = state.stream === sId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function showRiverTooltip(event, signalGroup) {
    if (!els.riverTooltip || !els.riverFieldWrap) return;

    const rect = signalGroup.getBoundingClientRect();
    const wrapRect = els.riverFieldWrap.getBoundingClientRect();

    const tipX = rect.left - wrapRect.left + rect.width / 2;
    const tipY = rect.top - wrapRect.top;

    const pStreamId = assignStream(event);
    const streamObj = STREAMS.find((s) => s.id === pStreamId) || STREAMS[0];
    const secondaryIds = getSecondaryStreams(event, pStreamId);
    const secondaryObjs = secondaryIds.map((id) => STREAMS.find((s) => s.id === id)).filter(Boolean);

    els.riverTooltip.innerHTML = `
      <div class="tooltip-date-row">
        <span>${escapeHtml(formatDateShort(event.date))}</span>
        <span>${escapeHtml(event.city || 'Online')}</span>
      </div>
      <div>
        <span class="tooltip-stream-badge" style="color: ${streamObj.stroke}; border-color: ${streamObj.stroke}; background: ${streamObj.fill};">
          ${streamObj.shortLabel}
        </span>
      </div>
      <div class="tooltip-title">${escapeHtml(event.talk)}</div>
      <div class="tooltip-event">${escapeHtml(event.event)}</div>
      <div class="tooltip-topics">
        ${(event.topics || []).slice(0, 3).map((t) => `<span class="tooltip-topic-tag">#${escapeHtml(t)}</span>`).join('')}
      </div>
      ${
        secondaryObjs.length > 0
          ? `<div class="tooltip-convergence-note">⇄ Bridges: ${escapeHtml(secondaryObjs.map((s) => s.shortLabel).join(', '))}</div>`
          : ''
      }
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
  // 02 The Speaking Journey (Global Speaking Signal) — Cinematic Timeline Engine
  // ==========================================================================
  const journeyState = {
    initialized: false,
    stops: [],
    currentIndex: 0,

    // Deterministic playback state machine
    userPlaying: true,         // User's manual playback intent
    hoverPaused: false,        // Transient pause on pointer hover
    modalOpen: false,          // Paused while inspecting event dossier
    inViewport: true,          // Active only when in viewport (IntersectionObserver)
    tabHidden: false,          // Paused when tab is hidden (visibilitychange)
    isTraveling: false,        // True during smooth camera motion

    currentCoords: [28.9784, 41.0082], // Starts centered on Istanbul
    currentScale: 230,
    baseScale: 230,
    globeCenter: [680, 290],
    visitedCoords: [],
    historicalArcs: [],

    holdTimer: null,
    resumeTimer: null,
    animId: null,
    landData: null,
    projection: null,
    pathGen: null,
    graticuleGeo: null
  };

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function calcDistanceKm(p1, p2) {
    if (!p1 || !p2 || typeof d3 === 'undefined') return 0;
    const rad = d3.geoDistance(p1, p2);
    return Math.round(rad * 6371);
  }

  function isJourneyAutoAdvancing() {
    return journeyState.userPlaying &&
      !journeyState.hoverPaused &&
      !journeyState.modalOpen &&
      journeyState.inViewport &&
      !journeyState.tabHidden;
  }

  function syncJourneyPlaybackUI() {
    if (!journeyState.initialized) return;

    if (!journeyState.userPlaying) {
      if (els.journeyPlayIcon) els.journeyPlayIcon.textContent = '▶';
      if (els.journeyPlayLabel) els.journeyPlayLabel.textContent = 'PLAY';
      if (els.journeyStatusText) els.journeyStatusText.textContent = 'PAUSED';
      if (els.journeyStatusIndicator) els.journeyStatusIndicator.classList.add('paused');
    } else if (journeyState.modalOpen) {
      if (els.journeyPlayIcon) els.journeyPlayIcon.textContent = '⏸';
      if (els.journeyPlayLabel) els.journeyPlayLabel.textContent = 'PAUSE';
      if (els.journeyStatusText) els.journeyStatusText.textContent = 'PAUSED (DOSSIER)';
      if (els.journeyStatusIndicator) els.journeyStatusIndicator.classList.add('paused');
    } else if (journeyState.hoverPaused) {
      if (els.journeyPlayIcon) els.journeyPlayIcon.textContent = '⏸';
      if (els.journeyPlayLabel) els.journeyPlayLabel.textContent = 'PAUSE';
      if (els.journeyStatusText) els.journeyStatusText.textContent = 'PAUSED (HOVER)';
      if (els.journeyStatusIndicator) els.journeyStatusIndicator.classList.add('paused');
    } else {
      if (els.journeyPlayIcon) els.journeyPlayIcon.textContent = '⏸';
      if (els.journeyPlayLabel) els.journeyPlayLabel.textContent = 'PAUSE';
      if (els.journeyStatusText) els.journeyStatusText.textContent = 'CHRONOLOGICAL PLAYBACK';
      if (els.journeyStatusIndicator) els.journeyStatusIndicator.classList.remove('paused');
    }
  }

  function pauseJourney(reason) {
    clearTimeout(journeyState.holdTimer);
    clearTimeout(journeyState.resumeTimer);

    if (reason === 'user') {
      journeyState.userPlaying = false;
      journeyState.hoverPaused = false;
    } else if (reason === 'hover') {
      journeyState.hoverPaused = true;
    } else if (reason === 'modal') {
      journeyState.modalOpen = true;
    } else if (reason === 'viewport') {
      journeyState.inViewport = false;
    } else if (reason === 'visibility') {
      journeyState.tabHidden = true;
    }

    syncJourneyPlaybackUI();
  }

  function resumeJourney(reason, delayMs = 1200) {
    clearTimeout(journeyState.resumeTimer);

    if (reason === 'user') {
      journeyState.userPlaying = true;
      journeyState.hoverPaused = false; // Manual click clears any hover pause
    } else if (reason === 'hover') {
      journeyState.hoverPaused = false;
    } else if (reason === 'modal') {
      journeyState.modalOpen = false;
    } else if (reason === 'viewport') {
      journeyState.inViewport = true;
    } else if (reason === 'visibility') {
      journeyState.tabHidden = false;
    }

    syncJourneyPlaybackUI();

    if (isJourneyAutoAdvancing() && !journeyState.isTraveling) {
      scheduleJourneyAdvance(delayMs);
    }
  }

  function scheduleJourneyAdvance(holdMs = 2800) {
    clearTimeout(journeyState.holdTimer);
    if (!isJourneyAutoAdvancing()) return;

    journeyState.holdTimer = setTimeout(() => {
      if (!isJourneyAutoAdvancing() || journeyState.isTraveling) return;

      const nextIndex = (journeyState.currentIndex + 1) % journeyState.stops.length;
      advanceChronologicalStop(nextIndex);
    }, holdMs);
  }

  function getChronologicalHistoryUpTo(targetIndex) {
    const visitedCoords = [];
    const historicalArcs = [];
    let lastPhysicalCoord = null;

    for (let i = 0; i <= targetIndex; i++) {
      const stop = journeyState.stops[i];
      if (!stop || stop.city === 'Online') continue;
      const coord = getCityCoord(stop.city);
      if (!coord) continue;
      const pt = [coord.lon, coord.lat];

      if (i < targetIndex) {
        const alreadyVisited = visitedCoords.some(
          (v) => Math.abs(v[0] - pt[0]) < 0.001 && Math.abs(v[1] - pt[1]) < 0.001
        );
        if (!alreadyVisited) {
          visitedCoords.push(pt);
        }
      }

      if (lastPhysicalCoord) {
        const isSameLoc =
          Math.abs(lastPhysicalCoord[0] - pt[0]) < 0.001 &&
          Math.abs(lastPhysicalCoord[1] - pt[1]) < 0.001;
        if (!isSameLoc) {
          historicalArcs.push({
            type: 'LineString',
            coordinates: [lastPhysicalCoord, pt]
          });
        }
      }
      lastPhysicalCoord = pt;
    }

    return { visitedCoords, historicalArcs };
  }

  function updateGlobeDimensions() {
    const isMobile = window.innerWidth <= 860;
    const center = isMobile ? [550, 290] : [680, 290];
    const radius = isMobile ? 215 : 230;

    journeyState.globeCenter = center;
    journeyState.baseScale = radius;

    if (els.journeySpaceBg) {
      els.journeySpaceBg.setAttribute('cx', center[0]);
      els.journeySpaceBg.setAttribute('cy', center[1]);
      els.journeySpaceBg.setAttribute('r', radius);
    }
    if (els.journeyAtmosphere) {
      els.journeyAtmosphere.setAttribute('cx', center[0]);
      els.journeyAtmosphere.setAttribute('cy', center[1]);
      els.journeyAtmosphere.setAttribute('r', radius);
    }
    if (journeyState.projection) {
      journeyState.projection
        .scale(journeyState.isTraveling ? journeyState.currentScale : radius)
        .translate(center);
    }
  }

  function initJourneyDefs() {
    if (!els.journeyDefs) return;
    els.journeyDefs.innerHTML = `
      <radialGradient id="globe-shading" cx="62%" cy="38%" r="68%">
        <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.08" />
        <stop offset="55%" stop-color="#0c1017" stop-opacity="0.0" />
        <stop offset="100%" stop-color="#05070a" stop-opacity="0.78" />
      </radialGradient>
      <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
        <stop offset="85%" stop-color="#3b82f6" stop-opacity="0.0" />
        <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.25" />
      </radialGradient>
      <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    `;
  }

  function renderGlobeStatic() {
    if (!journeyState.pathGen) return;

    if (els.journeySphere) {
      els.journeySphere.setAttribute('d', journeyState.pathGen({ type: 'Sphere' }) || '');
    }

    if (els.journeyGraticule && journeyState.graticuleGeo) {
      els.journeyGraticule.setAttribute('d', journeyState.pathGen(journeyState.graticuleGeo) || '');
    }

    if (els.journeyLand && journeyState.landData) {
      els.journeyLand.setAttribute('d', journeyState.pathGen(journeyState.landData) || '');
    }
  }

  function renderHistoricalTrails() {
    if (!els.journeyRoutesGroup || !journeyState.pathGen) return;

    if (journeyState.historicalArcs.length === 0) {
      els.journeyRoutesGroup.innerHTML = '';
      return;
    }

    const multiLine = {
      type: 'MultiLineString',
      coordinates: journeyState.historicalArcs.map((a) => a.coordinates)
    };
    const d = journeyState.pathGen(multiLine);

    let trailPath = els.journeyRoutesGroup.querySelector('.journey-route-trail');
    if (!trailPath) {
      els.journeyRoutesGroup.innerHTML = `<path class="journey-route-trail" d="${d || ''}"></path>`;
    } else {
      trailPath.setAttribute('d', d || '');
    }
  }

  function renderHistoricalMarkers() {
    if (!els.journeyMarkersGroup || !journeyState.projection) return;
    const centerLon = -journeyState.projection.rotate()[0];
    const centerLat = -journeyState.projection.rotate()[1];
    const center = [centerLon, centerLat];

    const visitedStops = [];
    const seen = new Set();
    for (let i = 0; i < journeyState.currentIndex; i++) {
      const stop = journeyState.stops[i];
      if (!stop || stop.city === 'Online') continue;
      const coord = getCityCoord(stop.city);
      if (!coord) continue;
      const key = `${coord.lon.toFixed(2)},${coord.lat.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.add(key);
        visitedStops.push({
          stopIndex: i,
          event: stop,
          coord: [coord.lon, coord.lat],
          label: coord.label
        });
      }
    }

    const dotsHtml = visitedStops.map((v) => {
      if (d3.geoDistance(center, v.coord) > Math.PI / 2) return '';
      const pt = journeyState.projection(v.coord);
      if (!pt) return '';
      const x = Math.round(pt[0]);
      const y = Math.round(pt[1]);
      return `
        <circle class="journey-hist-dot"
          cx="${x}" cy="${y}" r="3.5"
          data-event-id="${escapeHtml(v.event.id)}"
          role="button"
          tabindex="0"
          aria-label="Inspect ${escapeHtml(v.label)}: ${escapeHtml(v.event.talk)} (${formatDateShort(v.event.date)})">
        </circle>
      `;
    }).join('');

    els.journeyMarkersGroup.innerHTML = dotsHtml;

    const dots = els.journeyMarkersGroup.querySelectorAll('.journey-hist-dot');
    dots.forEach((dot) => {
      dot.onclick = (e) => {
        e.stopPropagation();
        const eventId = dot.dataset.eventId;
        if (eventId) openEvent(eventId);
      };
      dot.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const eventId = dot.dataset.eventId;
          if (eventId) openEvent(eventId);
        }
      };
    });
  }

  function renderActiveMarker(coord, cityLabel, coordsText, pulse = false) {
    if (!els.journeyActiveMarkerGroup || !journeyState.projection) return;
    if (!coord) {
      els.journeyActiveMarkerGroup.innerHTML = '';
      return;
    }

    const centerLon = -journeyState.projection.rotate()[0];
    const centerLat = -journeyState.projection.rotate()[1];
    const center = [centerLon, centerLat];

    if (d3.geoDistance(center, coord) > Math.PI / 2) {
      els.journeyActiveMarkerGroup.innerHTML = '';
      return;
    }

    const pt = journeyState.projection(coord);
    if (!pt) {
      els.journeyActiveMarkerGroup.innerHTML = '';
      return;
    }

    const x = Math.round(pt[0]);
    const y = Math.round(pt[1]);

    const isRightHalf = x >= journeyState.globeCenter[0];
    const dx = isRightHalf ? 38 : -38;
    const dy = -26;
    const textAnchor = isRightHalf ? 'start' : 'end';
    const textX = x + dx + (isRightHalf ? 8 : -8);
    const textY = y + dy - 2;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let markerHtml = '';
    if (pulse && !prefersReducedMotion) {
      markerHtml += `<circle class="journey-marker-pulse" cx="${x}" cy="${y}" r="6"></circle>`;
    }
    markerHtml += `
      <g class="journey-active-marker-pin" role="button" tabindex="0" aria-label="Active stop: ${escapeHtml(cityLabel)} — select to open dossier">
        <polyline class="journey-leader-line" points="${x},${y} ${x + dx},${y + dy} ${textX},${y + dy}"></polyline>
        <circle class="journey-marker-dot" cx="${x}" cy="${y}" r="4.5"></circle>
        <text class="journey-marker-label" x="${textX}" y="${textY}" text-anchor="${textAnchor}">${escapeHtml(cityLabel.toUpperCase())}</text>
        <text class="journey-marker-coords" x="${textX}" y="${textY + 12}" text-anchor="${textAnchor}">${escapeHtml(coordsText)}</text>
      </g>
    `;
    els.journeyActiveMarkerGroup.innerHTML = markerHtml;

    const pin = els.journeyActiveMarkerGroup.querySelector('.journey-active-marker-pin');
    if (pin) {
      pin.onclick = () => {
        const ev = journeyState.stops[journeyState.currentIndex];
        if (ev) openEvent(ev.id);
      };
      pin.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const ev = journeyState.stops[journeyState.currentIndex];
          if (ev) openEvent(ev.id);
        }
      };
    }
  }

  function announceJourneyStop(stopIndex) {
    if (!els.journeySrAnnouncer) return;
    const stop = journeyState.stops[stopIndex];
    if (!stop) return;
    const isOnline = stop.city === 'Online';
    const coord = getCityCoord(stop.city);
    const loc = isOnline ? 'Online Broadcast' : (coord ? `${coord.label}, ${coord.country}` : stop.city);
    els.journeySrAnnouncer.textContent = `Stop ${stopIndex + 1} of ${journeyState.stops.length}: ${formatDateShort(stop.date)} in ${loc} — ${stop.talk}`;
  }

  function renderJourneyScrubber() {
    if (!els.journeyScrubber) return;
    const total = journeyState.stops.length;
    els.journeyScrubber.innerHTML = journeyState.stops.map((stop, idx) => {
      const isOnline = stop.city === 'Online';
      const coord = getCityCoord(stop.city);
      const label = isOnline ? 'Online' : (coord ? coord.label : stop.city);
      const title = `${formatDateShort(stop.date)} · ${label} — ${stop.talk}`;
      const isActive = idx === journeyState.currentIndex;
      return `
        <button type="button" class="journey-scrub-tick ${isOnline ? 'online' : ''} ${isActive ? 'active' : ''}"
          data-index="${idx}"
          title="${escapeHtml(title)}"
          aria-label="Stop ${idx + 1} of ${total}: ${escapeHtml(title)}"
          aria-current="${isActive ? 'step' : 'false'}">
        </button>
      `;
    }).join('');

    const ticks = els.journeyScrubber.querySelectorAll('.journey-scrub-tick');
    ticks.forEach((tick) => {
      tick.addEventListener('click', () => {
        const idx = parseInt(tick.dataset.index, 10);
        if (!isNaN(idx)) {
          jumpToJourneyStop(idx, false, true);
        }
      });
      tick.addEventListener('keydown', (e) => {
        const currIdx = parseInt(tick.dataset.index, 10);
        let targetIdx = null;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          targetIdx = (currIdx - 1 + total) % total;
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          targetIdx = (currIdx + 1) % total;
        } else if (e.key === 'Home') {
          e.preventDefault();
          targetIdx = 0;
        } else if (e.key === 'End') {
          e.preventDefault();
          targetIdx = total - 1;
        }
        if (targetIdx !== null) {
          jumpToJourneyStop(targetIdx, false, true);
          const nextTick = els.journeyScrubber.querySelector(`[data-index="${targetIdx}"]`);
          if (nextTick) nextTick.focus();
        }
      });
    });
  }

  function updateJourneyCard(event, prevEvent = null, distanceKm = 0, isSameCity = false) {
    if (!els.journeyActiveCard || !event) return;

    const isOnline = event.city === 'Online';
    const coord = getCityCoord(event.city);

    if (els.journeyCardDate) {
      els.journeyCardDate.textContent = formatDateShort(event.date);
    }

    if (els.journeyCounter) {
      els.journeyCounter.textContent = `STOP ${String(journeyState.currentIndex + 1).padStart(2, '0')} / ${journeyState.stops.length}`;
    }

    if (isOnline) {
      if (els.journeyCardCoords) els.journeyCardCoords.textContent = 'WORLDWIDE BROADCAST';
      if (els.journeyCardLocation) {
        els.journeyCardLocation.textContent = 'ONLINE · GLOBAL';
        els.journeyCardLocation.classList.add('online-loc');
      }
      if (els.journeyHopDistance) els.journeyHopDistance.textContent = 'Global virtual interlude · Online broadcast';
    } else if (coord) {
      const latStr = `${Math.abs(coord.lat).toFixed(2)}° ${coord.lat >= 0 ? 'N' : 'S'}`;
      const lonStr = `${Math.abs(coord.lon).toFixed(2)}° ${coord.lon >= 0 ? 'E' : 'W'}`;
      if (els.journeyCardCoords) els.journeyCardCoords.textContent = `${latStr} · ${lonStr}`;
      if (els.journeyCardLocation) {
        els.journeyCardLocation.textContent = `${coord.label.toUpperCase()}, ${coord.country.toUpperCase()}`;
        els.journeyCardLocation.classList.remove('online-loc');
      }

      if (els.journeyHopDistance) {
        if (journeyState.currentIndex === 0) {
          els.journeyHopDistance.textContent = 'Voyage Origin · Istanbul, Türkiye';
        } else if (isSameCity) {
          els.journeyHopDistance.textContent = `Consecutive session in ${coord.label}`;
        } else if (prevEvent) {
          const prevC = getCityCoord(prevEvent.city);
          const prevLabel = prevC ? prevC.label : prevEvent.city;
          els.journeyHopDistance.textContent = `+${distanceKm.toLocaleString()} km from ${prevLabel}`;
        }
      }
    }

    if (els.journeyCardTitle) {
      els.journeyCardTitle.textContent = event.talk || 'Technical Keynote';
    }

    if (els.journeyCardEvent) {
      els.journeyCardEvent.textContent = event.event || 'Technical Conference';
    }

    if (els.journeyCardDesc) {
      els.journeyCardDesc.textContent = event.description || 'Verified session preserved in technical speaking archive.';
    }

    if (els.journeyCardTopics) {
      els.journeyCardTopics.innerHTML = (event.topics || []).slice(0, 4).map((t) => `
        <span class="journey-card-topic-pill">#${escapeHtml(t)}</span>
      `).join('');
    }

    // Update scrubber ticks
    if (els.journeyScrubber) {
      const ticks = els.journeyScrubber.querySelectorAll('.journey-scrub-tick');
      ticks.forEach((tick, idx) => {
        const isActive = idx === journeyState.currentIndex;
        tick.classList.toggle('active', isActive);
        tick.classList.toggle('visited', idx < journeyState.currentIndex);
        tick.setAttribute('aria-current', isActive ? 'step' : 'false');
      });
    }

    if (els.journeyDossierBtn) {
      els.journeyDossierBtn.onclick = () => {
        openEvent(event.id);
      };
    }
  }

  function advanceChronologicalStop(nextIndex) {
    if (!journeyState.stops.length) return;

    clearTimeout(journeyState.holdTimer);
    if (journeyState.animId) {
      cancelAnimationFrame(journeyState.animId);
      journeyState.animId = null;
    }

    const prevIndex = journeyState.currentIndex;
    journeyState.currentIndex = nextIndex;

    const currentEvent = journeyState.stops[nextIndex];
    const prevEvent = journeyState.stops[prevIndex];
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // A. Loop back to Origin: Reset historical routes & markers cleanly without fake return arc
    if (nextIndex === 0) {
      journeyState.visitedCoords = [];
      journeyState.historicalArcs = [];
      if (els.journeyActiveArc) {
        els.journeyActiveArc.setAttribute('d', '');
        els.journeyActiveArc.style.display = 'none';
      }

      const originCoord = getCityCoord(currentEvent.city) || CITY_COORDINATES['Istanbul, Türkiye'];
      const targetLonLat = [originCoord.lon, originCoord.lat];

      if (prefersReducedMotion) {
        journeyState.isTraveling = false;
        journeyState.currentCoords = targetLonLat;
        journeyState.projection
          .scale(journeyState.baseScale)
          .rotate([-targetLonLat[0], -targetLonLat[1]]);
        renderGlobeStatic();
        renderHistoricalTrails();
        renderHistoricalMarkers();
        const latStr = `${Math.abs(originCoord.lat).toFixed(1)}°${originCoord.lat >= 0 ? 'N' : 'S'}`;
        const lonStr = `${Math.abs(originCoord.lon).toFixed(1)}°${originCoord.lon >= 0 ? 'E' : 'W'}`;
        renderActiveMarker(targetLonLat, originCoord.label, `${latStr} · ${lonStr}`, false);
        updateJourneyCard(currentEvent, null, 0, false);
        if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
        scheduleJourneyAdvance(3000);
        return;
      }

      // Smooth camera reset rotation without active route arc
      journeyState.isTraveling = true;
      if (els.journeyActiveCard) els.journeyActiveCard.classList.add('fading');

      const prevLonLat = journeyState.currentCoords;
      const interp = d3.geoInterpolate(prevLonLat, targetLonLat);
      const startTime = performance.now();
      const duration = 2200;

      function stepResetLoop(now) {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = easeInOutCubic(progress);
        const currentInterp = interp(ease);
        const currentScale = journeyState.baseScale - 30 * Math.sin(Math.PI * ease);

        journeyState.projection
          .scale(currentScale)
          .rotate([-currentInterp[0], -currentInterp[1]]);

        renderGlobeStatic();
        renderHistoricalTrails();
        renderHistoricalMarkers();

        if (progress < 1) {
          journeyState.animId = requestAnimationFrame(stepResetLoop);
        } else {
          journeyState.isTraveling = false;
          journeyState.currentCoords = targetLonLat;
          journeyState.projection
            .scale(journeyState.baseScale)
            .rotate([-targetLonLat[0], -targetLonLat[1]]);
          renderGlobeStatic();
          renderHistoricalTrails();
          renderHistoricalMarkers();
          const latStr = `${Math.abs(originCoord.lat).toFixed(1)}°${originCoord.lat >= 0 ? 'N' : 'S'}`;
          const lonStr = `${Math.abs(originCoord.lon).toFixed(1)}°${originCoord.lon >= 0 ? 'E' : 'W'}`;
          renderActiveMarker(targetLonLat, originCoord.label, `${latStr} · ${lonStr}`, true);
          updateJourneyCard(currentEvent, null, 0, false);
          if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
          scheduleJourneyAdvance(3000);
        }
      }

      journeyState.animId = requestAnimationFrame(stepResetLoop);
      return;
    }

    // B. Online Digital Interlude
    const isOnline = currentEvent.city === 'Online';
    if (isOnline) {
      journeyState.isTraveling = false;
      if (els.journeyBroadcastGroup) {
        els.journeyBroadcastGroup.classList.remove('hidden');
        els.journeyBroadcastGroup.innerHTML = `
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 0s;"></circle>
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 0.8s;"></circle>
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 1.6s;"></circle>
        `;
      }
      if (els.journeyLand) els.journeyLand.style.opacity = '0.35';
      if (els.journeyOnlineOverlay) els.journeyOnlineOverlay.classList.remove('hidden');
      if (els.journeyActiveMarkerGroup) els.journeyActiveMarkerGroup.innerHTML = '';
      if (els.journeyActiveArc) {
        els.journeyActiveArc.setAttribute('d', '');
        els.journeyActiveArc.style.display = 'none';
      }

      updateJourneyCard(currentEvent, prevEvent, 0, false);
      if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
      scheduleJourneyAdvance(2400);
      return;
    }

    // C. Physical Speaking Stop Transition
    if (els.journeyBroadcastGroup) {
      els.journeyBroadcastGroup.classList.add('hidden');
      els.journeyBroadcastGroup.innerHTML = '';
    }
    if (els.journeyLand) els.journeyLand.style.opacity = '1';
    if (els.journeyOnlineOverlay) els.journeyOnlineOverlay.classList.add('hidden');

    const nextCoordObj = getCityCoord(currentEvent.city);
    const prevCoordObj = getCityCoord(prevEvent.city);
    const targetLonLat = [nextCoordObj.lon, nextCoordObj.lat];
    const prevLonLat = prevCoordObj ? [prevCoordObj.lon, prevCoordObj.lat] : journeyState.currentCoords;

    const isSameCity = prevCoordObj &&
      Math.abs(prevCoordObj.lat - nextCoordObj.lat) < 0.001 &&
      Math.abs(prevCoordObj.lon - nextCoordObj.lon) < 0.001;

    const latStr = `${Math.abs(nextCoordObj.lat).toFixed(1)}°${nextCoordObj.lat >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(nextCoordObj.lon).toFixed(1)}°${nextCoordObj.lon >= 0 ? 'E' : 'W'}`;
    const coordStr = `${latStr} · ${lonStr}`;

    // Consecutive session in the same city
    if (isSameCity) {
      journeyState.isTraveling = false;
      journeyState.currentCoords = targetLonLat;
      updateJourneyCard(currentEvent, prevEvent, 0, true);
      renderActiveMarker(targetLonLat, nextCoordObj.label, coordStr, true);
      if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
      scheduleJourneyAdvance(2800);
      return;
    }

    // Instant mode under prefers-reduced-motion
    if (prefersReducedMotion) {
      journeyState.isTraveling = false;
      journeyState.currentCoords = targetLonLat;
      journeyState.projection
        .scale(journeyState.baseScale)
        .rotate([-targetLonLat[0], -targetLonLat[1]]);

      if (prevLonLat && (prevLonLat[0] !== targetLonLat[0] || prevLonLat[1] !== targetLonLat[1])) {
        const alreadyVisited = journeyState.visitedCoords.some(
          (v) => Math.abs(v[0] - prevLonLat[0]) < 0.001 && Math.abs(v[1] - prevLonLat[1]) < 0.001
        );
        if (!alreadyVisited) journeyState.visitedCoords.push(prevLonLat);
        journeyState.historicalArcs.push({
          type: 'LineString',
          coordinates: [prevLonLat, targetLonLat]
        });
      }

      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();
      renderActiveMarker(targetLonLat, nextCoordObj.label, coordStr, false);
      updateJourneyCard(currentEvent, prevEvent, calcDistanceKm(prevLonLat, targetLonLat), false);
      if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
      scheduleJourneyAdvance(3000);
      return;
    }

    // Great-Circle Cinematic Camera Journey
    journeyState.isTraveling = true;
    if (els.journeyActiveCard) els.journeyActiveCard.classList.add('fading');

    const distRad = d3.geoDistance(prevLonLat, targetLonLat);
    const distKm = Math.round(distRad * 6371);

    let duration = 2000;
    let scaleDip = 32;
    if (distRad < 0.08) {
      duration = 1400;
      scaleDip = 8;
    } else if (distRad < 0.35) {
      duration = 2100;
      scaleDip = 32;
    } else {
      duration = 2800;
      scaleDip = 52;
    }

    const interp = d3.geoInterpolate(prevLonLat, targetLonLat);
    const startTime = performance.now();

    function stepAnimation(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeInOutCubic(progress);

      const currentInterp = interp(ease);
      const currentScale = journeyState.baseScale - scaleDip * Math.sin(Math.PI * ease);

      journeyState.projection
        .scale(currentScale)
        .rotate([-currentInterp[0], -currentInterp[1]]);

      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();

      // Traveling active arc
      if (els.journeyActiveArc) {
        const arcGeo = {
          type: 'LineString',
          coordinates: [prevLonLat, currentInterp]
        };
        const d = journeyState.pathGen(arcGeo);
        els.journeyActiveArc.setAttribute('d', d || '');
        els.journeyActiveArc.style.display = d ? 'block' : 'none';
      }

      if (progress < 1) {
        journeyState.animId = requestAnimationFrame(stepAnimation);
      } else {
        journeyState.isTraveling = false;
        journeyState.currentCoords = targetLonLat;
        journeyState.currentScale = journeyState.baseScale;
        journeyState.projection
          .scale(journeyState.baseScale)
          .rotate([-targetLonLat[0], -targetLonLat[1]]);

        const alreadyVisited = journeyState.visitedCoords.some(
          (v) => Math.abs(v[0] - prevLonLat[0]) < 0.001 && Math.abs(v[1] - prevLonLat[1]) < 0.001
        );
        if (!alreadyVisited) journeyState.visitedCoords.push(prevLonLat);
        journeyState.historicalArcs.push({
          type: 'LineString',
          coordinates: [prevLonLat, targetLonLat]
        });

        if (els.journeyActiveArc) {
          els.journeyActiveArc.setAttribute('d', '');
          els.journeyActiveArc.style.display = 'none';
        }

        renderGlobeStatic();
        renderHistoricalTrails();
        renderHistoricalMarkers();
        renderActiveMarker(targetLonLat, nextCoordObj.label, coordStr, true);

        updateJourneyCard(currentEvent, prevEvent, distKm, false);
        if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');
        scheduleJourneyAdvance(2800);
      }
    }

    journeyState.animId = requestAnimationFrame(stepAnimation);
  }

  function jumpToJourneyStop(targetIndex, instant = false, announce = true) {
    if (!journeyState.stops.length) return;

    clearTimeout(journeyState.holdTimer);
    if (journeyState.animId) {
      cancelAnimationFrame(journeyState.animId);
      journeyState.animId = null;
    }

    const total = journeyState.stops.length;
    const nextIdx = (targetIndex + total) % total;
    const prevIdx = journeyState.currentIndex;
    journeyState.currentIndex = nextIdx;

    // Derived canonical chronological speaking history up to target stop (prevents fake routes)
    const { visitedCoords, historicalArcs } = getChronologicalHistoryUpTo(nextIdx);
    journeyState.visitedCoords = visitedCoords;
    journeyState.historicalArcs = historicalArcs;

    if (els.journeyActiveArc) {
      els.journeyActiveArc.setAttribute('d', '');
      els.journeyActiveArc.style.display = 'none';
    }

    const currentEvent = journeyState.stops[nextIdx];
    const prevEvent = journeyState.stops[prevIdx];
    const isOnline = currentEvent.city === 'Online';
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (announce) {
      announceJourneyStop(nextIdx);
    }

    // 1. Online Interlude
    if (isOnline) {
      journeyState.isTraveling = false;
      if (els.journeyBroadcastGroup) {
        els.journeyBroadcastGroup.classList.remove('hidden');
        els.journeyBroadcastGroup.innerHTML = `
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 0s;"></circle>
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 0.8s;"></circle>
          <circle class="journey-orbit-ring" cx="${journeyState.globeCenter[0]}" cy="${journeyState.globeCenter[1]}" r="${journeyState.baseScale}" style="animation-delay: 1.6s;"></circle>
        `;
      }
      if (els.journeyLand) els.journeyLand.style.opacity = '0.35';
      if (els.journeyOnlineOverlay) els.journeyOnlineOverlay.classList.remove('hidden');
      if (els.journeyActiveMarkerGroup) els.journeyActiveMarkerGroup.innerHTML = '';

      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();
      updateJourneyCard(currentEvent, prevEvent, 0, false);
      if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');

      if (isJourneyAutoAdvancing()) {
        scheduleJourneyAdvance(3200);
      }
      return;
    }

    // 2. Physical Speaking Stop
    if (els.journeyBroadcastGroup) {
      els.journeyBroadcastGroup.classList.add('hidden');
      els.journeyBroadcastGroup.innerHTML = '';
    }
    if (els.journeyLand) els.journeyLand.style.opacity = '1';
    if (els.journeyOnlineOverlay) els.journeyOnlineOverlay.classList.add('hidden');

    const nextCoordObj = getCityCoord(currentEvent.city) || CITY_COORDINATES['Istanbul, Türkiye'];
    const targetLonLat = [nextCoordObj.lon, nextCoordObj.lat];
    const prevLonLat = journeyState.currentCoords || targetLonLat;

    const latStr = `${Math.abs(nextCoordObj.lat).toFixed(1)}°${nextCoordObj.lat >= 0 ? 'N' : 'S'}`;
    const lonStr = `${Math.abs(nextCoordObj.lon).toFixed(1)}°${nextCoordObj.lon >= 0 ? 'E' : 'W'}`;
    const coordStr = `${latStr} · ${lonStr}`;

    const distKm = calcDistanceKm(prevLonLat, targetLonLat);

    if (instant || prefersReducedMotion) {
      journeyState.isTraveling = false;
      journeyState.currentCoords = targetLonLat;
      journeyState.projection
        .scale(journeyState.baseScale)
        .rotate([-targetLonLat[0], -targetLonLat[1]]);

      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();
      renderActiveMarker(targetLonLat, nextCoordObj.label, coordStr, false);
      updateJourneyCard(currentEvent, prevEvent, distKm, false);
      if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');

      if (isJourneyAutoAdvancing()) {
        scheduleJourneyAdvance(3500);
      }
      return;
    }

    // Smooth camera refocus without drawing non-chronological active arc
    journeyState.isTraveling = true;
    updateJourneyCard(currentEvent, prevEvent, distKm, false);
    if (els.journeyActiveCard) els.journeyActiveCard.classList.add('fading');

    const interp = d3.geoInterpolate(prevLonLat, targetLonLat);
    const startTime = performance.now();
    const duration = 1600;

    function stepJumpAnimation(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = easeInOutCubic(progress);

      const currentInterp = interp(ease);
      const currentScale = journeyState.baseScale - 24 * Math.sin(Math.PI * ease);

      journeyState.projection
        .scale(currentScale)
        .rotate([-currentInterp[0], -currentInterp[1]]);

      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();

      if (progress < 1) {
        journeyState.animId = requestAnimationFrame(stepJumpAnimation);
      } else {
        journeyState.isTraveling = false;
        journeyState.currentCoords = targetLonLat;
        journeyState.projection
          .scale(journeyState.baseScale)
          .rotate([-targetLonLat[0], -targetLonLat[1]]);

        renderGlobeStatic();
        renderHistoricalTrails();
        renderHistoricalMarkers();
        renderActiveMarker(targetLonLat, nextCoordObj.label, coordStr, true);
        updateJourneyCard(currentEvent, prevEvent, distKm, false);
        if (els.journeyActiveCard) els.journeyActiveCard.classList.remove('fading');

        if (isJourneyAutoAdvancing()) {
          scheduleJourneyAdvance(3500);
        }
      }
    }

    journeyState.animId = requestAnimationFrame(stepJumpAnimation);
  }

  function setupJourneyListeners() {
    if (els.journeyPlayBtn) {
      els.journeyPlayBtn.addEventListener('click', () => {
        if (journeyState.userPlaying) {
          pauseJourney('user');
        } else {
          resumeJourney('user', 600);
        }
      });
    }

    if (els.journeyPrevBtn) {
      els.journeyPrevBtn.addEventListener('click', () => {
        const prevIdx = (journeyState.currentIndex - 1 + journeyState.stops.length) % journeyState.stops.length;
        jumpToJourneyStop(prevIdx, false, true);
      });
    }

    if (els.journeyNextBtn) {
      els.journeyNextBtn.addEventListener('click', () => {
        const nextIdx = (journeyState.currentIndex + 1) % journeyState.stops.length;
        jumpToJourneyStop(nextIdx, false, true);
      });
    }

    if (els.journeyStageWrap) {
      els.journeyStageWrap.addEventListener('pointerenter', (e) => {
        if (e.pointerType === 'touch') return;
        pauseJourney('hover');
      });

      els.journeyStageWrap.addEventListener('pointerleave', (e) => {
        if (e.pointerType === 'touch') return;
        clearTimeout(journeyState.resumeTimer);
        journeyState.resumeTimer = setTimeout(() => {
          resumeJourney('hover', 800);
        }, 400);
      });
    }
  }

  function setupJourneyLifecycle() {
    if (window.IntersectionObserver && els.journeyStageWrap) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            resumeJourney('viewport', 1000);
          } else {
            pauseJourney('viewport');
          }
        });
      }, { threshold: 0.15 });
      observer.observe(els.journeyStageWrap);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        pauseJourney('visibility');
      } else {
        resumeJourney('visibility', 1000);
      }
    });

    window.addEventListener('resize', () => {
      updateGlobeDimensions();
      renderGlobeStatic();
      renderHistoricalTrails();
      renderHistoricalMarkers();
      if (journeyState.stops.length > 0) {
        const currentStop = journeyState.stops[journeyState.currentIndex];
        if (currentStop && currentStop.city !== 'Online') {
          const coord = getCityCoord(currentStop.city);
          if (coord) {
            const latStr = `${Math.abs(coord.lat).toFixed(1)}°${coord.lat >= 0 ? 'N' : 'S'}`;
            const lonStr = `${Math.abs(coord.lon).toFixed(1)}°${coord.lon >= 0 ? 'E' : 'W'}`;
            renderActiveMarker([coord.lon, coord.lat], coord.label, `${latStr} · ${lonStr}`, false);
          }
        }
      }
    });
  }

  function initSpeakingJourney(landData) {
    if (!els.journeySvg || !state.events.length) return;
    if (typeof d3 === 'undefined') {
      console.warn('D3 is not available; Speaking Journey could not initialize.');
      return;
    }

    journeyState.landData = landData;
    journeyState.stops = state.events.slice().sort((a, b) => a.date.localeCompare(b.date));
    if (!journeyState.stops.length) return;

    validateCoordinates(journeyState.stops);

    const firstPhysical = journeyState.stops.find((s) => s.city !== 'Online');
    const firstCoord = firstPhysical ? getCityCoord(firstPhysical.city) : CITY_COORDINATES['Istanbul, Türkiye'];
    if (firstCoord) {
      journeyState.currentCoords = [firstCoord.lon, firstCoord.lat];
    }

    updateGlobeDimensions();

    journeyState.projection = d3.geoOrthographic()
      .scale(journeyState.baseScale)
      .translate(journeyState.globeCenter)
      .rotate([-journeyState.currentCoords[0], -journeyState.currentCoords[1]])
      .clipAngle(90);

    journeyState.pathGen = d3.geoPath(journeyState.projection);
    journeyState.graticuleGeo = d3.geoGraticule().step([30, 30])();

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      journeyState.userPlaying = false;
    }

    initJourneyDefs();
    renderGlobeStatic();
    renderJourneyScrubber();
    setupJourneyListeners();
    setupJourneyLifecycle();

    journeyState.currentIndex = 0;
    journeyState.initialized = true;

    jumpToJourneyStop(0, true, false);
    syncJourneyPlaybackUI();

    if (isJourneyAutoAdvancing()) {
      scheduleJourneyAdvance(3000);
    }
  }

  // ==========================================================================
  // Event Detail Modal Dossier & Full Photo Support
  // ==========================================================================
  function openEvent(id) {
    const event = state.events.find((e) => e.id === id);
    if (!event || !els.dialog) return;

    // Pause journey playback during dossier examination
    pauseJourney('modal');

    if (journeyState.initialized) {
      const stopIdx = journeyState.stops.findIndex((s) => s.id === id);
      if (stopIdx !== -1 && stopIdx !== journeyState.currentIndex) {
        jumpToJourneyStop(stopIdx, true, false);
      }
    }

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

    // Resume Speaking Journey playback
    resumeJourney('modal', 1200);
  }

  function handleRouteFromHash() {
    const rawHash = window.location.hash.replace(/^#/, '').trim();
    if (!rawHash) {
      if (els.dialog && els.dialog.open) {
        closeEvent();
      }
      return;
    }

    const sectionIds = ['river', 'journey', 'archive', 'threads', 'reach', 'about', 'top'];
    if (sectionIds.includes(rawHash)) {
      const elem = document.getElementById(rawHash);
      if (elem) elem.scrollIntoView({ behavior: 'auto' });
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
      const [eventsRes, landRes] = await Promise.all([
        fetch(DATA_URL, { cache: 'no-cache' }),
        fetch('data/land.json', { cache: 'no-cache' })
      ]);

      if (!eventsRes.ok) {
        throw new Error(`Failed to load ${DATA_URL}: ${eventsRes.status}`);
      }

      const data = await eventsRes.json();
      if (!Array.isArray(data)) {
        throw new Error('Data in events.json is not an array');
      }

      state.events = data;

      let landData = null;
      if (landRes && landRes.ok) {
        try {
          landData = await landRes.json();
        } catch (landErr) {
          console.warn('Could not parse land.json:', landErr);
        }
      }

      updateHeroMetrics();
      rerender();
      initSpeakingJourney(landData);
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
