import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { BottleFamily, ClosureType, DecorationType, Finish, LabelArt } from '../domain/types';
import type { ResolvedPack } from '../domain/resolve';
import type { CompetitorPack } from '../data/retail';
import { arcLength, neckRadius, surfaceGeometry, type ShapeParams } from './geometry';
import { makeLabelTextures } from './labelTexture';

export interface PackVisual {
  family: BottleFamily;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  shoulder: number;
  waist: number;
  neckFinish: string;
  closureType: ClosureType;
  closureH: number;
  closureD: number;
  bottleColor: string;
  capColor: string;
  liquidColor: string;
  finish: Finish;
  capFinish: Finish;
  decorationType: DecorationType;
  label: LabelArt;
  ribbed: boolean;
  volumeText: string;
  resin: string;
}

export function visualFromPack(p: ResolvedPack): PackVisual {
  const d = p.design;
  return {
    family: p.bottle.family, ...p.dims, neckFinish: p.bottle.neckFinish, closureType: p.closure.type,
    closureH: p.closure.heightMm, closureD: p.closure.diameterMm, bottleColor: d.bottleColor, capColor: d.capColor,
    liquidColor: d.liquidColor, finish: d.finish, capFinish: d.capFinish, decorationType: p.decoration.type, label: d.label,
    ribbed: !!d.shape.ribbed, volumeText: `${p.volumeMl} ml`, resin: p.bottle.resin,
  };
}

export function visualFromCompetitor(c: CompetitorPack): PackVisual {
  return {
    family: c.family, heightMm: c.heightMm, widthMm: c.widthMm, depthMm: c.depthMm, shoulder: 0.55, waist: 0.03,
    neckFinish: c.pump ? '28/410' : '24/410', closureType: c.pump ? 'pump' : 'flip-top', closureH: c.pump ? 62 : 24,
    closureD: c.pump ? 34 : 30, bottleColor: c.bottle, capColor: c.cap, liquidColor: '#ffffff', finish: 'gloss', capFinish: 'gloss',
    decorationType: 'ps-label', ribbed: false, volumeText: '400 ml', resin: 'HDPE',
    label: { brandText: c.name, variantText: 'Daily Care', claimText: 'Soft and smooth', bg: c.label, ink: c.ink, accent: c.ink, heightPct: 0.55, offsetPct: 0.48, wrap: 'front', layout: 'stacked' },
  };
}

function finishProps(f: Finish, lite: boolean): Partial<THREE.MeshPhysicalMaterialParameters> {
  switch (f) {
    case 'gloss': return { roughness: 0.18, clearcoat: lite ? 0 : 1, clearcoatRoughness: 0.08 };
    case 'matte': return { roughness: 0.72 };
    case 'soft-touch': return { roughness: 0.92, sheen: lite ? 0 : 0.6, sheenRoughness: 0.8 };
    case 'pearl': return { roughness: 0.28, iridescence: lite ? 0 : 0.9, iridescenceIOR: 1.5, sheen: lite ? 0 : 0.5, clearcoat: lite ? 0 : 0.6 };
    case 'frosted': return lite ? { roughness: 0.5, transparent: true, opacity: 0.75 } : { roughness: 0.55, transmission: 0.85, thickness: 2 };
    case 'clear': return lite ? { roughness: 0.05, transparent: true, opacity: 0.45 } : { roughness: 0.04, transmission: 1, thickness: 1.5, ior: 1.57 };
    case 'metallic': return { roughness: 0.22, metalness: 0.85 };
  }
}

function useMaterial(color: string, finish: Finish, lite: boolean, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({ color, ...finishProps(finish, lite), ...extra });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, finish, lite]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

interface Props {
  v: PackVisual;
  lite?: boolean;
  open?: boolean;
  pressed?: boolean;
  onPointerDown?: () => void;
}

const S = 0.01; // mm → scene units (1 unit = 10 cm)

/** Re-renders once web fonts have loaded so label art uses the brand typefaces. */
function useFontsReady() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setN((x) => x + 1));
    return () => { alive = false; };
  }, []);
  return n;
}

