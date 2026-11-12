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

const ATMOSPHERE_LIMB_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPositionWorld;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPositionWorld);
    float ndotv = max(0.0, dot(vNormal, viewDirection));
    float fresnel = pow(1.0 - ndotv, 6.2);
    vec3 rimColor = mix(vec3(0.32, 0.44, 0.62), vec3(0.76, 0.82, 0.88), fresnel);
    gl_FragColor = vec4(rimColor, fresnel * 0.42);
  }
`;

const ATMOSPHERE_HALO_FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPositionWorld;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vPositionWorld);
    float intensity = pow(max(0.0, 0.48 - dot(-vNormal, viewDirection)), 3.2);
    vec3 haloColor = vec3(0.28, 0.38, 0.52);
    gl_FragColor = vec4(haloColor, intensity * 0.24);
  }
`;

function createMarkerGlowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(48, 48, 1.5, 48, 48, 46);
  grad.addColorStop(0, 'rgba(255, 250, 240, 0.95)');
  grad.addColorStop(0.25, 'rgba(226, 168, 75, 0.72)');
  grad.addColorStop(0.6, 'rgba(226, 168, 75, 0.18)');
  grad.addColorStop(1, 'rgba(226, 168, 75, 0)');

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
  private cityHitMeshes = new Map<string, THREE.Mesh>();
  private citySprites = new Map<string, THREE.Sprite>();
  private cityRings = new Map<string, THREE.Mesh>();
  private labelElements = new Map<string, HTMLElement>();
  private cachedPanelRects: DOMRect[] | null = null;
  private cachedViewportSize: { width: number; height: number } | null = null;
  private coastlineBuilt = false;
  private routeLines: Array<{
    id: string;
    fromCityId: string;
    toCityId: string;
    kind: 'hub' | 'chronological';
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
  private hoveredCityId: string | null = null;
  private activeYear = 'all';
  private activeTopic: TopicCategoryId | 'all' = 'all';
  private activeRegion = 'all';

  private isPaused = false;
  private isMotionReduced = false;
  private isUserInteracting = false;
  private isWebGLAvailable = false;
  private rafId: number | null = null;
  private cameraTween: gsap.core.Tween | null = null;
  private startTime = performance.now();
  private boundResizeHandler = () => this.handleResize();
  private boundPageHideHandler = () => this.dispose();

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

  private applyCameraViewportOffset(
    camera: THREE.PerspectiveCamera,
    width: number,
    height: number
  ): void {
    if (width >= 1024) {
      // Center globe horizontally between the left hero column and right destination panel,
      // and slightly above the bottom timeline strip
      camera.setViewOffset(
        width,
        height,
        -Math.round(width * 0.018),
        Math.round(height * 0.035),
        width,
        height
      );
    } else {
      // On mobile/tablet (< 1024px), shift the optical center downward so the Istanbul hub
      // and Eurasia/MENA speaking cluster sit inside #mobile-globe-viewport below the hero overview card
      camera.setViewOffset(
        width,
        height,
        0,
        -Math.round(height * 0.145),
        width,
        height
      );
    }
    camera.updateProjectionMatrix();
  }

  private cacheLabelElements(): void {
    this.labelElements.clear();
    for (const city of this.atlas.cities) {
      const el = document.querySelector<HTMLElement>(
        `[data-globe-city-label="${city.id}"]`
      );
      if (el) {
        this.labelElements.set(city.id, el);
      }
    }
  }

  public loadCoastlineGeoJson(landGeoJson: unknown): void {
    this.landGeoJson = landGeoJson;
    if (this.globeGroup && !this.coastlineBuilt) {
      this.buildCoastlineVectors(this.globeGroup);
      if (this.isPaused && this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }
  }

  private init(): void {
    this.cacheLabelElements();
    try {
      const scene = new THREE.Scene();
      const width = this.container.clientWidth || window.innerWidth || 1280;
      const height = this.container.clientHeight || window.innerHeight || 800;

      const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 120);
      this.applyCameraViewportOffset(camera, width, height);

      // Position camera facing ~34°N, 38°E (centering Europe, Türkiye, MENA, and Central Asia)
      const initialDist = width < 640 ? 10.8 : 9.6;
      const initialCamPos = latLonToVector3(34, 38, initialDist);
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
      controls.enableZoom = false;
      controls.minDistance = 4.2;
      controls.maxDistance = 13.5;
      controls.rotateSpeed = 0.65;
      controls.zoomSpeed = 0.85;
      controls.target.set(0, 0, 0);
      controls.update();

      controls.addEventListener('start', () => {
        this.isUserInteracting = true;
        this.killCameraTween();
      });
      controls.addEventListener('end', () => {
        this.isUserInteracting = false;
      });

      const globeGroup = new THREE.Group();
      scene.add(globeGroup);

      // Subtle lighting: let the emissive satellite/night-lights texture carry full contrast
      const ambientLight = new THREE.AmbientLight(0xd6d3cd, 0.14);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xe7e2d8, 0.18);
      sunLight.position.set(6, 5, 8);
      scene.add(sunLight);

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
      renderer.domElement.addEventListener('pointerleave', () => {
        if (this.hoveredCityId !== null) {
          this.hoveredCityId = null;
          this.updateVisualHighlightState();
        }
      });

      window.addEventListener('resize', this.boundResizeHandler);
      window.addEventListener('pagehide', this.boundPageHideHandler);
      this.projectCityLabels();
      this.startLoop();
    } catch {
      this.isWebGLAvailable = false;
      this.projectFallbackCityLabels();
    }
  }

  private killCameraTween(): void {
    if (this.cameraTween) {
      this.cameraTween.kill();
      this.cameraTween = null;
    }
  }

  private animateCameraToLatLon(
    lat: number,
    lon: number,
    targetDist: number,
    duration: number
  ): void {
    if (!this.camera) return;
    this.killCameraTween();

    if (this.isMotionReduced || duration <= 0) {
      const pos = latLonToVector3(lat, lon, targetDist);
      this.camera.position.set(pos[0], pos[1], pos[2]);
      this.controls?.update();
      this.projectCityLabels();
      return;
    }

    const startDir = this.camera.position.clone().normalize();
    const startDist = this.camera.position.length() || 9.6;
    const targetDir = new THREE.Vector3(...latLonToVector3(lat, lon, 1)).normalize();

    // Use spherical interpolation (SLERP via quaternion) so the camera orbits smoothly
    // around the outside of the planet and never cuts through the Earth sphere
    const qStart = new THREE.Quaternion();
    const qEnd = new THREE.Quaternion().setFromUnitVectors(startDir, targetDir);
    const qCurrent = new THREE.Quaternion();
    const proxy = { t: 0 };

    this.cameraTween = gsap.to(proxy, {
      t: 1,
      duration,
      ease: 'power3.out',
      onUpdate: () => {
        if (!this.camera) return;
        qCurrent.slerpQuaternions(qStart, qEnd, proxy.t);
        const dir = startDir.clone().applyQuaternion(qCurrent).normalize();
        const dist = startDist + (targetDist - startDist) * proxy.t;
        this.camera.position.copy(dir.multiplyScalar(dist));
      },
      onComplete: () => {
        this.cameraTween = null;
      },
    });
  }

  private buildStarfield(scene: THREE.Scene): void {
    const starCount = 700;
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

      const c = i % 6 === 0 ? new THREE.Color('#E2C799') : new THREE.Color('#A8A29E');
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));
  }

  private buildEarthSphere(globeGroup: THREE.Group): void {
    const sphereGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const earthMat = new THREE.MeshPhongMaterial({
      color: new THREE.Color('#0A1222'),
      emissive: new THREE.Color('#050C1A'),
      emissiveIntensity: 1.0,
      specular: new THREE.Color('#060D1A'),
      shininess: 6,
    });

    const loader = new THREE.TextureLoader();
    loader.load(withBase('textures/earth-atlas.webp'), (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      earthMat.map = tex;
      earthMat.emissiveMap = tex;
      earthMat.emissive = new THREE.Color('#ffffff');
      earthMat.emissiveIntensity = 1.05;
      earthMat.needsUpdate = true;
    });

    const earthMesh = new THREE.Mesh(sphereGeo, earthMat);
    // Align Three.js SphereGeometry equirectangular UV mapping (u=0.5 at +X)
    // with latLonToVector3 (lon=0 at +Z, lon=90E at +X) via -90° Y rotation
    earthMesh.rotation.y = -Math.PI / 2;
    globeGroup.add(earthMesh);

    // 1. Limb-only atmospheric horizon rim (zero center washout)
    const limbGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.006, 64, 64);
    const limbMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_LIMB_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(limbGeo, limbMat));

    // 2. Outer planetary corona halo rendered on BackSide
    const haloGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.038, 64, 64);
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERE_VERTEX_SHADER,
      fragmentShader: ATMOSPHERE_HALO_FRAGMENT_SHADER,
      side: THREE.BackSide,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    globeGroup.add(new THREE.Mesh(haloGeo, haloMat));
  }

  /**
   * Draws 3D vector coastlines directly from data/land.json on the sphere surface
   * with spherical subdivision so long segments never dip beneath the sphere surface,
   * batched into a single LineSegments draw call.
   */
  private buildCoastlineVectors(globeGroup: THREE.Group): void {
    if (this.coastlineBuilt) return;
    const fc = this.landGeoJson as {
      features?: Array<{
        geometry?: {
          type: string;
          coordinates: number[][][] | number[][][][];
        };
      }>;
    } | null;

    if (!fc?.features) return;
    this.coastlineBuilt = true;

    const lineMat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#94A3B8'),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const r = GLOBE_RADIUS * 1.0018;
    const segmentCoords: number[] = [];

    const addRingSegments = (ring: number[][]) => {
      if (ring.length < 3) return;
      for (let i = 0; i < ring.length - 1; i++) {
        const [lon0, lat0] = ring[i];
        const [lon1, lat1] = ring[i + 1];

        // Skip artificial antimeridian / pole jump closure lines
        if (Math.abs(lon1 - lon0) > 170) continue;

        const angularSpan = Math.hypot(lon1 - lon0, lat1 - lat0);
        const steps = Math.max(1, Math.min(20, Math.ceil(angularSpan / 1.5)));

        let prev = latLonToVector3(lat0, lon0, r);
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const next = latLonToVector3(
            lat0 + (lat1 - lat0) * t,
            lon0 + (lon1 - lon0) * t,
            r
          );
          segmentCoords.push(prev[0], prev[1], prev[2], next[0], next[1], next[2]);
          prev = next;
        }
      }
    };

    for (const feat of fc.features) {
      const geom = feat.geometry;
      if (!geom) continue;
      if (geom.type === 'Polygon') {
        for (const ring of geom.coordinates as number[][][]) {
          addRingSegments(ring);
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const poly of geom.coordinates as number[][][][]) {
          for (const ring of poly) {
            addRingSegments(ring);
          }
        }
      }
    }

    if (segmentCoords.length > 0) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(segmentCoords, 3)
      );
      globeGroup.add(new THREE.LineSegments(geo, lineMat));
    }
  }

  /**
   * Places clickable 3D pinpoint markers and delicate surface rings at all 23 verified physical speaking cities.
   */
  private buildCityMarkers(globeGroup: THREE.Group): void {
    const glowTex = createMarkerGlowTexture();
    const markerGeo = new THREE.SphereGeometry(1, 16, 16);
    const hitMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      colorWrite: false,
    });

    for (const city of this.atlas.cities) {
      const [x, y, z] = latLonToVector3(city.lat, city.lon, GLOBE_RADIUS * 1.004);
      const isHub = city.isBaseHub || city.eventsCount >= 2;
      const colorHex = city.isBaseHub
        ? '#E2A84B'
        : city.eventsCount >= 2
          ? '#F3D08A'
          : '#CBD5E1';

      const radius = city.isBaseHub
        ? 0.026
        : Math.min(0.022, 0.014 + city.eventsCount * 0.0025);

      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FFFBEB'),
        transparent: true,
        opacity: 0.98,
      });

      const mesh = new THREE.Mesh(markerGeo, mat);
      mesh.position.set(x, y, z);
      mesh.scale.setScalar(radius);
      mesh.userData = { cityId: city.id, city };
      globeGroup.add(mesh);
      this.cityMeshes.set(city.id, mesh);

      // Generous invisible 3D pick target so clustered cities are easy to hover and click
      const hitMesh = new THREE.Mesh(markerGeo, hitMat);
      hitMesh.position.set(x, y, z);
      hitMesh.scale.setScalar(Math.max(0.055, radius * 2.4));
      hitMesh.userData = { cityId: city.id, city };
      globeGroup.add(hitMesh);
      this.cityHitMeshes.set(city.id, hitMesh);

      // Delicate surface tangent ring
      const ringGeo = new THREE.RingGeometry(radius * 1.35, radius * 1.85, 28);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorHex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isHub ? 0.65 : 0.38,
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
          opacity: isHub ? 0.85 : 0.6,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.set(x, y, z);
        const s = radius * 4.2;
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
    const pulseGeo = new THREE.SphereGeometry(0.014, 10, 10);

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
        color: new THREE.Color('#F4F1EA'),
        transparent: true,
        opacity: 0.85,
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
        kind: route.kind,
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
      const width = this.container.clientWidth || window.innerWidth || 1280;
      const defaultDist = width < 640 ? 10.8 : 9.6;
      this.animateCameraToLatLon(34, 38, defaultDist, 1.15);
      return;
    }

    const city = this.atlas.cities.find((c) => c.id === cityId);
    if (!city) return;

    this.animateCameraToLatLon(city.lat, city.lon, 7.0, 1.1);
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
    if (options.region !== undefined && this.camera) {
      if (options.region === 'all') {
        if (!this.selectedCityId) {
          const width = this.container.clientWidth || window.innerWidth || 1280;
          this.animateCameraToLatLon(34, 38, width < 640 ? 10.8 : 9.6, 1.05);
        }
      } else {
        const regionCenters: Record<string, [number, number, number]> = {
          turkiye: [39.5, 31.5, 7.2],
          'central-asia': [44.5, 76.0, 7.6],
          mena: [29.5, 31.0, 7.8],
          'balkans-caucasus': [42.2, 29.0, 7.4],
        };
        const target = regionCenters[options.region];
        if (target) {
          this.animateCameraToLatLon(target[0], target[1], target[2], 1.05);
        }
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
      const isHovered = this.hoveredCityId === city.id;
      const isActiveBaseHub =
        city.isBaseHub && this.activeRegion === 'all' && !this.selectedCityId;

      const mesh = this.cityMeshes.get(city.id);
      const sprite = this.citySprites.get(city.id);
      const ring = this.cityRings.get(city.id);

      if (mesh) {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        mat.opacity =
          isSelected || isHovered
            ? 1.0
            : isMatch
              ? 0.95
              : isActiveBaseHub
                ? 0.65
                : 0.18;
      }
      if (sprite) {
        sprite.material.opacity =
          isSelected || isHovered
            ? 1.0
            : isMatch
              ? 0.82
              : isActiveBaseHub
                ? 0.5
                : 0.1;
      }
      if (ring) {
        const rMat = ring.material as THREE.MeshBasicMaterial;
        rMat.opacity =
          isSelected || isHovered
            ? 0.95
            : isMatch
              ? 0.58
              : isActiveBaseHub
                ? 0.42
                : 0.1;
        ring.scale.setScalar(isSelected ? 1.4 : isHovered ? 1.25 : 1.0);
      }
    }

    for (const route of this.routeLines) {
      const touchesSelected =
        !this.selectedCityId ||
        route.fromCityId === this.selectedCityId ||
        route.toCityId === this.selectedCityId;

      // Hub routes connect the Istanbul base hub to each destination city;
      // keep hub routes visible whenever their destination city matches active Year/Topic filters
      const endpointsMatch =
        this.selectedCityId !== null
          ? matchedCityIds.has(route.fromCityId) || matchedCityIds.has(route.toCityId)
          : route.kind === 'hub'
            ? matchedCityIds.has(route.toCityId) &&
              (this.activeRegion === 'all' || matchedCityIds.has(route.fromCityId))
            : matchedCityIds.has(route.fromCityId) && matchedCityIds.has(route.toCityId);

      const visible = touchesSelected && endpointsMatch;
      route.material.opacity = visible
        ? this.selectedCityId
          ? 0.88
          : route.baseOpacity
        : 0.05;
      route.pulseMesh.visible = visible && !this.isMotionReduced;
    }

    this.projectCityLabels();
  }

  public zoomBy(deltaFactor: number): void {
    if (!this.camera) return;
    this.killCameraTween();
    const len = this.camera.position.length();
    const targetLen = Math.min(12.5, Math.max(4.5, len * deltaFactor));
    const scale = targetLen / (len || 1);
    this.cameraTween = gsap.to(this.camera.position, {
      x: this.camera.position.x * scale,
      y: this.camera.position.y * scale,
      z: this.camera.position.z * scale,
      duration: this.isMotionReduced ? 0 : 0.45,
      ease: 'power2.out',
      onComplete: () => {
        this.cameraTween = null;
      },
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

    // Gentle bounded orbital sway centered on the Eurasia/MENA speaking hemisphere when idle
    if (
      !this.isMotionReduced &&
      !this.selectedCityId &&
      this.activeRegion === 'all' &&
      !this.isUserInteracting &&
      !this.cameraTween &&
      this.globeGroup
    ) {
      const swayAngularVelocity = Math.cos(elapsed * 0.28) * 0.00036;
      this.camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), swayAngularVelocity);
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

  public invalidatePanelRects(): void {
    this.cachedPanelRects = null;
    this.cachedViewportSize = null;
    this.projectCityLabels();
  }

  private getOccludingPanelRects(): DOMRect[] {
    if (this.cachedPanelRects) {
      return this.cachedPanelRects;
    }
    const rects: DOMRect[] = [];
    const selectors = [
      'header',
      '#hero-overview-panel',
      '#right-discovery-column',
      '#destination-panel',
      '#view-mode-tablist',
      '#recent-signals-strip',
      '#globe-controls-toolbar',
      '#mobile-globe-hint-pill',
    ];
    for (const sel of selectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        if (sel === '#right-discovery-column' && window.innerWidth >= 1024) {
          rects.push(new DOMRect(r.left, 0, r.width, r.bottom));
        } else {
          rects.push(r);
        }
      }
    }
    this.cachedPanelRects = rects;
    return rects;
  }

  private setLabelVisibility(el: HTMLElement, visible: boolean): void {
    const nextStr = visible ? 'true' : 'false';
    if (el.dataset.visible !== nextStr) {
      el.dataset.visible = nextStr;
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
      if (visible) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      }
    }
  }

  /**
   * Projects 3D city coordinates to 2D floating HTML badges on the visible hemisphere,
   * preventing overlaps with both UI panels and neighboring badges while keeping the
   * selected/hovered city and major hubs crystal clear.
   */
  private projectCityLabels(): void {
    if (!this.camera) return;
    if (!this.cachedViewportSize) {
      const rect = this.container.getBoundingClientRect();
      this.cachedViewportSize = {
        width: rect.width || window.innerWidth || 1280,
        height: rect.height || window.innerHeight || 800,
      };
    }
    const { width, height } = this.cachedViewportSize;

    const camDir = this.camera.position.clone().normalize();
    const placedBoxes: Array<{ x: number; y: number; halfW: number }> = [];
    const panelRects = this.getOccludingPanelRects();

    const orderedCities = [...this.atlas.cities].sort((a, b) => {
      const aSel = this.selectedCityId === a.id ? 1 : 0;
      const bSel = this.selectedCityId === b.id ? 1 : 0;
      if (aSel !== bSel) return bSel - aSel;

      const aHov = this.hoveredCityId === a.id ? 1 : 0;
      const bHov = this.hoveredCityId === b.id ? 1 : 0;
      if (aHov !== bHov) return bHov - aHov;

      const aHub = a.isBaseHub ? 1 : 0;
      const bHub = b.isBaseHub ? 1 : 0;
      if (aHub !== bHub) return bHub - aHub;

      return b.eventsCount - a.eventsCount;
    });

    for (const city of orderedCities) {
      const el =
        this.labelElements.get(city.id) ??
        document.querySelector<HTMLElement>(`[data-globe-city-label="${city.id}"]`);
      if (!el) continue;

      const worldVec = new THREE.Vector3(...city.position3D);
      const normalVec = worldVec.clone().normalize();

      // Hide markers on the back side of the Earth
      const facingDot = normalVec.dot(camDir);
      if (facingDot < 0.24) {
        this.setLabelVisibility(el, false);
        continue;
      }

      const projected = worldVec.clone().project(this.camera);
      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      // Estimate badge pill bounding box (centered horizontally at x, sitting above y)
      const halfW = Math.max(36, city.city.length * 3.8 + 18);
      const badgeLeft = x - halfW;
      const badgeRight = x + halfW;
      const badgeTop = y - 30;
      const badgeBottom = y + 2;

      // Clip labels that fall outside the viewport or overlap any UI panel on desktop, tablet, or mobile
      const outOfBounds =
        badgeLeft < 8 || badgeRight > width - 8 || badgeTop < 68 || badgeBottom > height - 16;

      const overlapsPanel = panelRects.some(
        (pr) =>
          badgeRight > pr.left - 6 &&
          badgeLeft < pr.right + 6 &&
          badgeBottom > pr.top - 4 &&
          badgeTop < pr.bottom + 4
      );

      if (outOfBounds || overlapsPanel) {
        this.setLabelVisibility(el, false);
        continue;
      }

      const isSelected = this.selectedCityId === city.id;
      const isHovered = this.hoveredCityId === city.id;
      const isMatched = this.doesCityMatchFilters(city);

      // Avoid pill-to-pill overlap using accurate rectangular pill dimensions
      const collides =
        !isSelected &&
        !isHovered &&
        placedBoxes.some(
          (b) => Math.abs(b.x - x) < b.halfW + halfW + 6 && Math.abs(b.y - y) < 25
        );

      if (collides || (!isMatched && !isSelected && !isHovered)) {
        this.setLabelVisibility(el, false);
        continue;
      }

      placedBoxes.push({ x, y, halfW });
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      this.setLabelVisibility(el, true);
      el.style.zIndex = isSelected
        ? '30'
        : isHovered
          ? '25'
          : city.isBaseHub
            ? '20'
            : '10';
    }
  }

  private projectFallbackCityLabels(): void {
    const width = window.innerWidth || 1280;
    const height = window.innerHeight || 800;
    this.atlas.cities.forEach((city, idx) => {
      const el =
        this.labelElements.get(city.id) ??
        document.querySelector<HTMLElement>(`[data-globe-city-label="${city.id}"]`);
      if (!el) return;
      const col = idx % 5;
      const row = Math.floor(idx / 5);
      const x = width * 0.34 + col * 92;
      const y = height * 0.24 + row * 54;
      el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      this.setLabelVisibility(el, true);
    });
  }

  /**
   * Raycasts against front-hemisphere city pick targets so back-of-Earth markers
   * can never be hovered or clicked through the planet.
   */
  private pickFrontHemisphereCity(clientX: number, clientY: number): string | null {
    if (!this.camera || !this.renderer) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const camDir = this.camera.position.clone().normalize();
    const hitTargets = Array.from(this.cityHitMeshes.values());
    const hits = this.raycaster.intersectObjects(hitTargets, false);

    for (const hit of hits) {
      const hitMesh = hit.object as THREE.Mesh;
      const normalVec = hitMesh.position.clone().normalize();
      if (normalVec.dot(camDir) > 0.15) {
        return (hitMesh.userData.cityId as string | undefined) ?? null;
      }
    }
    return null;
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const hitCityId = this.pickFrontHemisphereCity(event.clientX, event.clientY);
    this.renderer.domElement.style.cursor = hitCityId ? 'pointer' : 'grab';

    if (this.hoveredCityId !== hitCityId) {
      this.hoveredCityId = hitCityId;
      this.updateVisualHighlightState();
    }
  }

  private handleCanvasClick(event: PointerEvent): void {
    if (!this.camera || !this.renderer || this.isPaused) return;
    const hitCityId = this.pickFrontHemisphereCity(event.clientX, event.clientY);
    if (hitCityId) {
      this.callbacks.onSelectCity(hitCityId);
    }
  }

  private handleResize(): void {
    this.cachedPanelRects = null;
    this.cachedViewportSize = null;
    if (!this.camera || !this.renderer) {
      this.projectFallbackCityLabels();
      return;
    }
    const width = this.container.clientWidth || window.innerWidth || 1280;
    const height = this.container.clientHeight || window.innerHeight || 800;
    this.camera.aspect = width / height;
    this.applyCameraViewportOffset(this.camera, width, height);
    this.renderer.setSize(width, height);
    this.projectCityLabels();
  }

  /**
   * Disposes all Three.js geometries, materials, textures, controls, and event listeners.
   */
  public dispose(): void {
    this.killCameraTween();
    this.setPaused(true);
    window.removeEventListener('resize', this.boundResizeHandler);
    window.removeEventListener('pagehide', this.boundPageHideHandler);

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const materials = Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material];
          for (const mat of materials) {
            const m = mat as THREE.MeshPhongMaterial;
            if (m.map) m.map.dispose();
            if (m.emissiveMap) m.emissiveMap.dispose();
            mat.dispose();
          }
        }
      });
      this.scene = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }
}

