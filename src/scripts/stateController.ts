import type { ClusterId, OrbitArchive, Talk } from '../schemas/talkSchema';
import { getOrbitTelemetry, talkMatchesCluster, type OrbitTelemetry } from '../utils/metrics';
import { formatSignalDate, withBase } from '../utils/paths';
import { OrbitSceneController } from './orbitScene';

export type OrbitMode =
  | 'overview'
  | 'explore'
  | 'cluster-lock'
  | 'signal-detail'
  | 'archive';

declare global {
  interface Window {
    __orbitScene?: OrbitSceneController;
    __orbitState?: OrbitStateController;
  }
}

const CLUSTER_NAMES: Record<ClusterId, string> = {
  ai: 'AI AGENTS',
  k8s: 'KUBERNETES',
  cloud: 'GOOGLE CLOUD',
  workshops: 'WORKSHOPS',
};

const CLUSTER_COLORS: Record<ClusterId, string> = {
  ai: '#38BDF8',
  k8s: '#F59E0B',
  cloud: '#FACC15',
  workshops: '#10B981',
};

export class OrbitStateController {
  private archive: OrbitArchive;
  private telemetry: OrbitTelemetry;
  private scene: OrbitSceneController;

  private mode: OrbitMode = 'overview';
  private baseModeBeforeModal: 'overview' | 'explore' | 'cluster-lock' = 'overview';
  private activeCluster: ClusterId | 'all' = 'all';
  private exploreCountry = 'all';
  private exploreYear = 'all';
  private selectedTalk: Talk | null = null;

  // Archive Matrix filter state
  private archiveQuery = '';
  private archiveCluster = 'all';
  private archiveType = 'all';
  private archiveYear = 'all';
  private archiveCountry = 'all';

  constructor(archive: OrbitArchive, scene: OrbitSceneController) {
    this.archive = archive;
    this.telemetry = getOrbitTelemetry(archive);
    this.scene = scene;
    this.bindEvents();
    this.syncBodyAttributes();
  }

  public getMode(): OrbitMode {
    return this.mode;
  }

  public getTelemetry(): OrbitTelemetry {
    return this.telemetry;
  }

  public getActiveCluster(): ClusterId | 'all' {
    return this.activeCluster;
  }

  private syncBodyAttributes(): void {
    document.body.dataset.mode = this.mode;
    document.body.dataset.cluster = this.activeCluster;
    if (this.selectedTalk) {
      document.body.dataset.selectedTalk = this.selectedTalk.id;
    } else {
      delete document.body.dataset.selectedTalk;
    }
  }

  public enterOverview(): void {
    this.closeDrawerInternal();
    this.closeArchiveInternal();
    this.mode = 'overview';
    this.baseModeBeforeModal = 'overview';
    this.activeCluster = 'all';
    this.exploreCountry = 'all';
    this.exploreYear = 'all';

    const hero = document.getElementById('hero-overview-panel');
    const recent = document.getElementById('recent-signals-strip');
    const hud = document.getElementById('telemetry-hud-pill');
    const dock = document.getElementById('explore-control-dock');

    hero?.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    recent?.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
    hud?.classList.add('hidden');
    hud?.classList.remove('flex');
    dock?.classList.add('hidden');

    this.updateClusterPillsUI('all');
    this.scene.setPaused(false);
    this.scene.transitionToMode('overview');
    this.syncBodyAttributes();
  }

  public enterExplore(clusterId: ClusterId | 'all' = 'all'): void {
    this.closeDrawerInternal();
    this.closeArchiveInternal();

    const hero = document.getElementById('hero-overview-panel');
    const recent = document.getElementById('recent-signals-strip');
    const hud = document.getElementById('telemetry-hud-pill');
    const dock = document.getElementById('explore-control-dock');

    hero?.classList.add('hidden');
    recent?.classList.add('hidden');
    hud?.classList.remove('hidden');
    hud?.classList.add('flex');
    dock?.classList.remove('hidden');

    this.scene.setPaused(false);

    if (clusterId === 'all') {
      this.mode = 'explore';
      this.baseModeBeforeModal = 'explore';
      this.activeCluster = 'all';
      this.scene.transitionToMode('explore');
    } else {
      this.mode = 'cluster-lock';
      this.baseModeBeforeModal = 'cluster-lock';
      this.activeCluster = clusterId;
      this.scene.transitionToMode('cluster-lock', { clusterId });
    }

    this.updateClusterPillsUI(clusterId);
    this.updateExploreStatusBanner();
    this.syncBodyAttributes();
  }

