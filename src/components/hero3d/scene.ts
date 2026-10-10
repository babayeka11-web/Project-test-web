// Home hero 3D: a procedural wall-mounted air conditioner (three.js). Neutral shapes only — no brand marks and no copy of
// any manufacturer's design (ARCHITECTURE §6.12). The page loads this module lazily (see HeroVisual); nothing here runs on
// the server. One small scene: rounded white body with a front-panel seam, a swaying louver, soft cool-air wisps, studio
// lighting from RoomEnvironment, transparent background so the page's sky wash shows through.
import {
  BoxGeometry,
  Color,
  CubicBezierCurve,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  NormalBlending,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Shape,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export type WallUnitSceneOptions = {
  /** prefers-reduced-motion: no auto-rotate, no louver sway, wisps frozen (drag still works). */
  reducedMotion: boolean;
  /** Colour of the air wisps and the indicator light (a CSS colour, normally the --color-sky token). */
  airColor: string;
  /** Opacity multiplier of the wisps (1 on a light page). */
  airGain?: number;
  /** Called once, after the first frame is on screen. */
  onFirstFrame?: () => void;
  /** Called when the GPU drops the WebGL context — the caller shows the still fallback again. */
  onContextLost?: () => void;
};

export type WallUnitScene = {
  setReducedMotion(reduced: boolean): void;
  /** `gain` scales the wisps' opacity (about 1.7 on a dark page, where soft mist needs more presence). */
  setAirColor(color: string, gain?: number): void;
  dispose(): void;
};

/* ---------- model dimensions (scene units ≈ 0.45 m) ---------- */

const W = 2.0; // width
const H = 0.56; // height
const D = 0.42; // depth (wall → front)
const BEVEL = 0.035; // rounding of the cross-section (the profile grows by this much)
const END = 0.05; // rounding of the two side ends
const DD = D - 2 * BEVEL; // profile box before the bevel grows it
const HH = H - 2 * BEVEL;

// Profile anchors (u = towards the front, v = up), shared by the body and the parts placed on it.
const LIP = new Vector2(DD - 0.025, 0.12); // bottom of the front panel
const OUT_A = new Vector2(DD - 0.045, 0.105); // top of the air outlet (just behind the lip)
const OUT_B = new Vector2(DD - 0.2, 0); // back of the air outlet
const FRONT = new CubicBezierCurve(new Vector2(DD, HH - 0.12), new Vector2(DD + 0.008, HH * 0.55), new Vector2(DD, 0.17), LIP);

/** Side profile of the indoor unit: flat back on the wall, rounded top, gently convex front, outlet slope underneath. */
function bodyShape(): Shape {
  const s = new Shape();
  s.moveTo(0, 0.05);
  s.lineTo(0, HH - 0.03);
  s.quadraticCurveTo(0, HH, 0.03, HH);
  s.lineTo(DD - 0.1, HH);
  s.bezierCurveTo(DD - 0.04, HH, DD, HH - 0.04, DD, HH - 0.12);
  s.bezierCurveTo(FRONT.v1.x, FRONT.v1.y, FRONT.v2.x, FRONT.v2.y, LIP.x, LIP.y);
  s.lineTo(OUT_A.x, OUT_A.y);
  s.lineTo(OUT_B.x, OUT_B.y);
  s.lineTo(0.05, 0);
  s.quadraticCurveTo(0, 0, 0, 0.05);
  return s;
}

/** Profile point (u, v) → unit-local position (y up, z towards the viewer), body centred on the origin. */
const toLocal = (u: number, v: number) => ({ y: v - HH / 2, z: u - DD / 2 });

/* ---------- air wisps: camera-facing ribbons from head to tail, fading at both ends ---------- */

const WISP_VERT = /* glsl */ `
attribute vec3 aHead;
attribute vec3 aTail;
attribute float aAlpha;
attribute float aWidth;
varying float vAlpha;
varying float vAcross;
varying float vAlong;
void main() {
  vec4 h = modelViewMatrix * vec4(aHead, 1.0);
  vec4 t = modelViewMatrix * vec4(aTail, 1.0);
  vec4 p = mix(t, h, position.x);
  vec2 d = h.xy - t.xy;
  float len = length(d);
  vec2 n = len > 1e-5 ? vec2(-d.y, d.x) / len : vec2(0.0, 1.0);
  p.xy += n * aWidth * position.y;
  vAlpha = aAlpha;
  vAcross = position.y;
  vAlong = position.x;
  gl_Position = projectionMatrix * p;
}`;

const WISP_FRAG = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vAcross;
varying float vAlong;
void main() {
  // soft elliptical puff: strongest in the middle, fading to nothing at the rim
  float x = vAlong * 2.0 - 1.0;
  float r2 = x * x + vAcross * vAcross;
  float a = vAlpha * pow(max(0.0, 1.0 - r2), 2.0);
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}`;

type Wisp = { x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; span: number; seed: number; strength: number };

const WISPS = 110;
const LOUVER_MIN = 0.3; // louver tilt (rad), front edge down
const LOUVER_MAX = 0.62;

/* ---------- motion constants ---------- */

const BASE_YAW = -0.32; // a three-quarter view by default
const BASE_PITCH = 0.06;
const AUTO_AMP = 0.55; // ± auto-rotate swing (rad)
const AUTO_SPEED = 0.22; // rad/s of the swing phase (≈ 29 s per cycle)
const RESUME_AFTER = 2.5; // s of no dragging before auto-rotate eases back in

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Builds the scene inside `host` (a sized, positioned element). Throws when WebGL is not available. */
export function createWallUnitScene(host: HTMLElement, opts: WallUnitSceneOptions): WallUnitScene {
  let reduced = opts.reducedMotion;
  let airGain = opts.airGain ?? 1;

  /* ----- renderer ----- */
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap: Texture = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  scene.environment = envMap;
  scene.environmentIntensity = 0.85;

  const camera = new PerspectiveCamera(24, 1, 0.1, 50);
  const target = { x: 0, y: -0.16, z: 0 };

  /* ----- lights: soft studio key from the upper left, cool rim from the right, sky/ground fill ----- */
  scene.add(new HemisphereLight(0xffffff, 0xb6c4d6, 0.55));
  const key = new DirectionalLight(0xffffff, 1.35);
  key.position.set(-2.4, 3.2, 4.2);
  scene.add(key);
  const rim = new DirectionalLight(0xd4e8ff, 0.7);
  rim.position.set(3.2, 1.2, -2.5);
  scene.add(rim);

  /* ----- model ----- */
  const unit = new Group();
  unit.position.set(0, 0.34, 0);
  scene.add(unit);

  const plastic = new MeshPhysicalMaterial({ color: 0xf3f5f8, roughness: 0.4, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.32 });
  const plasticSoft = new MeshPhysicalMaterial({ color: 0xeceff3, roughness: 0.46, metalness: 0, clearcoat: 0.2, clearcoatRoughness: 0.4 });
  const seamMat = new MeshStandardMaterial({ color: 0x9aa6b4, roughness: 0.7, metalness: 0 });
  const outletMat = new MeshStandardMaterial({ color: 0x1b2430, roughness: 0.85, metalness: 0 });
  const vaneMat = new MeshStandardMaterial({ color: 0x5c6878, roughness: 0.7, metalness: 0 });
  const airColor = new Color();
  const ledMat = new MeshBasicMaterial({ color: airColor, toneMapped: false });

  // Body: the side profile extruded along the width, both ends rounded by the bevel.
  const bodyGeo = new ExtrudeGeometry(bodyShape(), {
    depth: W - 2 * END,
    bevelEnabled: true,
    bevelSize: BEVEL,
    bevelThickness: END,
    bevelSegments: 10,
    curveSegments: 28,
  });
  // Shape (u, v, extrusion) → x along the width, y up, z towards the front; centred.
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.translate(W / 2 - END, -HH / 2, -DD / 2);
  bodyGeo.computeVertexNormals();
  unit.add(new Mesh(bodyGeo, plastic));

  // Front-panel seams: a thin groove under the top shoulder and one just above the outlet lip.
  const seamLen = W - 2 * END - 0.08;
  const seamGeo = new CylinderGeometry(0.0032, 0.0032, seamLen, 10, 1);
  seamGeo.rotateZ(Math.PI / 2);
  for (const t of [0.05, 0.9]) {
    const p = FRONT.getPoint(t);
    const tan = FRONT.getTangent(t);
    const n = new Vector2(tan.y, -tan.x).normalize(); // outward normal of the front face
    const l = toLocal(p.x + n.x * (BEVEL - 0.0012), p.y + n.y * (BEVEL - 0.0012));
    const seam = new Mesh(seamGeo, seamMat);
    seam.position.set(0, l.y, l.z);
    unit.add(seam);
  }

  // Air outlet: a dark recess on the slope under the lip, with thin vertical vanes.
  const slope = new Vector2().subVectors(OUT_A, OUT_B);
  const slopeLen = slope.length();
  const outN = new Vector2(slope.y, -slope.x).normalize(); // outward (forward-down)
  const outTilt = Math.atan2(-outN.y, outN.x); // rotation about x that turns +z into the outward normal
  const mid = new Vector2().addVectors(OUT_A, OUT_B).multiplyScalar(0.5);
  const outletW = W * 0.84;
  const at = (offset: number) => toLocal(mid.x + outN.x * (BEVEL + offset), mid.y + outN.y * (BEVEL + offset));

  const outletGeo = new PlaneGeometry(outletW, slopeLen * 0.78);
  const outlet = new Mesh(outletGeo, outletMat);
  const o = at(0.0015);
  outlet.position.set(0, o.y, o.z);
  outlet.rotation.x = outTilt;
  unit.add(outlet);

  const vaneGeo = new BoxGeometry(0.006, slopeLen * 0.62, 0.016);
  const vanes = new Group();
  const v0 = at(0.009);
  vanes.position.set(0, v0.y, v0.z);
  vanes.rotation.x = outTilt;
  for (let i = 0; i < 13; i++) {
    const vane = new Mesh(vaneGeo, vaneMat);
    vane.position.x = (i / 12 - 0.5) * outletW * 0.9;
    vanes.add(vane);
  }
  unit.add(vanes);

  // Louver: one long blade hinged in front of the outlet; its tilt sets the air direction.
  const louverGeo = new BoxGeometry(outletW - 0.04, 0.008, 0.12);
  const louver = new Mesh(louverGeo, plasticSoft);
  const lp = at(0.05);
  louver.position.set(0, lp.y, lp.z);
  louver.rotation.x = (LOUVER_MIN + LOUVER_MAX) / 2;
  unit.add(louver);

  // Indicator light (no logo, no display digits).
  const ledGeo = new SphereGeometry(0.0085, 16, 12);
  const led = new Mesh(ledGeo, ledMat);
  {
    const p = FRONT.getPoint(0.72);
    const l = toLocal(p.x + BEVEL - 0.002, p.y);
    led.position.set(W / 2 - 0.2, l.y, l.z);
  }
  unit.add(led);

  /* ----- air wisps ----- */
  const wispGeo = new InstancedBufferGeometry();
  wispGeo.setAttribute('position', new Float32BufferAttribute([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0], 3));
  wispGeo.setIndex([0, 1, 2, 0, 2, 3]);
  const headArr = new Float32Array(WISPS * 3);
  const tailArr = new Float32Array(WISPS * 3);
  const alphaArr = new Float32Array(WISPS);
  const widthArr = new Float32Array(WISPS);
  const aHead = new InstancedBufferAttribute(headArr, 3);
  const aTail = new InstancedBufferAttribute(tailArr, 3);
  const aAlpha = new InstancedBufferAttribute(alphaArr, 1);
  const aWidth = new InstancedBufferAttribute(widthArr, 1);
  wispGeo.setAttribute('aHead', aHead);
  wispGeo.setAttribute('aTail', aTail);
  wispGeo.setAttribute('aAlpha', aAlpha);
  wispGeo.setAttribute('aWidth', aWidth);
  wispGeo.instanceCount = WISPS;
  const wispMat = new ShaderMaterial({
    vertexShader: WISP_VERT,
    fragmentShader: WISP_FRAG,
    uniforms: { uColor: { value: airColor } },
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
  const wispMesh = new Mesh(wispGeo, wispMat);
  wispMesh.frustumCulled = false;
  wispMesh.renderOrder = 2;
  unit.add(wispMesh);

  // Seeded random so the frozen (reduced-motion) frame is always the same picture.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const wisps: Wisp[] = Array.from({ length: WISPS }, () => ({ x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, span: 3, seed: 0, strength: 1 }));

  const spawn = (w: Wisp, tilt: number) => {
    const along = (rand() - 0.5) * 0.08;
    w.x = (rand() - 0.5) * outletW * 0.86;
    w.y = louver.position.y - Math.sin(tilt) * along - 0.01;
    w.z = louver.position.z + Math.cos(tilt) * along + 0.02;
    const speed = 0.4 + rand() * 0.22;
    const spread = (rand() - 0.5) * 0.18;
    w.vx = (rand() - 0.5) * 0.08 + (w.x / outletW) * 0.16; // the stream fans out sideways a little
    w.vy = -Math.sin(tilt + spread) * speed;
    w.vz = Math.cos(tilt + spread) * speed;
    w.life = 0;
    w.span = 2.4 + rand() * 1.4;
    w.seed = rand() * Math.PI * 2;
    w.strength = 0.55 + rand() * 0.45;
  };
  wisps.forEach((w) => {
    spawn(w, louver.rotation.x);
    w.life = rand(); // start spread over their lifetimes
  });

  const stepWisps = (dt: number, time: number) => {
    const drag = Math.exp(-0.38 * dt);
    for (const w of wisps) {
      w.life += dt / w.span;
      if (w.life >= 1) spawn(w, louver.rotation.x);
      w.vy -= 0.07 * dt; // cool air sinks
      w.vx *= drag;
      w.vy *= drag;
      w.vz *= drag;
      w.x += (w.vx + Math.sin(time * 0.9 + w.seed) * 0.03) * dt;
      w.y += w.vy * dt;
      w.z += w.vz * dt;
    }
  };

  const writeWisps = () => {
    for (let i = 0; i < WISPS; i++) {
      const w = wisps[i];
      const trail = 0.7 + 0.3 * w.life;
      headArr[i * 3] = w.x;
      headArr[i * 3 + 1] = w.y;
      headArr[i * 3 + 2] = w.z;
      tailArr[i * 3] = w.x - w.vx * trail;
      tailArr[i * 3 + 1] = w.y - w.vy * trail;
      tailArr[i * 3 + 2] = w.z - w.vz * trail;
      const fade = Math.sin(Math.PI * Math.min(1, w.life));
      alphaArr[i] = 0.15 * airGain * w.strength * fade * fade;
      widthArr[i] = 0.04 + 0.09 * w.life;
    }
    aHead.needsUpdate = true;
    aTail.needsUpdate = true;
    aAlpha.needsUpdate = true;
    aWidth.needsUpdate = true;
  };

  // Warm the flow up so the first frame (and the frozen reduced-motion frame) already shows air.
  for (let i = 0; i < 120; i++) stepWisps(1 / 30, i / 30);
  writeWisps();

  /* ----- colour from the theme token ----- */
  const setAirColor = (css: string, gain?: number) => {
    if (gain !== undefined) airGain = gain;
    try {
      airColor.setStyle(css || '#0b74b5');
    } catch {
      airColor.set(0x0b74b5);
    }
  };
  setAirColor(opts.airColor);

  /* ----- sizing: keep the whole unit and its air in frame at any aspect ratio ----- */
  let width = 0;
  let height = 0;
  const fit = () => {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w === width && h === height) return false;
    width = w;
    height = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const halfV = Math.tan((camera.fov * Math.PI) / 360);
    const dist = Math.max(2.65 / (2 * halfV * camera.aspect), 2.1 / (2 * halfV));
    camera.position.set(0, target.y + dist * 0.05, dist);
    camera.lookAt(target.x, target.y, target.z);
    camera.updateProjectionMatrix();
    return true;
  };
  fit();

  /* ----- interaction: drag to orbit (horizontal on touch so the page still scrolls), auto-rotate when idle ----- */
  let yaw = BASE_YAW;
  let pitch = BASE_PITCH;
  let yawVel = 0;
  let dragging = false;
  let pointerId = -1;
  let pointerType = '';
  let lastX = 0;
  let lastY = 0;
  let lastMove = 0;
  let idleFor = RESUME_AFTER;
  let autoPhase = 0;
  let clock = 0;

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0 || dragging) return;
    dragging = true;
    pointerId = e.pointerId;
    pointerType = e.pointerType;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = performance.now();
    yawVel = 0;
    idleFor = 0;
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* capture is a nicety */
    }
    kick();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const dtm = Math.max(8, now - lastMove) / 1000;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMove = now;
    const k = 6 / Math.max(240, width);
    yaw += dx * k;
    yawVel = clamp((dx * k) / dtm, -5, 5);
    if (pointerType === 'mouse') pitch = clamp(pitch + dy * k * 0.5, -0.18, 0.4);
    idleFor = 0;
    kick();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = -1;
    yaw = wrapAngle(yaw);
    if (performance.now() - lastMove > 80) yawVel = 0;
    idleFor = 0;
    kick();
  };
  host.addEventListener('pointerdown', onDown);
  host.addEventListener('pointermove', onMove);
  host.addEventListener('pointerup', onUp);
  host.addEventListener('pointercancel', onUp);

  const update = (dt: number) => {
    if (!dragging) {
      if (Math.abs(yawVel) > 1e-3) {
        yaw += yawVel * dt;
        yawVel *= Math.exp(-3.5 * dt);
      } else yawVel = 0;
      idleFor += dt;
      if (!reduced && idleFor > RESUME_AFTER) {
        autoPhase += dt * AUTO_SPEED;
        const k = 1 - Math.exp(-dt * 0.9);
        yaw += (BASE_YAW + AUTO_AMP * Math.sin(autoPhase) - yaw) * k;
        pitch += (BASE_PITCH - pitch) * k;
      }
    }
    unit.rotation.set(pitch, yaw, 0, 'YXZ');
    if (!reduced) {
      clock += dt;
      louver.rotation.x = LOUVER_MIN + (LOUVER_MAX - LOUVER_MIN) * (0.5 + 0.5 * Math.sin(clock * 0.45));
      stepWisps(dt, clock);
      writeWisps();
    }
  };

  /* ----- render loop: only while visible and something moves ----- */
  let raf = 0;
  let last = 0;
  let visible = true;
  let pageVisible = document.visibilityState !== 'hidden';
  let disposed = false;
  let firstFrame = false;

  const moving = () => !reduced || dragging || yawVel !== 0;
  const frame = (now: number) => {
    raf = 0;
    if (disposed) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    fit();
    update(dt);
    renderer.render(scene, camera);
    if (!firstFrame) {
      firstFrame = true;
      opts.onFirstFrame?.();
    }
    if (visible && pageVisible && moving()) raf = requestAnimationFrame(frame);
  };
  function kick() {
    if (raf || disposed || !visible || !pageVisible) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  };

  const io =
    typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (visible) kick();
          else stop();
        })
      : null;
  io?.observe(host);
  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => kick()) : null;
  ro?.observe(host);
  const onVisibility = () => {
    pageVisible = document.visibilityState !== 'hidden';
    if (pageVisible) kick();
    else stop();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const onLost = (e: Event) => {
    e.preventDefault();
    stop();
    opts.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onLost);

  kick();

  return {
    setReducedMotion(r) {
      reduced = r;
      idleFor = RESUME_AFTER;
      kick();
    },
    setAirColor(css, gain) {
      setAirColor(css, gain);
      writeWisps();
      kick();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      host.removeEventListener('pointerdown', onDown);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerup', onUp);
      host.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('webglcontextlost', onLost);
      const geos = new Set<BufferGeometry>();
      const mats = new Set<Material>();
      scene.traverse((obj: Object3D) => {
        const m = obj as Mesh;
        if (m.isMesh) {
          geos.add(m.geometry);
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((mat) => mats.add(mat));
        }
      });
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
