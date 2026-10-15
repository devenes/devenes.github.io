import { z } from 'zod';

export const SpeakingEventSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  event: z.string().min(1),
  city: z.string().min(1),
  talk: z.string().min(1),
  photos: z.array(z.string()),
  description: z.string(),
  topics: z.array(z.string()).min(1),
  slidesUrl: z.string().optional(),
  recordingUrl: z.string().optional(),
  eventUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

export const VerifiedLocationSchema = z.object({
  id: z.string().min(1),
  cityKey: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  countryCode: z.string().length(2),
  flag: z.string().min(1),
  regionId: z.enum(['turkiye', 'central-asia', 'mena', 'balkans-caucasus']),
  regionName: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  isBaseHub: z.boolean().optional().default(false),
  note: z.string().optional(),
});

export type RawSpeakingEvent = z.infer<typeof SpeakingEventSchema>;
export type VerifiedLocation = z.infer<typeof VerifiedLocationSchema>;

export type TopicCategoryId = 'ai' | 'kubernetes' | 'cloud' | 'mlops';
export type SessionFormatType = 'keynote' | 'workshop' | 'conference';

export interface EnrichedSpeakingEvent extends RawSpeakingEvent {
  isOnline: boolean;
  locationId: string | null;
  cityName: string;
  countryName: string;
  countryCode: string;
  flag: string;
  regionId: string;
  regionName: string;
  lat: number | null;
  lon: number | null;
  year: string;
  sessionType: SessionFormatType;
  topicCategories: TopicCategoryId[];
  primaryCategory: TopicCategoryId;
}

export interface CityDestination extends VerifiedLocation {
  eventsCount: number;
  events: EnrichedSpeakingEvent[];
  latestDate: string;
  years: string[];
  topicCategories: TopicCategoryId[];
  position3D: [number, number, number];
}

export interface TravelRouteArc {
  id: string;
  fromCityId: string;
  toCityId: string;
  fromCity: string;
  toCity: string;
  fromCoords: [number, number]; // [lat, lon]
  toCoords: [number, number]; // [lat, lon]
  distanceKm: number;
  kind: 'hub' | 'chronological';
  year: string;
  color: string;
  points3D: Array<[number, number, number]>;
}

export interface RegionSummary {
  id: string;
  name: string;
  color: string;
  talksCount: number;
  citiesCount: number;
  countriesCount: number;
  cities: CityDestination[];
}

export interface TopicCategorySummary {
  id: TopicCategoryId;
  label: string;
  shortLabel: string;
  subLabel: string;
  color: string;
  talksCount: number;
  citiesCount: number;
  countriesCount: number;
}

export interface UnverifiedLocationFinding {
  eventId: string;
  cityString: string;
  reason: string;
}

export interface SameDateFinding {
  date: string;
  eventIds: string[];
  descriptions: string[];
}

export interface SpeakingAtlasData {
  metrics: {
    totalTalks: number;
    physicalTalks: number;
    onlineTalks: number;
    uniqueCountries: number;
    uniqueCities: number;
    uniqueRegions: number;
    keynotesCount: number;
    workshopsCount: number;
    conferencesCount: number;
  };
  events: EnrichedSpeakingEvent[];
  cities: CityDestination[];
  regions: RegionSummary[];
  topics: TopicCategorySummary[];
  years: Array<{ year: string; talksCount: number; citiesCount: number }>;
  routes: TravelRouteArc[];
  unverifiedLocations: UnverifiedLocationFinding[];
  sameDateFindings: SameDateFinding[];
}

export const GLOBE_RADIUS = 2.65;

/**
 * Converts geographic (latitude, longitude) in degrees to 3D Cartesian coordinates
 * on a Three.js sphere of radius R (where +Y is North Pole, +Z faces lon=0, +X faces lon=90E).
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  radius = GLOBE_RADIUS
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 90) * Math.PI) / 180;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  const round = (v: number) => Math.round(v * 1e6) / 1e6;
  return [round(x), round(y), round(z)];
}

/**
 * Computes real-world Haversine great-circle distance in kilometers between two coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Generates 3D points along a true spherical Great-Circle arc (via spherical linear interpolation)
 * between two [lat, lon] endpoints, elevated smoothly above the sphere surface.
 */