  public selectCluster(clusterId: ClusterId | 'all'): void {
    if (this.mode === 'overview') {
      this.enterExplore(clusterId);
      return;
    }

    this.activeCluster = clusterId;
    this.mode = clusterId === 'all' ? 'explore' : 'cluster-lock';
    this.baseModeBeforeModal = this.mode;

    this.updateClusterPillsUI(clusterId);
    this.updateExploreStatusBanner();

    if (clusterId === 'all') {
      this.scene.transitionToMode('explore');
    } else {
      this.scene.transitionToMode('cluster-lock', { clusterId });
    }
    this.syncBodyAttributes();
  }

  private updateClusterPillsUI(clusterId: ClusterId | 'all'): void {
    const pills = document.querySelectorAll<HTMLButtonElement>('[data-cluster-pill]');
    pills.forEach((pill) => {
      const pid = pill.dataset.clusterPill;
      const isSelected = pid === clusterId;
      pill.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
      pill.dataset.active = isSelected ? 'true' : 'false';
      if (isSelected) {
        pill.classList.add('bg-[#38BDF8]/20', 'text-white', 'border-[#38BDF8]/60');
        pill.classList.remove('bg-white/[0.05]', 'text-slate-300', 'border-white/10');
      } else {
        pill.classList.remove('bg-[#38BDF8]/20', 'text-white', 'border-[#38BDF8]/60');
        pill.classList.add('bg-white/[0.05]', 'text-slate-300', 'border-white/10');
      }
    });
  }

  private updateExploreStatusBanner(): void {
    const textEl = document.getElementById('cluster-status-text');
    const dotEl = document.getElementById('cluster-status-dot');
    if (!textEl) return;

    const matchingTalks = this.archive.talks.filter((talk) => {
      const cMatch =
        this.activeCluster === 'all' || talkMatchesCluster(talk, this.activeCluster);
      const countryMatch =
        this.exploreCountry === 'all' ||
        talk.countryCode.toUpperCase() === this.exploreCountry.toUpperCase();
      const yearMatch =
        this.exploreYear === 'all' || talk.date.slice(0, 4) === this.exploreYear;
      return cMatch && countryMatch && yearMatch;
    });

    const uniqueCountries = new Set(
      matchingTalks.map((t) => t.countryCode.toUpperCase())
    ).size;

    if (this.activeCluster === 'all') {
      textEl.textContent = `ALL CLUSTERS: ${matchingTalks.length} Sessions across ${uniqueCountries} Countries`;
      if (dotEl) dotEl.style.backgroundColor = '#38BDF8';
    } else {
      const label = CLUSTER_NAMES[this.activeCluster];
      textEl.textContent = `${label} CLUSTER: ${matchingTalks.length} Sessions across ${uniqueCountries} Countries`;
      if (dotEl) dotEl.style.backgroundColor = CLUSTER_COLORS[this.activeCluster];
    }
  }

  public openSignalDrawer(talkId: string): void {
    const talk = this.archive.talks.find((t) => t.id === talkId);
    if (!talk) return;

    if (this.mode === 'archive') {
      this.closeArchiveInternal();
    } else if (
      this.mode === 'overview' ||
      this.mode === 'explore' ||
      this.mode === 'cluster-lock'
    ) {
      this.baseModeBeforeModal = this.mode;
    }

    this.selectedTalk = talk;
    this.mode = 'signal-detail';
    this.populateDrawerDOM(talk);

    const drawer = document.getElementById('signal-drawer');
    const backdrop = document.getElementById('signal-drawer-backdrop');
    drawer?.classList.remove('hidden');
    drawer?.setAttribute('aria-hidden', 'false');
    backdrop?.classList.remove('hidden');
    backdrop?.setAttribute('aria-hidden', 'false');

    this.scene.setPaused(false);
    this.scene.transitionToMode('signal-detail', { talkId: talk.id });
    this.syncBodyAttributes();
  }

