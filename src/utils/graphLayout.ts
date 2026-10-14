import type { Cluster, ClusterId, OrbitArchive, Talk } from '../schemas/talkSchema';

export type Vec3Tuple = [number, number, number];

export interface ClusterNode3D extends Cluster {
  position: Vec3Tuple;
}

export interface TalkNode3D {
  id: string;
  talk: Talk;
  position: Vec3Tuple;
  barycenter: Vec3Tuple;
  primaryCluster: ClusterId;
  topics: ClusterId[];
  color: string;
  radius: number;
}

export interface OrbitEdge3D {
  id: string;
  sourceId: string;
  targetId: string;
  sourcePos: Vec3Tuple;
  targetPos: Vec3Tuple;
  controlPos: Vec3Tuple;
  kind: 'primary' | 'secondary' | 'country' | 'chronology';
  clusterId: ClusterId;
  color: string;
  opacity: number;
}

export interface OrbitGraphLayout {
  clusterNodes: ClusterNode3D[];
  talkNodes: TalkNode3D[];
  edges: OrbitEdge3D[];
}

export const DEFAULT_CLUSTER_ANCHORS: Record<ClusterId, Vec3Tuple> = {
  ai: [0.8, 2.3, 0.2],
  k8s: [4.6, 1.5, -0.8],
  cloud: [0.4, -0.3, 1.1],
  workshops: [4.2, -1.6, 0.6],
};

/**
 * Deterministic 32-bit string hash (FNV-1a variant) to seed Mulberry32 PRNG.
 */
export function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Mulberry32 deterministic PRNG returning values in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function next(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function distance3D(a: Vec3Tuple, b: Vec3Tuple): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function roundCoord(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 1e6) / 1e6;
}

/**
 * Computes the deterministic 3D constellation layout for clusters, talk nodes, and edges.
 */