export function PackModel({ v, lite = false, open = false, pressed = false }: Props) {
  const inverted = v.family === 'tottle' || v.family === 'tube';
  const fonts = useFontsReady();
  const neckR = neckRadius(v.neckFinish);
  const shape: ShapeParams = useMemo(
    () => ({ family: v.family, heightMm: v.heightMm, widthMm: v.widthMm, depthMm: v.depthMm, shoulder: v.shoulder, waist: v.waist, neckR }),
    [v.family, v.heightMm, v.widthMm, v.depthMm, v.shoulder, v.waist, neckR],
  );
  const segs = lite ? 40 : 112;
  const rings = lite ? 28 : 80;

  const bodyGeo = useMemo(() => surfaceGeometry(shape, 0, shape.heightMm, 0, Math.PI * 2, 0, segs, rings, true), [shape, segs, rings]);
  useEffect(() => () => bodyGeo.dispose(), [bodyGeo]);

  const transparentBody = v.finish === 'clear' || v.finish === 'frosted';
  const bodyMat = useMaterial(v.bottleColor, v.finish, lite, transparentBody ? {} : {});
  const capMat = useMaterial(v.capColor, v.capFinish, lite);
  const liquidMat = useMaterial(v.liquidColor, 'gloss', true, { roughness: 0.25, transparent: true, opacity: 0.92 });

  const liquidGeo = useMemo(() => {
    if (!transparentBody) return null;
    const inner: ShapeParams = { ...shape, widthMm: shape.widthMm * 0.94, depthMm: shape.depthMm * 0.92 };
    return surfaceGeometry(inner, 2, shape.heightMm * 0.72, 0, Math.PI * 2, -1.2, 64, 40, true);
  }, [shape, transparentBody]);

  // Label panels.
  const bodyH = shape.heightMm * 0.78;
  const L = v.label;
  const panels = useMemo(() => {
    const out: { geo: THREE.BufferGeometry; face: 'front' | 'back' | 'sleeve' | 'wrap'; aspect: number }[] = [];
    const isSleeve = v.decorationType === 'shrink-sleeve' || L.wrap === 'sleeve';
    const off = v.decorationType === 'iml' || v.decorationType === 'screen-print' ? 0.12 : 0.45;
    const ls = lite ? 32 : 96;
    const lr = lite ? 12 : 40;
    if (isSleeve) {
      const y0 = shape.heightMm * 0.03;
      const y1 = shape.heightMm * 0.86;
      const geo = surfaceGeometry(shape, y0, y1, -Math.PI / 2, Math.PI * 1.5, off, ls * 2, lr * 2);
      const arc = arcLength(shape, (y0 + y1) / 2, 0, Math.PI * 2);
      out.push({ geo, face: 'sleeve', aspect: arc / (y1 - y0) });
      return out;
    }
    const lh = bodyH * L.heightPct;
    const center = bodyH * L.offsetPct + shape.heightMm * 0.03;
    const y0 = Math.max(shape.heightMm * 0.04, center - lh / 2);
    const y1 = Math.min(shape.heightMm * 0.75, center + lh / 2);
    const yc = (y0 + y1) / 2;
    const span = L.wrap === 'wrap' ? Math.PI * 2 * 0.92 : v.family === 'cylinder' || v.family === 'tube' ? 1.6 : 1.9;
    const front = surfaceGeometry(shape, y0, y1, Math.PI / 2 - span / 2, Math.PI / 2 + span / 2, off, ls, lr);
    out.push({ geo: front, face: L.wrap === 'wrap' ? 'wrap' : 'front', aspect: arcLength(shape, yc, Math.PI / 2 - span / 2, Math.PI / 2 + span / 2) / (y1 - y0) });
    if (L.wrap === 'front-back') {
      const back = surfaceGeometry(shape, y0, y1, Math.PI * 1.5 - span / 2, Math.PI * 1.5 + span / 2, off, ls, lr);
      out.push({ geo: back, face: 'back', aspect: arcLength(shape, yc, 0, span) / (y1 - y0) });
    }
    return out;
  }, [shape, L.heightPct, L.offsetPct, L.wrap, v.decorationType, v.family, bodyH, lite]);
  useEffect(() => () => panels.forEach((p) => p.geo.dispose()), [panels]);

  const labelMats = useMemo(
    () =>
      panels.map((p) => {
        const { map, metal } = makeLabelTextures({ art: L, volumeText: v.volumeText, aspect: p.aspect, face: p.face, foil: v.decorationType === 'hot-foil' && !lite, width: lite ? 384 : 1024 });
        if (inverted) {
          for (const t of [map, metal]) {
            if (!t) continue;
            t.center.set(0.5, 0.5);
            t.rotation = Math.PI;
          }
        }
        const glossy = v.decorationType === 'iml' || v.decorationType === 'shrink-sleeve';
        return new THREE.MeshPhysicalMaterial({
          map, metalnessMap: metal, metalness: metal ? 1 : 0, roughness: metal ? 0.3 : glossy ? 0.22 : v.decorationType === 'screen-print' ? 0.4 : 0.55,
          clearcoat: glossy && !lite ? 0.8 : 0, transparent: v.decorationType === 'screen-print', alphaTest: 0,
        });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panels, L.bg, L.ink, L.accent, L.brandText, L.variantText, L.claimText, L.layout, v.volumeText, v.decorationType, lite, inverted, fonts],
  );
  useEffect(() => () => labelMats.forEach((m) => { m.map?.dispose(); m.metalnessMap?.dispose(); m.dispose(); }), [labelMats]);

  const ribs = useMemo(() => {
    if (!v.ribbed) return [];
    const r: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 6; i++) {
      const y = shape.heightMm * (0.2 + i * 0.07);
      r.push(surfaceGeometry(shape, y, y + 2.2, Math.PI * 1.5 - 0.5, Math.PI * 1.5 + 0.5, 0.7, 24, 2));
    }
    return r;
  }, [v.ribbed, shape]);

  const neckTop = shape.heightMm;
  const capBase = neckTop - 9;
  const total = capBase + v.closureH;

  return (
    <group scale={S} rotation={inverted ? [0, 0, Math.PI] : [0, 0, 0]} position={[0, inverted ? total * S : 0, 0]}>
      <mesh geometry={bodyGeo} material={bodyMat} castShadow receiveShadow />
      {liquidGeo && <mesh geometry={liquidGeo} material={liquidMat} />}
      {panels.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={labelMats[i]} castShadow />
      ))}
      {ribs.map((g, i) => (
        <mesh key={`r${i}`} geometry={g} material={bodyMat} />
      ))}
      <group position={[0, capBase, 0]}>
        <Closure type={v.closureType} h={v.closureH} d={v.closureD} mat={capMat} open={open} pressed={pressed} lite={lite} />
      </group>
    </group>
  );
}

