import type {
  CityDestination,
  EnrichedSpeakingEvent,
  SpeakingAtlasData,
  TopicCategoryId,
} from '../utils/geography';
import { formatSignalDate, withBase } from '../utils/paths';
import { EarthGlobeController } from './earthGlobe';

export type AtlasViewMode = 'globe' | 'regions' | 'timeline' | 'topics';

declare global {
  interface Window {
    __earthGlobe?: EarthGlobeController;
    __atlasController?: SpeakingAtlasController;
  }
}

const ERA_NARRATIVES: Record<string, string> = {
  all: 'Tracing 44 speaking engagements across 4 years: from enterprise Kubernetes and cloud architectures to autonomous AI agents and global reliability engineering.',
  '2026':
    '2026 — AI Infrastructure, Surgical AI Agents & Global Reliability: High-scale AI infrastructure, clinical AI agent workshops, Kubernetes for AI workloads, and SRE at Google scale.',
  '2025':
    '2025 — The Autonomous Agent Wave: Rapid transition into Generative AI and autonomous AI Agents, building with Agent Development Kit (ADK), Vertex AI, and enterprise GKE platforms.',
  '2024':
    '2024 — Containers Meet AI/ML: Container orchestration converges with high-scale AI/ML workloads, introducing MLOps pipelines and multi-cloud GKE architectures.',
  '2023':
    '2023 — Cloud & Kubernetes Foundations: Deep dives into GKE Enterprise, scheduler internals, and serverless architectures across Türkiye, Central Asia, and the Balkans.',
};

export class SpeakingAtlasController {
  private atlas: SpeakingAtlasData;
  private globe: EarthGlobeController;

  private viewMode: AtlasViewMode = 'globe';
  private selectedCityId: string | null = null;
  private activeCityTab: 'talks' | 'photos' | 'about' = 'talks';
  private activeYear = 'all';
  private activeTopic: TopicCategoryId | 'all' = 'all';
  private activeRegion = 'all';

  // Archive modal filter state
  private archiveQuery = '';
  private archiveCluster = 'all';
  private archiveType = 'all';
  private archiveYear = 'all';
  private archiveCity = 'all';

  constructor(atlas: SpeakingAtlasData, globe: EarthGlobeController) {
    this.atlas = atlas;
    this.globe = globe;
    this.bindEvents();
    this.syncBodyAttributes();
  }

  private syncBodyAttributes(): void {
    document.body.dataset.viewMode = this.viewMode;
    document.body.dataset.selectedCity = this.selectedCityId ?? '';
    document.body.dataset.cityTab = this.activeCityTab;
    document.body.dataset.region = this.activeRegion;
    document.body.dataset.year = this.activeYear;
    document.body.dataset.topic = this.activeTopic;
  }

  public setViewMode(mode: AtlasViewMode): void {
    this.viewMode = mode;

    document.querySelectorAll<HTMLButtonElement>('[data-view-mode]').forEach((btn) => {
      const isSelected = btn.dataset.viewMode === mode;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        btn.classList.add('bg-[#1D4ED8]/45', 'text-white', 'border-[#38BDF8]/50');
        btn.classList.remove('text-slate-300', 'border-transparent');
      } else {
        btn.classList.remove('bg-[#1D4ED8]/45', 'text-white', 'border-[#38BDF8]/50');
        btn.classList.add('text-slate-300', 'border-transparent');
      }
    });

    const overviewEl = document.getElementById('city-overview-state');
    const selectedCityEl = document.getElementById('selected-city-panel');
    const regionsEl = document.getElementById('view-panel-regions');
    const timelineEl = document.getElementById('view-panel-timeline');
    const topicsEl = document.getElementById('view-panel-topics');

    overviewEl?.classList.add('hidden');
    selectedCityEl?.classList.add('hidden');
    selectedCityEl?.classList.remove('flex');
    regionsEl?.classList.add('hidden');
    timelineEl?.classList.add('hidden');
    topicsEl?.classList.add('hidden');

