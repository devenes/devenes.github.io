import { describe, expect, it } from 'vitest';
import rawArchive from '../../src/data/talks.json';
import { getOrbitTelemetry, validateArchive } from '../../src/utils/metrics';
import type { OrbitArchive, Talk } from '../../src/schemas/talkSchema';

const baseArchive = validateArchive(rawArchive);

function createMockTalk(overrides: Partial<Talk>): Talk {
  return {
    id: 'mock-talk-1',
    eventId: 'mock-event-1',
    title: 'Mock Talk Title',
    event: 'Mock Conference',
    city: 'Almaty',
    country: 'Kazakhstan',
    countryCode: 'KZ',
    coords: [43.222, 76.8512],
    date: '2025-03-15',
    type: 'conference',
    primaryCluster: 'ai',
    topics: ['ai'],
    featured: false,
    summary: 'Mock summary',
    image: 'images/talks/devfest-almaty-2025-keynote.svg',
    links: { event: '', slides: '', video: '' },
    ...overrides,
  };
}

describe('ORBIT Telemetry & Metric Deduplication Engine', () => {
  it('accurately computes totalTalks, uniqueCountries, uniqueCities, uniqueEvents, workshopsCount, and keynotesCount on seed data', () => {
    const telemetry = getOrbitTelemetry(baseArchive);

    expect(telemetry.totalTalks).toBe(baseArchive.talks.length);
    expect(telemetry.uniqueCountries).toBe(18);
    expect(telemetry.uniqueCities).toBeGreaterThanOrEqual(24);
    // Because devfest-almaty-2025 and devfest-ulaanbaatar-2023 each have 2 sessions, uniqueEvents is totalTalks - 2
    expect(telemetry.uniqueEvents).toBe(baseArchive.talks.length - 2);

    const manualWorkshops = baseArchive.talks.filter((t) => t.type === 'workshop').length;
    const manualKeynotes = baseArchive.talks.filter((t) => t.type === 'keynote').length;
    expect(telemetry.workshopsCount).toBe(manualWorkshops);
    expect(telemetry.keynotesCount).toBe(manualKeynotes);
  });

  it('deduplicates shared eventId, city, and countryCode when 2 talks occur at the same conference', () => {
    const talkA = createMockTalk({
      id: 'devfest-almaty-keynote',
      eventId: 'devfest-almaty-2025',
      city: 'Almaty',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      type: 'keynote',
    });
    const talkB = createMockTalk({
      id: 'devfest-almaty-workshop',
      eventId: 'devfest-almaty-2025',
      city: 'Almaty',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      type: 'workshop',
    });

    const mockArchive: OrbitArchive = {
      ...baseArchive,
      talks: [talkA, talkB],
    };

    const telemetry = getOrbitTelemetry(mockArchive);
    expect(telemetry.totalTalks).toBe(2);
    expect(telemetry.uniqueEvents).toBe(1);
    expect(telemetry.uniqueCities).toBe(1);
    expect(telemetry.uniqueCountries).toBe(1);
    expect(telemetry.keynotesCount).toBe(1);
    expect(telemetry.workshopsCount).toBe(1);
  });

  it('counts two cities with the same name in different countries as 2 distinct cities', () => {
    const parisFrance = createMockTalk({
      id: 'talk-paris-fr',
      eventId: 'event-paris-fr',
      city: 'Paris',
      country: 'France',
      countryCode: 'FR',
    });
    const parisTexas = createMockTalk({
      id: 'talk-paris-us',
      eventId: 'event-paris-us',
      city: 'Paris',
      country: 'United States',
      countryCode: 'US',
    });

    const mockArchive: OrbitArchive = {
      ...baseArchive,
      talks: [parisFrance, parisTexas],
    };

    const telemetry = getOrbitTelemetry(mockArchive);
    expect(telemetry.totalTalks).toBe(2);
    expect(telemetry.uniqueCountries).toBe(2);
    expect(telemetry.uniqueCities).toBe(2);
  });

  it('returns exactly 3 recentSignals in descending chronological order matching the reference cards', () => {
    const telemetry = getOrbitTelemetry(baseArchive);
    expect(telemetry.recentSignals).toHaveLength(3);

    const [first, second, third] = telemetry.recentSignals;
    expect(first.date >= second.date).toBe(true);
    expect(second.date >= third.date).toBe(true);

    expect(first.event).toBe('DevFest Almaty');
    expect(second.event).toBe('KCD Istanbul');
    expect(third.event).toBe('Build with AI');
  });
});
