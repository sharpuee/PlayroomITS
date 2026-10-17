import * as THREE from 'three';
import type { LabelArt } from '../domain/types';
import { shade } from '../domain/color';

// Draws label artwork onto a canvas that is mapped around the bottle.

export interface LabelDrawOpts {
  art: LabelArt;
  volumeText: string;
  aspect: number; // physical width / height of the label
  face: 'front' | 'back' | 'sleeve' | 'wrap';
  foil?: boolean;
  bottleColor?: string;
  width?: number;
}

const FONT_HEAD = '"Bricolage Grotesque", "Helvetica Neue", Arial, sans-serif';
const FONT_BODY = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number, size: number, weight: number, family: string) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > maxW && s > 8) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawFront(ctx: CanvasRenderingContext2D, W: number, H: number, o: LabelDrawOpts, mask: boolean) {
  const { art } = o;
  const ink = mask ? '#000' : art.ink;
  const accent = mask ? '#fff' : art.accent;
  const cx = W / 2;
  const pad = W * 0.1;
  const maxW = W - pad * 2;

  if (!mask) {
    ctx.fillStyle = art.bg;
    ctx.fillRect(0, 0, W, H);
  }

  if (art.layout === 'band') {
    ctx.fillStyle = accent;
    ctx.fillRect(0, H * 0.58, W, H * 0.2);
    ctx.fillStyle = mask ? '#fff' : ink;
    const bs = fitText(ctx, art.brandText, maxW, H * 0.24, 700, FONT_HEAD);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(art.brandText, cx, H * 0.3 + bs * 0.35);
    ctx.fillStyle = mask ? '#000' : art.bg;
    fitText(ctx, art.variantText, maxW, H * 0.1, 600, FONT_BODY);
    ctx.fillText(art.variantText, cx, H * 0.7);
    ctx.fillStyle = ink;
    fitText(ctx, art.claimText, maxW, H * 0.065, 500, FONT_BODY);
    ctx.fillText(art.claimText, cx, H * 0.88);
  } else if (art.layout === 'minimal') {
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    const bs = fitText(ctx, art.brandText, maxW * 0.8, H * 0.15, 600, FONT_HEAD);
    ctx.save();
    ctx.translate(cx, H * 0.26 + bs * 0.35);
    ctx.fillText(art.brandText.split('').join(String.fromCharCode(8202)), 0, 0);
    ctx.restore();
    ctx.fillRect(cx - W * 0.08, H * 0.4, W * 0.16, Math.max(2, H * 0.006));
    ctx.fillStyle = mask ? '#000' : ink;
    ctx.font = `500 ${Math.round(H * 0.085)}px ${FONT_BODY}`;
    const lines = wrapLines(ctx, art.variantText, maxW * 0.85).slice(0, 2);
    lines.forEach((l, i) => ctx.fillText(l, cx, H * 0.55 + i * H * 0.1));
    ctx.fillStyle = mask ? '#000' : shade(art.ink, art.bg.toLowerCase() === '#ffffff' ? 0.3 : 0);
    ctx.font = `400 ${Math.round(H * 0.05)}px ${FONT_BODY}`;
    wrapLines(ctx, art.claimText, maxW * 0.8).slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, H * 0.78 + i * H * 0.065));
  } else {
    // stacked
    ctx.textAlign = 'center';
    ctx.fillStyle = mask ? '#fff' : ink;
    const bs = fitText(ctx, art.brandText, maxW, H * 0.22, 700, FONT_HEAD);
    ctx.fillText(art.brandText, cx, H * 0.08 + bs);
    ctx.fillStyle = accent;
    ctx.fillRect(pad, H * 0.38, maxW, H * 0.17);
    ctx.fillStyle = mask ? '#000' : art.bg;
    fitText(ctx, art.variantText, maxW * 0.92, H * 0.095, 600, FONT_BODY);
    ctx.fillText(art.variantText, cx, H * 0.495);
    ctx.fillStyle = ink;
    ctx.font = `500 ${Math.round(H * 0.062)}px ${FONT_BODY}`;
    wrapLines(ctx, art.claimText, maxW).slice(0, 2).forEach((l, i) => ctx.fillText(l, cx, H * 0.68 + i * H * 0.08));
  }
  if (!mask) {
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.font = `500 ${Math.round(H * 0.05)}px ${FONT_BODY}`;
    ctx.fillText(o.volumeText, cx, H * 0.955);
  }
}

