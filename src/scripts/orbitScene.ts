import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import type { ClusterId, OrbitArchive, Talk } from '../schemas/talkSchema';
import {
  computeOrbitLayout,
  type OrbitGraphLayout,
} from '../utils/graphLayout';
import { formatSignalDate } from '../utils/paths';

export interface OrbitSceneCallbacks {
  onSelectTalk: (talk: Talk) => void;
  onSelectCluster: (clusterId: ClusterId) => void;
  onUserCanvasDrag: () => void;
}

const WAVE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  attribute float aScale;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vAlpha;

  // Compact 3D Simplex-like harmonic noise for smooth topographic wave undulation
  float waveNoise(vec3 p) {
    return sin(p.x * 0.75 + uTime * 0.55) * cos(p.z * 0.65 - uTime * 0.4) * 0.55
         + sin(p.x * 1.4 - p.z * 1.1 + uTime * 0.35) * 0.25;
  }

  void main() {
    vColor = aColor;
    vec3 pos = position;
    float elevation = waveNoise(pos);
    pos.y += elevation;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float distAtten = clamp(18.0 / -mvPosition.z, 0.5, 3.2);
    gl_PointSize = aScale * distAtten;
    vAlpha = clamp(0.18 + (elevation + 0.8) * 0.38, 0.12, 0.88);
  }
`;

const WAVE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord.xy - vec2(0.5);
    float d = length(uv);
    if (d > 0.5) discard;
    float softEdge = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(vColor, vAlpha * softEdge);
  }
`;

function createRadialGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.18)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export class OrbitSceneController {
  private container: HTMLElement;
  private layout: OrbitGraphLayout;
  private callbacks: OrbitSceneCallbacks;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private waveMaterial: THREE.ShaderMaterial | null = null;

  private talkMeshes = new Map<string, THREE.Mesh>();
  private talkMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private talkGlowSprites = new Map<string, THREE.Sprite>();
  private clusterGroupMap = new Map<ClusterId, THREE.Group>();
  private edgeLines: Array<{
    line: THREE.Line;
    material: THREE.LineBasicMaterial;
    clusterId: ClusterId;
    sourceId: string;
    targetId: string;
    baseOpacity: number;
  }> = [];

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-999, -999);

  private isPaused = false;
  private isWebGLAvailable = false;
  private currentMode: string = 'overview';
  private activeCluster: ClusterId | 'all' = 'all';
  private activeCountry = 'all';
  private activeYear = 'all';
  private rafId: number | null = null;
  private startTime = performance.now();

  constructor(
    container: HTMLElement,
    archive: OrbitArchive,
    callbacks: OrbitSceneCallbacks
  ) {
    this.container = container;
    this.layout = computeOrbitLayout(archive);
    this.callbacks = callbacks;
    this.init();
  }

  public getLayout(): OrbitGraphLayout {
    return this.layout;
  }

  private init(): void {
    try {
      const scene = new THREE.Scene();
      const width = window.innerWidth || 1280;
      const height = window.innerHeight || 800;

      const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
      // In Overview Mode, shift camera target slightly left so the constellation sweeps across the right 65% of the viewport
      camera.position.set(0.2, 0.6, 10.5);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      this.container.innerHTML = '';
      this.container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.enablePan = true;
      controls.minDistance = 3.2;
      controls.maxDistance = 20;
      // Offset lookAt target slightly left in overview mode so nodes sit in the right 65%
      controls.target.set(0.8, 0.3, 0);
      controls.update();

      let pointerDownPos = { x: 0, y: 0 };
      renderer.domElement.addEventListener('pointerdown', (e) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      });
      renderer.domElement.addEventListener('pointerup', (e) => {
        const dx = Math.abs(e.clientX - pointerDownPos.x);
        const dy = Math.abs(e.clientY - pointerDownPos.y);
        if (dx > 12 || dy > 12) {
          this.callbacks.onUserCanvasDrag();
        } else {
          this.handleCanvasClick(e);
        }
      });
      renderer.domElement.addEventListener('pointermove', (e) => {
        this.handlePointerMove(e);
      });

      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.controls = controls;
      this.isWebGLAvailable = true;

      this.buildTopographicWave(scene);
      this.buildConstellation(scene);
      this.projectClusterLabels();

      window.addEventListener('resize', () => this.handleResize());
      this.startLoop();
    } catch {
      // Headless browser fallback when WebGL context cannot be created
      this.isWebGLAvailable = false;
      this.projectFallbackClusterLabels();
    }
  }

  /**
   * Layer 1: 12,800+ micro-particles arranged along a 3D topographic ribbon wave
   * undulating gently via a custom GLSL vertex shader.
   */
  private buildTopographicWave(scene: THREE.Scene): void {
    const count = 12800;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    const cDeep = new THREE.Color('#0E2A5C');
    const cCyan = new THREE.Color('#38BDF8');
    const cGold = new THREE.Color('#F59E0B');

    const cols = 160;
    const rows = 80;

    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = r / (rows - 1);

        const x = (u - 0.35) * 16.5;
        const z = (v - 0.5) * 9.5;
        const y =
          Math.sin(u * Math.PI * 2.2) * 1.1 +
          Math.cos(v * Math.PI * 1.8) * 0.55 -
          0.4;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        scales[i] = 1.6 + ((r * 13 + c * 7) % 10) * 0.24;

        const mixRatio = Math.min(1, Math.max(0, u * 0.85 + (v - 0.5) * 0.25));
        const col = cDeep.clone().lerp(cCyan, mixRatio);
        if ((r + c) % 29 === 0) {
          col.lerp(cGold, 0.45);
        }

        colors[i * 3] = col.r;
        colors[i * 3 + 1] = col.g;
        colors[i * 3 + 2] = col.b;
        i++;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

    this.waveMaterial = new THREE.ShaderMaterial({
      vertexShader: WAVE_VERTEX_SHADER,
      fragmentShader: WAVE_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const points = new THREE.Points(geometry, this.waveMaterial);
    scene.add(points);
  }

  /**
   * Layer 2 & 3: 4 Cluster Hub energy spheres, individual talk nodes, and QuadraticBezier filaments.
   */
  private buildConstellation(scene: THREE.Scene): void {
    const glowTexture = createRadialGlowTexture();

    // Layer 2: 4 Primary Cluster Hub Nodes
    for (const cluster of this.layout.clusterNodes) {
      const group = new THREE.Group();
      group.position.set(...cluster.position);

      const coreGeo = new THREE.SphereGeometry(0.22, 28, 28);
      const coreMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cluster.color),
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      group.add(coreMesh);

      // Outer wireframe orbital ring
      const ringGeo = new THREE.RingGeometry(0.32, 0.35, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(cluster.color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.45,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      group.add(ringMesh);

      if (glowTexture) {
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTexture,
          color: new THREE.Color(cluster.color),
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.85, 1.85, 1);
        group.add(sprite);
      }

      scene.add(group);
      this.clusterGroupMap.set(cluster.id, group);
    }

    // Layer 3A: Curved Filaments (QuadraticBezierCurve3)
    for (const edge of this.layout.edges) {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...edge.sourcePos),
        new THREE.Vector3(...edge.controlPos),
        new THREE.Vector3(...edge.targetPos)
      );
      const pts = curve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(edge.color),
        transparent: true,
        opacity: edge.opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      this.edgeLines.push({
        line,
        material: lineMat,
        clusterId: edge.clusterId,
        sourceId: edge.sourceId,
        targetId: edge.targetId,
        baseOpacity: edge.opacity,
      });
    }

    // Layer 3B: Individual Talk Nodes
    const sphereGeo = new THREE.SphereGeometry(1, 20, 20);
    for (const tNode of this.layout.talkNodes) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(tNode.color),
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.position.set(...tNode.position);
      mesh.scale.setScalar(tNode.radius);
      mesh.userData = { talkId: tNode.id, talk: tNode.talk };

      scene.add(mesh);
      this.talkMeshes.set(tNode.id, mesh);
      this.talkMaterials.set(tNode.id, mat);

      if (glowTexture) {
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTexture,
          color: new THREE.Color(tNode.color),
          transparent: true,
          opacity: tNode.talk.featured ? 0.85 : 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(...tNode.position);
        const glowScale = tNode.radius * 5.2;
        sprite.scale.set(glowScale, glowScale, 1);
        scene.add(sprite);
        this.talkGlowSprites.set(tNode.id, sprite);
      }
    }
  }

  public setPaused(paused: boolean): void {
    if (this.isPaused === paused) return;
    this.isPaused = paused;
    if (paused) {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    } else {
      this.startLoop();
    }
  }

  public isRenderPaused(): boolean {
    return this.isPaused;
  }

  private startLoop(): void {
    if (!this.isWebGLAvailable || this.isPaused || this.rafId !== null) return;

    const tick = () => {
      if (this.isPaused) {
        this.rafId = null;
        return;
      }
      this.rafId = requestAnimationFrame(tick);
      this.renderFrame();
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private renderFrame(): void {
    if (!this.scene || !this.camera || !this.renderer || !this.controls) return;

    const elapsed = (performance.now() - this.startTime) * 0.001;
    if (this.waveMaterial) {
      this.waveMaterial.uniforms.uTime.value = elapsed;
    }

    // Gentle auto-pilot breathing in overview mode
    if (this.currentMode === 'overview') {
      this.camera.position.x = 0.2 + Math.sin(elapsed * 0.22) * 0.35;
      this.camera.position.y = 0.6 + Math.cos(elapsed * 0.18) * 0.22;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.projectClusterLabels();
  }

  /**
   * Projects 3D cluster hub positions to 2D viewport coordinates for floating HTML labels.
   */
  private projectClusterLabels(): void {
    if (!this.camera) return;
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;

    for (const cluster of this.layout.clusterNodes) {
      const el = document.querySelector<HTMLElement>(
        `[data-cluster-hub="${cluster.id}"]`
      );
      if (!el) continue;

      const worldPos = new THREE.Vector3(
        cluster.position[0],
        cluster.position[1] + 0.32,
        cluster.position[2]
      );
      worldPos.project(this.camera);

      if (worldPos.z > 1) {
        el.style.opacity = '0';
        continue;
      }

      const x = (worldPos.x * 0.5 + 0.5) * width;
      const y = (-worldPos.y * 0.5 + 0.5) * height;

      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      const isDimmed =
        this.activeCluster !== 'all' && this.activeCluster !== cluster.id;
      el.style.opacity = isDimmed ? '0.35' : '1';
    }
  }

  private projectFallbackClusterLabels(): void {
    const fallbackCoords: Record<ClusterId, [number, number]> = {
      ai: [0.58, 0.28],
      k8s: [0.82, 0.36],
      cloud: [0.55, 0.62],
      workshops: [0.78, 0.72],
    };
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    for (const cluster of this.layout.clusterNodes) {
      const el = document.querySelector<HTMLElement>(
        `[data-cluster-hub="${cluster.id}"]`
      );
      if (!el) continue;
      const [rx, ry] = fallbackCoords[cluster.id] ?? [0.6, 0.5];
      el.style.transform = `translate3d(${Math.round(rx * width)}px, ${Math.round(ry * height)}px, 0)`;
    }
  }

  public transitionToMode(
    mode: string,
    options?: { clusterId?: ClusterId | 'all'; talkId?: string }
  ): void {
    this.currentMode = mode;
    if (!this.camera || !this.controls) {
      if (options?.clusterId) {
        this.applyFilters(options.clusterId, this.activeCountry, this.activeYear);
      }
      return;
    }

    if (mode === 'overview') {
      this.activeCluster = 'all';
      this.applyFilters('all', 'all', 'all');
      gsap.to(this.camera.position, {
        x: 0.2,
        y: 0.6,
        z: 10.5,
        duration: 1.1,
        ease: 'power3.out',
      });
      gsap.to(this.controls.target, {
        x: 0.8,
        y: 0.3,
        z: 0,
        duration: 1.1,
        ease: 'power3.out',
      });
    } else if (mode === 'explore') {
      this.activeCluster = 'all';
      this.applyFilters('all', this.activeCountry, this.activeYear);
      gsap.to(this.camera.position, {
        x: 2.4,
        y: 0.6,
        z: 8.6,
        duration: 1.1,
        ease: 'power3.out',
      });
      gsap.to(this.controls.target, {
        x: 2.4,
        y: 0.4,
        z: 0.2,
        duration: 1.1,
        ease: 'power3.out',
      });
    } else if (mode === 'cluster-lock' && options?.clusterId && options.clusterId !== 'all') {
      const targetCluster = this.layout.clusterNodes.find(
        (c) => c.id === options.clusterId
      );
      this.applyFilters(options.clusterId, this.activeCountry, this.activeYear);
      if (targetCluster) {
        const [cx, cy, cz] = targetCluster.position;
        gsap.to(this.camera.position, {
          x: cx,
          y: cy + 0.4,
          z: cz + 5.2,
          duration: 1.0,
          ease: 'power3.out',
        });
        gsap.to(this.controls.target, {
          x: cx,
          y: cy,
          z: cz,
          duration: 1.0,
          ease: 'power3.out',
        });
      }
    } else if (mode === 'signal-detail' && options?.talkId) {
      const targetNode = this.layout.talkNodes.find((n) => n.id === options.talkId);
      if (targetNode) {
        const [tx, ty, tz] = targetNode.position;
        gsap.to(this.camera.position, {
          x: tx + 0.8,
          y: ty + 0.3,
          z: tz + 4.2,
          duration: 0.95,
          ease: 'power3.out',
        });
        gsap.to(this.controls.target, {
          x: tx + 0.6,
          y: ty,
          z: tz,
          duration: 0.95,
          ease: 'power3.out',
        });
      }
    }
  }

  /**
   * Filters 3D talk nodes and filaments by cluster, country, and year.
   * Matching nodes pulse at 100% opacity; unrelated nodes dim to 15% opacity.
   */
  public applyFilters(
    clusterId: ClusterId | 'all',
    countryCode = 'all',
    year = 'all'
  ): void {
    this.activeCluster = clusterId;
    this.activeCountry = countryCode;
    this.activeYear = year;

    const matchedTalkIds = new Set<string>();

    for (const tNode of this.layout.talkNodes) {
      const matchesCluster =
        clusterId === 'all' ||
        tNode.primaryCluster === clusterId ||
        tNode.topics.includes(clusterId);
      const matchesCountry =
        countryCode === 'all' ||
        tNode.talk.countryCode.toUpperCase() === countryCode.toUpperCase();
      const matchesYear =
        year === 'all' || tNode.talk.date.slice(0, 4) === year;

      const isMatch = matchesCluster && matchesCountry && matchesYear;
      if (isMatch) matchedTalkIds.add(tNode.id);

      const mat = this.talkMaterials.get(tNode.id);
      const sprite = this.talkGlowSprites.get(tNode.id);
      if (mat) {
        mat.opacity = isMatch ? 1.0 : 0.15;
      }
      if (sprite) {
        sprite.material.opacity = isMatch ? 0.85 : 0.08;
      }
    }

    for (const edge of this.edgeLines) {
      const targetMatched = matchedTalkIds.has(edge.targetId);
      const clusterMatched =
        clusterId === 'all' || edge.clusterId === clusterId;
      edge.material.opacity =
        targetMatched && clusterMatched ? Math.min(1, edge.baseOpacity * 1.65) : 0.05;
    }

    this.projectClusterLabels();
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = Array.from(this.talkMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);

    const tooltip = document.getElementById('orbit-node-tooltip');
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const talk = hitMesh.userData.talk as Talk | undefined;
      if (talk) {
        this.renderer.domElement.style.cursor = 'pointer';
        if (tooltip) {
          tooltip.classList.remove('hidden');
          tooltip.style.left = `${event.clientX}px`;
          tooltip.style.top = `${event.clientY - 12}px`;
          const dEl = document.getElementById('tooltip-date');
          const eEl = document.getElementById('tooltip-event');
          const tEl = document.getElementById('tooltip-title');
          const lEl = document.getElementById('tooltip-location');
          if (dEl) dEl.textContent = formatSignalDate(talk.date);
          if (eEl) eEl.textContent = talk.event;
          if (tEl) tEl.textContent = talk.title;
          if (lEl) lEl.textContent = `📍 ${talk.city}, ${talk.country}`;
        }
        return;
      }
    }

    this.renderer.domElement.style.cursor = 'grab';
    if (tooltip) tooltip.classList.add('hidden');
  }

  private handleCanvasClick(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = Array.from(this.talkMeshes.values());
    const intersects = this.raycaster.intersectObjects(meshes, false);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const talk = hitMesh.userData.talk as Talk | undefined;
      if (talk) {
        this.callbacks.onSelectTalk(talk);
      }
    }
  }

  private handleResize(): void {
    if (!this.camera || !this.renderer) {
      this.projectFallbackClusterLabels();
      return;
    }
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.projectClusterLabels();
  }
}
