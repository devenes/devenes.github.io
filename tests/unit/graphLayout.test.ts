import { describe, expect, it } from 'vitest';
import rawArchive from '../../src/data/talks.json';
import { validateArchive } from '../../src/utils/metrics';
import {
  computeOrbitLayout,
  DEFAULT_CLUSTER_ANCHORS,
  distance3D,
  type Vec3Tuple,
} from '../../src/utils/graphLayout';
import type { OrbitArchive, Talk } from '../../src/schemas/talkSchema';

const archive = validateArchive(rawArchive);

describe('ORBIT Deterministic 3D Graph Layout Engine', () => {
  it('produces 100% identical (x, y, z) coordinates across repeated runs', () => {
    const run1 = computeOrbitLayout(archive);
    const run2 = computeOrbitLayout(archive);

    expect(run1.talkNodes.length).toBe(run2.talkNodes.length);
    for (let i = 0; i < run1.talkNodes.length; i++) {
      expect(run1.talkNodes[i].id).toBe(run2.talkNodes[i].id);
      expect(run1.talkNodes[i].position).toEqual(run2.talkNodes[i].position);
    }
    expect(run1.edges).toEqual(run2.edges);
  });

  it('guarantees finite coordinates (no NaN or Infinity) for all nodes and edges', () => {
    const layout = computeOrbitLayout(archive);

    for (const cNode of layout.clusterNodes) {
      for (const coord of cNode.position) {
        expect(Number.isFinite(coord)).toBe(true);
      }
    }

    for (const tNode of layout.talkNodes) {
      for (const coord of tNode.position) {
        expect(Number.isFinite(coord)).toBe(true);
      }
    }

    for (const edge of layout.edges) {
      for (const coord of [...edge.sourcePos, ...edge.targetPos, ...edge.controlPos]) {
        expect(Number.isFinite(coord)).toBe(true);
      }
    }
  });

  it('enforces minimum separation distance (minDistance >= 0.25) between all talk nodes', () => {
    const layout = computeOrbitLayout(archive, 0.28);
    const nodes = layout.talkNodes;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = distance3D(nodes[i].position, nodes[j].position);
        expect(
          dist,
          `Expected nodes ${nodes[i].id} and ${nodes[j].id} to be separated by >= 0.25, got ${dist}`
        ).toBeGreaterThanOrEqual(0.25);
      }
    }
  });

  it('applies barycentric pull toward secondary topic cluster anchors', () => {
    const aiAnchor = DEFAULT_CLUSTER_ANCHORS.ai;
    const k8sAnchor = DEFAULT_CLUSTER_ANCHORS.k8s;
    const midpointAiK8s: Vec3Tuple = [
      (aiAnchor[0] + k8sAnchor[0]) / 2,
      (aiAnchor[1] + k8sAnchor[1]) / 2,
      (aiAnchor[2] + k8sAnchor[2]) / 2,
    ];

    const baseTalk: Talk = {
      id: 'bary-ai-k8s',
      eventId: 'ev-1',
      title: 'AI and K8s Hybrid Talk',
      event: 'DevFest',
      city: 'Almaty',
      country: 'Kazakhstan',
      countryCode: 'KZ',
      coords: [43.22, 76.85],
      date: '2025-03-15',
      type: 'conference',
      primaryCluster: 'ai',
      topics: ['ai', 'k8s'],
      featured: false,
      image: 'images/talks/devfest-almaty-2025-keynote.svg',
      links: { event: '', slides: '', video: '' },
    };

    const workshopsOnlyTalk: Talk = {
      ...baseTalk,
      id: 'bary-workshops-only',
      primaryCluster: 'workshops',
      topics: ['workshops'],
    };

    const customArchive: OrbitArchive = {
      ...archive,
      talks: [baseTalk, workshopsOnlyTalk],
    };

    const layout = computeOrbitLayout(customArchive);
    const hybridNode = layout.talkNodes.find((n) => n.id === 'bary-ai-k8s')!;
    const workshopsNode = layout.talkNodes.find((n) => n.id === 'bary-workshops-only')!;

    const distHybridToMidpoint = distance3D(hybridNode.position, midpointAiK8s);
    const distWorkshopsToMidpoint = distance3D(workshopsNode.position, midpointAiK8s);

    expect(distHybridToMidpoint).toBeLessThan(distWorkshopsToMidpoint);
  });
});