    if (mode === 'globe') {
      if (this.selectedCityId) {
        selectedCityEl?.classList.remove('hidden');
        selectedCityEl?.classList.add('flex');
      } else {
        overviewEl?.classList.remove('hidden');
      }
    } else if (mode === 'regions') {
      regionsEl?.classList.remove('hidden');
    } else if (mode === 'timeline') {
      timelineEl?.classList.remove('hidden');
    } else if (mode === 'topics') {
      topicsEl?.classList.remove('hidden');
    }

    this.syncBodyAttributes();
  }

  public selectCity(cityId: string | null): void {
    if (!cityId) {
      this.selectedCityId = null;
      this.activeRegion = 'all';
      const dropdown = document.getElementById(
        'city-selector-dropdown'
      ) as HTMLSelectElement | null;
      if (dropdown) dropdown.value = '';
      this.globe.focusOnCity(null);
      this.setViewMode('globe');
      return;
    }

    const city = this.atlas.cities.find((c) => c.id === cityId);
    if (!city) return;

    this.selectedCityId = city.id;
    const dropdown = document.getElementById(
      'city-selector-dropdown'
    ) as HTMLSelectElement | null;
    if (dropdown) dropdown.value = city.id;

    this.populateSelectedCityPanel(city);
    this.setCityTab('talks');
    this.setViewMode('globe');
    this.globe.focusOnCity(city.id);
    this.syncBodyAttributes();
  }

  private populateSelectedCityPanel(city: CityDestination): void {
    const nameEl = document.getElementById('selected-city-name');
    const countryEl = document.getElementById('selected-city-country');
    const regionBadgeEl = document.getElementById('selected-city-region-badge');
    const coordsEl = document.getElementById('selected-city-coords');
    const countEl = document.getElementById('selected-city-talks-count');
    const eventsListEl = document.getElementById('selected-city-events-list');
    const photosContentEl = document.getElementById('selected-city-photos-content');
    const aboutContentEl = document.getElementById('selected-city-about-content');
    const archiveBtn = document.getElementById('selected-city-archive-btn');

    if (nameEl) nameEl.textContent = city.city;
    if (countryEl) {
      countryEl.innerHTML = `<span>${city.flag}</span><span>${city.country}</span>`;
    }
    if (regionBadgeEl) regionBadgeEl.textContent = city.regionName.toUpperCase();
    if (coordsEl) {
      coordsEl.textContent = `${city.lat.toFixed(2)}°N, ${city.lon.toFixed(2)}°E`;
    }
    if (countEl) {
      countEl.textContent = `${city.eventsCount} ${city.eventsCount === 1 ? 'TALK' : 'TALKS'}`;
    }
    if (archiveBtn) {
      archiveBtn.textContent = `View all talks in ${city.city} →`;
      archiveBtn.onclick = () => {
        this.openArchive({ cityId: city.id });
      };
    }

    if (eventsListEl) {
      eventsListEl.innerHTML = city.events
        .map(
          (ev) => `
          <button
            type="button"
            data-city-event-id="${ev.id}"
            data-testid="city-event-item-${ev.id}"
            class="w-full group flex items-center justify-between gap-3 rounded-xl p-2.5 bg-slate-900/75 hover:bg-slate-900 border border-white/10 hover:border-[#38BDF8]/50 text-left transition-all cursor-pointer"
          >
            <div class="min-w-0 flex-1">
              <div class="font-mono text-[10px] text-[#38BDF8] uppercase">
                ${formatSignalDate(ev.date)} · ${ev.sessionType.toUpperCase()}
              </div>
              <div class="text-xs font-bold text-white truncate mt-0.5 group-hover:text-[#38BDF8] transition-colors">
                ${ev.event}
              </div>
              <div class="text-[11px] text-slate-300 truncate mt-0.5">
                ${ev.talk}
              </div>
            </div>
            <span class="h-7 w-7 rounded-full flex items-center justify-center bg-white/[0.06] group-hover:bg-[#38BDF8]/20 text-slate-300 group-hover:text-white text-xs shrink-0">
              →
            </span>
          </button>
        `
        )
        .join('');

      eventsListEl
        .querySelectorAll<HTMLButtonElement>('[data-city-event-id]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const evId = btn.dataset.cityEventId;
            if (evId) this.openEventDrawer(evId);
          });
        });
    }

    if (photosContentEl) {
      const allPhotos = city.events.flatMap((e) =>
        e.photos.map((p) => ({ photo: p, event: e.event, date: e.date }))
      );
      if (allPhotos.length > 0) {
        photosContentEl.innerHTML = `<div class="grid grid-cols-2 gap-2">${allPhotos
          .map(
            (item) =>
              `<img src="${withBase(item.photo)}" alt="${item.event}" class="rounded-lg border border-white/15 object-cover aspect-video w-full"/>`
          )
          .join('')}</div>`;
      } else {
        photosContentEl.innerHTML = `
          <div class="rounded-xl p-3.5 bg-slate-900/60 border border-white/10 text-slate-300">
            <p class="font-semibold text-white">Verified Event Archive (${city.eventsCount} ${city.eventsCount === 1 ? 'session' : 'sessions'})</p>
            <p class="mt-1 text-[11px] text-slate-400">
              Stage photography for ${city.city}, ${city.country} is not yet attached in <code>data/events.json</code>. Only authentic repository photos are displayed.
            </p>
          </div>
        `;
      }
    }

    if (aboutContentEl) {
      const allTopics = Array.from(
        new Set(city.events.flatMap((e) => e.topics))
      ).slice(0, 8);

      aboutContentEl.innerHTML = `
        <div class="rounded-xl p-3 bg-slate-900/60 border border-white/10 space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-400">Region:</span>
            <strong class="text-white">${city.regionName}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Coordinates:</span>
            <strong class="font-mono text-white">${city.lat.toFixed(4)}°N, ${city.lon.toFixed(4)}°E</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-400">Active Years:</span>
            <strong class="font-mono text-white">${city.years.join(', ')}</strong>
          </div>
          ${
            city.note
              ? `<p class="pt-1.5 border-t border-white/10 text-[11px] text-[#38BDF8]">${city.note}</p>`
              : ''
          }
        </div>
        <div class="pt-1">
          <div class="font-mono text-[9px] tracking-widest uppercase text-slate-400 mb-1.5">TOPICS PRESENTED IN ${city.city.toUpperCase()}</div>
          <div class="flex flex-wrap gap-1">
            ${allTopics
              .map(
                (t) =>
                  `<span class="rounded-full px-2 py-0.5 font-mono text-[10px] bg-white/10 text-slate-200">${t}</span>`
              )
              .join('')}
          </div>
        </div>
      `;
    }
  }

  private setCityTab(tab: 'talks' | 'photos' | 'about'): void {
    this.activeCityTab = tab;
    const tabs: Array<'talks' | 'photos' | 'about'> = ['talks', 'photos', 'about'];
    tabs.forEach((t) => {
      const btn = document.getElementById(`city-tab-btn-${t}`);
      const content = document.getElementById(`city-tab-content-${t}`);
      if (t === tab) {
        btn?.classList.add('text-white', 'border-[#38BDF8]');
        btn?.classList.remove('text-slate-400', 'border-transparent');
        content?.classList.remove('hidden');
      } else {
        btn?.classList.remove('text-white', 'border-[#38BDF8]');
        btn?.classList.add('text-slate-400', 'border-transparent');
        content?.classList.add('hidden');
      }
    });
  }

  public selectYear(year: string): void {
    this.activeYear = year;
    this.globe.applyFilters({ year });

    document.querySelectorAll<HTMLButtonElement>('[data-action="select-year"]').forEach((btn) => {
      const isSelected = btn.dataset.year === year;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      if (isSelected) {
        btn.classList.add(
          'bg-[#1D4ED8]/55',
          'text-white',
          'border-[#38BDF8]/70',
          'font-semibold'
        );
        btn.classList.remove('bg-white/[0.04]', 'text-slate-300', 'border-white/10');
      } else {
        btn.classList.remove(
          'bg-[#1D4ED8]/55',
          'text-white',
          'border-[#38BDF8]/70',
          'font-semibold'
        );
        btn.classList.add('bg-white/[0.04]', 'text-slate-300', 'border-white/10');
      }
    });

    const narrativeEl = document.getElementById('timeline-era-narrative');
    if (narrativeEl) {
      narrativeEl.textContent = ERA_NARRATIVES[year] ?? ERA_NARRATIVES.all;
    }

    this.filterTimelineStrip();
    this.syncBodyAttributes();
  }

  public selectTopic(topic: TopicCategoryId | 'all'): void {
    this.activeTopic = topic;
    this.globe.applyFilters({ topic });

    document.querySelectorAll<HTMLElement>('[data-action="select-topic"]').forEach((btn) => {
      const isSelected = btn.dataset.topic === topic && topic !== 'all';
      if (btn.dataset.topic !== 'all') {
        if (isSelected) {
          btn.classList.add('border-[#38BDF8]', 'bg-[#1D4ED8]/25');
          btn.classList.remove('border-white/10', 'bg-slate-900/70');
        } else {
          btn.classList.remove('border-[#38BDF8]', 'bg-[#1D4ED8]/25');
          btn.classList.add('border-white/10', 'bg-slate-900/70');
        }
      }
    });

    this.filterTimelineStrip();
    this.syncBodyAttributes();
  }

  private filterTimelineStrip(): void {
    const cards = document.querySelectorAll<HTMLElement>('[data-timeline-card]');
    cards.forEach((card) => {
      const cardYear = card.dataset.year ?? '';
      const cardTopics = (card.dataset.topics ?? '').split(',');
      const yearMatch = this.activeYear === 'all' || cardYear === this.activeYear;
      const topicMatch =
        this.activeTopic === 'all' || cardTopics.includes(this.activeTopic);

      if (yearMatch && topicMatch) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  public openEventDrawer(eventId: string): void {
    const ev = this.atlas.events.find((e) => e.id === eventId);
    if (!ev) return;

    this.closeArchiveInternal();

    if (!ev.isOnline && ev.locationId) {
      this.selectCity(ev.locationId);
    }

    this.populateEventDrawerDOM(ev);

    const drawer = document.getElementById('signal-drawer');
    const backdrop = document.getElementById('signal-drawer-backdrop');
    drawer?.classList.remove('hidden');
    drawer?.setAttribute('aria-hidden', 'false');
    backdrop?.classList.remove('hidden');
    backdrop?.setAttribute('aria-hidden', 'false');
  }

  private populateEventDrawerDOM(ev: EnrichedSpeakingEvent): void {
    const typeEl = document.getElementById('drawer-type');
    const dateEl = document.getElementById('drawer-date');
    const locEl = document.getElementById('drawer-location');
    const coordsEl = document.getElementById('drawer-coords');
    const eventEl = document.getElementById('drawer-event');
    const titleEl = document.getElementById('signal-drawer-title');
    const clustersEl = document.getElementById('drawer-clusters');
    const summaryEl = document.getElementById('drawer-summary');
    const linksEl = document.getElementById('drawer-links');
    const photosWrapper = document.getElementById('drawer-photos-wrapper');
    const photosGrid = document.getElementById('drawer-photos-grid');
    const inspectCityBtn = document.getElementById('drawer-inspect-city-btn');
    const connectedEl = document.getElementById('drawer-connected');

    if (typeEl) typeEl.textContent = ev.sessionType.toUpperCase();
    if (dateEl) dateEl.textContent = formatSignalDate(ev.date);
    if (locEl) locEl.textContent = `${ev.flag} ${ev.city}`;
    if (coordsEl) {
      coordsEl.textContent =
        ev.lat !== null && ev.lon !== null
          ? `${ev.lat.toFixed(4)}°N, ${ev.lon.toFixed(4)}°E`
          : 'Online Broadcast';
    }
    if (eventEl) eventEl.textContent = ev.event;
    if (titleEl) titleEl.textContent = ev.talk;
    if (summaryEl) summaryEl.textContent = ev.description;

    if (clustersEl) {
      clustersEl.innerHTML = ev.topics
        .map(
          (t) =>
            `<span class="rounded-full px-3 py-1 font-mono text-[10px] tracking-wider uppercase bg-white/10 text-slate-200 border border-white/15">${t}</span>`
        )
        .join('');
    }

    if (photosWrapper && photosGrid) {
      if (ev.photos && ev.photos.length > 0) {
        photosWrapper.classList.remove('hidden');
        photosGrid.innerHTML = ev.photos
          .map(
            (p) =>
              `<img src="${withBase(p)}" alt="${ev.event}" class="w-full rounded-xl border border-white/15 object-cover"/>`
          )
          .join('');
      } else {
        photosWrapper.classList.add('hidden');
        photosGrid.innerHTML = '';
      }
    }

    if (linksEl) {
      const linkItems: string[] = [];
      if (ev.eventUrl) {
        linkItems.push(
          `<a href="${ev.eventUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 px-3.5 py-2 text-xs font-medium text-white transition-colors">Event Page ↗</a>`
        );
      }
      if (ev.slidesUrl) {
        linkItems.push(
          `<a href="${ev.slidesUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors">View Slides ↗</a>`
        );
      }
      if (ev.recordingUrl) {
        linkItems.push(
          `<a href="${ev.recordingUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors">Watch Recording ↗</a>`
        );
      }
      if (ev.linkedinUrl) {
        linkItems.push(
          `<a href="${ev.linkedinUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors">LinkedIn Post ↗</a>`
        );
      }
      linksEl.innerHTML = linkItems.join('');
    }

    if (inspectCityBtn) {
      if (ev.locationId) {
        inspectCityBtn.classList.remove('hidden');
        inspectCityBtn.textContent = `Inspect ${ev.cityName} on Globe →`;
        inspectCityBtn.onclick = () => {
          this.closeEventDrawer();
          this.selectCity(ev.locationId);
        };
      } else {
        inspectCityBtn.classList.add('hidden');
      }
    }

    if (connectedEl) {
      const related = this.atlas.events
        .filter(
          (other) =>
            other.id !== ev.id &&
            ((ev.locationId && other.locationId === ev.locationId) ||
              other.regionId === ev.regionId)
        )
        .slice(0, 4);

      connectedEl.innerHTML = related
        .map(
          (item) => `
          <button
            type="button"
            data-connected-event="${item.id}"
            class="flex items-center justify-between gap-3 rounded-xl p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-[#38BDF8]/40 text-left transition-all cursor-pointer"
          >
            <div class="min-w-0">
              <div class="font-mono text-[10px] text-[#38BDF8] uppercase">${formatSignalDate(item.date)} · ${item.flag} ${item.city}</div>
              <div class="text-xs font-semibold text-white truncate mt-0.5">${item.talk}</div>
              <div class="text-[11px] text-slate-400 truncate">${item.event}</div>
            </div>
            <span class="text-slate-400 text-xs shrink-0">→</span>
          </button>
        `
        )
        .join('');

      connectedEl
        .querySelectorAll<HTMLButtonElement>('[data-connected-event]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const targetId = btn.dataset.connectedEvent;
            if (targetId) this.openEventDrawer(targetId);
          });
        });
    }
  }

  public closeEventDrawer(): void {
    const drawer = document.getElementById('signal-drawer');
    const backdrop = document.getElementById('signal-drawer-backdrop');
    drawer?.classList.add('hidden');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.add('hidden');
    backdrop?.setAttribute('aria-hidden', 'true');
  }

  public openArchive(options?: { cityId?: string; topicId?: string }): void {
    this.closeEventDrawer();
    this.closeAboutModal();

    if (options?.cityId) {
      this.archiveCity = options.cityId;
      const citySelect = document.getElementById(
        'archive-city-select'
      ) as HTMLSelectElement | null;
      if (citySelect) citySelect.value = options.cityId;
    }

    if (options?.topicId) {
      this.archiveCluster = options.topicId;
      const clusterSelect = document.getElementById(
        'archive-cluster-select'
      ) as HTMLSelectElement | null;
      if (clusterSelect) clusterSelect.value = options.topicId;
    }

    this.filterArchiveMatrix();

    const modal = document.getElementById('archive-matrix-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
    modal?.setAttribute('aria-hidden', 'false');

    this.globe.setPaused(true);

    const searchInput = document.getElementById(
      'archive-search-input'
    ) as HTMLInputElement | null;
    searchInput?.focus();
  }

  private closeArchiveInternal(): void {
    const modal = document.getElementById('archive-matrix-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    modal?.setAttribute('aria-hidden', 'true');
  }

  public closeArchive(): void {
    this.closeArchiveInternal();
    this.globe.setPaused(false);
  }

  public openAboutModal(): void {
    const modal = document.getElementById('about-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
    modal?.setAttribute('aria-hidden', 'false');
  }

  public closeAboutModal(): void {
    const modal = document.getElementById('about-modal');
    modal?.classList.add('hidden');
    modal?.classList.remove('flex');
    modal?.setAttribute('aria-hidden', 'true');
  }

  private filterArchiveMatrix(): void {
    const rows = document.querySelectorAll<HTMLElement>('[data-archive-row]');
    const counterEl = document.getElementById('archive-result-counter');
    const emptyEl = document.getElementById('archive-empty-state');

    const q = this.archiveQuery.trim().toLowerCase();
    let visibleCount = 0;
    const visibleCities = new Set<string>();

    rows.forEach((row) => {
      const searchBlob = (row.dataset.search ?? '').toLowerCase();
      const rowType = row.dataset.type ?? '';
      const rowClusters = (row.dataset.clusters ?? '').split(',');
      const rowYear = row.dataset.year ?? '';
      const rowCityId = row.dataset.cityId ?? '';

      const matchesSearch = !q || searchBlob.includes(q);
      const matchesCluster =
        this.archiveCluster === 'all' || rowClusters.includes(this.archiveCluster);
      const matchesType =
        this.archiveType === 'all' ||
        rowType.toLowerCase() === this.archiveType.toLowerCase();
      const matchesYear =
        this.archiveYear === 'all' || rowYear === this.archiveYear;
      const matchesCity =
        this.archiveCity === 'all' || rowCityId === this.archiveCity;

      const isVisible =
        matchesSearch &&
        matchesCluster &&
        matchesType &&
        matchesYear &&
        matchesCity;

      if (isVisible) {
        row.classList.remove('hidden');
        visibleCount += 1;
        if (rowCityId && rowCityId !== 'online') visibleCities.add(rowCityId);
      } else {
        row.classList.add('hidden');
      }
    });

    if (counterEl) {
      counterEl.textContent = `Showing ${visibleCount} of ${this.atlas.events.length} talks (${visibleCities.size} physical cities matched)`;
    }

    if (emptyEl) {
      if (visibleCount === 0) {
        emptyEl.classList.remove('hidden');
      } else {
        emptyEl.classList.add('hidden');
      }
    }
  }

  private syncArchiveTypeButtons(selectedType: string): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>('[data-archive-type]');
    buttons.forEach((btn) => {
      const isMatch = btn.dataset.archiveType === selectedType;
      if (isMatch) {
        btn.classList.add('bg-[#38BDF8]/20', 'text-white', 'border-[#38BDF8]/50');
        btn.classList.remove('bg-white/[0.04]', 'text-slate-300', 'border-white/10');
      } else {
        btn.classList.remove('bg-[#38BDF8]/20', 'text-white', 'border-[#38BDF8]/50');
        btn.classList.add('bg-white/[0.04]', 'text-slate-300', 'border-white/10');
      }
    });
  }

  private bindEvents(): void {
    // 4-Mode View Selector Tabs (Globe · Regions · Timeline · Topics)
    document.querySelectorAll<HTMLButtonElement>('[data-view-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = (btn.dataset.viewMode ?? 'globe') as AtlasViewMode;
        this.setViewMode(mode);
      });
    });

    // Select City triggers (2D globe badges, prominent destination chips, region city pills)
    document.querySelectorAll<HTMLElement>('[data-action="select-city"]').forEach((el) => {
      el.addEventListener('click', () => {
        const cid = el.dataset.cityId ?? null;
        this.selectCity(cid);
      });
    });

    // City selector dropdown
    const cityDropdown = document.getElementById(
      'city-selector-dropdown'
    ) as HTMLSelectElement | null;
    cityDropdown?.addEventListener('change', () => {
      this.selectCity(cityDropdown.value || null);
    });

    // Reset City / View All Destinations
    document
      .querySelectorAll<HTMLElement>('[data-action="reset-city"], [data-action="reset-atlas"], [data-action="focus-globe"]')
      .forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.selectYear('all');
          this.selectTopic('all');
          this.selectCity(null);
        });
      });

    // Explore the world CTA -> selects Istanbul hub (or focuses globe) to demonstrate city inspection immediately
    document.querySelectorAll<HTMLElement>('[data-action="explore-world"]').forEach((el) => {
      el.addEventListener('click', () => {
        this.selectCity('istanbul-tr');
      });
    });

    // City Panel Sub-Tabs (TALKS | PHOTOS | ABOUT)
    document.querySelectorAll<HTMLButtonElement>('[data-city-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn.dataset.cityTab ?? 'talks') as 'talks' | 'photos' | 'about';
        this.setCityTab(tab);
      });
    });

    // Globe camera zoom & motion controls
    document.querySelectorAll<HTMLElement>('[data-action="globe-zoom-in"]').forEach((btn) => {
      btn.addEventListener('click', () => this.globe.zoomBy(0.82));
    });
    document.querySelectorAll<HTMLElement>('[data-action="globe-zoom-out"]').forEach((btn) => {
      btn.addEventListener('click', () => this.globe.zoomBy(1.22));
    });

    const motionBtn = document.getElementById('toggle-motion-btn');
    motionBtn?.addEventListener('click', () => {
      const nextReduced = !this.globe.isMotionPaused();
      this.globe.setMotionReduced(nextReduced);
      motionBtn.setAttribute('aria-pressed', nextReduced ? 'true' : 'false');
      motionBtn.textContent = nextReduced ? 'Resume motion' : 'Pause motion';
    });

    // Year filter buttons
    document.querySelectorAll<HTMLElement>('[data-action="select-year"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const yr = btn.dataset.year ?? 'all';
        this.selectYear(yr);
      });
    });

    // Topic filter cards
    document.querySelectorAll<HTMLElement>('[data-action="select-topic"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topic = (btn.dataset.topic ?? 'all') as TopicCategoryId | 'all';
        this.selectTopic(topic);
      });
    });

    // Region filter headers
    document.querySelectorAll<HTMLElement>('[data-action="filter-region"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const regId = btn.dataset.regionId ?? 'all';
        this.activeRegion = regId;
        this.globe.applyFilters({ region: regId });
      });
    });

    // Timeline cards & overview recent event triggers
    document.querySelectorAll<HTMLElement>('[data-timeline-card], [data-action="open-event"]').forEach((card) => {
      card.addEventListener('click', () => {
        const evId = card.dataset.eventId;
        if (evId) this.openEventDrawer(evId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const evId = card.dataset.eventId;
          if (evId) this.openEventDrawer(evId);
        }
      });
    });

    // Timeline horizontal scroll arrows
    const track = document.getElementById('timeline-cards-track');
    document.getElementById('timeline-scroll-prev')?.addEventListener('click', () => {
      track?.scrollBy({ left: -360, behavior: 'smooth' });
    });
    document.getElementById('timeline-scroll-next')?.addEventListener('click', () => {
      track?.scrollBy({ left: 360, behavior: 'smooth' });
    });

    // Archive Matrix open/close triggers
    document.querySelectorAll<HTMLElement>('[data-action="open-archive"]').forEach((el) => {
      el.addEventListener('click', () => this.openArchive());
    });
    document.querySelectorAll<HTMLElement>('[data-action="close-archive"]').forEach((el) => {
      el.addEventListener('click', () => this.closeArchive());
    });

    // Drawer & About modal triggers
    document.querySelectorAll<HTMLElement>('[data-action="close-drawer"]').forEach((el) => {
      el.addEventListener('click', () => this.closeEventDrawer());
    });
    document.querySelectorAll<HTMLElement>('[data-action="open-about"]').forEach((el) => {
      el.addEventListener('click', () => this.openAboutModal());
    });
    document.querySelectorAll<HTMLElement>('[data-action="close-about"]').forEach((el) => {
      el.addEventListener('click', () => this.closeAboutModal());
    });

    // Archive Matrix search & filter inputs
    const searchInput = document.getElementById(
      'archive-search-input'
    ) as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => {
      this.archiveQuery = searchInput.value;
      this.filterArchiveMatrix();
    });

    const clusterSelect = document.getElementById(
      'archive-cluster-select'
    ) as HTMLSelectElement | null;
    clusterSelect?.addEventListener('change', () => {
      this.archiveCluster = clusterSelect.value;
      this.filterArchiveMatrix();
    });

    const typeSelect = document.getElementById(
      'archive-type-select'
    ) as HTMLSelectElement | null;
    typeSelect?.addEventListener('change', () => {
      this.archiveType = typeSelect.value;
      this.syncArchiveTypeButtons(this.archiveType);
      this.filterArchiveMatrix();
    });

    document.querySelectorAll<HTMLButtonElement>('[data-archive-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.archiveType ?? 'all';
        this.archiveType = t;
        if (typeSelect) typeSelect.value = t;
        this.syncArchiveTypeButtons(t);
        this.filterArchiveMatrix();
      });
    });

    const yearSelect = document.getElementById(
      'archive-year-select'
    ) as HTMLSelectElement | null;
    yearSelect?.addEventListener('change', () => {
      this.archiveYear = yearSelect.value;
      this.filterArchiveMatrix();
    });

    const citySelect = document.getElementById(
      'archive-city-select'
    ) as HTMLSelectElement | null;
    citySelect?.addEventListener('change', () => {
      this.archiveCity = citySelect.value;
      this.filterArchiveMatrix();
    });

    const resetBtn = document.getElementById('archive-reset-filters-btn');
    resetBtn?.addEventListener('click', () => {
      this.archiveQuery = '';
      this.archiveCluster = 'all';
      this.archiveType = 'all';
      this.archiveYear = 'all';
      this.archiveCity = 'all';
      if (searchInput) searchInput.value = '';
      if (clusterSelect) clusterSelect.value = 'all';
      if (typeSelect) typeSelect.value = 'all';
      if (yearSelect) yearSelect.value = 'all';
      if (citySelect) citySelect.value = 'all';
      this.syncArchiveTypeButtons('all');
      this.filterArchiveMatrix();
    });

    document.querySelectorAll<HTMLElement>('[data-archive-row]').forEach((row) => {
      row.addEventListener('click', () => {
        const evId = row.dataset.eventId;
        if (evId) this.openEventDrawer(evId);
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const evId = row.dataset.eventId;
          if (evId) this.openEventDrawer(evId);
        }
      });
    });

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const archiveModal = document.getElementById('archive-matrix-modal');
        if (archiveModal && !archiveModal.classList.contains('hidden')) {
          this.closeArchive();
        } else {
          this.openArchive();
        }
        return;
      }

      if (e.key === 'Escape') {
        const aboutModal = document.getElementById('about-modal');
        if (aboutModal && !aboutModal.classList.contains('hidden')) {
          this.closeAboutModal();
          return;
        }
        const drawer = document.getElementById('signal-drawer');
        if (drawer && !drawer.classList.contains('hidden')) {
          this.closeEventDrawer();
          return;
        }
        const archiveModal = document.getElementById('archive-matrix-modal');
        if (archiveModal && !archiveModal.classList.contains('hidden')) {
          this.closeArchive();
          return;
        }
        if (this.selectedCityId) {
          this.selectCity(null);
        }
      }
    });
  }
}

export function initSpeakingAtlasApp(
  atlas: SpeakingAtlasData,
  landGeoJson: unknown
): void {
  const globeContainer = document.getElementById('orbit-canvas-container');
  if (!globeContainer) return;

  let controllerRef: SpeakingAtlasController | null = null;
  const globe = new EarthGlobeController(globeContainer, atlas, landGeoJson, {
    onSelectCity: (cityId) => {
      controllerRef?.selectCity(cityId);
    },
  });

  controllerRef = new SpeakingAtlasController(atlas, globe);
  window.__earthGlobe = globe;
  window.__atlasController = controllerRef;
}
