import { useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { RetailFormat } from '../data/retail';
import { PackModel, packTotalHeight, type PackVisual } from './PackModel';
import { StudioLights } from './Studio';

// Units: 1 scene unit = 100 mm (PackModel scales mm by 0.01).
const U = 0.01;

export interface ShelfItem {
  v: PackVisual;
  ours: boolean;
  key: string;
}

export interface PlacedPack {
  item: ShelfItem;
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
}

export interface ShelfLayout {
  placed: PlacedPack[];
  widthMm: number;
  shelfY: number[];
  ourShelf: number;
  frontZ: number;
}

/** Lays our block plus competitor packs onto shelves, left to right. */
export function layoutShelf(format: RetailFormat, ours: PackVisual[], competitors: PackVisual[], facings: number, ourShelf: number, ourPos: number): ShelfLayout {
  const bays = format.id === 'kirana' ? 1 : 2;
  const widthMm = format.bayWidthMm * bays;
  const gap = 4 + (1 - format.crowding) * 26;
  const baseY = 120;
  const shelfY = Array.from({ length: format.shelves }, (_, i) => baseY + i * format.shelfGapMm);
  const placed: PlacedPack[] = [];
  let ci = 0;
  for (let s = 0; s < format.shelves; s++) {
    const row: ShelfItem[] = [];
    let used = 0;
    const ourBlock: ShelfItem[] = [];
    if (s === ourShelf) {
      for (const v of ours) for (let f = 0; f < facings; f++) ourBlock.push({ v, ours: true, key: `o-${v.label.variantText}-${f}` });
    }
    const ourW = ourBlock.reduce((a, it) => a + it.v.widthMm + gap, 0);
    const startAt = (widthMm - ourW) * ourPos;
    let inserted = ourBlock.length === 0;
    let guard = 0;
    while (guard++ < 400) {
      if (!inserted && used >= startAt) {
        row.push(...ourBlock);
        used += ourW;
        inserted = true;
        continue;
      }
      const c = competitors[ci % competitors.length];
      // Each competitor gets 2–3 facings in a block, like a real planogram.
      const reps = 2 + ((ci * 7 + s) % 2);
      const blockW = reps * (c.widthMm + gap);
      if (used + blockW > widthMm) {
        if (!inserted && used + ourW <= widthMm) { row.push(...ourBlock); used += ourW; inserted = true; }
        break;
      }
      for (let r = 0; r < reps; r++) row.push({ v: c, ours: false, key: `c-${s}-${ci}-${r}` });
      used += blockW;
      ci++;
    }
    if (!inserted) row.splice(0, Math.ceil(ourBlock.length), ...ourBlock);
    const total = row.reduce((a, it) => a + it.v.widthMm + gap, 0);
    let x = -total / 2 + gap / 2;
    for (const it of row) {
      const h = packTotalHeight(it.v);
      const fitsH = h < format.shelfGapMm - 15 || s === format.shelves - 1;
      if (fitsH) placed.push({ item: it, x: x + it.v.widthMm / 2, y: shelfY[s] + 9, w: it.v.widthMm, h, d: it.v.depthMm });
      x += it.v.widthMm + gap;
    }
  }
  return { placed, widthMm, shelfY, ourShelf, frontZ: format.shelfDepthMm / 2 - 12 };
}

function LookAt({ target }: { target: [number, number, number] }) {
  const camera = useThree((s) => s.camera);
  const key = target.join(',');
  useEffect(() => {
    camera.lookAt(...target);
    camera.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, camera]);
  return null;
}

export type AnalyzeFn = () => { image: HTMLCanvasElement; ours: [number, number, number, number][]; all: [number, number, number, number][] } | null;

function AnalyzeBridge({ layout, onReady }: { layout: ShelfLayout; onReady: (fn: AnalyzeFn) => void }) {
  const { gl, scene, camera, size } = useThree();
  onReady(() => {
    gl.render(scene, camera);
    const c = document.createElement('canvas');
    c.width = 192;
    c.height = Math.round((192 * size.height) / size.width);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(gl.domElement, 0, 0, c.width, c.height);
    const box = (p: PlacedPack): [number, number, number, number] => {
      let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
      for (const dx of [-0.5, 0.5]) for (const dy of [0, 1]) {
        const v = new THREE.Vector3((p.x + dx * p.w) * U, (p.y + dy * p.h) * U, layout.frontZ * U).project(camera);
        const sx = (v.x + 1) / 2;
        const sy = (1 - v.y) / 2;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      }
      return [Math.max(0, x0), Math.max(0, y0), Math.min(1, x1), Math.min(1, y1)];
    };
    return { image: c, ours: layout.placed.filter((p) => p.item.ours).map(box), all: layout.placed.map(box) };
  });
  return null;
}

function Fixture({ format, layout }: { format: RetailFormat; layout: ShelfLayout }) {
  const W = layout.widthMm;
  const top = layout.shelfY[layout.shelfY.length - 1] + format.shelfGapMm;
  const D = format.shelfDepthMm;
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: format.fixtureColor, roughness: 0.6, metalness: format.id === 'kirana' ? 0 : 0.2 }), [format]);
  const back = useMemo(() => new THREE.MeshStandardMaterial({ color: format.id === 'kirana' ? '#7b5638' : '#c9cfd4', roughness: 0.9 }), [format]);
  const strip = useMemo(() => new THREE.MeshStandardMaterial({ color: format.stripColor, roughness: 0.5 }), [format]);
  const tag = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }), []);
  const floor = useMemo(() => new THREE.MeshStandardMaterial({ color: format.floorColor, roughness: 0.95 }), [format]);
  return (
    <group scale={U}>
      <mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1200]} receiveShadow>
        <planeGeometry args={[W + 4000, 5000]} />
      </mesh>
      <mesh material={back} position={[0, top / 2, -D / 2 - 10]} receiveShadow>
        <boxGeometry args={[W + 60, top + 120, 20]} />
      </mesh>
      {[-W / 2 - 15, W / 2 + 15, ...(format.id === 'kirana' ? [] : [0])].map((x) => (
        <mesh key={x} material={mat} position={[x, top / 2, 0]} castShadow>
          <boxGeometry args={[30, top + 120, D + 20]} />
        </mesh>
      ))}
      {layout.shelfY.map((y, i) => (
        <group key={i}>
          <mesh material={mat} position={[0, y, 0]} receiveShadow castShadow>
            <boxGeometry args={[W, 18, D]} />
          </mesh>
          <mesh material={strip} position={[0, y - 8, D / 2 + 6]}>
            <boxGeometry args={[W, 34, 6]} />
          </mesh>
          {Array.from({ length: Math.floor(W / 260) }).map((_, k) => (
            <mesh key={k} material={tag} position={[-W / 2 + 130 + k * 260, y - 8, D / 2 + 10]}>
              <boxGeometry args={[70, 26, 2]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh material={mat} position={[0, top, 0]}>
        <boxGeometry args={[W + 60, 30, D + 20]} />
      </mesh>
    </group>
  );
}

export function ShelfScene({ format, layout, view, onAnalyzeReady, highlight = false }: { format: RetailFormat; layout: ShelfLayout; view: 'aisle' | 'close' | 'free'; onAnalyzeReady: (fn: AnalyzeFn) => void; highlight?: boolean }) {
  const eye = 15.5;
  const ourY = (layout.shelfY[layout.ourShelf] ?? 1000) * U + 1;
  const dist = view === 'close' ? format.viewDistanceM * 10 * 0.45 : format.viewDistanceM * 10;
  const topY = ((layout.shelfY[layout.shelfY.length - 1] ?? 1000) + format.shelfGapMm) * U;
  const lookY = view === 'close' ? ourY + 0.8 : topY / 2;
  // Stand far enough back to see the whole fixture, but never closer than the format's viewing distance.
  const fitDist = Math.max(topY / (2 * Math.tan((25 * Math.PI) / 180)) * 1.08, (layout.widthMm * U) / (2 * Math.tan((32 * Math.PI) / 180)));
  const camPos: [number, number, number] = [0, view === 'close' ? ourY + 1.6 : Math.min(eye, topY * 0.75), view === 'close' ? dist : Math.max(dist, fitDist)];
  return (
    <Canvas shadows frameloop="demand" dpr={[1, 1.75]} gl={{ preserveDrawingBuffer: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <PerspectiveCamera makeDefault key={`${view}-${format.id}`} position={camPos} fov={view === 'close' ? 38 : 50} near={0.1} far={400} />
      <color attach="background" args={[format.id === 'kirana' ? '#5a4a3c' : '#dfe3e7']} />
      <fog attach="fog" args={[format.id === 'kirana' ? '#5a4a3c' : '#dfe3e7', 40, 120]} />
      <StudioLights warmth={format.light.warmth} intensity={format.light.intensity} />
      <pointLight position={[0, 30, 12]} intensity={format.light.intensity * 120} distance={80} color="#ffffff" />
      <Fixture format={format} layout={layout} />
      {highlight &&
        layout.placed.filter((p) => p.item.ours).map((p) => (
          <mesh key={`hl-${p.item.key}-${p.x}`} position={[p.x * U, (p.y - 16) * U, (layout.frontZ + 22) * U]}>
            <boxGeometry args={[p.w * U * 1.05, 0.12, 0.05]} />
            <meshBasicMaterial color="#5a3fd6" />
          </mesh>
        ))}
      {layout.placed.map((p) => (
        <group key={p.item.key + p.x} position={[p.x * U, p.y * U, (layout.frontZ - p.d / 2) * U]}>
          <PackModel v={p.item.v} lite />
        </group>
      ))}
      {view === 'free' ? (
        <OrbitControls key={`oc-${format.id}`} target={[0, lookY, 0]} makeDefault enablePan maxDistance={60} minDistance={2} />
      ) : (
        <LookAt target={[0, lookY, 0]} />
      )}
      <AnalyzeBridge layout={layout} onReady={onAnalyzeReady} />
    </Canvas>
  );
}

/** A light Itti–Koch style saliency map: colour and luminance contrast, centre bias. */
export function saliency(img: HTMLCanvasElement): { map: Float32Array; w: number; h: number } {
  const w = img.width;
  const h = img.height;
  const ctx = img.getContext('2d')!;
  const d = ctx.getImageData(0, 0, w, h).data;
  const L = new Float32Array(w * h);
  const RG = new Float32Array(w * h);
  const BY = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4] / 255, g = d[i * 4 + 1] / 255, b = d[i * 4 + 2] / 255;
    L[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    RG[i] = r - g;
    BY[i] = b - (r + g) / 2;
  }
  const blur = (src: Float32Array, rad: number) => {
    const tmp = new Float32Array(w * h);
    const out = new Float32Array(w * h);
    for (let y = 0; y < h; y++) {
      let acc = 0;
      for (let x = -rad; x <= rad; x++) acc += src[y * w + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[y * w + x] = acc / (2 * rad + 1);
        acc += src[y * w + Math.min(w - 1, x + rad + 1)] - src[y * w + Math.max(0, x - rad)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -rad; y <= rad; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / (2 * rad + 1);
        acc += tmp[Math.min(h - 1, y + rad + 1) * w + x] - tmp[Math.max(0, y - rad) * w + x];
      }
    }
    return out;
  };
  const feat = (f: Float32Array) => {
    const c = blur(f, 1);
    const s = blur(f, 8);
    const o = new Float32Array(w * h);
    let mx = 1e-6;
    for (let i = 0; i < w * h; i++) { o[i] = Math.abs(c[i] - s[i]); mx = Math.max(mx, o[i]); }
    for (let i = 0; i < w * h; i++) o[i] /= mx;
    return o;
  };
  const fl = feat(L), fr = feat(RG), fb = feat(BY);
  const sum = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const cx = (x / w - 0.5) / 0.45, cy = (y / h - 0.48) / 0.4;
      const bias = Math.exp(-(cx * cx + cy * cy) / 2);
      sum[i] = (fl[i] * 0.9 + fr[i] * 1.1 + fb[i]) * (0.35 + 0.65 * bias);
    }
  const sm = blur(sum, 3);
  let mx = 1e-6;
  for (let i = 0; i < w * h; i++) mx = Math.max(mx, sm[i]);
  for (let i = 0; i < w * h; i++) sm[i] /= mx;
  return { map: sm, w, h };
}
