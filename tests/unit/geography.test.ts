import { describe, expect, it } from 'vitest';
import rawEvents from '../../data/events.json';
import rawLocations from '../../data/locations.json';
import {
  buildSpeakingAtlas,
  computeGreatCircleArcPoints,
  GLOBE_RADIUS,
  haversineDistanceKm,
  latLonToVector3,
} from '../../src/utils/geography';

describe('Global Speaking Atlas Geographic & Aggregation Engine', () => {
  it('computes exact metrics from authoritative data/events.json and data/locations.json', () => {
    const atlas = buildSpeakingAtlas(rawEvents, rawLocations);

    expect(atlas.metrics.totalTalks).toBe(44);
    expect(atlas.metrics.physicalTalks).toBe(38);
    expect(atlas.metrics.onlineTalks).toBe(6);
    expect(atlas.metrics.uniqueCountries).toBe(12);
    expect(atlas.metrics.uniqueCities).toBe(23);
    expect(atlas.unverifiedLocations).toHaveLength(0);
  });

  it('aggregates multiple appearances in the same city into a single CityDestination without duplicating markers', () => {
    const atlas = buildSpeakingAtlas(rawEvents, rawLocations);

    const istanbul = atlas.cities.find((c) => c.id === 'istanbul-tr');
    expect(istanbul).toBeDefined();
    expect(istanbul!.eventsCount).toBe(7);
    expect(istanbul!.events).toHaveLength(7);

    const sarajevo = atlas.cities.find((c) => c.id === 'sarajevo-ba');
    expect(sarajevo).toBeDefined();
    expect(sarajevo!.eventsCount).toBe(3);

    const almaty = atlas.cities.find((c) => c.id === 'almaty-kz');
    expect(almaty).toBeDefined();
    expect(almaty!.eventsCount).toBe(2);
  });

  it('never plots Online events as physical city destinations or route endpoints', () => {
    const atlas = buildSpeakingAtlas(rawEvents, rawLocations);

    const onlineCity = atlas.cities.find(
      (c) => c.city.toLowerCase() === 'online' || c.id === 'online'
    );
    expect(onlineCity).toBeUndefined();

    const onlineEvents = atlas.events.filter((e) => e.isOnline);
    expect(onlineEvents).toHaveLength(6);
    for (const ev of onlineEvents) {
      expect(ev.locationId).toBeNull();
      expect(ev.lat).toBeNull();
      expect(ev.lon).toBeNull();
    }

    for (const route of atlas.routes) {
      expect(route.fromCityId).not.toBe('online');
      expect(route.toCityId).not.toBe('online');
    }
  });

  it('flags unverified physical locations for review instead of silently plotting or guessing coordinates', () => {
    const mockEvents = [
      ...rawEvents,
      {
        id: 'mystery-conf-atlantis-2026',
        date: '2026-11-01',
        event: 'Atlantis Cloud Summit',
        city: 'Atlantis, Ocean',
        talk: 'Subsea Kubernetes Clusters',
        photos: [],
        description: 'Test unverified location handling.',
        topics: ['Kubernetes'],
      },
    ];

    const atlas = buildSpeakingAtlas(mockEvents, rawLocations);
    expect(atlas.unverifiedLocations).toHaveLength(1);
    expect(atlas.unverifiedLocations[0].eventId).toBe('mystery-conf-atlantis-2026');
    expect(atlas.unverifiedLocations[0].cityString).toBe('Atlantis, Ocean');
    // Physical cities count remains 23 (never silently plotted)
    expect(atlas.metrics.uniqueCities).toBe(23);
  });

  it('generates valid spherical 3D coordinates and elevated great-circle route arcs', () => {
    const istanbul3D = latLonToVector3(41.0082, 28.9784, GLOBE_RADIUS);
    const radiusCheck = Math.hypot(istanbul3D[0], istanbul3D[1], istanbul3D[2]);
    expect(radiusCheck).toBeCloseTo(GLOBE_RADIUS, 3);

    const arc = computeGreatCircleArcPoints(
      41.0082,
      28.9784,
      43.222,
      76.8512,
      GLOBE_RADIUS,
      20
    );
    expect(arc).toHaveLength(21);

    // Start and end points lie on the sphere surface, midpoint is elevated above GLOBE_RADIUS
    const startR = Math.hypot(arc[0][0], arc[0][1], arc[0][2]);
    const midR = Math.hypot(arc[10][0], arc[10][1], arc[10][2]);
    const endR = Math.hypot(arc[20][0], arc[20][1], arc[20][2]);

    expect(startR).toBeCloseTo(GLOBE_RADIUS, 3);
    expect(endR).toBeCloseTo(GLOBE_RADIUS, 3);
    expect(midR).toBeGreaterThan(GLOBE_RADIUS);

    const distIstanbulAlmaty = haversineDistanceKm(41.0082, 28.9784, 43.222, 76.8512);
    expect(distIstanbulAlmaty).toBeGreaterThan(3800);
    expect(distIstanbulAlmaty).toBeLessThan(4100);
  });
});