export function computeGreatCircleArcPoints(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  radius = GLOBE_RADIUS,
  segments = 44
): Array<[number, number, number]> {
  const p0 = latLonToVector3(startLat, startLon, 1);
  const p1 = latLonToVector3(endLat, endLon, 1);

  const dot = Math.min(
    1,
    Math.max(-1, p0[0] * p1[0] + p0[1] * p1[1] + p0[2] * p1[2])
  );
  const omega = Math.acos(dot);
  const sinOmega = Math.sin(omega);

  // Arc peak elevation scales proportionally with angular distance so short routes stay low and inter-regional routes arch gracefully
  const maxLift = radius * Math.min(0.26, Math.max(0.035, (omega / Math.PI) * 0.48));

  const points: Array<[number, number, number]> = [];
  const round = (v: number) => Math.round(v * 1e6) / 1e6;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let ux: number;
    let uy: number;
    let uz: number;

    if (sinOmega < 1e-5) {
      ux = p0[0] + (p1[0] - p0[0]) * t;
      uy = p0[1] + (p1[1] - p0[1]) * t;
      uz = p0[2] + (p1[2] - p0[2]) * t;
    } else {
      const w0 = Math.sin((1 - t) * omega) / sinOmega;
      const w1 = Math.sin(t * omega) / sinOmega;
      ux = p0[0] * w0 + p1[0] * w1;
      uy = p0[1] * w0 + p1[1] * w1;
      uz = p0[2] * w0 + p1[2] * w1;
    }

    const len = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1;
    const altitude = radius + Math.sin(t * Math.PI) * maxLift;

    points.push([
      round((ux / len) * altitude),
      round((uy / len) * altitude),
      round((uz / len) * altitude),
    ]);
  }

  return points;
}

/**
 * Infers session format (keynote, workshop, conference) from authentic event metadata.
 */
export function inferSessionFormat(ev: RawSpeakingEvent): SessionFormatType {
  const combined = `${ev.talk} ${ev.event} ${ev.description} ${ev.topics.join(' ')}`.toLowerCase();
  if (combined.includes('keynote')) return 'keynote';
  if (
    combined.includes('workshop') ||
    combined.includes('study jam') ||
    combined.includes('hands-on')
  ) {
    return 'workshop';
  }
  return 'conference';
}

/**
 * Classifies an event into canonical technical topic categories based on its topics and title.
 * Note: A talk can belong to multiple categories (e.g., "Kubernetes for AI" matches both kubernetes and mlops).
 */
export function classifyTopicCategories(ev: RawSpeakingEvent): TopicCategoryId[] {
  const hay = `${ev.talk} ${ev.topics.join(' ')}`.toLowerCase();
  const matched = new Set<TopicCategoryId>();

  if (
    hay.includes('agent') ||
    hay.includes('adk') ||
    hay.includes('generative ai') ||
    hay.includes('build with ai') ||
    hay.includes('gemini') ||
    hay.includes('healthcare ai')
  ) {
    matched.add('ai');
  }

  if (
    hay.includes('kubernetes') ||
    hay.includes('gke') ||
    hay.includes('platform engineering') ||
    hay.includes('scheduling') ||
    hay.includes('multi-cluster') ||
    hay.includes('containers') ||
    hay.includes('knative')
  ) {
    matched.add('kubernetes');
  }

  if (
    hay.includes('mlops') ||
    hay.includes('ai/ml') ||
    hay.includes('vertex ai') ||
    hay.includes('machine learning') ||
    hay.includes('computer vision') ||
    hay.includes('kubernetes for ai')
  ) {
    matched.add('mlops');
  }

  if (
    hay.includes('google cloud') ||
    hay.includes('cloud architecture') ||
    hay.includes('serverless') ||
    hay.includes('cloud run') ||
    hay.includes('sre') ||
    hay.includes('reliability') ||
    hay.includes('devops') ||
    hay.includes('cloud computing') ||
    hay.includes('cloud engineering') ||
    hay.includes('infrastructure')
  ) {
    matched.add('cloud');
  }

  if (matched.size === 0) {
    matched.add('cloud');
  }

  return Array.from(matched);
}

