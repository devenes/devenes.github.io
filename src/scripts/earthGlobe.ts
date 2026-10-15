import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import {
  GLOBE_RADIUS,
  latLonToVector3,
  type CityDestination,
  type SpeakingAtlasData,
  type TopicCategoryId,
} from '../utils/geography';
import { withBase } from '../utils/paths';

export interface EarthGlobeCallbacks {
  onSelectCity: (cityId: string | null) => void;
}

const ATMOSPHERE_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPositionWorld;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPositionWorld = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPositionWorld;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPositionWorld);
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDirection)), 4.2);
    vec3 rimColor = mix(vec3(0.08, 0.45, 0.95), vec3(0.28, 0.82, 1.0), fresnel);
    gl_FragColor = vec4(rimColor, fresnel * 0.48);
  }
`;

function createMarkerGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(48, 48, 2, 48, 48, 48);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(56, 189, 248, 0.75)');
  grad.addColorStop(0.65, 'rgba(14, 165, 233, 0.22)');
  grad.addColorStop(1, 'rgba(14, 165, 233, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 96, 96);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class EarthGlobeController {
  private container: HTMLElement;
  private atlas: SpeakingAtlasData;
  private landGeoJson: unknown;
  private callbacks: EarthGlobeCallbacks;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private controls: OrbitControls | null = null;
  private globeGroup: THREE.Group | null = null;

  private cityMeshes = new Map<string, THREE.Mesh>();
  private citySprites = new Map<string, THREE.Sprite>();
  private cityRings = new Map<string, THREE.Mesh>();
  private routeLines: Array<{
    id: string;
    fromCityId: string;
    toCityId: string;
    year: string;
    line: THREE.Line;
    material: THREE.LineBasicMaterial;
    baseOpacity: number;
    points: THREE.Vector3[];
    pulseMesh: THREE.Mesh;
    pulseSpeed: number;
    pulseOffset: number;
  }> = [];

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(-999, -999);

  private selectedCityId: string | null = null;
  private activeYear = 'all';
  private activeTopic: TopicCategoryId | 'all' = 'all';
  private activeRegion = 'all';

  private isPaused = false;
  private isMotionReduced = false;
  private isWebGLAvailable = false;
  private rafId: number | null = null;
  private startTime = performance.now();

  constructor(
    container: HTMLElement,
    atlas: SpeakingAtlasData,
    landGeoJson: unknown,
    callbacks: EarthGlobeCallbacks
  ) {
    this.container = container;
    this.atlas = atlas;
    this.landGeoJson = landGeoJson;
    this.callbacks = callbacks;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      this.isMotionReduced = true;
    }

    this.init();
  }

  private init(): void {
    try {
      const scene = new THREE.Scene();
      const width = this.container.clientWidth || window.innerWidth || 1280;
      const height = this.container.clientHeight || window.innerHeight || 800;

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 120);
      // Position camera facing ~34°N, 42°E (centering Europe, Türkiye, MENA, and Central Asia)
      const initialCamPos = latLonToVector3(34, 42, 8.2);
      camera.position.set(...initialCamPos);

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
      controls.enablePan = false;
      controls.minDistance = 4.1;
      controls.maxDistance = 12.5;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.85;
      controls.target.set(0, 0, 0);
      controls.update();

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // Lighting for realistic 3D spherical shading with high-contrast night lights
      const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0x93c5fd, 1.35);
      sunLight.position.set(-8, 6, 8);
      scene.add(sunLight);

      const warmRimLight = new THREE.DirectionalLight(0xfbbf24, 0.65);
      warmRimLight.position.set(9, -4, 5);
      scene.add(warmRimLight);

      this.scene = scene;
      this.camera = camera;
      this.renderer = renderer;
      this.controls = controls;
      this.globeGroup = globeGroup;
      this.isWebGLAvailable = true;

      this.buildStarfield(scene);
      this.buildEarthSphere(globeGroup);
      this.buildCoastlineVectors(globeGroup);
      this.buildCityMarkers(globeGroup);
      this.buildTravelRoutes(globeGroup);

      let downX = 0;
      let downY = 0;
      renderer.domElement.addEventListener('pointerdown', (e) => {
        downX = e.clientX;
        downY = e.clientY;
      });
      renderer.domElement.addEventListener('pointerup', (e) => {
        if (Math.abs(e.clientX - downX) < 8 && Math.abs(e.clientY - downY) < 8) {
          this.handleCanvasClick(e);
        }
      });
      renderer.domElement.addEventListener('pointermove', (e) => {
        this.handlePointerMove(e);
      });

      window.addEventListener('resize', () => this.handleResize());
      this.projectCityLabels();
      this.startLoop();
    } catch {
      this.isWebGLAvailable = false;
      this.projectFallbackCityLabels();
    }
  }

  private buildStarfield(scene: THREE.Scene): void {
    const starCount = 1400;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = ((i * 73) % 1000) / 1000;
      const v = ((i * 137) % 1000) / 1000;
      const theta = u * Math.PI * 2;
      const phi = Math.acos(2 * v - 1);
      const r = 28 + (i % 15);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = i % 5 === 0 ? new THREE.Color('#38BDF8') : new THREE.Color('#CBD5E1');
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));
  }

  private buildEarthSphere(globeGroup: THREE.Group): void {
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const earthMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#dbeafe'),
      emissive: new THREE.Color('#09152B'),
      emissiveIntensity: 0.78,
      specular: new THREE.Color('#1E3A8A'),
      shininess: 16,
    });

    const loader = new THREE.TextureLoader();
    loader.load(
      withBase('textures/earth-atlas.webp'),
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        earthMat.map = tex;
        earthMat.emissiveMap = tex;
        earthMat.emissive = new THREE.Color('#ffffff');
        earthMat.emissiveIntensity = 0.82;
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Fallback to PNG if WebP fails
        loader.load(withBase('textures/earth-atlas.png'), (pngTex) => {
          pngTex.colorSpace = THREE.SRGBColorSpace;
          earthMat.map = pngTex;
          earthMat.emissiveMap = pngTex;
          earthMat.emissive = new THREE.Color('#ffffff');
          earthMat.emissiveIntensity = 0.82;
          earthMat.needsUpdate = true;
        });
      }
    );

    const earthMesh = new THREE.Mesh(sphereGeo, earthMat);
    globeGroup.add(earthMesh);

    // Subtle atmospheric Fresnel glow shell
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.045, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);
  }

  /**
   * Draws 3D vector coastlines directly from data/land.json on the sphere surface
   * so continent outlines remain crisp at any zoom level.
   */
  private buildCoastlineVectors(globeGroup: THREE.Group): void {
    const fc = this.landGeoJson as {
      features?: Array<{
        geometry?: {
          type: string;
          coordinates: number[][][] | number[][][][];
        };
      }>;
    } | null;

    if (!fc?.features) return;

    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#38BDF8'),
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const r = GLOBE_RADIUS * 1.002;

    const addRing = (ring: number[][]) => {
      if (ring.length < 3) return;
      const pts: THREE.Vector3[] = [];
      for (const coord of ring) {
        const [lon, lat] = coord;
        const [x, y, z] = latLonToVector3(lat, lon, r);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      globeGroup.add(new THREE.Line(geo, lineMat));
    };

    for (const feat of fc.features) {
      const geom = feat.geometry;
      if (!geom) continue;
      if (geom.type === 'Polygon') {
        for (const ring of geom.coordinates as number[][][]) {
          addRing(ring);
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
          for (const ring of poly) {
            addRing(ring);
          }
        }
      }
    }
  }

  /**
   * Places clickable 3D markers and surface rings at all 23 verified physical speaking cities.
   */
  private buildCityMarkers(globeGroup: THREE.Group): void {
    const glowTex = createMarkerGlowTexture();
    const markerGeo = new THREE.SphereGeometry(1, 18, 18);

    for (const city of this.atlas.cities) {
      const [x, y, z] = latLonToVector3(city.lat, city.lon, GLOBE_RADIUS * 1.006);
      const isHub = city.isBaseHub || city.eventsCount >= 2;
      const colorHex = city.isBaseHub
        ? '#38BDF8'
        : city.eventsCount >= 2
          ? '#FDE047'
          : '#60A5FA';

      const radius = city.isBaseHub
        ? 0.048
        : Math.min(0.042, 0.024 + city.eventsCount * 0.005);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        transparent: true,
        opacity: 0.98,
      });

      const mesh = new THREE.Mesh(markerGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(radius);
      mesh.userData = { cityId: city.id, city };
      globeGroup.add(mesh);
      this.cityMeshes.set(city.id, mesh);

      // Surface tangent halo ring
      const ringGeo = new THREE.RingGeometry(radius * 1.45, radius * 2.1, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isHub ? 0.78 : 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(x, y, z);
      ringMesh.lookAt(new THREE.Vector3(x * 2, y * 2, z * 2));
      globeGroup.add(ringMesh);
      this.cityRings.set(city.id, ringMesh);

      if (glowTex) {
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTex,
          color: new THREE.Color(colorHex),
          transparent: true,
          opacity: isHub ? 0.9 : 0.68,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(x, y, z);
        const s = radius * 6.5;
        sprite.scale.set(s, s, 1);
        globeGroup.add(sprite);
        this.citySprites.set(city.id, sprite);
      }
    }
  }

  /**
   * Builds luminous great-circle travel routes and animated traveling light packets.
   */
  private buildTravelRoutes(globeGroup: THREE.Group): void {
    const pulseGeo = new THREE.SphereGeometry(0.018, 10, 10);

    this.atlas.routes.forEach((route, idx) => {
      const vecPoints = route.points3D.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
      const lineGeo = new THREE.BufferGeometry().setFromPoints(vecPoints);
      const baseOpacity = route.kind === 'hub' ? 0.52 : 0.32;

      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(route.color),
        transparent: true,
        opacity: baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      globeGroup.add(line);

      const pulseMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FEF08A'),
        transparent: true,
        opacity: 0.9,
      });
      const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
      if (vecPoints.length > 0) {
        pulseMesh.position.copy(vecPoints[0]);
      }
      globeGroup.add(pulseMesh);

      this.routeLines.push({
        id: route.id,
        fromCityId: route.fromCityId,
        toCityId: route.toCityId,
        year: route.year,
        line,
        material: lineMat,
        baseOpacity,
        points: vecPoints,
        pulseMesh,
        pulseSpeed: 0.22 + (idx % 5) * 0.04,
        pulseOffset: (idx * 0.17) % 1,
      });
    });
  }

  public focusOnCity(cityId: string | null): void {
    this.selectedCityId = cityId;
    this.updateVisualHighlightState();

    if (!this.camera || !this.controls) {
      this.projectFallbackCityLabels();
      return;
    }

    if (!cityId) {
      const defaultPos = latLonToVector3(34, 42, 8.2);
      gsap.to(this.camera.position, {
        x: defaultPos[0],
        y: defaultPos[1],
        z: defaultPos[2],
        duration: this.isMotionReduced ? 0 : 1.15,
        ease: 'power3.out',
      });
      return;
    }

    const city = this.atlas.cities.find((c) => c.id === cityId);
    if (!city) return;

    const targetCamPos = latLonToVector3(city.lat, city.lon, 5.8);
    gsap.to(this.camera.position, {
      x: targetCamPos[0],
      y: targetCamPos[1],
      z: targetCamPos[2],
      duration: this.isMotionReduced ? 0 : 1.1,
      ease: 'power3.out',
    });
  }

  public applyFilters(options: {
    year?: string;
    topic?: TopicCategoryId | 'all';
    region?: string;
  }): void {
    if (options.year !== undefined) this.activeYear = options.year;
    if (options.topic !== undefined) this.activeTopic = options.topic;
    if (options.region !== undefined) this.activeRegion = options.region;
    this.updateVisualHighlightState();

    // If a region is selected, smoothly rotate globe toward that region's center
    if (options.region && options.region !== 'all' && this.camera) {
      const regionCenters: Record<string, [number, number, number]> = {
        turkiye: [39.5, 31.5, 6.2],
        'central-asia': [44.5, 76.0, 6.6],
        mena: [29.5, 31.0, 6.8],
        'balkans-caucasus': [42.2, 29.0, 6.5],
      };
      const target = regionCenters[options.region];
      if (target) {
        const camPos = latLonToVector3(target[0], target[1], target[2]);
        gsap.to(this.camera.position, {
          x: camPos[0],
          y: camPos[1],
          z: camPos[2],
          duration: this.isMotionReduced ? 0 : 1.05,
          ease: 'power3.out',
        });
      }
    }
  }

  private doesCityMatchFilters(city: CityDestination): boolean {
    const matchesYear =
      this.activeYear === 'all' || city.years.includes(this.activeYear);
    const matchesTopic =
      this.activeTopic === 'all' || city.topicCategories.includes(this.activeTopic);
    const matchesRegion =
      this.activeRegion === 'all' || city.regionId === this.activeRegion;
    return matchesYear && matchesTopic && matchesRegion;
  }

  private updateVisualHighlightState(): void {
    const matchedCityIds = new Set<string>();

    for (const city of this.atlas.cities) {
      const isMatch = this.doesCityMatchFilters(city);
      if (isMatch) matchedCityIds.add(city.id);

      const isSelected = this.selectedCityId === city.id;
      const mesh = this.cityMeshes.get(city.id);
      const sprite = this.citySprites.get(city.id);
      const ring = this.cityRings.get(city.id);

      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = isSelected ? 1.0 : isMatch ? 0.95 : 0.18;
      }
      if (sprite) {
        sprite.material.opacity = isSelected ? 1.0 : isMatch ? 0.82 : 0.1;
      }
      if (ring) {
        const rMat = ring.material as THREE.MeshBasicMaterial;
        rMat.opacity = isSelected ? 1.0 : isMatch ? 0.68 : 0.1;
        ring.scale.setScalar(isSelected ? 1.55 : 1.0);
      }
    }

    for (const route of this.routeLines) {
      const touchesSelected =
        !this.selectedCityId ||
        route.fromCityId === this.selectedCityId ||
        route.toCityId === this.selectedCityId;
      const endpointsMatch =
        matchedCityIds.has(route.fromCityId) && matchedCityIds.has(route.toCityId);

      const visible = touchesSelected && endpointsMatch;
      route.material.opacity = visible
        ? this.selectedCityId
          ? 0.85
          : route.baseOpacity
        : 0.05;
      route.pulseMesh.visible = visible && !this.isMotionReduced;
    }

    this.projectCityLabels();
  }

  public zoomBy(deltaFactor: number): void {
    if (!this.camera) return;
    const len = this.camera.position.length();
    const targetLen = Math.min(12.0, Math.max(4.3, len * deltaFactor));
    const scale = targetLen / (len || 1);
    gsap.to(this.camera.position, {
      x: this.camera.position.x * scale,
      y: this.camera.position.y * scale,
      z: this.camera.position.z * scale,
      duration: this.isMotionReduced ? 0 : 0.45,
      ease: 'power2.out',
    });
  }

  public setMotionReduced(reduced: boolean): void {
    this.isMotionReduced = reduced;
    this.updateVisualHighlightState();
  }

  public isMotionPaused(): boolean {
    return this.isMotionReduced || this.isPaused;
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

    // Subtle idle rotation when no city is locked and motion is enabled
    if (!this.isMotionReduced && !this.selectedCityId && this.globeGroup) {
      this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.00045);
    }

    // Animate traveling route pulses along great-circle arcs
    if (!this.isMotionReduced) {
      for (const route of this.routeLines) {
        if (!route.pulseMesh.visible || route.points.length < 2) continue;
        const progress = (elapsed * route.pulseSpeed + route.pulseOffset) % 1;
        const floatIdx = progress * (route.points.length - 1);
        const i0 = Math.floor(floatIdx);
        const i1 = Math.min(route.points.length - 1, i0 + 1);
        const frac = floatIdx - i0;
        route.pulseMesh.position.lerpVectors(
          route.points[i0],
          route.points[i1],
          frac
        );
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.projectCityLabels();
  }

  /**
   * Projects 3D city coordinates to 2D floating HTML badges on the visible hemisphere,
   * preventing overlaps while keeping the selected city and major hubs crystal clear.
   */
  private projectCityLabels(): void {
    if (!this.camera) return;
    const rect = this.container.getBoundingClientRect();
    const width = rect.width || window.innerWidth || 1280;
    const height = rect.height || window.innerHeight || 800;

    const camDir = this.camera.position.clone().normalize();
    const placedBoxes: Array<{ x: number; y: number }> = [];

    const orderedCities = [...this.atlas.cities].sort((a, b) => {
      const aSel = this.selectedCityId === a.id ? 1 : 0;
      const bSel = this.selectedCityId === b.id ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;
      const aHub = a.isBaseHub ? 1 : 0;
      const bHub = b.isBaseHub ? 1 : 0;
      if (aHub !== bHub) return bHub - aHub;
      return b.eventsCount - a.eventsCount;
    });

    for (const city of orderedCities) {
      const el = document.querySelector<HTMLElement>(
        `[data-globe-city-label="${city.id}"]`
      );
      if (!el) continue;

      const worldVec = new THREE.Vector3(...city.position3D);
      const normalVec = worldVec.clone().normalize();

      // Hide markers on the back side of the Earth
      const facingDot = normalVec.dot(camDir);
      if (facingDot < 0.25) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }

      const projected = worldVec.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      // On desktop, clip labels outside the central globe column so they never overlap left/right panels
      if (width >= 1024 && (x < 380 || x > width - 405 || y < 72 || y > height - 185)) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        continue;
      }

      const isSelected = this.selectedCityId === city.id;
      const isMatched = this.doesCityMatchFilters(city);

      // Avoid label overlap for tightly clustered cities
      const camDist = this.camera.position.length();
      const minSepPx = camDist < 6.0 ? 44 : 52;
      const collides =
        !isSelected &&
        placedBoxes.some((b) => Math.hypot(b.x - x, b.y - y) < minSepPx);

      if (collides || !isMatched) {
        el.style.opacity = isSelected ? '1' : '0';
        el.style.pointerEvents = isSelected ? 'auto' : 'none';
        continue;
      }

      placedBoxes.push({ x, y });
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
      el.style.zIndex = isSelected ? '30' : city.isBaseHub ? '20' : '10';
    }
  }

  private projectFallbackCityLabels(): void {
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    this.atlas.cities.forEach((city, idx) => {
      const el = document.querySelector<HTMLElement>(
        `[data-globe-city-label="${city.id}"]`
      );
      if (!el) return;
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const x = width * 0.34 + col * 92;
      const y = height * 0.24 + row * 54;
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      el.style.opacity = '1';
      el.style.pointerEvents = 'auto';
    });
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = Array.from(this.cityMeshes.values());
    const hits = this.raycaster.intersectObjects(meshes, false);
    this.renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  }

  private handleCanvasClick(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const meshes = Array.from(this.cityMeshes.values());
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (hits.length > 0) {
      const hitMesh = hits[0].object as THREE.Mesh;
      const cityId = hitMesh.userData.cityId as string | undefined;
      if (cityId) {
        this.callbacks.onSelectCity(cityId);
      }
    }
  }

  private handleResize(): void {
    if (!this.camera || !this.renderer) {
      this.projectFallbackCityLabels();
      return;
    }
    const width = this.container.clientWidth || window.innerWidth || 1280;
    const height = this.container.clientHeight || window.innerHeight || 800;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.projectCityLabels();
  }
}
