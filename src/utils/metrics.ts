import {
  OrbitArchiveSchema,
  type ClusterId,
  type OrbitArchive,
  type Talk,
} from '../schemas/talkSchema';

export interface ClusterMetric {
  id: ClusterId;
  talksCount: number;
  primaryCount: number;
  countriesCount: number;
  citiesCount: number;
}

export interface OrbitTelemetry {
  totalTalks: number;
  uniqueCountries: number;
  uniqueCities: number;
  uniqueEvents: number;
  workshopsCount: number;
  keynotesCount: number;
  conferencesCount: number;
  clusterCounts: Record<ClusterId, number>;
  clusterMetrics: Record<ClusterId, ClusterMetric>;
  recentSignals: Talk[];
  sortedTalks: Talk[];
  years: string[];
  countries: Array<{ code: string; name: string; count: number }>;
  displayTalks: string;
  displayCountries: string;
  displayCities: string;
}

/**
 * Validates raw archive JSON data against OrbitArchiveSchema.
 * Also enforces unique talk IDs across the archive.
 */
export function validateArchive(rawData: unknown): OrbitArchive {
  const parsed = OrbitArchiveSchema.parse(rawData);
  const seenIds = new Set<string>();
  for (const talk of parsed.talks) {
    if (seenIds.has(talk.id)) {
      throw new Error(`Duplicate talk id detected: "${talk.id}"`);
    }
    seenIds.add(talk.id);
  }
  return parsed;
}

/**
 * Checks whether a talk belongs to a given technology cluster
 * (either as primaryCluster or in its topics list).
 */
export function talkMatchesCluster(talk: Talk, clusterId: ClusterId): boolean {
  return talk.primaryCluster === clusterId || talk.topics.includes(clusterId);
}

/**
 * Computes deduplicated speaker telemetry, cluster breakdowns, chronological talk lists,
 * and recent signals at build time or runtime.
 */
export function getOrbitTelemetry(archive: OrbitArchive): OrbitTelemetry {
  const { talks, speaker } = archive;

  const countrySet = new Set<string>();
  const citySet = new Set<string>();
  const eventSet = new Set<string>();
  const yearSet = new Set<string>();
  const countryMap = new Map<string, { code: string; name: string; count: number }>();

  let workshopsCount = 0;
  let keynotesCount = 0;
  let conferencesCount = 0;

  const clusterIds: ClusterId[] = ['ai', 'k8s', 'cloud', 'workshops'];
  const clusterCounts: Record<ClusterId, number> = {
    ai: 0,
    k8s: 0,
    cloud: 0,
    workshops: 0,
  };

  const clusterMetrics: Record<ClusterId, ClusterMetric> = {
    ai: { id: 'ai', talksCount: 0, primaryCount: 0, countriesCount: 0, citiesCount: 0 },
    k8s: { id: 'k8s', talksCount: 0, primaryCount: 0, countriesCount: 0, citiesCount: 0 },
    cloud: { id: 'cloud', talksCount: 0, primaryCount: 0, countriesCount: 0, citiesCount: 0 },
    workshops: {
      id: 'workshops',
      talksCount: 0,
      primaryCount: 0,
      countriesCount: 0,
      citiesCount: 0,
    },
  };

  const clusterCountrySets: Record<ClusterId, Set<string>> = {
    ai: new Set(),
    k8s: new Set(),
    cloud: new Set(),
    workshops: new Set(),
  };

  const clusterCitySets: Record<ClusterId, Set<string>> = {
    ai: new Set(),
    k8s: new Set(),
    cloud: new Set(),
    workshops: new Set(),
  };

  for (const talk of talks) {
    const normalizedCountry = talk.countryCode.trim().toUpperCase();
    const normalizedCityKey = `${normalizedCountry}:${talk.city.trim().toLowerCase()}`;
    const normalizedEventId = talk.eventId.trim().toLowerCase();

    countrySet.add(normalizedCountry);
    citySet.add(normalizedCityKey);
    eventSet.add(normalizedEventId);

    const year = talk.date.slice(0, 4);
    if (year) yearSet.add(year);

    const existingCountry = countryMap.get(normalizedCountry);
    if (existingCountry) {
      existingCountry.count += 1;
    } else {
      countryMap.set(normalizedCountry, {
        code: normalizedCountry,
        name: talk.country.trim(),
        count: 1,
      });
    }

    if (talk.type === 'workshop') workshopsCount += 1;
    else if (talk.type === 'keynote') keynotesCount += 1;
    else if (talk.type === 'conference') conferencesCount += 1;

    clusterMetrics[talk.primaryCluster].primaryCount += 1;

    for (const cid of clusterIds) {
      if (talkMatchesCluster(talk, cid)) {
        clusterCounts[cid] += 1;
        clusterMetrics[cid].talksCount += 1;
        clusterCountrySets[cid].add(normalizedCountry);
        clusterCitySets[cid].add(normalizedCityKey);
      }
    }
  }

  for (const cid of clusterIds) {
    clusterMetrics[cid].countriesCount = clusterCountrySets[cid].size;
    clusterMetrics[cid].citiesCount = clusterCitySets[cid].size;
  }

  const sortedTalks = [...talks].sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });

  // Prioritize featured talks first, then chronological descending; ensure the final 3 are in descending chronological order
  const featuredCandidates = [...talks]
    .sort((a, b) => {
      const featDiff = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      if (featDiff !== 0) return featDiff;
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.id.localeCompare(b.id);
    })
    .slice(0, 3)
    .sort((a, b) => {
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      return a.id.localeCompare(b.id);
    });

  const totalTalks = talks.length;
  const uniqueCountries = countrySet.size;
  const uniqueCities = citySet.size;
  const uniqueEvents = eventSet.size;

  const baseline = speaker.careerBaseline;
  const useFloor = Boolean(baseline?.useCareerFloor);

  const displayTalks =
    useFloor && baseline && baseline.talksFloor >= totalTalks
      ? `${Math.max(totalTalks, baseline.talksFloor)}+`
      : `${totalTalks}`;

  const displayCountries =
    useFloor && baseline
      ? `${Math.max(uniqueCountries, baseline.countriesFloor)}`
      : `${uniqueCountries}`;

  const displayCities =
    useFloor && baseline ? `${Math.max(uniqueCities, baseline.citiesFloor)}` : `${uniqueCities}`;

  const years = Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  const countries = Array.from(countryMap.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );

  return {
    totalTalks,
    uniqueCountries,
    uniqueCities,
    uniqueEvents,
    workshopsCount,
    keynotesCount,
    conferencesCount,
    clusterCounts,
    clusterMetrics,
    recentSignals: featuredCandidates,
    sortedTalks,
    years,
    countries,
    displayTalks,
    displayCountries,
    displayCities,
  };
}
