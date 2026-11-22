/*
 * pyRevit paper logo backdrop.
 *
 * Draws the folded-paper pyRevit logo in a small WebGL studio behind the home
 * page, standing exactly where the avatar image is. The studio follows the
 * theme's light/dark scheme, and the controls live in the yellow button at the
 * bottom right.
 *
 * Needs three.js r147 and its Reflector helper (assets/js/vendor). If WebGL is
 * missing or software-only, the script does nothing and the site looks as before.
 */
(function () {
'use strict';

const LOGO_POINTS = {
  A: [0, 140.3], B: [121.8, 218.4], C: [172.9, 161], D: [22.3, 65],
  E: [61.8, 50.6], F: [100, 158.9], G: [180.3, 102.3], H: [118.8, 0],
  K: [185.7, 58.8], L: [186.4, 92.8], M: [155.1, 31.8],
  I: [122.4, 166.2], J: [198.1, 132.8]
};
const LOGO_EYE = { centre: [150.3, 55.1], radius: 9.7 };
const LOGO_CENTRE = [99.05, 109.2];
const LOGO_SPAN = { width: 2, height: 2.2 };
const LOGO_HEIGHT = 218.4;
const LOGO_ASPECT = 218.4 / 198.1;

const UNIT = 0.01;
const PAPER_THICKNESS = 1.5 * UNIT;
const FOLD_DEPTH = { E: 0, K: 36, L: 44, Hbend: -18, G: -30, D: 28, A: 50, B: -30, I: 14 };
const PANELS = [
  { name: 'midLow', corners: 'DFA', face: 'gold' },
  { name: 'midHigh', corners: 'DGF', face: 'gold', parent: 'midLow', hinge: 'DF', span: [0, 1] },
  { name: 'neck', corners: 'EFGH', face: 'slate', parent: 'midHigh', hinge: 'FG', span: [0, 0.5] },
  { name: 'crown', corners: 'EHM', face: 'gold', parent: 'neck', hinge: 'EH', span: [0.25, 0.75] },
  { name: 'head', corners: 'EMKL', face: 'gold', parent: 'crown', hinge: 'EM', span: [0.5, 1], pierced: true },
  { name: 'lower', corners: 'ABCD', face: 'slate', parent: 'midLow', hinge: 'DA', span: [0.45, 0.95] },
  { name: 'tail', corners: 'IJB', face: 'gold', parent: 'lower', hinge: 'BJ', span: [0.7, 1] }
];
const ROOT_SPAN = [0.05, 0.95];
const BACKING_EDGES = { midLow: 'FA', midHigh: 'DG', neck: 'EF', crown: 'HM', head: 'LE', lower: 'CD', tail: 'IJ' };
const BACKING_ORDER = ['tail', 'lower', 'midLow', 'midHigh', 'neck', 'crown', 'head'];
const BACKING_SHARE = 0.4;
const INTRO_MILLISECONDS = { strip: 4200, backed: 6200 };
const TEXTURE_TILE = 1.1;
const FOLD_SPINE = 'gold';
const FOLD_EDGES = ['BC', 'DA', 'FG', 'EH', 'BJ'];
const CREASE_EDGES = ['DF', 'EM'];
const EYE_DISTANCE = 7.35;
const WIDEST_TANGENT = 1.3;
const VIEWS = { front: { theta: 0, phi: Math.PI / 2 }, turned: { theta: -0.26, phi: 1.45 } };
const SKY_SPREAD = '0.22';
const BACKDROPS = {
  dark: { deep: '#020306', haze: '#080c13', sky: '#6f7885', ambient: 0.24, fill: 0.2 },
  light: { deep: '#e9e8e4', haze: '#f6f5f2', sky: '#e6e8ec', ambient: 0.5, fill: 0.3 }
};
const FLOORS = {
  dark: { base: '#000000', mirror: 0.6, bounce: '#16120c' },
  light: { base: '#f6f5f2', mirror: 0.24, bounce: '#a8a399' }
};
const STORE_KEY = 'pyrevit-paper-logo';

const NEUTRAL_TONE_MAPPING = `
vec3 CustomToneMapping( vec3 color ) {
  color *= toneMappingExposure;
  const float startCompression = 0.76;
  const float desaturation = 0.15;
  float x = min( color.r, min( color.g, color.b ) );
  float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
  color -= offset;
  float peak = max( color.r, max( color.g, color.b ) );
  if ( peak < startCompression ) return color;
  float d = 1.0 - startCompression;
  float newPeak = 1.0 - d * d / ( peak + d - startCompression );
  color *= newPeak / peak;
  float g = 1.0 - 1.0 / ( desaturation * ( peak - newPeak ) + 1.0 );
  return mix( color, vec3( newPeak ), g );
}`;

const FLOOR_SHADER = {
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    uTexel: { value: null },
    uSteep: { value: 0.42 },
    uBase: { value: null },
    uMirror: { value: 0.6 },
    uSkyGain: { value: 1 },
    uDeep: { value: null },
    uHaze: { value: null }
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vUv = textureMatrix * vec4( position, 1.0 );
      vWorld = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec3 color;
    uniform vec2 uTexel;
    uniform float uSteep;
    uniform vec3 uBase;
    uniform float uMirror;
    uniform float uSkyGain;
    uniform vec3 uDeep;
    uniform vec3 uHaze;
    varying vec4 vUv;
    varying vec3 vWorld;
    void main() {
      vec2 uv = vUv.xy / vUv.w;
      vec2 o = uTexel * 1.6;
      vec4 r = texture2D( tDiffuse, uv ) * 0.36;
      r += texture2D( tDiffuse, uv + vec2( o.x, 0.0 ) ) * 0.12;
      r += texture2D( tDiffuse, uv - vec2( o.x, 0.0 ) ) * 0.12;
      r += texture2D( tDiffuse, uv + vec2( 0.0, o.y ) ) * 0.12;
      r += texture2D( tDiffuse, uv - vec2( 0.0, o.y ) ) * 0.12;
      r += texture2D( tDiffuse, uv + o ) * 0.04;
      r += texture2D( tDiffuse, uv - o ) * 0.04;
      r += texture2D( tDiffuse, uv + vec2( o.x, -o.y ) ) * 0.04;
      r += texture2D( tDiffuse, uv + vec2( -o.x, o.y ) ) * 0.04;
      vec3 toEye = normalize( cameraPosition - vWorld );
      float grazing = pow( 1.0 - clamp( toEye.y, 0.0, 1.0 ), 2.0 );
      vec3 sky = mix( uDeep, uHaze, exp( -pow( max( toEye.y, 0.0 ) / SKY_SPREAD, 2.0 ) ) );
      float gloss = mix( uSteep, 1.0, grazing );
      vec3 ground = uBase + sky * uSkyGain * gloss;
      float cover = clamp( r.a * gloss * uMirror, 0.0, 1.0 );
      gl_FragColor = vec4( color + ground * ( 1.0 - cover ) + r.rgb * gloss * uMirror, 1.0 );
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      gl_FragColor.rgb += ( fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5 ) / 255.0;
    }`.replace('SKY_SPREAD', SKY_SPREAD)
};

function seededRandom(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tileableNoise(size, cells, random) {
  const lattice = new Float32Array(cells * cells);
  for (let i = 0; i < lattice.length; i++) lattice[i] = random();
  const out = new Float32Array(size * size);
  const smooth = (t) => t * t * (3 - 2 * t);
  for (let y = 0; y < size; y++) {
    const fy = (y / size) * cells;
    const y0 = Math.floor(fy);
    const ty = smooth(fy - y0);
    const y1 = (y0 + 1) % cells;
    for (let x = 0; x < size; x++) {
      const fx = (x / size) * cells;
      const x0 = Math.floor(fx);
      const tx = smooth(fx - x0);
      const x1 = (x0 + 1) % cells;
      const top = lattice[y0 * cells + x0] * (1 - tx) + lattice[y0 * cells + x1] * tx;
      const bottom = lattice[y1 * cells + x0] * (1 - tx) + lattice[y1 * cells + x1] * tx;
      out[y * size + x] = top * (1 - ty) + bottom * ty;
    }
  }
  return out;
}

function makePaperTextures(anisotropy) {
  const size = 512;
  const random = seededRandom(20261006);
  const mottle = new Float32Array(size * size);
  [[3, 0.36], [7, 0.28], [15, 0.2], [31, 0.16]].forEach(([cells, amplitude]) => {
    const layer = tileableNoise(size, cells, random);
    for (let i = 0; i < mottle.length; i++) mottle[i] += layer[i] * amplitude;
  });
  const tooth = tileableNoise(size, 170, random);
  const speck = new Float32Array(size * size);
  for (let i = 0; i < speck.length; i++) speck[i] = random() - 0.5;

  const fibre = new Float32Array(size * size);
  const wrap = (v) => ((v % size) + size) % size;
  for (let n = 0; n < 520; n++) {
    let x = random() * size;
    let y = random() * size;
    let angle = random() * Math.PI * 2;
    const bend = (random() - 0.5) * 0.05;
    const strength = 0.2 + random() * 0.4;
    const length = 5 + random() * 16;
    for (let s = 0; s < length; s++) {
      const xi = wrap(Math.round(x));
      const yi = wrap(Math.round(y));
      fibre[yi * size + xi] += strength;
      x += Math.cos(angle);
      y += Math.sin(angle);
      angle += bend;
    }
  }

  const height = new Float32Array(size * size);
  for (let i = 0; i < height.length; i++) {
    height[i] = mottle[i] * 0.3 + (tooth[i] - 0.5) * 0.8 + speck[i] * 0.6 + Math.min(fibre[i], 1) * 0.35;
  }

  const colourPixels = new Uint8Array(size * size * 4);
  const normalPixels = new Uint8Array(size * size * 4);
  const slope = 1.5;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const o = i * 4;
      const tone = 0.9 + (mottle[i] - 0.5) * 0.14 + (tooth[i] - 0.5) * 0.08 + speck[i] * 0.1 + Math.min(fibre[i], 1) * 0.08;
      const byte = Math.max(0, Math.min(255, Math.round(tone * 255)));
      colourPixels[o] = colourPixels[o + 1] = colourPixels[o + 2] = byte;
      colourPixels[o + 3] = 255;
      const dx = (height[y * size + wrap(x + 1)] - height[y * size + wrap(x - 1)]) * slope;
      const dy = (height[wrap(y + 1) * size + x] - height[wrap(y - 1) * size + x]) * slope;
      const inverse = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      normalPixels[o] = Math.round((-dx * inverse * 0.5 + 0.5) * 255);
      normalPixels[o + 1] = Math.round((-dy * inverse * 0.5 + 0.5) * 255);
      normalPixels[o + 2] = Math.round((inverse * 0.5 + 0.5) * 255);
      normalPixels[o + 3] = 255;
    }
  }

  // Plain typed arrays, not 2D canvases: the most portable way to hand pixels to WebGL.
  // Canvas-backed textures came out with colour and normal maps mixed up in Firefox for Android.
  const prepare = (pixels) => {
    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    texture.needsUpdate = true;
    return texture;
  };
  const colour = prepare(colourPixels);
  colour.encoding = THREE.sRGBEncoding;
  return { colour, normal: prepare(normalPixels) };
}

class Bucket {
  constructor() {
    this.positions = [];
    this.normals = [];
    this.uvs = [];
    this.indices = [];
  }

  vertex(position, normal, u, v) {
    this.positions.push(position.x, position.y, position.z);
    this.normals.push(normal.x, normal.y, normal.z);
    this.uvs.push(u, v);
    return this.positions.length / 3 - 1;
  }

  triangle(a, b, c) {
    this.indices.push(a, b, c);
  }

  toGeometry() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geometry.setIndex(this.indices);
    geometry.computeBoundingSphere();
    return geometry;
  }
}

function addSlab(buckets, outline, holes, normal, thickness, frontKey, backKey, uvOffset, edgeKinds, spineKey) {
  const origin = outline[0];
  const axisU = outline[1].clone().sub(origin);
  axisU.addScaledVector(normal, -axisU.dot(normal)).normalize();
  const axisV = new THREE.Vector3().crossVectors(normal, axisU).normalize();
  const flatten = (p) => {
    const d = p.clone().sub(origin);
    return new THREE.Vector2(d.dot(axisU), d.dot(axisV));
  };

  let outer3 = outline.slice();
  let outer2 = outer3.map(flatten);
  let kinds = edgeKinds || outline.map(() => 'cut');
  if (THREE.ShapeUtils.isClockWise(outer2)) {
    const count = outer3.length;
    kinds = kinds.map((kind, i) => kinds[(2 * count - 2 - i) % count]);
    outer3.reverse();
    outer2.reverse();
  }
  const holes3 = holes.map((hole) => hole.slice());
  const holes2 = holes3.map((hole, index) => {
    let flat = hole.map(flatten);
    if (!THREE.ShapeUtils.isClockWise(flat)) {
      hole.reverse();
      flat.reverse();
    }
    return flat;
  });

  const all3 = outer3.concat(...holes3);
  const all2 = outer2.concat(...holes2);
  const triangles = THREE.ShapeUtils.triangulateShape(outer2, holes2);
  const half = thickness / 2;
  const scale = 1 / TEXTURE_TILE;
  const back = normal.clone().negate();

  const front = buckets[frontKey];
  const frontBase = all3.map((p, i) => front.vertex(p.clone().addScaledVector(normal, half), normal, all2[i].x * scale + uvOffset, all2[i].y * scale + uvOffset * 0.37));
  const rear = buckets[backKey];
  const rearBase = all3.map((p, i) => rear.vertex(p.clone().addScaledVector(normal, -half), back, -all2[i].x * scale + uvOffset * 0.61, all2[i].y * scale + uvOffset));
  triangles.forEach(([a, b, c]) => {
    const ab = all2[b].clone().sub(all2[a]);
    const ac = all2[c].clone().sub(all2[a]);
    const counterClockwise = ab.x * ac.y - ab.y * ac.x > 0;
    if (counterClockwise) {
      front.triangle(frontBase[a], frontBase[b], frontBase[c]);
      rear.triangle(rearBase[a], rearBase[c], rearBase[b]);
    } else {
      front.triangle(frontBase[a], frontBase[c], frontBase[b]);
      rear.triangle(rearBase[a], rearBase[b], rearBase[c]);
    }
  });

  const wallKeys = {
    cut: [frontKey + 'Edge', backKey + 'Edge'],
    crease: [frontKey, backKey],
    fold: [spineKey || FOLD_SPINE, spineKey || FOLD_SPINE]
  };
  const wall = (loop, loopKinds) => {
    for (let i = 0; i < loop.length; i++) {
      const a = loop[i];
      const b = loop[(i + 1) % loop.length];
      const outward = new THREE.Vector3().crossVectors(b.clone().sub(a), normal).normalize();
      const keys = wallKeys[loopKinds ? loopKinds[i] : 'cut'];
      [[half, 0], [0, -half]].forEach(([top, bottom], side) => {
        const bucket = buckets[keys[side]] || buckets[wallKeys.cut[side]];
        const p0 = bucket.vertex(a.clone().addScaledVector(normal, top), outward, 0, 1);
        const p1 = bucket.vertex(a.clone().addScaledVector(normal, bottom), outward, 0, 0);
        const p2 = bucket.vertex(b.clone().addScaledVector(normal, bottom), outward, 1, 0);
        const p3 = bucket.vertex(b.clone().addScaledVector(normal, top), outward, 1, 1);
        bucket.triangle(p0, p1, p2);
        bucket.triangle(p0, p2, p3);
      });
    }
  };
  wall(outer3, kinds);
  holes3.forEach((loop) => wall(loop, null));
}

function solveFoldedLogo(eye) {
  const flat = {};
  Object.keys(LOGO_POINTS).forEach((key) => {
    flat[key] = new THREE.Vector2((LOGO_POINTS[key][0] - LOGO_CENTRE[0]) * UNIT, (LOGO_CENTRE[1] - LOGO_POINTS[key][1]) * UNIT);
  });
  const ray = new THREE.Ray();
  const liftTo = (p, z) => {
    const k = 1 - z / eye.z;
    return new THREE.Vector3(eye.x + (p.x - eye.x) * k, eye.y + (p.y - eye.y) * k, z);
  };
  const dropOnto = (p, plane) => {
    ray.origin.copy(eye);
    ray.direction.set(p.x - eye.x, p.y - eye.y, -eye.z).normalize();
    return ray.intersectPlane(plane, new THREE.Vector3()) || liftTo(p, 0);
  };
  const planeThrough = (a, b, c) => new THREE.Plane().setFromCoplanarPoints(a, b, c);
  const depth = (key) => FOLD_DEPTH[key] * UNIT;

  const E = liftTo(flat.E, depth('E'));
  const K = liftTo(flat.K, depth('K'));
  const L = liftTo(flat.L, depth('L'));
  const headPlane = planeThrough(E, K, L);
  const M = dropOnto(flat.M, headPlane);
  const H = liftTo(flat.H, dropOnto(flat.H, headPlane).z + depth('Hbend'));
  const G = liftTo(flat.G, depth('G'));
  const neckPlane = planeThrough(E, H, G);
  const F = dropOnto(flat.F, neckPlane);
  const D = liftTo(flat.D, depth('D'));
  const A = liftTo(flat.A, depth('A'));
  const B = liftTo(flat.B, depth('B'));
  const lowerPlane = planeThrough(A, D, B);
  const J = dropOnto(flat.J, lowerPlane);
  const I = liftTo(flat.I, depth('I'));
  const planes = {
    midLow: planeThrough(D, F, A),
    midHigh: planeThrough(D, G, F),
    neck: neckPlane,
    crown: planeThrough(E, H, M),
    head: headPlane,
    lower: lowerPlane,
    tail: planeThrough(I, J, B)
  };

  const eyeCentre = new THREE.Vector2((LOGO_EYE.centre[0] - LOGO_CENTRE[0]) * UNIT, (LOGO_CENTRE[1] - LOGO_EYE.centre[1]) * UNIT);
  const eyeRing = [];
  for (let i = 0; i < 56; i++) {
    const a = (i / 56) * Math.PI * 2;
    eyeRing.push(new THREE.Vector2(eyeCentre.x + Math.cos(a) * LOGO_EYE.radius * UNIT, eyeCentre.y + Math.sin(a) * LOGO_EYE.radius * UNIT));
  }

  const edgeKind = (a, b) => {
    if (FOLD_EDGES.includes(a + b) || FOLD_EDGES.includes(b + a)) return 'fold';
    if (CREASE_EDGES.includes(a + b) || CREASE_EDGES.includes(b + a)) return 'crease';
    return 'cut';
  };
  const solved = {};
  PANELS.forEach((panel) => {
    const plane = planes[panel.name];
    const names = panel.corners.split('');
    const corner = {};
    names.forEach((name) => {
      corner[name] = dropOnto(flat[name], plane);
    });
    const outline = names.map((name) => corner[name]);
    const normal = plane.normal.clone();
    if (normal.dot(eye.clone().sub(outline[0])) < 0) normal.negate();
    solved[panel.name] = {
      outline,
      corner,
      names,
      normal,
      gold: panel.face === 'gold' ? normal.clone() : normal.clone().negate(),
      kinds: names.map((name, i) => edgeKind(name, names[(i + 1) % names.length])),
      holes: panel.pierced ? [eyeRing.map((p) => dropOnto(p, plane))] : [],
      centre: outline.reduce((sum, p) => sum.add(p), new THREE.Vector3()).divideScalar(outline.length)
    };
  });
  return solved;
}

function unfoldAngle(pivot, axis, parentCentre, childCentre) {
  const across = (point) => {
    const d = point.clone().sub(pivot);
    return d.addScaledVector(axis, -d.dot(axis)).normalize();
  };
  const folded = across(childCentre);
  const opened = across(parentCentre).negate();
  return Math.atan2(axis.dot(new THREE.Vector3().crossVectors(folded, opened)), folded.dot(opened));
}

function start(renderer) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const dock = document.getElementById('paper-logo-dock');
  const panel = document.getElementById('paper-logo-panel');
  const kebab = document.getElementById('paper-logo-kebab');
  const foldInput = document.getElementById('paper-logo-fold');
  const turnInput = document.getElementById('paper-logo-turn');
  const lightInput = document.getElementById('paper-logo-light');
  const viewButtons = { front: document.getElementById('paper-logo-front'), turned: document.getElementById('paper-logo-3d') };
  const patternButtons = { strip: document.getElementById('paper-logo-strip'), backed: document.getElementById('paper-logo-backed') };
  const anchor = document.querySelector('.avatar img');

  THREE.ColorManagement.legacyMode = false;
  THREE.ShaderChunk.tonemapping_pars_fragment = THREE.ShaderChunk.tonemapping_pars_fragment.replace(
    /vec3 CustomToneMapping\s*\(\s*vec3 color\s*\)\s*\{\s*return color;\s*\}/,
    NEUTRAL_TONE_MAPPING
  );
  renderer.toneMapping = THREE.CustomToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 160);

  const backdrop = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uDeep: { value: new THREE.Color() },
        uHaze: { value: new THREE.Color() }
      },
      vertexShader: `
        varying vec3 vDirection;
        void main() {
          vDirection = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,
      fragmentShader: `
        uniform vec3 uDeep;
        uniform vec3 uHaze;
        varying vec3 vDirection;
        void main() {
          vec3 d = normalize( vDirection );
          float haze = exp( -pow( max( d.y, 0.0 ) / SKY_SPREAD, 2.0 ) );
          gl_FragColor = vec4( mix( uDeep, uHaze, haze ), 1.0 );
          #include <tonemapping_fragment>
          #include <encodings_fragment>
          gl_FragColor.rgb += ( fract( sin( dot( gl_FragCoord.xy, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ) - 0.5 ) / 255.0;
        }`.replace('SKY_SPREAD', SKY_SPREAD)
    })
  );
  backdrop.renderOrder = -10;
  scene.add(backdrop);

  const reflectionPass = { value: 0 };
  const fadeInReflection = (material) => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uReflectionPass = reflectionPass;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vWorldHeight;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWorldHeight = ( modelMatrix * vec4( transformed, 1.0 ) ).y;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uReflectionPass;\nvarying float vWorldHeight;')
        .replace('#include <tonemapping_fragment>', 'gl_FragColor *= mix( 1.0, exp( -4.4 * max( vWorldHeight, 0.0 ) ), uReflectionPass );\n#include <tonemapping_fragment>');
    };
    material.customProgramCacheKey = () => 'fade-in-reflection';
    return material;
  };

  const textures = makePaperTextures(Math.min(8, renderer.capabilities.getMaxAnisotropy()));
  const paper = (colour, roughness) => fadeInReflection(new THREE.MeshStandardMaterial({
    color: colour,
    roughness,
    metalness: 0,
    map: textures.colour,
    normalMap: textures.normal,
    normalScale: new THREE.Vector2(0.3, 0.3)
  }));
  const cutEdge = (colour) => fadeInReflection(new THREE.MeshStandardMaterial({ color: colour, roughness: 0.6, metalness: 0 }));
  const materials = {
    gold: paper('#c6a544', 0.9),
    slate: paper('#3b4149', 0.86),
    blank: paper('#e4e0d6', 0.92),
    goldEdge: cutEdge('#dcbd62'),
    slateEdge: cutEdge('#555b63')
  };

  const floor = new THREE.Reflector(new THREE.PlaneGeometry(240, 240), {
    textureWidth: 1024,
    textureHeight: 1024,
    clipBias: 0.001,
    multisample: 4,
    color: 0x000000,
    shader: FLOOR_SHADER
  });
  floor.rotation.x = -Math.PI / 2;
  floor.material.uniforms.uTexel.value = new THREE.Vector2(1 / 1024, 1 / 1024);
  floor.material.uniforms.uDeep.value = new THREE.Color();
  floor.material.uniforms.uHaze.value = new THREE.Color();
  floor.material.uniforms.uBase.value = new THREE.Color();
  const shadowCatcher = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.22 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.002;
  shadowCatcher.receiveShadow = true;
  shadowCatcher.visible = false;
  const renderReflection = floor.onBeforeRender;
  floor.onBeforeRender = function (...parameters) {
    const catching = shadowCatcher.visible;
    reflectionPass.value = 1;
    backdrop.visible = false;
    shadowCatcher.visible = false;
    renderer.setClearAlpha(0);
    renderReflection.apply(this, parameters);
    renderer.setClearAlpha(1);
    shadowCatcher.visible = catching;
    backdrop.visible = true;
    reflectionPass.value = 0;
  };
  scene.add(floor);
  scene.add(shadowCatcher);

  const logoGroup = new THREE.Group();
  scene.add(logoGroup);

  const ambient = new THREE.HemisphereLight(0x6f7885, 0x16120c, 0.24);
  scene.add(ambient);

  const fill = new THREE.DirectionalLight(0xdfe4ea, 0.2);
  fill.position.set(3.2, 1.6, 6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xa9c1e8, 0.5);
  rim.position.set(2.6, 4.6, -6);
  scene.add(rim);

  const keyTarget = new THREE.Object3D();
  scene.add(keyTarget);
  // Each key light samples its own shadow map. Phones get three instead of five,
  // which keeps the paper shader well under the eight texture units some of them stop at.
  const keySpread = window.matchMedia('(pointer: coarse)').matches
    ? [[0, 0], [0.3, 0.16], [-0.27, -0.18]]
    : [[0, 0], [0.3, 0.16], [-0.27, 0.2], [0.1, -0.3], [-0.2, -0.18]];
  const keyLights = keySpread.map(() => {
    const light = new THREE.SpotLight(0xfff6e6, 1.2 / keySpread.length, 0, 0.27, 1);
    light.castShadow = true;
    light.shadow.mapSize.set(1280, 1280);
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.012;
    light.shadow.camera.near = 3;
    light.shadow.camera.far = 18;
    light.target = keyTarget;
    scene.add(light);
    return light;
  });

  const state = {
    fold: 1,
    foldTarget: 1,
    posedFold: -1,
    eye: new THREE.Vector3(0, 0, EYE_DISTANCE),
    frame: { x: 0, y: LOGO_SPAN.height / 2, width: LOGO_SPAN.width, height: LOGO_SPAN.height },
    settle: 1,
    view: 'front',
    tween: null,
    intro: null,
    swayPhase: 0,
    swayFrom: 0,
    stale: true,
    live: false,
    pattern: 'backed'
  };
  const relight = () => {
    renderer.shadowMap.needsUpdate = true;
    state.stale = true;
  };

  const placeKeyLight = (degrees) => {
    const a = (degrees * Math.PI) / 180;
    const frame = state.frame;
    const reach = Math.max(1, frame.width / LOGO_SPAN.width, frame.height / LOGO_SPAN.height);
    const centre = new THREE.Vector3(frame.x + Math.sin(a) * 6.4 * reach, frame.y + 3.5 * reach, Math.cos(a) * 6.4 * reach);
    const right = new THREE.Vector3(Math.cos(a), 0, -Math.sin(a));
    keyTarget.position.set(frame.x, frame.y, 0);
    keyLights.forEach((light, index) => {
      light.position.copy(centre).addScaledVector(right, keySpread[index][0] * reach);
      light.position.y += keySpread[index][1] * reach;
      light.shadow.normalBias = 0.012 * reach;
      light.shadow.camera.near = 3 * reach;
      light.shadow.camera.far = 18 * reach;
      light.shadow.camera.updateProjectionMatrix();
    });
    relight();
  };

  let parts = {};
  let chain = [];
  const rootTurn = new THREE.Quaternion();
  const turn = new THREE.Quaternion();
  const hinge = new THREE.Matrix4();
  const moved = new THREE.Vector3();
  const unscaled = new THREE.Vector3(1, 1, 1);
  const clamp01 = (value) => Math.min(1, Math.max(0, value));
  const stageOf = (span, fold) => easeInOut(clamp01((fold - span[0]) / (span[1] - span[0])));
  const turnAbout = (matrix, pivot, quaternion) => matrix.compose(moved.copy(pivot).applyQuaternion(quaternion).negate().add(pivot), quaternion, unscaled);

  const layOut = (fold, rootQuaternion) => {
    const strip = state.pattern === 'backed' ? clamp01((fold - BACKING_SHARE) / (1 - BACKING_SHARE)) : fold;
    chain.forEach((link) => {
      const part = parts[link.name];
      if (link.parent) {
        turn.setFromAxisAngle(part.axis, part.unfold * (1 - stageOf(link.span, link.backing ? fold : strip)));
        part.group.matrix.multiplyMatrices(parts[link.parent].group.matrix, turnAbout(hinge, part.pivot, turn));
      } else {
        turn.identity().slerp(rootQuaternion, 1 - stageOf(ROOT_SPAN, strip));
        turnAbout(part.group.matrix, part.centre, turn);
      }
      part.group.matrixWorldNeedsUpdate = true;
    });
  };

  const placed = (part, point) => point.clone().applyMatrix4(part.group.matrix);

  const poseLogo = () => {
    layOut(state.fold, rootTurn);
    const box = new THREE.Box3();
    chain.forEach((link) => {
      const part = parts[link.name];
      part.outline.forEach((point) => box.expandByPoint(placed(part, point)));
    });
    logoGroup.position.y = PAPER_THICKNESS / 2 - box.min.y;
    const settle = easeInOut(clamp01((state.fold - 0.75) / 0.25));
    const loose = { x: (box.min.x + box.max.x) / 2, y: (box.max.y - box.min.y) / 2, width: box.max.x - box.min.x, height: box.max.y - box.min.y };
    const exact = { x: 0, y: logoGroup.position.y, width: LOGO_SPAN.width, height: LOGO_SPAN.height };
    Object.keys(exact).forEach((key) => {
      state.frame[key] = loose[key] + (exact[key] - loose[key]) * settle;
    });
    state.settle = settle;
    state.moved = true;
    state.posedFold = state.fold;
    placeKeyLight(Number(lightInput.value));
  };

  const groupOf = (buckets) => {
    const group = new THREE.Group();
    group.matrixAutoUpdate = false;
    Object.keys(materials).forEach((key) => {
      if (!buckets[key] || !buckets[key].indices.length) return;
      const mesh = new THREE.Mesh(buckets[key].toGeometry(), materials[key]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });
    logoGroup.add(group);
    return group;
  };

  const rebuildLogo = () => {
    Object.keys(parts).forEach((name) => {
      parts[name].group.children.forEach((mesh) => mesh.geometry.dispose());
      logoGroup.remove(parts[name].group);
    });
    parts = {};
    chain = [];
    const backed = state.pattern === 'backed';
    const layer = PAPER_THICKNESS / 2;
    const solved = solveFoldedLogo(state.eye);
    const lifted = (points, normal, distance) => points.map((point) => point.clone().addScaledVector(normal, distance));
    const backs = [];

    PANELS.forEach((panel, index) => {
      const shape = solved[panel.name];
      const part = { outline: shape.outline, centre: shape.centre, normal: shape.normal };
      if (panel.parent) {
        const [from, to] = panel.hinge.split('');
        part.pivot = shape.corner[from];
        part.axis = shape.corner[to].clone().sub(part.pivot).normalize();
        part.unfold = unfoldAngle(part.pivot, part.axis, solved[panel.parent].centre, shape.centre);
      }
      if (!backed) {
        const buckets = { gold: new Bucket(), slate: new Bucket(), goldEdge: new Bucket(), slateEdge: new Bucket() };
        addSlab(buckets, shape.outline, shape.holes, shape.normal, PAPER_THICKNESS, panel.face, panel.face === 'gold' ? 'slate' : 'gold', index * 0.173, shape.kinds);
        part.group = groupOf(buckets);
      } else {
        const edge = BACKING_EDGES[panel.name];
        const onEdge = (i) => {
          const pair = shape.names[i] + shape.names[(i + 1) % shape.names.length];
          return pair === edge || pair === edge[1] + edge[0];
        };
        const face = { gold: new Bucket(), blank: new Bucket(), goldEdge: new Bucket() };
        face.blankEdge = face.goldEdge;
        addSlab(face, lifted(shape.outline, shape.gold, layer / 2), shape.holes.map((hole) => lifted(hole, shape.gold, layer / 2)), shape.gold, layer,
          'gold', 'blank', index * 0.173, shape.kinds.map((kind, i) => (onEdge(i) ? 'fold' : kind)));
        part.group = groupOf(face);

        const rear = { blank: new Bucket(), slate: new Bucket(), slateEdge: new Bucket() };
        rear.blankEdge = rear.slateEdge;
        addSlab(rear, lifted(shape.outline, shape.gold, -layer / 2), shape.holes.map((hole) => lifted(hole, shape.gold, -layer / 2)), shape.gold, layer,
          'blank', 'slate', index * 0.173 + 0.41, shape.names.map((name, i) => (onEdge(i) ? 'fold' : 'cut')), 'slate');
        const pivot = shape.corner[edge[0]];
        const axis = shape.corner[edge[1]].clone().sub(pivot).normalize();
        const reach = shape.centre.clone().sub(pivot);
        reach.addScaledVector(axis, -reach.dot(axis));
        const behind = new THREE.Vector3().crossVectors(axis, reach).dot(shape.gold) < 0;
        const start = BACKING_ORDER.indexOf(panel.name) * 0.03;
        backs.push({ name: panel.name + 'Back', parent: panel.name, backing: true, span: [start, start + 0.21] });
        parts[panel.name + 'Back'] = { group: groupOf(rear), outline: shape.outline, centre: shape.centre, pivot, axis, unfold: behind ? Math.PI : -Math.PI };
      }
      parts[panel.name] = part;
      chain.push({ name: panel.name, parent: panel.parent, span: panel.span });
    });
    chain = chain.concat(backs);

    const facing = new THREE.Quaternion().setFromUnitVectors(parts.midLow.normal, new THREE.Vector3(0, 0, 1));
    layOut(0, facing);
    const run = placed(parts.head, parts.head.centre).sub(placed(parts.tail, parts.tail.centre));
    let roll = -Math.atan2(run.y, run.x);
    roll = Math.atan2(Math.sin(roll), Math.cos(roll));
    rootTurn.setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll).multiply(facing);

    poseLogo();
  };

  const pose = { theta: VIEWS.front.theta, phi: VIEWS.front.phi };
  const target = new THREE.Vector3();
  const spherical = new THREE.Spherical();
  const aimCamera = () => {
    target.set(state.frame.x, state.frame.y, 0);
    spherical.set(EYE_DISTANCE, pose.phi, pose.theta);
    camera.position.setFromSpherical(spherical).add(target);
    camera.lookAt(target);
    turnInput.value = String(Math.round((Math.atan2(Math.sin(pose.theta), Math.cos(pose.theta)) * 180) / Math.PI));
    state.stale = true;
  };

  const fitToAnchor = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const slot = anchor.getBoundingClientRect();
    const slotHeight = slot.height || slot.width * LOGO_ASPECT;
    const shown = slot.width > 8 && !renderer.getContext().isContextLost();
    if (logoGroup.visible !== shown) relight();
    logoGroup.visible = shown;
    dock.hidden = !shown;
    document.body.classList.toggle('paper-logo-docked', shown);
    camera.aspect = width / height;
    if (shown) {
      // Folded, the logo fills its slot exactly. While it is opened out, pull back and slide
      // sideways just enough to keep the whole sheet on screen, which matters on phones.
      const frame = state.frame;
      const loose = 1 - state.settle;
      const slotTangent = (LOGO_HEIGHT * UNIT * height) / (2 * EYE_DISTANCE * slotHeight);
      const fitTangent = Math.max((frame.width * height) / (2 * EYE_DISTANCE * 0.94 * width), frame.height / (2 * EYE_DISTANCE * 0.8));
      const tangent = Math.min(WIDEST_TANGENT, slotTangent + Math.max(0, fitTangent - slotTangent) * loose);
      const reach = (frame.width * height) / (4 * EYE_DISTANCE * tangent);
      const slotX = slot.left + slot.width / 2;
      const clearX = reach * 2 <= width * 0.94 ? Math.min(Math.max(slotX, width * 0.03 + reach), width * 0.97 - reach) : width / 2;
      const axisX = slotX + (clearX - slotX) * loose;
      camera.fov = (Math.atan(tangent) * 360) / Math.PI;
      camera.setViewOffset(width, height, width / 2 - axisX, height / 2 - (slot.top + slotHeight / 2), width, height);
    } else {
      camera.clearViewOffset();
    }
    camera.updateProjectionMatrix();
    state.stale = true;
  };

  const applyTheme = () => {
    const tone = document.body.classList.contains('colorscheme-dark') ? 'dark' : 'light';
    const sky = BACKDROPS[tone];
    const ground = FLOORS[tone];
    [backdrop.material.uniforms, floor.material.uniforms].forEach((uniforms) => {
      uniforms.uDeep.value.set(sky.deep);
      uniforms.uHaze.value.set(sky.haze);
    });
    floor.material.uniforms.uBase.value.set(ground.base);
    floor.material.uniforms.uMirror.value = ground.mirror;
    floor.material.uniforms.uSkyGain.value = tone === 'light' ? 0 : 1;
    shadowCatcher.visible = tone === 'light';
    ambient.color.set(sky.sky);
    ambient.groundColor.set(ground.bounce);
    ambient.intensity = sky.ambient;
    fill.intensity = sky.fill;
    state.stale = true;
  };

  const syncView = () => {
    Object.keys(viewButtons).forEach((name) => viewButtons[name].setAttribute('aria-pressed', String(state.view === name)));
  };
  const showView = (name) => {
    state.view = name;
    syncView();
    if (reducedMotion) {
      state.tween = null;
      pose.theta = VIEWS[name].theta;
      pose.phi = VIEWS[name].phi;
      aimCamera();
      return;
    }
    state.tween = { from: { theta: pose.theta, phi: pose.phi }, to: VIEWS[name], started: performance.now(), duration: 1000 };
  };
  const syncPattern = () => {
    Object.keys(patternButtons).forEach((name) => patternButtons[name].setAttribute('aria-pressed', String(state.pattern === name)));
  };
  const replay = (delay) => {
    state.fold = 0;
    state.foldTarget = 1;
    state.intro = { started: null, delay, duration: INTRO_MILLISECONDS[state.pattern] };
  };
  const openPanel = (open) => {
    panel.hidden = !open;
    kebab.setAttribute('aria-expanded', String(open));
  };

  viewButtons.front.addEventListener('click', () => showView('front'));
  viewButtons.turned.addEventListener('click', () => showView('turned'));
  turnInput.addEventListener('input', () => {
    state.view = 'free';
    state.tween = null;
    syncView();
    pose.theta = (Number(turnInput.value) * Math.PI) / 180;
    aimCamera();
  });
  foldInput.addEventListener('input', () => {
    state.intro = null;
    state.foldTarget = Number(foldInput.value) / 100;
  });
  lightInput.addEventListener('input', () => placeKeyLight(Number(lightInput.value)));
  document.getElementById('paper-logo-replay').addEventListener('click', () => replay(250));
  Object.keys(patternButtons).forEach((name) => {
    patternButtons[name].addEventListener('click', () => {
      if (state.pattern === name) return;
      state.pattern = name;
      state.intro = null;
      syncPattern();
      rebuildLogo();
      aimCamera();
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify({ pattern: name }));
      } catch (error) {
        state.stale = true;
      }
    });
  });
  kebab.addEventListener('click', () => openPanel(panel.hidden));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    openPanel(false);
    kebab.focus();
  });
  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !dock.contains(event.target)) openPanel(false);
  });
  document.addEventListener('themeChanged', applyTheme);
  renderer.domElement.addEventListener('webglcontextlost', () => {
    state.live = false;
    state.moved = true;
    document.body.classList.remove('paper-logo-live');
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    state.moved = true;
  });
  window.addEventListener('scroll', () => {
    state.moved = true;
  }, { passive: true });
  window.addEventListener('resize', () => {
    state.resized = true;
  });
  window.addEventListener('load', () => {
    state.moved = true;
  });

  try {
    const saved = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');
    if (patternButtons[saved.pattern]) state.pattern = saved.pattern;
  } catch (error) {
    state.pattern = 'backed';
  }
  syncPattern();
  syncView();
  applyTheme();
  rebuildLogo();
  aimCamera();
  fitToAnchor();
  if (!reducedMotion) replay(600);

  let previous = performance.now();
  const frame = (now) => {
    const delta = Math.min(0.05, (now - previous) / 1000);
    previous = now;

    if (state.intro) {
      if (state.intro.started === null) state.intro.started = now + state.intro.delay;
      state.fold = clamp01((now - state.intro.started) / state.intro.duration);
      foldInput.value = String(Math.round(state.fold * 100));
      if (state.fold >= 1) state.intro = null;
    } else if (!reducedMotion && Math.abs(state.foldTarget - state.fold) > 0.0005) {
      state.fold += (state.foldTarget - state.fold) * Math.min(1, delta * 7);
    } else {
      state.fold = state.foldTarget;
    }
    if (state.fold !== state.posedFold) {
      poseLogo();
      aimCamera();
    }

    if (state.tween) {
      const k = easeInOut(clamp01((now - state.tween.started) / state.tween.duration));
      const swing = Math.atan2(Math.sin(state.tween.to.theta - state.tween.from.theta), Math.cos(state.tween.to.theta - state.tween.from.theta));
      pose.theta = state.tween.from.theta + swing * k;
      pose.phi = state.tween.from.phi + (state.tween.to.phi - state.tween.from.phi) * k;
      if (k >= 1) {
        state.tween = null;
        state.swayPhase = 0;
        state.swayFrom = pose.theta;
      }
      aimCamera();
    } else if (!reducedMotion && state.view === 'turned' && !state.intro) {
      state.swayPhase += delta * 0.36;
      pose.theta = state.swayFrom + 0.22 * Math.sin(state.swayPhase);
      aimCamera();
    }

    if (state.resized) {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      state.resized = false;
      state.moved = true;
    }
    if (state.moved) {
      state.moved = false;
      fitToAnchor();
    }
    if (state.stale) {
      state.stale = false;
      backdrop.position.copy(camera.position);
      renderer.render(scene, camera);
      if (!state.live && !renderer.getContext().isContextLost()) {
        state.live = true;
        document.body.classList.add('paper-logo-live');
      }
    }
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
}

const canvas = document.getElementById('paper-logo-scene');
if (!canvas || !window.THREE || !THREE.Reflector || !document.querySelector('.avatar img')) return;
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, failIfMajorPerformanceCaveat: true });
} catch (error) {
  return;
}
start(renderer);
})();