/**
 * Builds the complete, verified Speaking Atlas from data/events.json and data/locations.json.
 * Never invents coordinates for unverified physical cities and never plots Online events as physical markers.
 */
export function buildSpeakingAtlas(
  rawEventsInput: unknown,
  rawLocationsInput: unknown
): SpeakingAtlasData {
  const rawEvents = z.array(SpeakingEventSchema).parse(rawEventsInput);
  const verifiedLocations = z.array(VerifiedLocationSchema).parse(rawLocationsInput);

  // Enforce unique event IDs
  const seenEventIds = new Set<string>();
  for (const ev of rawEvents) {
    if (seenEventIds.has(ev.id)) {
      throw new Error(`Duplicate speaking event id detected: "${ev.id}"`);
    }
    seenEventIds.add(ev.id);
  }

  const locationByCityKey = new Map<string, VerifiedLocation>();
  for (const loc of verifiedLocations) {
    locationByCityKey.set(loc.cityKey.trim(), loc);
  }

  const unverifiedLocations: UnverifiedLocationFinding[] = [];
  const cityEventsMap = new Map<string, EnrichedSpeakingEvent[]>();

  let keynotesCount = 0;
  let workshopsCount = 0;
  let conferencesCount = 0;
  let onlineTalks = 0;
  let physicalTalks = 0;

  const enrichedEvents: EnrichedSpeakingEvent[] = rawEvents.map((ev) => {
    const cityTrimmed = ev.city.trim();
    const isOnline = cityTrimmed.toLowerCase() === 'online';
    const sessionType = inferSessionFormat(ev);
    const topicCategories = classifyTopicCategories(ev);
    const primaryCategory = topicCategories[0];
    const year = ev.date.slice(0, 4);

    if (sessionType === 'keynote') keynotesCount += 1;
    else if (sessionType === 'workshop') workshopsCount += 1;
    else conferencesCount += 1;

    if (isOnline) {
      onlineTalks += 1;
      return {
        ...ev,
        isOnline: true,
        locationId: null,
        cityName: 'Online',
        countryName: 'Global / Online',
        countryCode: 'GL',
        flag: '🌐',
        regionId: 'online',
        regionName: 'Online & Global',
        lat: null,
        lon: null,
        year,
        sessionType,
        topicCategories,
        primaryCategory,
      };
    }

    const verified = locationByCityKey.get(cityTrimmed);
    if (!verified) {
      unverifiedLocations.push({
        eventId: ev.id,
        cityString: cityTrimmed,
        reason: `Physical location "${cityTrimmed}" is not present in verified data/locations.json registry and was excluded from globe plotting.`,
      });
      return {
        ...ev,
        isOnline: false,
        locationId: null,
        cityName: cityTrimmed,
        countryName: 'Unverified',
        countryCode: 'UN',
        flag: '📍',
        regionId: 'unverified',
        regionName: 'Unverified',
        lat: null,
        lon: null,
        year,
        sessionType,
        topicCategories,
        primaryCategory,
      };
    }

    physicalTalks += 1;
    const enriched: EnrichedSpeakingEvent = {
      ...ev,
      isOnline: false,
      locationId: verified.id,
      cityName: verified.city,
      countryName: verified.country,
      countryCode: verified.countryCode,
      flag: verified.flag,
      regionId: verified.regionId,
      regionName: verified.regionName,
      lat: verified.lat,
      lon: verified.lon,
      year,
      sessionType,
      topicCategories,
      primaryCategory,
    };

    const existingList = cityEventsMap.get(verified.id) ?? [];
    existingList.push(enriched);
    cityEventsMap.set(verified.id, existingList);

    return enriched;
  });

  // Sort events descending chronologically
  enrichedEvents.sort(
    (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id)
  );

  // Build CityDestination records for all verified physical locations that have >= 1 event
  const cities: CityDestination[] = [];
  for (const loc of verifiedLocations) {
    const evList = cityEventsMap.get(loc.id) ?? [];
    if (evList.length === 0) continue;

    evList.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
    const years = Array.from(new Set(evList.map((e) => e.year))).sort((a, b) =>
      b.localeCompare(a)
    );
    const cats = Array.from(
      new Set(evList.flatMap((e) => e.topicCategories))
    ) as TopicCategoryId[];

    cities.push({
      ...loc,
      eventsCount: evList.length,
      events: evList,
      latestDate: evList[0].date,
      years,
      topicCategories: cats,
      position3D: latLonToVector3(loc.lat, loc.lon, GLOBE_RADIUS),
    });
  }

  // Sort cities by eventsCount desc, then latestDate desc
  cities.sort(
    (a, b) =>
      b.eventsCount - a.eventsCount ||
      b.latestDate.localeCompare(a.latestDate) ||
      a.city.localeCompare(b.city)
  );

  const uniqueCountries = new Set(cities.map((c) => c.countryCode)).size;
  const uniqueCities = cities.length;

  // Regional summaries
  const regionMeta: Array<{ id: string; name: string; color: string }> = [
    { id: 'turkiye', name: 'Türkiye', color: '#38BDF8' },
    { id: 'central-asia', name: 'Central Asia', color: '#F59E0B' },
    { id: 'mena', name: 'Middle East & North Africa', color: '#A855F7' },
    { id: 'balkans-caucasus', name: 'Balkans & Caucasus', color: '#10B981' },
  ];

  const regions: RegionSummary[] = regionMeta.map((rm) => {
    const regCities = cities.filter((c) => c.regionId === rm.id);
    const regCountries = new Set(regCities.map((c) => c.countryCode)).size;
    const regTalks = regCities.reduce((acc, c) => acc + c.eventsCount, 0);
    return {
      id: rm.id,
      name: rm.name,
      color: rm.color,
      talksCount: regTalks,
      citiesCount: regCities.length,
      countriesCount: regCountries,
      cities: regCities,
    };
  });

  // Topic category summaries
  const topicDefinitions: Array<{
    id: TopicCategoryId;
    label: string;
    shortLabel: string;
    subLabel: string;
    color: string;
  }> = [
    {
      id: 'ai',
      label: 'Generative AI & AI Agents',
      shortLabel: 'AI Agents & GenAI',
      subLabel: 'ADK · Gemini · Multi-Agent Systems',
      color: '#38BDF8',
    },
    {
      id: 'kubernetes',
      label: 'Kubernetes & Platform Engineering',
      shortLabel: 'Kubernetes & GKE',
      subLabel: 'GKE Enterprise · Scheduling · Fleets',
      color: '#F59E0B',
    },
    {
      id: 'cloud',
      label: 'Google Cloud & Serverless',
      shortLabel: 'Google Cloud & SRE',
      subLabel: 'Cloud Architecture · Cloud Run · SRE',
      color: '#60A5FA',
    },
    {
      id: 'mlops',
      label: 'AI/ML & MLOps Infrastructure',
      shortLabel: 'AI/ML & MLOps',
      subLabel: 'Vertex AI · GPU Inference · Pipelines',
      color: '#10B981',
    },
  ];

  const topics: TopicCategorySummary[] = topicDefinitions.map((td) => {
    const matchingEvents = enrichedEvents.filter((e) =>
      e.topicCategories.includes(td.id)
    );
    const physMatching = matchingEvents.filter((e) => !e.isOnline && e.locationId);
    const cSet = new Set(physMatching.map((e) => e.locationId));
    const countrySet = new Set(physMatching.map((e) => e.countryCode));
    return {
      ...td,
      talksCount: matchingEvents.length,
      citiesCount: cSet.size,
      countriesCount: countrySet.size,
    };
  });

  // Years summary
  const yearSet = Array.from(new Set(enrichedEvents.map((e) => e.year))).sort((a, b) =>
    b.localeCompare(a)
  );
  const years = yearSet.map((yr) => {
    const yrEvents = enrichedEvents.filter((e) => e.year === yr);
    const yrPhysCities = new Set(
      yrEvents.filter((e) => !e.isOnline && e.locationId).map((e) => e.locationId)
    );
    return {
      year: yr,
      talksCount: yrEvents.length,
      citiesCount: yrPhysCities.size,
    };
  });

  // Build Great-Circle Travel Routes between Istanbul Base Hub & verified physical destinations,
  // plus chronological international hops
  const routes: TravelRouteArc[] = [];
  const baseHub = cities.find((c) => c.isBaseHub) ?? cities[0];

  if (baseHub) {
    for (const dest of cities) {
      if (dest.id === baseHub.id) continue;
      const distKm = haversineDistanceKm(
        baseHub.lat,
        baseHub.lon,
        dest.lat,
        dest.lon
      );
      const isInternational = dest.countryCode !== baseHub.countryCode;
      routes.push({
        id: `route-hub-${baseHub.id}-${dest.id}`,
        fromCityId: baseHub.id,
        toCityId: dest.id,
        fromCity: baseHub.city,
        toCity: dest.city,
        fromCoords: [baseHub.lat, baseHub.lon],
        toCoords: [dest.lat, dest.lon],
        distanceKm: distKm,
        kind: 'hub',
        year: dest.latestDate.slice(0, 4),
        color: isInternational ? '#38BDF8' : '#F59E0B',
        points3D: computeGreatCircleArcPoints(
          baseHub.lat,
          baseHub.lon,
          dest.lat,
          dest.lon,
          GLOBE_RADIUS
        ),
      });
    }
  }

  // Also add sequential chronological cross-border speaking hops
  const chronologicalPhysical = [...enrichedEvents]
    .filter((e) => !e.isOnline && e.locationId && e.lat !== null && e.lon !== null)
    .reverse();

  const seenRoutePairs = new Set(
    routes.map((r) => [r.fromCityId, r.toCityId].sort().join('--'))
  );

  for (let i = 0; i < chronologicalPhysical.length - 1; i++) {
    const curr = chronologicalPhysical[i];
    const next = chronologicalPhysical[i + 1];
    if (!curr.locationId || !next.locationId || curr.locationId === next.locationId) {
      continue;
    }
    const pairKey = [curr.locationId, next.locationId].sort().join('--');
    if (seenRoutePairs.has(pairKey)) continue;
    seenRoutePairs.add(pairKey);

    const distKm = haversineDistanceKm(
      curr.lat!,
      curr.lon!,
      next.lat!,
      next.lon!
    );
    routes.push({
      id: `route-seq-${curr.locationId}-${next.locationId}`,
      fromCityId: curr.locationId,
      toCityId: next.locationId,
      fromCity: curr.cityName,
      toCity: next.cityName,
      fromCoords: [curr.lat!, curr.lon!],
      toCoords: [next.lat!, next.lon!],
      distanceKm: distKm,
      kind: 'chronological',
      year: next.year,
      color: '#FBBF24',
      points3D: computeGreatCircleArcPoints(
        curr.lat!,
        curr.lon!,
        next.lat!,
        next.lon!,
        GLOBE_RADIUS
      ),
    });
  }

  // Audit same-date events
  const byDate = new Map<string, EnrichedSpeakingEvent[]>();
  for (const ev of enrichedEvents) {
    const list = byDate.get(ev.date) ?? [];
    list.push(ev);
    byDate.set(ev.date, list);
  }
  const sameDateFindings: SameDateFinding[] = [];
  for (const [date, list] of byDate.entries()) {
    if (list.length > 1) {
      sameDateFindings.push({
        date,
        eventIds: list.map((e) => e.id),
        descriptions: list.map((e) => `${e.event} (${e.city}): "${e.talk}"`),
      });
    }
  }

  return {
    metrics: {
      totalTalks: enrichedEvents.length,
      physicalTalks,
      onlineTalks,
      uniqueCountries,
      uniqueCities,
      uniqueRegions: regions.length,
      keynotesCount,
      workshopsCount,
      conferencesCount,
    },
    events: enrichedEvents,
    cities,
    regions,
    topics,
    years,
    routes,
    unverifiedLocations,
    sameDateFindings,
  };
}