function drawBack(ctx: CanvasRenderingContext2D, W: number, H: number, o: LabelDrawOpts) {
  const { art } = o;
  ctx.fillStyle = art.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = art.ink;
  ctx.textAlign = 'left';
  const pad = W * 0.1;
  ctx.font = `600 ${Math.round(H * 0.05)}px ${FONT_BODY}`;
  ctx.fillText('Directions', pad, H * 0.12);
  ctx.font = `400 ${Math.round(H * 0.032)}px ${FONT_BODY}`;
  const body =
    'Massage into wet hair, lather, rinse. Ingredients: Aqua, Sodium Laureth Sulfate, Cocamidopropyl Betaine, Glycerin, Parfum, Citric Acid, Sodium Benzoate. Avoid contact with eyes.';
  wrapLines(ctx, body, W - pad * 2).slice(0, 7).forEach((l, i) => ctx.fillText(l, pad, H * 0.2 + i * H * 0.045));
  // barcode
  const bx = pad;
  const by = H * 0.62;
  const bw = W * 0.42;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(bx - 6, by - 6, bw + 12, H * 0.22 + 12);
  ctx.fillStyle = '#111';
  let x = bx;
  let k = 7;
  while (x < bx + bw) {
    k = (k * 31 + 11) % 97;
    const w = 1 + (k % 4);
    if (k % 3) ctx.fillRect(x, by, w, H * 0.18);
    x += w + 1 + (k % 2);
  }
  // recycling mark
  ctx.strokeStyle = art.ink;
  ctx.lineWidth = Math.max(2, H * 0.006);
  const rx = W - pad - H * 0.09;
  const ry = H * 0.72;
  ctx.beginPath();
  ctx.moveTo(rx, ry - H * 0.08);
  ctx.lineTo(rx + H * 0.08, ry + H * 0.06);
  ctx.lineTo(rx - H * 0.08, ry + H * 0.06);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = art.ink;
  ctx.textAlign = 'center';
  ctx.font = `600 ${Math.round(H * 0.045)}px ${FONT_BODY}`;
  ctx.fillText('2', rx, ry + H * 0.035);
  ctx.font = `500 ${Math.round(H * 0.03)}px ${FONT_BODY}`;
  ctx.fillText('HDPE', rx, ry + H * 0.11);
}

export function makeLabelTextures(o: LabelDrawOpts): { map: THREE.CanvasTexture; metal?: THREE.CanvasTexture } {
  const W = o.width ?? 1024;
  const H = Math.round(Math.max(W / 4, Math.min(W * 2, W / Math.max(0.2, o.aspect))));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  if (o.face === 'back') drawBack(ctx, W, H, o);
  else if (o.face === 'sleeve' || o.face === 'wrap') {
    // Full wrap: front panel art in the middle third, back copy on the far side.
    ctx.fillStyle = o.art.bg;
    ctx.fillRect(0, 0, W, H);
    const panelW = W * (o.face === 'sleeve' ? 0.34 : 0.36);
    const sub = document.createElement('canvas');
    sub.width = Math.round(panelW * 2);
    sub.height = Math.round(H * 2);
    const sctx = sub.getContext('2d')!;
    // On a sleeve the art sits inside the body area only.
    drawFront(sctx, sub.width, sub.height, { ...o, aspect: sub.width / sub.height }, false);
    const top = o.face === 'sleeve' ? H * 0.12 : 0;
    const h = o.face === 'sleeve' ? H * 0.7 : H;
    ctx.drawImage(sub, W * 0.25 - panelW / 2 + W * 0.25, top, panelW, h);
    if (o.face === 'sleeve') {
      ctx.fillStyle = o.art.accent;
      ctx.fillRect(0, H * 0.9, W, H * 0.04);
    }
  } else drawFront(ctx, W, H, o, false);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  map.needsUpdate = true;

  let metal: THREE.CanvasTexture | undefined;
  if (o.foil && o.face !== 'back') {
    const mc = document.createElement('canvas');
    mc.width = W;
    mc.height = H;
    const m = mc.getContext('2d')!;
    m.fillStyle = '#000';
    m.fillRect(0, 0, W, H);
    if (o.face === 'front') drawFront(m, W, H, o, true);
    metal = new THREE.CanvasTexture(mc);
  }
  return { map, metal };
}