  private populateDrawerDOM(talk: Talk): void {
    const typeEl = document.getElementById('drawer-type');
    const dateEl = document.getElementById('drawer-date');
    const locEl = document.getElementById('drawer-location');
    const imgEl = document.getElementById('drawer-image') as HTMLImageElement | null;
    const eventEl = document.getElementById('drawer-event');
    const titleEl = document.getElementById('signal-drawer-title');
    const summaryEl = document.getElementById('drawer-summary');
    const clustersEl = document.getElementById('drawer-clusters');
    const linksEl = document.getElementById('drawer-links');
    const connectedEl = document.getElementById('drawer-connected');
    const dotEl = document.getElementById('drawer-badge-dot');

    const color = CLUSTER_COLORS[talk.primaryCluster] ?? '#38BDF8';
    if (dotEl) {
      dotEl.style.backgroundColor = color;
      dotEl.style.boxShadow = `0 0 10px ${color}`;
    }
    if (typeEl) {
      typeEl.textContent = talk.type.toUpperCase();
      typeEl.style.color = color;
    }
    if (dateEl) dateEl.textContent = formatSignalDate(talk.date);
    if (locEl) locEl.textContent = `${talk.city}, ${talk.country}`;
    if (imgEl) {
      imgEl.src = withBase(talk.image);
      imgEl.alt = `${talk.event} stage in ${talk.city}`;
    }
    if (eventEl) {
      eventEl.textContent = talk.event;
      eventEl.style.color = color;
    }
    if (titleEl) titleEl.textContent = talk.title;
    if (summaryEl) {
      summaryEl.textContent =
        talk.summary ||
        `${talk.type.toUpperCase()} delivered at ${talk.event} in ${talk.city}, ${talk.country}.`;
    }

    if (clustersEl) {
      const topics = Array.from(new Set([talk.primaryCluster, ...talk.topics]));
      clustersEl.innerHTML = topics
        .map(
          (cid) =>
            `<span class="rounded-full px-3 py-1 font-mono text-[10px] tracking-wider uppercase bg-white/10 text-slate-100 border border-white/15">${CLUSTER_NAMES[cid] ?? cid}</span>`
        )
        .join('');
    }

    if (linksEl) {
      const items: string[] = [];
      if (talk.links.event) {
        items.push(
          `<a href="${talk.links.event}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 border border-[#38BDF8]/40 px-3.5 py-2 text-xs font-medium text-white transition-colors">Event Website ↗</a>`
        );
      }
      if (talk.links.slides) {
        items.push(
          `<a href="${talk.links.slides}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors">View Slides ↗</a>`
        );
      }
      if (talk.links.video) {
        items.push(
          `<a href="${talk.links.video}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors">Watch Recording ↗</a>`
        );
      }
      linksEl.innerHTML = items.join('');
    }

    if (connectedEl) {
      const related = this.archive.talks
        .filter(
          (other) =>
            other.id !== talk.id &&
            (other.countryCode === talk.countryCode ||
              other.primaryCluster === talk.primaryCluster)
        )
        .slice(0, 4);

      connectedEl.innerHTML = related
        .map(
          (item) => `
          <button
            type="button"
            data-connected-talk="${item.id}"
            class="flex items-center justify-between gap-3 rounded-xl p-3 bg-slate-900/60 hover:bg-slate-900 border border-white/10 hover:border-[#38BDF8]/40 text-left transition-all cursor-pointer"
          >
            <div class="min-w-0">
              <div class="font-mono text-[10px] text-[#38BDF8] uppercase">${formatSignalDate(item.date)} · ${item.city}, ${item.country}</div>
              <div class="text-xs font-semibold text-white truncate mt-0.5">${item.title}</div>
              <div class="text-[11px] text-slate-400 truncate">${item.event}</div>
            </div>
            <span class="text-slate-400 text-xs shrink-0">→</span>
          </button>
        `
        )
        .join('');

      connectedEl
        .querySelectorAll<HTMLButtonElement>('[data-connected-talk]')
        .forEach((btn) => {
          btn.addEventListener('click', () => {
            const targetId = btn.dataset.connectedTalk;
            if (targetId) this.openSignalDrawer(targetId);
          });
        });
    }
  }

