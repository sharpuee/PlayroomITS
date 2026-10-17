import type { BottleSpec, Brand, ClosureSpec, DecorationSpec, Market, PackDesign, Component } from './types';
import { marketById } from '../data/markets';

export interface ResolvedPack {
  design: PackDesign;
  bottle: BottleSpec;
  closure: ClosureSpec;
  decoration: DecorationSpec;
  brand: Brand;
  market: Market;
  dims: { heightMm: number; widthMm: number; depthMm: number; shoulder: number; waist: number };
  volumeMl: number;
  grams: number; // bottle grams after shape changes and ribbing
  customShape: boolean;
  totalHeightMm: number; // incl. closure
  labelAreaCm2: number;
}

export interface Catalog {
  components: Component[];
  brands: Brand[];
  markets: Market[];
}

export function resolvePack(design: PackDesign, cat: Catalog): ResolvedPack {
  const bottles = cat.components.filter((c): c is BottleSpec => c.kind === 'bottle');
  const closures = cat.components.filter((c): c is ClosureSpec => c.kind === 'closure');
  const decos = cat.components.filter((c): c is DecorationSpec => c.kind === 'decoration');
  const bottle = bottles.find((b) => b.id === design.bottleId) ?? bottles[0];
  const closure = closures.find((c) => c.id === design.closureId) ?? closures[0];
  const decoration = decos.find((d) => d.id === design.decorationId) ?? decos[0];
  const brand = cat.brands.find((b) => b.id === design.brandId) ?? cat.brands[0];
  const market = cat.markets.find((m) => m.id === design.market) ?? marketById(design.market);

  const s = design.shape;
  const dims = {
    heightMm: s.heightMm ?? bottle.heightMm,
    widthMm: s.widthMm ?? bottle.widthMm,
    depthMm: s.depthMm ?? bottle.depthMm,
    shoulder: s.shoulder ?? bottle.shoulder,
    waist: s.waist ?? bottle.waist,
  };
  const customShape =
    Math.abs(dims.heightMm - bottle.heightMm) > 1 ||
    Math.abs(dims.widthMm - bottle.widthMm) > 1 ||
    Math.abs(dims.depthMm - bottle.depthMm) > 1 ||
    Math.abs(dims.shoulder - bottle.shoulder) > 0.02 ||
    Math.abs(dims.waist - bottle.waist) > 0.01;

  // Volume scales with the body envelope (rough planning model).
  const ratio =
    (dims.heightMm / bottle.heightMm) * (dims.widthMm / bottle.widthMm) * (dims.depthMm / bottle.depthMm) *
    (1 - dims.waist * 0.8) / (1 - bottle.waist * 0.8);
  const volumeMl = Math.round(bottle.volumeMl * ratio);
  // Surface area drives grams; ribbing lets you thin the wall ~10%.
  const areaRatio = Math.pow(ratio, 2 / 3);
  const grams = +(bottle.grams * areaRatio * (s.ribbed ? 0.9 : 1)).toFixed(1);

  const bodyH = dims.heightMm * 0.78;
  const perim = Math.PI * (3 * (dims.widthMm + dims.depthMm) / 2 - Math.sqrt((3 * dims.widthMm / 2 + dims.depthMm / 2) * (dims.widthMm / 2 + 3 * dims.depthMm / 2)));
  const wrapFrac = { front: 0.32, 'front-back': 0.62, wrap: 0.92, sleeve: 1 }[design.label.wrap];
  const hFrac = design.label.wrap === 'sleeve' ? 0.98 : design.label.heightPct;
  const labelAreaCm2 = +((perim * wrapFrac * bodyH * hFrac) / 100).toFixed(1);

  const inverted = bottle.family === 'tottle';
  const totalHeightMm = dims.heightMm + (inverted ? closure.heightMm * 0.6 : closure.heightMm * 0.85);

  return { design, bottle, closure, decoration, brand, market, dims, volumeMl, grams, customShape, totalHeightMm, labelAreaCm2 };
}

export function formatKey(family: string, w: number, d: number) {
  return `${family}-${Math.round(w)}x${Math.round(d)}`;
}

export function money(usd: number, market: Market, digits = 3) {
  const v = usd * market.fxPerUsd;
  const sym = market.currency === 'INR' ? '₹' : market.currency === 'EUR' ? '€' : '$';
  const d = market.currency === 'INR' ? Math.max(0, digits - 1) : digits;
  return `${sym}${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}

export function moneyBig(usd: number, market: Market) {
  const v = usd * market.fxPerUsd;
  const sym = market.currency === 'INR' ? '₹' : market.currency === 'EUR' ? '€' : '$';
  if (Math.abs(v) >= 1e7 && market.currency === 'INR') return `${sym}${(v / 1e7).toFixed(2)} Cr`;
  if (Math.abs(v) >= 1e5 && market.currency === 'INR') return `${sym}${(v / 1e5).toFixed(1)} L`;
  if (Math.abs(v) >= 1e6) return `${sym}${(v / 1e6).toFixed(2)}M`;
  if (Math.abs(v) >= 1e3) return `${sym}${(v / 1e3).toFixed(1)}k`;
  return `${sym}${v.toFixed(0)}`;
}
