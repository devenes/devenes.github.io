import type {
  CityDestination,
  EnrichedSpeakingEvent,
  SpeakingAtlasData,
  TopicCategoryId,
} from '../utils/geography';
import { formatCoordinates, formatSignalDate, withBase } from '../utils/paths';
import { EarthGlobeController } from './earthGlobe';

export type AtlasViewMode = 'globe' | 'regions' | 'timeline' | 'topics';
type NavLinkId = 'home' | 'talks' | 'about';

declare global {
  interface Window {
    __earthGlobe?: EarthGlobeController;
    __atlasController?: SpeakingAtlasController;
  }
}

const ERA_NARRATIVES: Record<string, string> = {
  '2026':
    '2026 — Hands-on workshops on clinical AI agent design, Kubernetes for AI workloads, and SRE practices.',
  '2025':
    '2025 — Multi-agent workflows with ADK and Vertex AI alongside production GKE platform sessions.',
  '2024':
    '2024 — Running ML workloads on containers, MLOps pipelines, and multi-cluster GKE architectures.',
  '2023':
    '2023 — Deep dives into Kubernetes scheduler internals, Knative serverless, and cloud foundations.',
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
    this.updateTimelineScrollButtons();
    this.applyHashRoute(window.location.hash);
  }

  private getEraNarrative(year: string): string {
    if (year !== 'all' && ERA_NARRATIVES[year]) {
      return ERA_NARRATIVES[year];
    }
    return `${this.atlas.metrics.totalTalks} sessions from 2023 to 2026 across cloud architecture, GKE internals, and multi-agent AI systems.`;
  }

  private syncBodyAttributes(): void {
    document.body.dataset.viewMode = this.viewMode;
    document.body.dataset.selectedCity = this.selectedCityId ?? '';
    document.body.dataset.cityTab = this.activeCityTab;
    document.body.dataset.region = this.activeRegion;
    document.body.dataset.year = this.activeYear;
    document.body.dataset.topic = this.activeTopic;
  }

  private setActiveNavLink(navId: NavLinkId): void {
    document.querySelectorAll<HTMLButtonElement>('[data-nav-link]').forEach((btn) => {
      const isMatch = btn.dataset.navLink === navId;
      if (isMatch) {
        btn.setAttribute('aria-current', 'page');
        btn.classList.add('text-[#F4F1EA]', 'border-[#E2A84B]');
        btn.classList.remove('text-[#A39E93]', 'border-transparent');
      } else {
        btn.removeAttribute('aria-current');
        btn.classList.remove('text-[#F4F1EA]', 'border-[#E2A84B]');
        btn.classList.add('text-[#A39E93]', 'border-transparent');
      }
    });
  }

  private isDialogOpen(id: string): boolean {
    const dialog = document.getElementById(id) as HTMLDialogElement | null;
    if (!dialog) return false;
    return Boolean(dialog.open) || dialog.getAttribute('aria-hidden') === 'false';
  }

  private syncGlobeDialogPauseState(): void {
    const anyModalOpen =
      this.isDialogOpen('signal-drawer') ||
      this.isDialogOpen('archive-matrix-modal') ||
      this.isDialogOpen('about-modal');
    this.globe.setPaused(anyModalOpen);
  }

  private openDialogElement(
    dialog: HTMLDialogElement | null,
    useFlexLayout = false
  ): void {
    if (!dialog) return;
    if (useFlexLayout) {
      dialog.classList.add('flex');
    }
    dialog.setAttribute('aria-hidden', 'false');
    if (!dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    }
    this.syncGlobeDialogPauseState();
  }

  private closeDialogElement(dialog: HTMLDialogElement | null): void {
    if (!dialog) return;
    dialog.classList.remove('flex');
    dialog.setAttribute('aria-hidden', 'true');
    if (dialog.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      } else {
        dialog.removeAttribute('open');
      }
    }
    this.syncGlobeDialogPauseState();
  }

  private setUrlHash(hashValue: string | null): void {
    if (typeof window === 'undefined' || !window.history?.replaceState) return;
    const baseUrl = `${window.location.pathname}${window.location.search}`;
    const targetUrl = hashValue ? `${baseUrl}#${encodeURIComponent(hashValue)}` : baseUrl;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetUrl) {
      window.history.replaceState(null, '', targetUrl);
    }
  }

  public applyHashRoute(rawHash: string): void {
    const cleaned = decodeURIComponent(rawHash.replace(/^#/, '').trim());
    if (!cleaned || cleaned === 'main-content') return;

    const matchedEvent = this.atlas.events.find((e) => e.id === cleaned);
    if (matchedEvent) {
      this.openEventDrawer(matchedEvent.id);
      return;
    }

    const matchedCity = this.atlas.cities.find((c) => c.id === cleaned);
    if (matchedCity) {
      this.selectCity(matchedCity.id);
    }
  }

  private setPanelHidden(
    el: HTMLElement | null,
    isHidden: boolean,
    flexWhenVisible = false
  ): void {
    if (!el) return;
    el.hidden = isHidden;
    el.classList.toggle('hidden', isHidden);
    if (flexWhenVisible) {
      el.classList.toggle('flex', !isHidden);
    }
  }

  public setViewMode(mode: AtlasViewMode): void {
    this.viewMode = mode;

    document.querySelectorAll<HTMLButtonElement>('[data-view-mode]').forEach((btn) => {
      const isSelected = btn.dataset.viewMode === mode;
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    const overviewEl = document.getElementById('city-overview-state');
    const selectedCityEl = document.getElementById('selected-city-panel');
    const regionsEl = document.getElementById('view-panel-regions');
    const timelineEl = document.getElementById('view-panel-timeline');
    const topicsEl = document.getElementById('view-panel-topics');

    this.setPanelHidden(overviewEl, !(mode === 'globe' && !this.selectedCityId));
    this.setPanelHidden(selectedCityEl, !(mode === 'globe' && Boolean(this.selectedCityId)), true);
    this.setPanelHidden(regionsEl, mode !== 'regions');
    this.setPanelHidden(timelineEl, mode !== 'timeline');
    this.setPanelHidden(topicsEl, mode !== 'topics');

    this.syncBodyAttributes();
    this.globe.invalidatePanelRects();
  }

  public selectCity(cityId: string | null): void {
    if (!cityId) {
      this.selectedCityId = null;
      this.activeRegion = 'all';
      this.syncRegionCards();
      const dropdown = document.getElementById(
        'city-selector-dropdown'
      ) as HTMLSelectElement | null;
      if (dropdown) dropdown.value = '';
      this.globe.applyFilters({ region: 'all' });
      this.globe.focusOnCity(null);
      this.setViewMode('globe');
      if (!this.isDialogOpen('signal-drawer')) {
        this.setUrlHash(null);
      }
      this.globe.invalidatePanelRects();
      return;
    }

    const city = this.atlas.cities.find((c) => c.id === cityId);
    if (!city) return;

    this.selectedCityId = city.id;
    if (this.activeRegion !== 'all' && this.activeRegion !== city.regionId) {
      this.activeRegion = 'all';
      this.syncRegionCards();
      this.globe.applyFilters({ region: 'all' });
    }

    const dropdown = document.getElementById(
      'city-selector-dropdown'
    ) as HTMLSelectElement | null;
    if (dropdown) dropdown.value = city.id;

    this.populateSelectedCityPanel(city);
    this.setCityTab('talks');
    this.setViewMode('globe');
    this.globe.focusOnCity(city.id);
    this.syncBodyAttributes();
    if (!this.isDialogOpen('signal-drawer')) {
      this.setUrlHash(city.id);
    }
    this.globe.invalidatePanelRects();
  }

  public selectRegion(regionId: string): void {
    const nextRegion =
      this.activeRegion === regionId && regionId !== 'all' ? 'all' : regionId;
    this.activeRegion = nextRegion;
    this.syncRegionCards();
    this.globe.applyFilters({ region: nextRegion });
    this.syncBodyAttributes();
  }

  private syncRegionCards(): void {
    document
      .querySelectorAll<HTMLElement>('[data-action="filter-region"]')
      .forEach((btn) => {
        const regId = btn.dataset.regionId ?? 'all';
        const isSelected = regId === this.activeRegion && this.activeRegion !== 'all';
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      });

    document.querySelectorAll<HTMLElement>('[data-region-card]').forEach((card) => {
      const regId = card.dataset.regionCard ?? '';
      const isSelected = regId === this.activeRegion && this.activeRegion !== 'all';
      if (isSelected) {
        card.classList.add('border-[#E2A84B]/60', 'bg-[#22262D]/85');
        card.classList.remove('border-[#F4F1EA]/12', 'bg-[#181B20]/75');
      } else {
        card.classList.remove('border-[#E2A84B]/60', 'bg-[#22262D]/85');
        card.classList.add('border-[#F4F1EA]/12', 'bg-[#181B20]/75');
      }
    });
  }

  private populateSelectedCityPanel(city: CityDestination): void {
    const nameEl = document.getElementById('selected-city-name');
    const countryEl = document.getElementById('selected-city-country');
    const regionBadgeEl = document.getElementById('selected-city-region-badge');
    const coordsEl = document.getElementById('selected-city-coords');
    const countEl = document.getElementById('selected-city-talks-count');
    const eventsListEl = document.getElementById('selected-city-events-list');
    const photosTabBtn = document.getElementById('city-tab-btn-photos');
    const photosContentEl = document.getElementById('selected-city-photos-content');
    const aboutContentEl = document.getElementById('selected-city-about-content');
    const archiveBtn = document.getElementById('selected-city-archive-btn');

    if (nameEl) nameEl.textContent = city.city;
    if (countryEl) {
      countryEl.innerHTML = `<span>${escapeHtml(city.flag)}</span><span>${escapeHtml(city.country)}</span>`;
    }
    if (regionBadgeEl) {
      if (city.isBaseHub) {
        regionBadgeEl.textContent = 'Home base';
      } else if (city.regionName.toLowerCase() === city.country.toLowerCase()) {
        regionBadgeEl.textContent =
          city.years.length > 1
            ? `${city.years[city.years.length - 1]}–${city.years[0]}`
            : city.years[0] ?? 'Speaking stop';
      } else {
        regionBadgeEl.textContent = city.regionName;
      }
    }
    if (coordsEl) {
      coordsEl.textContent = formatCoordinates(city.lat, city.lon, 2);
    }
    if (countEl) {
      countEl.textContent = `${city.eventsCount} ${city.eventsCount === 1 ? 'talk' : 'talks'}`;
    }
    if (archiveBtn) {
      archiveBtn.textContent = `View all talks in ${city.city} →`;
      archiveBtn.onclick = () => {
        this.openArchive({ cityId: city.id });
      };
    }

    if (eventsListEl) {
      eventsListEl.innerHTML = city.events
        .map((ev) => {
          const formatLabel =
            ev.sessionType === 'keynote'
              ? 'Keynote'
              : ev.sessionType === 'workshop'
                ? 'Workshop'
                : 'Talk';
          return `
          <button
            type="button"
            data-city-event-id="${escapeHtml(ev.id)}"
            data-testid="city-event-item-${escapeHtml(ev.id)}"
            class="w-full group flex items-center justify-between gap-3 rounded-lg p-2.5 bg-[#181B20]/80 hover:bg-[#22262D] border border-[#F4F1EA]/10 hover:border-[#E2A84B]/50 text-left transition-colors cursor-pointer"
          >
            <div class="min-w-0 flex-1">
              <div class="font-mono text-[0.6875rem] text-[#9C978C]">
                ${escapeHtml(formatSignalDate(ev.date))} · <span class="font-sans text-[#E2A84B]">${escapeHtml(formatLabel)}</span>
              </div>
              <div class="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5 group-hover:text-white transition-colors">
                ${escapeHtml(ev.talk)}
              </div>
              <div class="text-xs text-[#9C978C] truncate mt-0.5">
                ${escapeHtml(ev.event)}
              </div>
            </div>
            <span class="text-[#9C978C] group-hover:text-[#F4F1EA] text-xs shrink-0" aria-hidden="true">
              →
            </span>
          </button>
        `;
        })
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

    const allPhotos = city.events.flatMap((e) =>
      e.photos.map((p) => ({ photo: p, event: e.event, date: e.date }))
    );

    if (allPhotos.length > 0) {
      if (photosTabBtn) {
        photosTabBtn.hidden = false;
        photosTabBtn.classList.remove('hidden');
      }
      if (photosContentEl) {
        photosContentEl.innerHTML = `<div class="grid grid-cols-2 gap-2">${allPhotos
          .map(
            (item) =>
              `<img src="${escapeHtml(withBase(item.photo))}" alt="${escapeHtml(item.event)}" loading="lazy" decoding="async" class="rounded-lg border border-[#F4F1EA]/15 object-cover aspect-video w-full"/>`
          )
          .join('')}</div>`;
      }
    } else {
      if (photosTabBtn) {
        photosTabBtn.hidden = true;
        photosTabBtn.classList.add('hidden');
      }
      if (photosContentEl) {
        photosContentEl.innerHTML = '';
      }
      if (this.activeCityTab === 'photos') {
        this.activeCityTab = 'talks';
      }
    }

    if (aboutContentEl) {
      const allTopics = Array.from(
        new Set(city.events.flatMap((e) => e.topics))
      ).slice(0, 8);

      aboutContentEl.innerHTML = `
        <div class="rounded-lg p-3 bg-[#181B20]/75 border border-[#F4F1EA]/10 space-y-1.5">
          <div class="flex justify-between gap-2">
            <span class="text-[#9C978C]">Region</span>
            <strong class="font-medium text-[#F4F1EA]">${escapeHtml(city.regionName)}</strong>
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-[#9C978C]">Coordinates</span>
            <strong class="font-mono font-normal text-[#F4F1EA] tabular-nums">${escapeHtml(formatCoordinates(city.lat, city.lon, 4))}</strong>
          </div>
          <div class="flex justify-between gap-2">
            <span class="text-[#9C978C]">Years visited</span>
            <strong class="font-mono font-normal text-[#F4F1EA] tabular-nums">${escapeHtml(city.years.join(', '))}</strong>
          </div>
          ${
            city.note
              ? `<p class="pt-1.5 border-t border-[#F4F1EA]/10 text-xs text-[#E2A84B]">${escapeHtml(city.note)}</p>`
              : ''
          }
        </div>
        <div class="pt-1">
          <div class="text-xs font-medium text-[#9C978C] mb-1.5">Topics covered in ${escapeHtml(city.city)}</div>
          <div class="flex flex-wrap gap-1">
            ${allTopics
              .map(
                (t) =>
                  `<span class="rounded px-2 py-0.5 text-xs bg-[#181B20] text-[#C6C2B8] border border-[#F4F1EA]/10">${escapeHtml(t)}</span>`
              )
              .join('')}
          </div>
        </div>
      `;
    }
  }

  private setCityTab(tab: 'talks' | 'photos' | 'about'): void {
    const photosBtn = document.getElementById('city-tab-btn-photos');
    const safeTab =
      tab === 'photos' && (!photosBtn || photosBtn.hidden) ? 'talks' : tab;
    this.activeCityTab = safeTab;

    const tabs: Array<'talks' | 'photos' | 'about'> = ['talks', 'photos', 'about'];
    tabs.forEach((t) => {
      const btn = document.getElementById(`city-tab-btn-${t}`);
      const content = document.getElementById(`city-tab-content-${t}`);
      const isSelected = t === safeTab;
      btn?.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      this.setPanelHidden(content, !isSelected);
    });
    this.syncBodyAttributes();
    this.globe.invalidatePanelRects();
  }

  public selectYear(year: string): void {
    this.activeYear = year;
    this.globe.applyFilters({ year });

    document.querySelectorAll<HTMLButtonElement>('[data-action="select-year"]').forEach((btn) => {
      const isSelected = btn.dataset.year === year;
      btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    });

    const narrativeEl = document.getElementById('timeline-era-narrative');
    if (narrativeEl) {
      narrativeEl.textContent = this.getEraNarrative(year);
    }

    this.filterTimelineStrip();
    this.syncBodyAttributes();
  }

  public selectTopic(topic: TopicCategoryId | 'all'): void {
    const nextTopic =
      this.activeTopic === topic && topic !== 'all' ? 'all' : topic;
    this.activeTopic = nextTopic;
    this.globe.applyFilters({ topic: nextTopic });

    document.querySelectorAll<HTMLElement>('[data-action="select-topic"]').forEach((btn) => {
      const isSelected = btn.dataset.topic === nextTopic && nextTopic !== 'all';
      if (btn.dataset.topic !== 'all') {
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      }
    });

    const activeTopicPill = document.getElementById('active-topic-filter-pill');
    const activeTopicLabel = document.getElementById('active-topic-filter-label');
    if (activeTopicPill && activeTopicLabel) {
      if (nextTopic === 'all') {
        activeTopicPill.classList.add('hidden');
        activeTopicPill.classList.remove('inline-flex');
      } else {
        const topicMeta = this.atlas.topics.find((t) => t.id === nextTopic);
        activeTopicLabel.textContent = `Topic: ${topicMeta ? topicMeta.shortLabel : nextTopic}`;
        activeTopicPill.classList.remove('hidden');
        activeTopicPill.classList.add('inline-flex');
      }
    }

    this.filterTimelineStrip();
    this.syncBodyAttributes();
  }

  private filterTimelineStrip(): void {
    let visibleStripCount = 0;
    const cards = document.querySelectorAll<HTMLElement>('[data-timeline-card]');
    cards.forEach((card) => {
      const cardYear = card.dataset.year ?? '';
      const cardTopics = (card.dataset.topics ?? '').split(',');
      const yearMatch = this.activeYear === 'all' || cardYear === this.activeYear;
      const topicMatch =
        this.activeTopic === 'all' || cardTopics.includes(this.activeTopic);

      if (yearMatch && topicMatch) {
        card.classList.remove('hidden');
        visibleStripCount += 1;
      } else {
        card.classList.add('hidden');
      }
    });

    const stripEmptyEl = document.getElementById('timeline-strip-empty-state');
    if (stripEmptyEl) {
      if (visibleStripCount === 0) {
        stripEmptyEl.classList.remove('hidden');
        stripEmptyEl.classList.add('flex');
      } else {
        stripEmptyEl.classList.add('hidden');
        stripEmptyEl.classList.remove('flex');
      }
    }

    let visiblePanelCount = 0;
    const panelItems = document.querySelectorAll<HTMLElement>('[data-timeline-panel-item]');
    panelItems.forEach((item) => {
      const itemYear = item.dataset.year ?? '';
      const itemTopics = (item.dataset.topics ?? '').split(',');
      const yearMatch = this.activeYear === 'all' || itemYear === this.activeYear;
      const topicMatch =
        this.activeTopic === 'all' || itemTopics.includes(this.activeTopic);

      if (yearMatch && topicMatch) {
        item.classList.remove('hidden');
        visiblePanelCount += 1;
      } else {
        item.classList.add('hidden');
      }
    });

    const panelEmptyEl = document.getElementById('timeline-panel-empty-state');
    if (panelEmptyEl) {
      if (visiblePanelCount === 0) {
        panelEmptyEl.classList.remove('hidden');
      } else {
        panelEmptyEl.classList.add('hidden');
      }
    }

    const track = document.getElementById('timeline-cards-track');
    if (track) {
      track.scrollLeft = 0;
    }
    this.updateTimelineScrollButtons();
  }

  private updateTimelineScrollButtons(): void {
    const track = document.getElementById('timeline-cards-track');
    const prevBtn = document.getElementById('timeline-scroll-prev');
    const nextBtn = document.getElementById('timeline-scroll-next');
    if (!track) return;

    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth);
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft >= maxScrollLeft - 4;

    prevBtn?.setAttribute('aria-disabled', atStart ? 'true' : 'false');
    nextBtn?.setAttribute('aria-disabled', atEnd ? 'true' : 'false');
  }

  public openEventDrawer(eventId: string): void {
    const ev = this.atlas.events.find((e) => e.id === eventId);
    if (!ev) return;

    this.closeArchiveInternal();
    this.closeAboutModal();

    if (!ev.isOnline && ev.locationId) {
      this.selectCity(ev.locationId);
    }

    this.populateEventDrawerDOM(ev);

    const drawer = document.getElementById('signal-drawer') as HTMLDialogElement | null;
    this.openDialogElement(drawer, false);
    this.setUrlHash(ev.id);
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

    if (typeEl) typeEl.textContent = ev.sessionType;
    if (dateEl) dateEl.textContent = formatSignalDate(ev.date);
    if (locEl) locEl.textContent = `${ev.flag} ${ev.city}`;
    if (coordsEl) {
      coordsEl.textContent =
        ev.lat !== null && ev.lon !== null
          ? formatCoordinates(ev.lat, ev.lon, 4)
          : 'Online';
    }
    if (eventEl) eventEl.textContent = ev.event;
    if (titleEl) titleEl.textContent = ev.talk;
    if (summaryEl) summaryEl.textContent = ev.description;

    if (clustersEl) {
      clustersEl.innerHTML = ev.topics
        .map(
          (t) =>
            `<span class="rounded-md px-2.5 py-1 text-xs bg-[#181B20] text-[#C6C2B8] border border-[#F4F1EA]/12">${escapeHtml(t)}</span>`
        )
        .join('');
    }

    if (photosWrapper && photosGrid) {
      if (ev.photos && ev.photos.length > 0) {
        photosWrapper.classList.remove('hidden');
        photosGrid.innerHTML = ev.photos
          .map(
            (p) =>
              `<img src="${escapeHtml(withBase(p))}" alt="${escapeHtml(ev.event)}" loading="lazy" decoding="async" class="w-full rounded-lg border border-[#F4F1EA]/15 object-cover"/>`
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
          `<a href="${escapeHtml(ev.eventUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-md bg-[#F4F1EA] hover:bg-white px-3.5 py-2 text-xs font-semibold text-[#0B0C0E] transition-colors">Event page ↗</a>`
        );
      }
      if (ev.slidesUrl) {
        linkItems.push(
          `<a href="${escapeHtml(ev.slidesUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-md bg-[#181B20] hover:bg-[#22262D] border border-[#F4F1EA]/16 px-3.5 py-2 text-xs font-medium text-[#E6E2D8] transition-colors">Slides ↗</a>`
        );
      }
      if (ev.recordingUrl) {
        linkItems.push(
          `<a href="${escapeHtml(ev.recordingUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-md bg-[#181B20] hover:bg-[#22262D] border border-[#F4F1EA]/16 px-3.5 py-2 text-xs font-medium text-[#E6E2D8] transition-colors">Recording ↗</a>`
        );
      }
      if (ev.linkedinUrl) {
        linkItems.push(
          `<a href="${escapeHtml(ev.linkedinUrl)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-md bg-[#181B20] hover:bg-[#22262D] border border-[#F4F1EA]/16 px-3.5 py-2 text-xs font-medium text-[#E6E2D8] transition-colors">LinkedIn post ↗</a>`
        );
      }
      linksEl.innerHTML = linkItems.join('');
    }

    if (inspectCityBtn) {
      if (ev.locationId) {
        inspectCityBtn.classList.remove('hidden');
        inspectCityBtn.textContent = `Show ${ev.cityName} on globe →`;
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
            data-connected-event="${escapeHtml(item.id)}"
            class="flex items-center justify-between gap-3 rounded-lg p-3 bg-[#181B20]/75 hover:bg-[#22262D] border border-[#F4F1EA]/10 hover:border-[#E2A84B]/45 text-left transition-colors cursor-pointer"
          >
            <div class="min-w-0">
              <div class="font-mono text-[0.6875rem] text-[#9C978C]">${escapeHtml(formatSignalDate(item.date))} · ${escapeHtml(item.city)}</div>
              <div class="text-xs font-semibold text-[#F4F1EA] truncate mt-0.5">${escapeHtml(item.talk)}</div>
              <div class="text-xs text-[#9C978C] truncate">${escapeHtml(item.event)}</div>
            </div>
            <span class="text-[#9C978C] text-xs shrink-0" aria-hidden="true">→</span>
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
    const drawer = document.getElementById('signal-drawer') as HTMLDialogElement | null;
    this.closeDialogElement(drawer);
    this.setUrlHash(this.selectedCityId);
  }

  public openArchive(options?: { cityId?: string; topicId?: string }): void {
    this.closeEventDrawer();
    this.closeAboutModal();

    this.archiveQuery = '';
    const searchInput = document.getElementById(
      'archive-search-input'
    ) as HTMLInputElement | null;
    if (searchInput) searchInput.value = '';

    this.archiveType = 'all';
    const typeSelect = document.getElementById(
      'archive-type-select'
    ) as HTMLSelectElement | null;
    if (typeSelect) typeSelect.value = 'all';
    this.syncArchiveTypeButtons('all');

    this.archiveYear = 'all';
    const yearSelect = document.getElementById(
      'archive-year-select'
    ) as HTMLSelectElement | null;
    if (yearSelect) yearSelect.value = 'all';

    this.archiveCity = options?.cityId ?? 'all';
    const citySelect = document.getElementById(
      'archive-city-select'
    ) as HTMLSelectElement | null;
    if (citySelect) citySelect.value = this.archiveCity;

    this.archiveCluster = options?.topicId ?? 'all';
    const clusterSelect = document.getElementById(
      'archive-cluster-select'
    ) as HTMLSelectElement | null;
    if (clusterSelect) clusterSelect.value = this.archiveCluster;

    this.filterArchiveMatrix();

    const modal = document.getElementById(
      'archive-matrix-modal'
    ) as HTMLDialogElement | null;
    this.openDialogElement(modal, true);
    this.setActiveNavLink('talks');

    searchInput?.focus();
  }

  private closeArchiveInternal(): void {
    const modal = document.getElementById(
      'archive-matrix-modal'
    ) as HTMLDialogElement | null;
    this.closeDialogElement(modal);
  }

  public closeArchive(): void {
    this.closeArchiveInternal();
    this.setActiveNavLink('home');
  }

  public openAboutModal(): void {
    this.closeEventDrawer();
    this.closeArchiveInternal();
    const modal = document.getElementById('about-modal') as HTMLDialogElement | null;
    this.openDialogElement(modal, false);
    this.setActiveNavLink('about');
  }

  public closeAboutModal(): void {
    const modal = document.getElementById('about-modal') as HTMLDialogElement | null;
    this.closeDialogElement(modal);
    this.setActiveNavLink('home');
  }

  private filterArchiveMatrix(): void {
    const rows = document.querySelectorAll<HTMLElement>('[data-archive-row]');
    const counterEl = document.getElementById('archive-result-counter');
    const emptyEl = document.getElementById('archive-empty-state');

    const q = this.archiveQuery.trim().toLowerCase();
    let visibleCount = 0;
    let visibleOnlineCount = 0;
    const visibleCities = new Set<string>();
    const visibleCountries = new Set<string>();

    rows.forEach((row) => {
      const searchBlob = (row.dataset.search ?? '').toLowerCase();
      const rowType = row.dataset.type ?? '';
      const rowClusters = (row.dataset.clusters ?? '').split(',');
      const rowYear = row.dataset.year ?? '';
      const rowCityId = row.dataset.cityId ?? '';
      const rowCountry = row.dataset.country ?? '';

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
        if (rowCityId === 'online') {
          visibleOnlineCount += 1;
        } else if (rowCityId) {
          visibleCities.add(rowCityId);
          if (rowCountry && rowCountry !== 'ONLINE') {
            visibleCountries.add(rowCountry);
          }
        }
      } else {
        row.classList.add('hidden');
      }
    });

    if (counterEl) {
      const cityLabel = visibleCities.size === 1 ? 'city' : 'cities';
      const countryLabel = visibleCountries.size === 1 ? 'country' : 'countries';
      const onlineSuffix =
        visibleOnlineCount > 0 ? ` + ${visibleOnlineCount} online` : '';
      counterEl.textContent = `Showing ${visibleCount} of ${this.atlas.events.length} talks (${visibleCities.size} ${cityLabel} across ${visibleCountries.size} ${countryLabel}${onlineSuffix})`;
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
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    });
  }

  private bindAccessibleButtonRow(
    el: HTMLElement,
    onActivate: () => void
  ): void {
    el.addEventListener('click', onActivate);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onActivate();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
      }
    });
    el.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onActivate();
      }
    });
  }

  private bindDialogLifecycle(dialogId: string, onNativeClose?: () => void): void {
    const dialog = document.getElementById(dialogId) as HTMLDialogElement | null;
    if (!dialog) return;

    dialog.addEventListener('close', () => {
      dialog.classList.remove('flex');
      dialog.setAttribute('aria-hidden', 'true');
      this.syncGlobeDialogPauseState();
      onNativeClose?.();
    });

    // Fallback for browsers without native closedby="any" support (e.g. Safari)
    if (
      typeof HTMLDialogElement !== 'undefined' &&
      !('closedBy' in HTMLDialogElement.prototype)
    ) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent =
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width;
        if (isDialogContent) return;
        dialog.close();
      });
    }
  }

  private bindEvents(): void {
    this.bindDialogLifecycle('signal-drawer', () => {
      this.setUrlHash(this.selectedCityId);
    });
    this.bindDialogLifecycle('archive-matrix-modal', () => {
      this.setActiveNavLink('home');
    });
    this.bindDialogLifecycle('about-modal', () => {
      this.setActiveNavLink('home');
    });

    // 4-Mode View Selector Tabs (Places · Regions · Years · Topics)
    const viewModeButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-view-mode]')
    );
    viewModeButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const mode = (btn.dataset.viewMode ?? 'globe') as AtlasViewMode;
        this.setViewMode(mode);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextIdx =
            (idx + dir + viewModeButtons.length) % viewModeButtons.length;
          const nextBtn = viewModeButtons[nextIdx];
          nextBtn?.focus();
          const mode = (nextBtn?.dataset.viewMode ?? 'globe') as AtlasViewMode;
          this.setViewMode(mode);
        }
      });
    });

    // Select City triggers
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

    // Reset City / Overview
    document
      .querySelectorAll<HTMLElement>('[data-action="reset-city"], [data-action="reset-atlas"]')
      .forEach((el) => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          this.selectYear('all');
          this.selectTopic('all');
          this.selectCity(null);
          this.setActiveNavLink('home');
        });
      });

    // Istanbul hub button
    document.querySelectorAll<HTMLElement>('[data-action="explore-world"]').forEach((el) => {
      el.addEventListener('click', () => {
        this.selectCity('istanbul-tr');
      });
    });

    // City Panel Sub-Tabs (skips hidden tabs such as Photos when empty)
    const cityTabButtons = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[data-city-tab]')
    );
    cityTabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn.dataset.cityTab ?? 'talks') as 'talks' | 'photos' | 'about';
        this.setCityTab(tab);
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const visibleTabs = cityTabButtons.filter((b) => !b.hidden);
          if (visibleTabs.length === 0) return;
          const currentIdx = visibleTabs.indexOf(btn);
          const dir = e.key === 'ArrowRight' ? 1 : -1;
          const nextIdx =
            ((currentIdx === -1 ? 0 : currentIdx) + dir + visibleTabs.length) %
            visibleTabs.length;
          const nextBtn = visibleTabs[nextIdx];
          nextBtn?.focus();
          const tab = (nextBtn?.dataset.cityTab ?? 'talks') as
            | 'talks'
            | 'photos'
            | 'about';
          this.setCityTab(tab);
        }
      });
    });

    // Globe camera zoom & motion controls
    document.querySelectorAll<HTMLElement>('[data-action="globe-zoom-in"]').forEach((btn) => {
      btn.addEventListener('click', () => this.globe.zoomBy(0.82));
    });
    document.querySelectorAll<HTMLElement>('[data-action="globe-zoom-out"]').forEach((btn) => {
      btn.addEventListener('click', () => this.globe.zoomBy(1.22));
    });

    const motionBtns = document.querySelectorAll<HTMLElement>(
      '#toggle-motion-btn, [data-action="toggle-motion"]'
    );
    motionBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextReduced = !this.globe.isMotionPaused();
        this.globe.setMotionReduced(nextReduced);
        motionBtns.forEach((b) => {
          b.setAttribute('aria-pressed', nextReduced ? 'true' : 'false');
          if (b.id === 'toggle-motion-btn') {
            b.textContent = nextReduced ? 'Resume motion' : 'Pause motion';
          } else {
            b.textContent = nextReduced ? 'Resume' : 'Pause';
          }
        });
      });
    });

    // Year filter buttons
    document.querySelectorAll<HTMLElement>('[data-action="select-year"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const yr = btn.dataset.year ?? 'all';
        this.selectYear(yr);
      });
    });

    // Topic filter cards & clear topic pill
    document.querySelectorAll<HTMLElement>('[data-action="select-topic"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const topic = (btn.dataset.topic ?? 'all') as TopicCategoryId | 'all';
        this.selectTopic(topic);
      });
    });

    document
      .querySelectorAll<HTMLElement>('[data-action="clear-timeline-filters"]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          this.selectYear('all');
          this.selectTopic('all');
        });
      });

    // Region filter headers
    document.querySelectorAll<HTMLElement>('[data-action="filter-region"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const regId = btn.dataset.regionId ?? 'all';
        this.selectRegion(regId);
      });
    });

    // Timeline cards & panel items
    document
      .querySelectorAll<HTMLElement>('[data-timeline-card], [data-action="open-event"]')
      .forEach((card) => {
        if (card.tagName === 'BUTTON') {
          card.addEventListener('click', () => {
            const evId = card.dataset.eventId;
            if (evId) this.openEventDrawer(evId);
          });
        } else {
          this.bindAccessibleButtonRow(card, () => {
            const evId = card.dataset.eventId;
            if (evId) this.openEventDrawer(evId);
          });
        }
      });

    // Timeline horizontal scroll arrows
    const track = document.getElementById('timeline-cards-track');
    track?.addEventListener(
      'scroll',
      () => {
        this.updateTimelineScrollButtons();
      },
      { passive: true }
    );
    window.addEventListener(
      'resize',
      () => {
        this.updateTimelineScrollButtons();
      },
      { passive: true }
    );

    const prevScrollBtn = document.getElementById('timeline-scroll-prev');
    const nextScrollBtn = document.getElementById('timeline-scroll-next');
    prevScrollBtn?.addEventListener('click', () => {
      if (prevScrollBtn.getAttribute('aria-disabled') === 'true') return;
      track?.scrollBy({ left: -340, behavior: 'smooth' });
    });
    nextScrollBtn?.addEventListener('click', () => {
      if (nextScrollBtn.getAttribute('aria-disabled') === 'true') return;
      track?.scrollBy({ left: 340, behavior: 'smooth' });
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
      this.bindAccessibleButtonRow(row, () => {
        const evId = row.dataset.eventId;
        if (evId) this.openEventDrawer(evId);
      });
    });

    // URL Hash Navigation
    window.addEventListener('hashchange', () => {
      this.applyHashRoute(window.location.hash);
    });

    // Global Keyboard Shortcuts (⌘K / Ctrl+K, '/', Escape)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.isDialogOpen('archive-matrix-modal')) {
          this.closeArchive();
        } else {
          this.openArchive();
        }
        return;
      }

      if (e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const activeEl = document.activeElement as HTMLElement | null;
        const isEditable =
          activeEl &&
          (activeEl.tagName === 'INPUT' ||
            activeEl.tagName === 'TEXTAREA' ||
            activeEl.tagName === 'SELECT' ||
            activeEl.isContentEditable);
        if (!isEditable) {
          e.preventDefault();
          this.openArchive();
          return;
        }
      }

      if (e.key === 'Escape') {
        if (this.isDialogOpen('about-modal')) {
          e.preventDefault();
          this.closeAboutModal();
          return;
        }
        if (this.isDialogOpen('signal-drawer')) {
          e.preventDefault();
          this.closeEventDrawer();
          return;
        }
        if (this.isDialogOpen('archive-matrix-modal')) {
          e.preventDefault();
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
  landGeoJson?: unknown
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
