import * as THREE from 'three';
import type { BottleFamily } from '../domain/types';

// Parametric bottle surface. Units: millimetres; y = 0 at the base.
// Each height has an elliptical (superellipse) cross-section with half-axes a (width) and b (depth).

export interface ShapeParams {
  family: BottleFamily;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  shoulder: number;
  waist: number;
  neckR: number;
}

const SHOULDER_START = 0.76;
const NECK_START = 0.9;

export function exponent(family: BottleFamily) {
  return { oval: 2.7, cylinder: 2, flask: 3.4, tottle: 2.5, tube: 2 }[family];
}

/** Half-axes (a, b) at height y. */
export function halfAxes(p: ShapeParams, y: number): [number, number] {
  const t = Math.max(0, Math.min(1, y / p.heightMm));
  const A = p.widthMm / 2;
  const B = p.depthMm / 2;
  const n = p.neckR;

  if (p.family === 'tube') {
    // Crimp seal at t = 0 (top once flipped), round body, short cone into the neck.
    if (t < 0.22) {
      const k = t / 0.22;
      const e = Math.sin((k * Math.PI) / 2);
      return [A * (1.32 - 0.32 * e), Math.max(0.8, B * e)];
    }
    if (t < 0.86) return [A, B];
    if (t < 0.94) {
      const k = (t - 0.86) / 0.08;
      return [A + (n + 2 - A) * k, B + (n + 2 - B) * k];
    }
    return [n, n];
  }

  // Heel: rounded base.
  if (t < 0.035) {
    const k = t / 0.035;
    const s = 0.86 + 0.14 * Math.sin((k * Math.PI) / 2);
    return [A * s, B * s];
  }
  if (t < SHOULDER_START) {
    const pinch = 1 - p.waist * Math.exp(-(((t - 0.46) / 0.14) ** 2));
    return [A * pinch, B * pinch];
  }
  if (t < NECK_START) {
    const k = (t - SHOULDER_START) / (NECK_START - SHOULDER_START);
    const round = Math.sqrt(Math.max(0, 1 - k * k));
    const lin = 1 - k;
    const m = (1 - p.shoulder) * lin + p.shoulder * round;
    const neckA = n + 0.6;
    return [neckA + (A - neckA) * m, neckA + (B - neckA) * m];
  }
  // Neck with a support ring.
  const ring = t > 0.915 && t < 0.93 ? 2.2 : 0;
  return [n + ring, n + ring];
}

export function sectionExponent(p: ShapeParams, y: number) {
  const t = y / p.heightMm;
  const base = exponent(p.family);
  if (t > SHOULDER_START) {
    const k = Math.min(1, (t - SHOULDER_START) / (NECK_START - SHOULDER_START));
    return base + (2 - base) * k;
  }
  if (p.family === 'tube' && t < 0.22) return 2;
  return base;
}

function sp(c: number, e: number) {
  return Math.sign(c) * Math.pow(Math.abs(c), 2 / e);
}

/**
 * Builds a patch of the bottle surface between heights y0..y1 and angles th0..th1.
 * theta = PI/2 is the front (+z). offset pushes the surface outward (for labels, ribs).
 */
export function surfaceGeometry(
  p: ShapeParams,
  y0: number,
  y1: number,
  th0 = 0,
  th1 = Math.PI * 2,
  offset = 0,
  segs = 96,
  rings = 72,
  closeBottom = false,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= rings; j++) {
    const y = y0 + ((y1 - y0) * j) / rings;
    const [a, b] = halfAxes(p, y);
    const e = sectionExponent(p, y);
    for (let i = 0; i <= segs; i++) {
      const th = th0 + ((th1 - th0) * i) / segs;
      const c = Math.cos(th);
      const s = Math.sin(th);
      // Approximate outward offset along the superellipse.
      const x = -(a + offset) * sp(c, e);
      const z = (b + offset) * sp(s, e);
      pos.push(x, y, z);
      uv.push(i / segs, j / rings);
    }
  }
  const row = segs + 1;
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segs; i++) {
      const A = j * row + i;
      const B = A + 1;
      const C = A + row;
      const D = C + 1;
      idx.push(A, B, C, B, D, C);
    }
  }
  if (closeBottom) {
    const center = pos.length / 3;
    pos.push(0, y0, 0);
    uv.push(0.5, 0);
    for (let i = 0; i < segs; i++) idx.push(center, i + 1, i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** Arc length of a cross-section at height y between two angles (mm). */
export function arcLength(p: ShapeParams, y: number, th0: number, th1: number, steps = 64) {
  const [a, b] = halfAxes(p, y);
  const e = sectionExponent(p, y);
  let L = 0;
  let px = 0;
  let pz = 0;
  for (let i = 0; i <= steps; i++) {
    const th = th0 + ((th1 - th0) * i) / steps;
    const x = -a * sp(Math.cos(th), e);
    const z = b * sp(Math.sin(th), e);
    if (i > 0) L += Math.hypot(x - px, z - pz);
    px = x;
    pz = z;
  }
  return L;
}

export function neckRadius(finish: string): number {
  const m = /(\d+)/.exec(finish);
  const d = m ? +m[1] : 24;
  return d / 2;
}