export function computeOrbitLayout(
  archive: OrbitArchive,
  minDistance = 0.28
): OrbitGraphLayout {
  const clusterMap = new Map<ClusterId, ClusterNode3D>();

  const clusterNodes: ClusterNode3D[] = archive.clusters.map((c) => {
    const anchor: Vec3Tuple = c.anchor ?? DEFAULT_CLUSTER_ANCHORS[c.id];
    const node: ClusterNode3D = {
      ...c,
      position: [roundCoord(anchor[0]), roundCoord(anchor[1]), roundCoord(anchor[2])],
    };
    clusterMap.set(c.id, node);
    return node;
  });

  // Fallback for any missing cluster definition in custom test fixtures
  (Object.keys(DEFAULT_CLUSTER_ANCHORS) as ClusterId[]).forEach((cid) => {
    if (!clusterMap.has(cid)) {
      const anchor = DEFAULT_CLUSTER_ANCHORS[cid];
      clusterMap.set(cid, {
        id: cid,
        label: cid.toUpperCase(),
        subLabel: '',
        color: '#38BDF8',
        anchor,
        position: [...anchor],
      });
    }
  });

  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  const total = Math.max(archive.talks.length, 1);

  const talkNodes: TalkNode3D[] = archive.talks.map((talk, index) => {
    const primaryHub = clusterMap.get(talk.primaryCluster)!;
    const secondaryIds = Array.from(
      new Set(talk.topics.filter((t) => t !== talk.primaryCluster))
    );

    let bx = primaryHub.position[0];
    let by = primaryHub.position[1];
    let bz = primaryHub.position[2];

    if (secondaryIds.length > 0) {
      const primaryWeight = 0.65;
      const secondaryWeight = 0.35 / secondaryIds.length;
      bx = primaryHub.position[0] * primaryWeight;
      by = primaryHub.position[1] * primaryWeight;
      bz = primaryHub.position[2] * primaryWeight;

      for (const sid of secondaryIds) {
        const secHub = clusterMap.get(sid)!;
        bx += secHub.position[0] * secondaryWeight;
        by += secHub.position[1] * secondaryWeight;
        bz += secHub.position[2] * secondaryWeight;
      }
    }

    const barycenter: Vec3Tuple = [roundCoord(bx), roundCoord(by), roundCoord(bz)];

    // Deterministic spherical Fibonacci + PRNG jitter per talk.id
    const seed = hashString(talk.id);
    const rand = mulberry32(seed);

    const sampleIdx = (index + 0.5) / total;
    const phi = Math.acos(1 - 2 * ((sampleIdx + rand() * 0.35) % 1));
    const theta = index * GOLDEN_ANGLE + rand() * Math.PI * 0.5;
    const shellRadius = 0.45 + rand() * 0.48;

    const ox = shellRadius * Math.sin(phi) * Math.cos(theta);
    const oy = shellRadius * Math.sin(phi) * Math.sin(theta) * 0.85;
    const oz = shellRadius * Math.cos(phi);

    const position: Vec3Tuple = [
      roundCoord(barycenter[0] + ox),
      roundCoord(barycenter[1] + oy),
      roundCoord(barycenter[2] + oz),
    ];

    const baseRadius =
      talk.type === 'keynote' ? 0.12 : talk.type === 'workshop' ? 0.1 : 0.085;

    return {
      id: talk.id,
      talk,
      position,
      barycenter,
      primaryCluster: talk.primaryCluster,
      topics: Array.from(new Set([talk.primaryCluster, ...talk.topics])),
      color: primaryHub.color,
      radius: talk.featured ? baseRadius * 1.25 : baseRadius,
    };
  });

  // Deterministic minimum separation pass so no two talk nodes ever overlap (< minDistance)
  const targetSep = Math.max(minDistance, 0.28);
  for (let iter = 0; iter < 16; iter++) {
    let moved = false;
    for (let i = 0; i < talkNodes.length; i++) {
      // Also keep talk nodes slightly clear of cluster hub centers
      for (const hub of clusterNodes) {
        const distHub = distance3D(talkNodes[i].position, hub.position);
        const hubMin = 0.32;
        if (distHub < hubMin) {
          const dx = talkNodes[i].position[0] - hub.position[0] || 0.01;
          const dy = talkNodes[i].position[1] - hub.position[1] || 0.01;
          const dz = talkNodes[i].position[2] - hub.position[2] || 0.01;
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
          const push = hubMin - distHub + 0.02;
          talkNodes[i].position = [
            roundCoord(talkNodes[i].position[0] + (dx / len) * push),
            roundCoord(talkNodes[i].position[1] + (dy / len) * push),
            roundCoord(talkNodes[i].position[2] + (dz / len) * push),
          ];
          moved = true;
        }
      }

      for (let j = i + 1; j < talkNodes.length; j++) {
        const a = talkNodes[i];
        const b = talkNodes[j];
        const dist = distance3D(a.position, b.position);
        if (dist < targetSep) {
          let dx = b.position[0] - a.position[0];
          let dy = b.position[1] - a.position[1];
          let dz = b.position[2] - a.position[2];
          let len = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (len < 1e-5) {
            const angle = (i + 1) * GOLDEN_ANGLE;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            dz = 0.5;
            len = Math.sqrt(dx * dx + dy * dy + dz * dz);
          }
          const push = (targetSep - dist + 0.02) * 0.5;
          const nx = (dx / len) * push;
          const ny = (dy / len) * push;
          const nz = (dz / len) * push;

          a.position = [
            roundCoord(a.position[0] - nx),
            roundCoord(a.position[1] - ny),
            roundCoord(a.position[2] - nz),
          ];
          b.position = [
            roundCoord(b.position[0] + nx),
            roundCoord(b.position[1] + ny),
            roundCoord(b.position[2] + nz),
          ];
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  // Generate curved filament edges
  const edges: OrbitEdge3D[] = [];
  const makeControlPoint = (
    p1: Vec3Tuple,
    p2: Vec3Tuple,
    arcLift: number
  ): Vec3Tuple => {
    const mx = (p1[0] + p2[0]) * 0.5;
    const my = (p1[1] + p2[1]) * 0.5 + arcLift;
    const mz = (p1[2] + p2[2]) * 0.5 + arcLift * 0.45;
    return [roundCoord(mx), roundCoord(my), roundCoord(mz)];
  };

  for (const node of talkNodes) {
    const primaryHub = clusterMap.get(node.primaryCluster)!;
    edges.push({
      id: `edge-primary-${node.id}-${node.primaryCluster}`,
      sourceId: `cluster-${node.primaryCluster}`,
      targetId: node.id,
      sourcePos: [...primaryHub.position],
      targetPos: [...node.position],
      controlPos: makeControlPoint(primaryHub.position, node.position, 0.28),
      kind: 'primary',
      clusterId: node.primaryCluster,
      color: primaryHub.color,
      opacity: 0.42,
    });

    for (const topic of node.topics) {
      if (topic === node.primaryCluster) continue;
      const secHub = clusterMap.get(topic)!;
      edges.push({
        id: `edge-secondary-${node.id}-${topic}`,
        sourceId: `cluster-${topic}`,
        targetId: node.id,
        sourcePos: [...secHub.position],
        targetPos: [...node.position],
        controlPos: makeControlPoint(secHub.position, node.position, -0.22),
        kind: 'secondary',
        clusterId: topic,
        color: secHub.color,
        opacity: 0.22,
      });
    }
  }

  // Connect talks within the same countryCode
  const byCountry = new Map<string, TalkNode3D[]>();
  for (const node of talkNodes) {
    const code = node.talk.countryCode.toUpperCase();
    const list = byCountry.get(code) ?? [];
    list.push(node);
    byCountry.set(code, list);
  }

  for (const [code, list] of byCountry.entries()) {
    if (list.length < 2) continue;
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      edges.push({
        id: `edge-country-${code}-${a.id}-${b.id}`,
        sourceId: a.id,
        targetId: b.id,
        sourcePos: [...a.position],
        targetPos: [...b.position],
        controlPos: makeControlPoint(a.position, b.position, 0.16),
        kind: 'country',
        clusterId: a.primaryCluster,
        color: a.color,
        opacity: 0.16,
      });
    }
  }

  return {
    clusterNodes,
    talkNodes,
    edges,
  };
}
