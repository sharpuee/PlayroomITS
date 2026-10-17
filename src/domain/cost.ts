import type { ResolvedPack } from './resolve';
import type { Finish } from './types';
import { luminance } from './color';

const FINISH_ADDER: Record<Finish, number> = {
  gloss: 0.001, matte: 0.002, 'soft-touch': 0.008, pearl: 0.004, frosted: 0.003, clear: 0, metallic: 0.006,
};
const PCR_PREMIUM = 0.22; // PCR resin typically costs more than virgin
const FILL_CONVERSION_USD = 0.018; // filling, packing, overhead per unit at line rate

export interface CostBreakdown {
  bottle: number;
  closure: number;
  decoration: number;
  finish: number;
  filling: number;
  total: number;
  tooling: { item: string; usd: number }[];
  toolingTotal: number;
}

export function unitCost(p: ResolvedPack, lineSpeedFactor = 1): CostBreakdown {
  const { bottle, closure, decoration, market, design } = p;
  const resinPrice = market.resinUsdPerKg[bottle.resin];
  const conversion = Math.max(0.008, bottle.unitCostUsd - (bottle.grams / 1000) * 1.35);
  const pcr = design.pcrPct / 100;
  const bottleCost = (p.grams / 1000) * resinPrice * (1 + pcr * PCR_PREMIUM) + conversion;
  const decoCost = (p.labelAreaCm2 * decoration.costPer1000Cm2) / 1000;
  const finish = FINISH_ADDER[design.finish] + FINISH_ADDER[design.capFinish] * 0.4;
  const filling = FILL_CONVERSION_USD / Math.max(0.3, lineSpeedFactor);

  const tooling: { item: string; usd: number }[] = [];
  if (p.customShape) tooling.push({ item: `New bottle mould (${bottle.process})`, usd: Math.max(bottle.toolingUsd, 40000) });
  else if (!bottle.owned) tooling.push({ item: `Bottle mould: ${bottle.name}`, usd: bottle.toolingUsd });
  if (!closure.owned && closure.toolingUsd > 0) tooling.push({ item: `Closure tool: ${closure.name}`, usd: closure.toolingUsd });
  if (!decoration.owned && decoration.toolingUsd > 0) tooling.push({ item: `Decoration set-up: ${decoration.name}`, usd: decoration.toolingUsd });
  if (design.shape.ribbed && !p.customShape) tooling.push({ item: 'Mould insert for back-panel ribs', usd: 8000 });

  const total = bottleCost + closure.unitCostUsd + decoCost + finish + filling;
  return {
    bottle: bottleCost, closure: closure.unitCostUsd, decoration: decoCost, finish, filling, total,
    tooling, toolingTotal: tooling.reduce((a, t) => a + t.usd, 0),
  };
}

const EF: Record<string, number> = { HDPE: 1.9, PET: 2.2, PP: 1.7, LDPE: 2.0 }; // kg CO2e per kg virgin resin

export interface Sustainability {
  totalGrams: number;
  gramsPerMl: number;
  pcrPct: number;
  recyclScore: number;
  recyclClass: 'A' | 'B' | 'C' | 'D' | 'E';
  issues: string[];
  co2eG: number;
}

export function sustainability(p: ResolvedPack): Sustainability {
  const { bottle, closure, decoration, design } = p;
  const issues: string[] = [];
  let score = 100;
  if (bottle.resin === 'LDPE') { score -= 25; issues.push('Laminated or LDPE tubes are hard to recycle in most systems.'); }
  if (bottle.resin === 'PET' && luminance(design.bottleColor) < 0.6 && design.finish !== 'clear' && design.finish !== 'frosted') {
    score -= 15; issues.push('Coloured or opaque PET lowers recycled-PET value; keep PET clear or light tint.');
  }
  if (decoration.recyclePenalty > 0) {
    score -= decoration.recyclePenalty * 40;
    issues.push(`${decoration.name} adds a recyclability penalty (${decoration.substrate}).`);
  }
  if (design.finish === 'metallic') { score -= 20; issues.push('Metallised resin can confuse optical sorting.'); }
  if (design.finish === 'soft-touch') { score -= 8; issues.push('Soft-touch coating is a non-matching layer on the bottle.'); }
  if (luminance(design.bottleColor) < 0.03) { score -= 20; issues.push('Very dark bottles (carbon black) are invisible to NIR sorters; use NIR-detectable black.'); }
  if (!closure.mono) { score -= 12; issues.push(`${closure.name} contains a metal spring or mixed materials.`); }
  score = Math.max(0, Math.round(score));
  const recyclClass = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'E';

  const totalGrams = +(p.grams + closure.grams).toFixed(1);
  const pcr = design.pcrPct / 100;
  const co2e = (p.grams / 1000) * (EF[bottle.resin] * (1 - pcr) + 0.6 * pcr) * 1000 + closure.grams * 1.9 + p.labelAreaCm2 * 0.04;
  return { totalGrams, gramsPerMl: totalGrams / p.volumeMl, pcrPct: design.pcrPct, recyclScore: score, recyclClass, issues, co2eG: +co2e.toFixed(0) };
}