function Closure({ type, h, d, mat, open, pressed, lite }: { type: ClosureType; h: number; d: number; mat: THREE.Material; open: boolean; pressed: boolean; lite: boolean }) {
  const r = d / 2;
  const lid = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const disc = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 8);
    if (lid.current) lid.current.rotation.x += ((open ? -1.9 : 0) - lid.current.rotation.x) * k;
    if (head.current) head.current.position.y += ((pressed ? -10 : 0) - head.current.position.y) * k;
    if (disc.current) disc.current.rotation.x += ((open ? -0.35 : 0) - disc.current.rotation.x) * k;
  });
  const seg = lite ? 24 : 64;

  if (type === 'pump' || type === 'foam-pump') {
    const collarH = 14;
    const foam = type === 'foam-pump';
    const stemH = h - collarH - 14;
    return (
      <group>
        <mesh material={mat} position={[0, collarH / 2, 0]} castShadow>
          <cylinderGeometry args={[r, r, collarH, seg]} />
        </mesh>
        <mesh material={mat} position={[0, collarH + 2, 0]}>
          <cylinderGeometry args={[r * 0.55, r * 0.95, 4, seg]} />
        </mesh>
        <group ref={head}>
          <mesh material={mat} position={[0, collarH + stemH / 2 + 2, 0]}>
            <cylinderGeometry args={[foam ? 7 : 4, foam ? 7 : 4, stemH, seg / 2]} />
          </mesh>
          <mesh material={mat} position={[0, h - 7, 0]} castShadow>
            <boxGeometry args={[r * 1.5, 13, r * 1.5]} />
          </mesh>
          <mesh material={mat} position={[r * 0.75 + 11, h - 4, 0]} rotation={[0, 0, Math.PI / 2 - 0.08]}>
            <cylinderGeometry args={[3, 3.6, 24, 16]} />
          </mesh>
        </group>
      </group>
    );
  }
  if (type === 'flip-top' || type === 'tube-cap') {
    const baseH = h * 0.62;
    const lidH = h - baseH;
    return (
      <group>
        <mesh material={mat} position={[0, baseH / 2, 0]} castShadow>
          <cylinderGeometry args={[r * 0.97, r, baseH, seg]} />
        </mesh>
        <mesh material={mat} position={[0, baseH + 0.5, 0]}>
          <cylinderGeometry args={[r * 0.25, r * 0.3, 3, 16]} />
        </mesh>
        <group ref={lid} position={[0, baseH, -r * 0.95]}>
          <mesh material={mat} position={[0, lidH / 2, r * 0.95]} castShadow>
            <cylinderGeometry args={[r * 0.93, r * 0.97, lidH, seg]} />
          </mesh>
          <mesh material={mat} position={[0, lidH * 0.3, r * 1.95]}>
            <boxGeometry args={[r * 0.5, lidH * 0.5, 3]} />
          </mesh>
        </group>
      </group>
    );
  }
  if (type === 'disc-top') {
    return (
      <group>
        <mesh material={mat} position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[r * 0.96, r, h, seg]} />
        </mesh>
        <group ref={disc} position={[0, h + 0.2, 0]}>
          <mesh material={mat} position={[0, 0.6, r * 0.25]}>
            <cylinderGeometry args={[r * 0.5, r * 0.5, 1.6, seg]} />
          </mesh>
        </group>
      </group>
    );
  }
  if (type === 'valve') {
    return (
      <group>
        <mesh material={mat} position={[0, h / 2, 0]} castShadow>
          <cylinderGeometry args={[r * 0.82, r, h, seg]} />
        </mesh>
        <mesh material={mat} position={[0, h + 0.5, 0]}>
          <cylinderGeometry args={[r * 0.98, r * 0.98, 1.5, seg]} />
        </mesh>
      </group>
    );
  }
  // screw cap with knurled ribs
  return (
    <group>
      <mesh material={mat} position={[0, h / 2, 0]} castShadow>
        <cylinderGeometry args={[r, r, h, seg]} />
      </mesh>
      {!lite &&
        Array.from({ length: 36 }).map((_, i) => {
          const a = (i / 36) * Math.PI * 2;
          return (
            <mesh key={i} material={mat} position={[Math.cos(a) * r, h / 2, Math.sin(a) * r]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.8, h * 0.85, 1.2]} />
            </mesh>
          );
        })}
    </group>
  );
}

export function packTotalHeight(v: PackVisual) {
  return v.heightMm - 9 + v.closureH;
}