  private closeDrawerInternal(): void {
    const drawer = document.getElementById('signal-drawer');
    const backdrop = document.getElementById('signal-drawer-backdrop');
    drawer?.classList.add('hidden');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.add('hidden');
    backdrop?.setAttribute('aria-hidden', 'true');
    this.selectedTalk = null;
  }

  public closeSignalDrawer(): void {
    this.closeDrawerInternal();
    this.mode = this.baseModeBeforeModal;
    this.scene.transitionToMode(this.mode, {
      clusterId: this.activeCluster,
    });
    this.syncBodyAttributes();
  }

  public openArchive(): void {
    this.closeDrawerInternal();
    this.closeAboutModal();

    if (
      this.mode === 'overview' ||
      this.mode === 'explore' ||
      this.mode === 'cluster-lock'
    ) {
      this.baseModeBeforeModal = this.mode;
    }

    this.mode = 'archive';
    const modal = document.getElementById('archive-matrix-modal');
    modal?.classList.remove('hidden');
    modal?.classList.add('flex');
    modal?.setAttribute('aria-hidden', 'false');

    // Performance rule: pause Three.js requestAnimationFrame loop while archive modal is open
    this.scene.setPaused(true);
    this.syncBodyAttributes();

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
    this.mode = this.baseModeBeforeModal;
    this.scene.setPaused(false);
    this.syncBodyAttributes();
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
    const visibleCountries = new Set<string>();

    rows.forEach((row) => {
      const searchBlob = (row.dataset.search ?? '').toLowerCase();
      const rowType = row.dataset.type ?? '';
      const rowClusters = (row.dataset.clusters ?? '').split(',');
      const rowYear = row.dataset.year ?? '';
      const rowCountry = (row.dataset.country ?? '').toUpperCase();

      const matchesSearch = !q || searchBlob.includes(q);
      const matchesCluster =
        this.archiveCluster === 'all' || rowClusters.includes(this.archiveCluster);
      const matchesType =
        this.archiveType === 'all' ||
        rowType.toLowerCase() === this.archiveType.toLowerCase();
      const matchesYear =
        this.archiveYear === 'all' || rowYear === this.archiveYear;
      const matchesCountry =
        this.archiveCountry === 'all' ||
        rowCountry === this.archiveCountry.toUpperCase();

      const isVisible =
        matchesSearch &&
        matchesCluster &&
        matchesType &&
        matchesYear &&
        matchesCountry;

      if (isVisible) {
        row.classList.remove('hidden');
        visibleCount += 1;
        if (rowCountry) visibleCountries.add(rowCountry);
      } else {
        row.classList.add('hidden');
      }
    });

    if (counterEl) {
      counterEl.textContent = `Showing ${visibleCount} of ${this.archive.talks.length} talks across ${visibleCountries.size} countries`;
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
    // Action buttons
    document.querySelectorAll<HTMLElement>('[data-action="enter-explore"]').forEach((el) => {
      el.addEventListener('click', () => this.enterExplore('all'));
    });

    document.querySelectorAll<HTMLElement>('[data-action="exit-explore"], [data-action="reset-overview"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        this.enterOverview();
      });
    });

    document.querySelectorAll<HTMLElement>('[data-action="open-archive"], [data-action="open-archive-slides"]').forEach((el) => {
      el.addEventListener('click', () => this.openArchive());
    });

    document.querySelectorAll<HTMLElement>('[data-action="close-archive"]').forEach((el) => {
      el.addEventListener('click', () => this.closeArchive());
    });

    document.querySelectorAll<HTMLElement>('[data-action="close-drawer"]').forEach((el) => {
      el.addEventListener('click', () => this.closeSignalDrawer());
    });

    document.querySelectorAll<HTMLElement>('[data-action="open-about"]').forEach((el) => {
      el.addEventListener('click', () => this.openAboutModal());
    });

    document.querySelectorAll<HTMLElement>('[data-action="close-about"]').forEach((el) => {
      el.addEventListener('click', () => this.closeAboutModal());
    });

    // Recent Signals cards
    document.querySelectorAll<HTMLElement>('[data-signal-card]').forEach((card) => {
      card.addEventListener('click', () => {
        const talkId = card.dataset.talkId;
        if (talkId) this.openSignalDrawer(talkId);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const talkId = card.dataset.talkId;
          if (talkId) this.openSignalDrawer(talkId);
        }
      });
    });

    // 3D Projected Cluster Hub Labels
    document.querySelectorAll<HTMLElement>('[data-action="select-cluster"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.clusterId as ClusterId | undefined;
        if (cid) this.selectCluster(cid);
      });
    });

    // Explore Control Dock Cluster Filter Pills
    document.querySelectorAll<HTMLElement>('[data-cluster-pill]').forEach((pill) => {
      pill.addEventListener('click', () => {
        const cid = (pill.dataset.clusterPill ?? 'all') as ClusterId | 'all';
        this.selectCluster(cid);
      });
    });

    // Explore Dock Country & Year dropdowns
    const exploreCountryEl = document.getElementById(
      'explore-country-filter'
    ) as HTMLSelectElement | null;
    exploreCountryEl?.addEventListener('change', () => {
      this.exploreCountry = exploreCountryEl.value;
      this.scene.applyFilters(this.activeCluster, this.exploreCountry, this.exploreYear);
      this.updateExploreStatusBanner();
    });

    const exploreYearEl = document.getElementById(
      'explore-year-filter'
    ) as HTMLSelectElement | null;
    exploreYearEl?.addEventListener('change', () => {
      this.exploreYear = exploreYearEl.value;
      this.scene.applyFilters(this.activeCluster, this.exploreCountry, this.exploreYear);
      this.updateExploreStatusBanner();
    });

    // Archive Matrix Filters
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

    const countrySelect = document.getElementById(
      'archive-country-select'
    ) as HTMLSelectElement | null;
    countrySelect?.addEventListener('change', () => {
      this.archiveCountry = countrySelect.value;
      this.filterArchiveMatrix();
    });

    const resetBtn = document.getElementById('archive-reset-filters-btn');
    resetBtn?.addEventListener('click', () => {
      this.archiveQuery = '';
      this.archiveCluster = 'all';
      this.archiveType = 'all';
      this.archiveYear = 'all';
      this.archiveCountry = 'all';
      if (searchInput) searchInput.value = '';
      if (clusterSelect) clusterSelect.value = 'all';
      if (typeSelect) typeSelect.value = 'all';
      if (yearSelect) yearSelect.value = 'all';
      if (countrySelect) countrySelect.value = 'all';
      this.syncArchiveTypeButtons('all');
      this.filterArchiveMatrix();
    });

    // Archive Matrix rows -> open Signal Detail Drawer
    document.querySelectorAll<HTMLElement>('[data-archive-row]').forEach((row) => {
      row.addEventListener('click', () => {
        const talkId = row.dataset.talkId;
        if (talkId) this.openSignalDrawer(talkId);
      });
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const talkId = row.dataset.talkId;
          if (talkId) this.openSignalDrawer(talkId);
        }
      });
    });

    // Global Keyboard Shortcuts: Escape & Cmd/Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.mode === 'archive') {
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
        if (this.mode === 'signal-detail') {
          this.closeSignalDrawer();
          return;
        }
        if (this.mode === 'archive') {
          this.closeArchive();
          return;
        }
        if (this.mode === 'cluster-lock') {
          this.selectCluster('all');
          return;
        }
      }
    });

    // Scroll down in overview mode transitions to explore mode
    window.addEventListener(
      'wheel',
      (e) => {
        if (this.mode === 'overview' && e.deltaY > 45) {
          this.enterExplore('all');
        }
      },
      { passive: true }
    );
  }
}

export function initOrbitApp(archive: OrbitArchive): void {
  const canvasContainer = document.getElementById('orbit-canvas-container');
  if (!canvasContainer) return;

  let controllerRef: OrbitStateController | null = null;
  const scene = new OrbitSceneController(canvasContainer, archive, {
    onSelectTalk: (talk) => {
      controllerRef?.openSignalDrawer(talk.id);
    },
    onSelectCluster: (clusterId) => {
      controllerRef?.selectCluster(clusterId);
    },
    onUserCanvasDrag: () => {
      if (controllerRef?.getMode() === 'overview') {
        controllerRef.enterExplore('all');
      }
    },
  });

  controllerRef = new OrbitStateController(archive, scene);
  window.__orbitScene = scene;
  window.__orbitState = controllerRef;
}
