import type { ClosureSpec, DecorationSpec, Finish, PackDesign, ProductionLine } from './types';
import { resolvePack, type Catalog, type ResolvedPack } from './resolve';
import { contrast, deltaE, luminance, shade } from './color';
import { unitCost, sustainability } from './cost';
import { rankLines, type LineFit } from './linefit';
import { COMPETITORS } from '../data/retail';

export type LensId =
  | 'standout' | 'findability' | 'brand' | 'communication' | 'premium'
  | 'ergonomics' | 'sustainability' | 'cost' | 'manufacturability' | 'compliance';

export const LENSES: { id: LensId; name: string; weight: number; question: string }[] = [
  { id: 'standout', name: 'Shelf standout', weight: 14, question: 'Does the pack pull the eye among competitors?' },
  { id: 'findability', name: 'Findability', weight: 10, question: 'Can a shopper find the variant fast?' },
  { id: 'brand', name: 'Brand codes', weight: 12, question: 'Are the distinctive assets consistent and strong?' },
  { id: 'communication', name: 'Communication', weight: 12, question: 'Are brand and benefit legible from the aisle?' },
  { id: 'premium', name: 'Price-tier cues', weight: 8, question: 'Does it signal the intended price tier?' },
  { id: 'ergonomics', name: 'Ergonomics', weight: 8, question: 'Grip, stability and dispensing in a wet shower.' },
  { id: 'sustainability', name: 'Sustainability', weight: 12, question: 'Grams, PCR and recyclability.' },
  { id: 'cost', name: 'Cost', weight: 10, question: 'Landed cost per unit against the tier target.' },
  { id: 'manufacturability', name: 'Manufacturability', weight: 10, question: 'Will it run on your current lines?' },
  { id: 'compliance', name: 'Compliance', weight: 4, question: 'Does mandatory copy fit the label?' },
];

export interface Suggestion {
  id: string;
  lens: LensId;
  text: string;
  effect: string;
  patch?: Partial<PackDesign>;
}

export interface LensResult {
  id: LensId;
  score: number; // 0..1
  detail: string;
}

export interface CoachReport {
  pack: ResolvedPack;
  total: number;
  lenses: LensResult[];
  suggestions: Suggestion[];
  cost: ReturnType<typeof unitCost>;
  sus: ReturnType<typeof sustainability>;
  bestFit?: LineFit;
  fits: LineFit[];
}

export interface CoachContext extends Catalog {
  designs: PackDesign[];
  lines: ProductionLine[];
}

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

const FINISH_PREMIUM: Record<Finish, number> = { gloss: 0.3, matte: 0.6, 'soft-touch': 0.85, pearl: 0.8, frosted: 0.7, clear: 0.5, metallic: 0.9 };
const CLOSURE_PREMIUM: Record<string, number> = { pump: 0.9, 'foam-pump': 0.85, 'disc-top': 0.6, 'flip-top': 0.3, screw: 0.1, valve: 0.5, 'tube-cap': 0.4 };
const TIER_TARGET = { value: 0.25, mainstream: 0.5, premium: 0.8 };
const TIER_RATE = { value: 0.00012, mainstream: 0.00018, premium: 0.00032 };

/** Legible distance in metres for a character height in mm (≈ 25 mm of cap height per 3 m). */
export const legibleM = (charMm: number) => charMm / 8.5;

export function textHeights(p: ResolvedPack) {
  const bodyH = p.dims.heightMm * 0.78;
  const lh = (p.design.label.wrap === 'sleeve' ? 0.9 : p.design.label.heightPct) * bodyH;
  const k = p.design.label.layout === 'band' ? 0.8 : p.design.label.layout === 'minimal' ? 1.1 : 1;
  return { brandMm: lh * 0.2 * k, variantMm: lh * 0.085 * k, labelHeightMm: lh };
}

export function coach(design: PackDesign, ctx: CoachContext, opts: { lite?: boolean } = {}): CoachReport {
  const p = resolvePack(design, ctx);
  const { brand, closure, decoration, bottle } = p;
  const lenses: LensResult[] = [];
  const sug: Suggestion[] = [];
  const fits = rankLines(p, ctx.lines);
  const bestFit = fits[0];
  const speedFactor = bestFit && bestFit.predictedBpm > 0 ? bestFit.predictedBpm / bestFit.line.targetBpm : 0.8;
  const cost = unitCost(p, speedFactor);
  const sus = sustainability(p);

  // --- Standout ---
  const comp = COMPETITORS.map((c) => ({ name: c.name, d: deltaE(design.bottleColor, c.bottle) }));
  const nearest = comp.reduce((a, b) => (b.d < a.d ? b : a));
  const avg = comp.reduce((a, b) => a + b.d, 0) / comp.length;
  const finishPop = { pearl: 0.15, metallic: 0.15, gloss: 0.06, 'soft-touch': 0.05, frosted: 0.08, clear: 0.08, matte: 0.03 }[design.finish];
  const labelPop = clamp(deltaE(design.label.bg, design.bottleColor) / 60) * 0.12;
  const standout = clamp(clamp((avg - 15) / 45) * 0.55 + clamp((nearest.d - 8) / 30) * 0.18 + finishPop + labelPop);
  lenses.push({ id: 'standout', score: standout, detail: `Average colour distance to the category set is ΔE ${avg.toFixed(0)}; closest is ${nearest.name} (ΔE ${nearest.d.toFixed(0)}).` });
  if (nearest.d < 22) {
    const pick = brand.palette
      .map((c) => ({ c, d: Math.min(...COMPETITORS.map((x) => deltaE(c, x.bottle))) }))
      .sort((a, b) => b.d - a.d)[0];
    if (pick && pick.c.toLowerCase() !== design.bottleColor.toLowerCase()) {
      sug.push({ id: 'standout-colour', lens: 'standout', text: `Bottle colour sits close to ${nearest.name} (ΔE ${nearest.d.toFixed(0)}). Move to brand colour ${pick.c} to separate from the shelf.`, effect: `Nearest competitor distance becomes ΔE ${pick.d.toFixed(0)}.`, patch: { bottleColor: pick.c } });
    }
  }

  // --- Findability ---
  const siblings = ctx.designs.filter((d) => d.id !== design.id && d.brandId === design.brandId && d.rangeName === design.rangeName);
  const th = textHeights(p);
  const variantDist = legibleM(th.variantMm);
  let find = clamp(variantDist / 1.8) * 0.6 + 0.4;
  let findDetail = `Variant name readable to about ${variantDist.toFixed(1)} m.`;
  if (siblings.length) {
    const minD = Math.min(...siblings.map((s) => deltaE(s.label.accent, design.label.accent)));
    find = clamp(variantDist / 1.8) * 0.5 + clamp(minD / 35) * 0.5;
    findDetail += ` Variant colour differs from its closest sibling by ΔE ${minD.toFixed(0)}.`;
    if (minD < 18) sug.push({ id: 'find-sibling', lens: 'findability', text: `Variant accent is too similar to another ${design.rangeName} variant (ΔE ${minD.toFixed(0)}). Give each variant its own accent colour.`, effect: 'Shoppers can tell variants apart from the aisle.' });
  }
  lenses.push({ id: 'findability', score: find, detail: findDetail });
  if (variantDist < 1.4 && design.label.wrap !== 'sleeve') {
    const nh = Math.min(0.85, +(design.label.heightPct + 0.12).toFixed(2));
    sug.push({ id: 'find-label', lens: 'findability', text: `Variant name is legible only to ${variantDist.toFixed(1)} m. Raise label height from ${(design.label.heightPct * 100).toFixed(0)}% to ${(nh * 100).toFixed(0)}% of the body.`, effect: `Readable to about ${(variantDist * nh / design.label.heightPct).toFixed(1)} m.`, patch: { label: { ...design.label, heightPct: nh } } });
  }

  // --- Brand codes ---
  const primary = brand.palette[0];
  const brandDist = Math.min(deltaE(design.bottleColor, primary), deltaE(design.label.accent, primary), deltaE(design.label.ink, primary), deltaE(design.capColor, primary));
  let brandScore = clamp(1 - brandDist / 45);
  const brandNotes = [`Closest use of the primary brand colour is ΔE ${brandDist.toFixed(0)}.`];
  if (!brand.lockedFamilies.includes(bottle.family)) {
    brandScore *= 0.65;
    brandNotes.push(`${bottle.family} is outside the brand's locked shape families.`);
    sug.push({ id: 'brand-family', lens: 'brand', text: `${brand.name} owns ${brand.lockedFamilies.join(' and ')} silhouettes; a ${bottle.family} weakens shape recognition. Use a platform ${brand.lockedFamilies[0]} or raise a deviation request.`, effect: 'Keeps the distinctive silhouette.' });
  }
  if (design.label.brandText.trim() !== brand.logoText) {
    brandScore *= 0.8;
    sug.push({ id: 'brand-logo', lens: 'brand', text: `Brand word mark reads "${design.label.brandText}" instead of the locked "${brand.logoText}".`, effect: 'Restores the global logo.', patch: { label: { ...design.label, brandText: brand.logoText } } });
  }
  if (brandDist > 25) sug.push({ id: 'brand-accent', lens: 'brand', text: `No element uses the brand primary ${primary}. Put it on the cap or label accent.`, effect: 'Brand recognised in under a second.', patch: { capColor: primary } });
  lenses.push({ id: 'brand', score: brandScore, detail: brandNotes.join(' ') });

  // --- Communication ---
  const c = contrast(design.label.ink, design.label.bg);
  const brandDistM = legibleM(th.brandMm);
  const comm = clamp((c - 2) / 5) * 0.55 + clamp(brandDistM / 3) * 0.3 + (design.label.claimText.length <= 36 ? 0.15 : 0.05);
  lenses.push({ id: 'communication', score: comm, detail: `Text contrast ${c.toFixed(1)}:1; brand legible to ${brandDistM.toFixed(1)} m; claim ${design.label.claimText.length} characters.` });
  if (c < 4.5) {
    const ink = contrast('#111111', design.label.bg) > contrast('#FFFFFF', design.label.bg) ? '#111111' : '#FFFFFF';
    sug.push({ id: 'comm-contrast', lens: 'communication', text: `Label text contrast is ${c.toFixed(1)}:1, below 4.5:1. Switch ink to ${ink === '#111111' ? 'near-black' : 'white'}.`, effect: `Contrast rises to ${contrast(ink, design.label.bg).toFixed(1)}:1.`, patch: { label: { ...design.label, ink } } });
  }
  if (design.label.claimText.length > 36) sug.push({ id: 'comm-claim', lens: 'communication', text: `Benefit claim is ${design.label.claimText.length} characters; shoppers read 3 to 5 words at shelf. Cut it to one benefit.`, effect: 'Benefit lands at a glance.' });

  // --- Premium cues ---
  const prem = decoration.premium * 0.35 + FINISH_PREMIUM[design.finish] * 0.35 + (CLOSURE_PREMIUM[closure.type] ?? 0.3) * 0.2 + (design.label.layout === 'minimal' ? 0.1 : design.label.layout === 'band' ? 0.05 : 0.02);
  const target = TIER_TARGET[brand.tier];
  lenses.push({ id: 'premium', score: clamp(1 - Math.abs(prem - target) * 1.7), detail: `Premium cue index ${(prem * 100).toFixed(0)} against a ${brand.tier} target of ${(target * 100).toFixed(0)}.` });
  if (prem < target - 0.15) sug.push({ id: 'prem-up', lens: 'premium', text: `Reads cheaper than a ${brand.tier} brand. A pearl or soft-touch finish and a minimal label lift tier cues.`, effect: 'Premium cue index rises about 15 points.', patch: { finish: 'pearl', label: { ...design.label, layout: 'minimal' } } });
  if (prem > target + 0.2) sug.push({ id: 'prem-down', lens: 'premium', text: `Signals above the ${brand.tier} price point; shoppers may expect a higher price. Gloss finish and a standard label keep it honest and cheaper.`, effect: 'Saves finish and decoration cost.', patch: { finish: 'gloss' } });

  // --- Ergonomics ---
  let ergo = 1;
  const ergoNotes: string[] = [];
  const ratio = p.totalHeightMm / p.dims.depthMm;
  if (ratio > 5.6) { ergo -= 0.25; ergoNotes.push(`Tall and narrow (height/depth ${ratio.toFixed(1)}), tips in the shower.`); }
  if (p.dims.depthMm > 60 && bottle.family !== 'cylinder') { ergo -= 0.15; ergoNotes.push('Deep body is hard to hold one-handed.'); }
  if (p.dims.heightMm > 180 && p.dims.waist < 0.03 && bottle.family !== 'tube') {
    ergo -= 0.15; ergoNotes.push('No waist for wet grip.');
    sug.push({ id: 'ergo-waist', lens: 'ergonomics', text: 'Add a 4% waist so a wet hand does not slip.', effect: 'Better grip; small volume loss.', patch: { shape: { ...design.shape, waist: 0.05 } } });
  }
  if (p.volumeMl >= 550 && !['pump', 'foam-pump'].includes(closure.type)) {
    ergo -= 0.15; ergoNotes.push('Large pack poured from a flip-top is heavy to tip.');
    const pump = ctx.components.find((x): x is ClosureSpec => x.kind === 'closure' && x.type === 'pump' && x.neckFinishes.includes(bottle.neckFinish));
    if (pump) sug.push({ id: 'ergo-pump', lens: 'ergonomics', text: `A ${p.volumeMl} ml pack is easier to use with a pump (${pump.name}).`, effect: 'Easier dosing; check line capability for pumps.', patch: { closureId: pump.id } });
  }
  const isConditioner = /condition|mask|cream/i.test(design.label.variantText + design.name);
  if (isConditioner && bottle.family !== 'tottle' && !['pump'].includes(closure.type)) {
    ergo -= 0.1; ergoNotes.push('Thick product is hard to get out of an upright bottle.');
    sug.push({ id: 'ergo-tottle', lens: 'ergonomics', text: 'Conditioner in an upright bottle leaves product behind. An inverted tottle improves evacuation.', effect: 'Up to the last drop; needs pucks on the line.' });
  }
  lenses.push({ id: 'ergonomics', score: clamp(ergo), detail: ergoNotes.length ? ergoNotes.join(' ') : 'Good grip, stability and dispensing.' });

  // --- Sustainability ---
  const gpm = sus.gramsPerMl;
  const susScore = clamp(sus.recyclScore / 100) * 0.55 + clamp(design.pcrPct / 50) * 0.25 + clamp((0.11 - gpm) / 0.05) * 0.2;
  lenses.push({ id: 'sustainability', score: susScore, detail: `Recyclability class ${sus.recyclClass}, ${design.pcrPct}% PCR, ${sus.totalGrams} g total (${(gpm * 1000).toFixed(0)} mg/ml), about ${sus.co2eG} g CO2e.` });
  if (!design.shape.ribbed && ['EBM', 'ISBM'].includes(bottle.process)) sug.push({ id: 'sus-ribs', lens: 'sustainability', text: `Add back-panel ribs to thin the wall: about ${(p.grams * 0.1).toFixed(1)} g less resin per bottle without losing topload.`, effect: `Saves ${(p.grams * 0.1).toFixed(1)} g per unit; needs a mould insert.`, patch: { shape: { ...design.shape, ribbed: true } } });
  if (design.pcrPct < p.market.pcrAvailable) sug.push({ id: 'sus-pcr', lens: 'sustainability', text: `Raise PCR from ${design.pcrPct}% to ${p.market.pcrAvailable}% (practical maximum in ${p.market.name}).`, effect: 'Lower CO2e; small cost premium and slight colour shift.', patch: { pcrPct: p.market.pcrAvailable } });
  if (decoration.recyclePenalty >= 0.3) {
    const pe = ctx.components.find((x): x is DecorationSpec => x.kind === 'decoration' && x.recyclePenalty === 0 && x.type === 'ps-label');
    if (pe) sug.push({ id: 'sus-label', lens: 'sustainability', text: `${decoration.name} hurts recyclability. A ${pe.name} matches the bottle resin.`, effect: 'Recyclability improves by up to one class.', patch: { decorationId: pe.id } });
  }
  if (!closure.mono) {
    const mono = ctx.components.find((x): x is ClosureSpec => x.kind === 'closure' && x.mono && x.type === closure.type && x.neckFinishes.includes(bottle.neckFinish));
    if (mono) sug.push({ id: 'sus-mono', lens: 'sustainability', text: `Swap to ${mono.name} to remove the metal spring.`, effect: `+$${(mono.unitCostUsd - closure.unitCostUsd).toFixed(3)} per unit.`, patch: { closureId: mono.id } });
  }
  if (luminance(design.bottleColor) < 0.03) sug.push({ id: 'sus-black', lens: 'sustainability', text: 'Specify an NIR-detectable black masterbatch, or lift the colour slightly.', effect: 'Bottle can be sorted for recycling.', patch: { bottleColor: shade(design.bottleColor, 0.18) } });

  // --- Cost ---
  const target$ = 0.05 + p.volumeMl * TIER_RATE[brand.tier];
  const costScore = clamp(1 - (cost.total / target$ - 1) * 2);
  lenses.push({ id: 'cost', score: costScore, detail: `$${cost.total.toFixed(3)} per unit against a ${brand.tier} target of $${target$.toFixed(3)}; one-off tooling $${(cost.toolingTotal / 1000).toFixed(0)}k.` });
  if (cost.total > target$ * 1.05) {
    const finishCost = cost.finish > 0.004;
    sug.push({ id: 'cost-over', lens: 'cost', text: `Unit cost is ${(((cost.total / target$) - 1) * 100).toFixed(0)}% over target. Biggest lever: ${cost.closure > cost.bottle ? 'closure' : finishCost ? 'finish' : 'bottle grams'}.`, effect: 'See the cost breakdown in Production.', patch: finishCost ? { finish: 'gloss' } : undefined });
  }

  // --- Manufacturability ---
  let manu = 0.1;
  if (bestFit) manu = bestFit.verdict === 'green' ? 1 : bestFit.verdict === 'amber' ? clamp(0.85 - bestFit.partsUsd / 150000, 0.45, 0.85) : 0.1;
  lenses.push({ id: 'manufacturability', score: manu, detail: bestFit ? `Best fit: ${bestFit.line.name}, ${bestFit.verdict}${bestFit.parts.length ? `, ${bestFit.parts.length} change parts ($${(bestFit.partsUsd / 1000).toFixed(1)}k)` : ''}, about ${bestFit.predictedBpm} bpm.` : 'No lines modelled.' });
  if (bestFit && bestFit.verdict === 'red') {
    // Try a closure that the best-ranked line can run.
    const alts = ctx.components.filter((x): x is ClosureSpec => x.kind === 'closure' && x.neckFinishes.includes(bottle.neckFinish) && x.id !== closure.id);
    for (const alt of alts) {
      const trial = resolvePack({ ...design, closureId: alt.id }, ctx);
      const r = rankLines(trial, ctx.lines)[0];
      if (r && r.verdict !== 'red') {
        sug.push({ id: 'manu-closure', lens: 'manufacturability', text: `No current line can run this pack. With ${alt.name} it runs on ${r.line.name} (${r.verdict}).`, effect: 'Avoids new line capex.', patch: { closureId: alt.id } });
        break;
      }
    }
    if (p.customShape) sug.push({ id: 'manu-shape', lens: 'manufacturability', text: 'The custom shape falls outside every line envelope. Reset to the platform dimensions.', effect: 'Back inside the envelope.', patch: { shape: { ribbed: design.shape.ribbed } } });
  } else if (bestFit && bestFit.verdict === 'amber' && p.customShape) {
    sug.push({ id: 'manu-format', lens: 'manufacturability', text: `Custom footprint ${p.dims.widthMm.toFixed(0)}×${p.dims.depthMm.toFixed(0)} mm needs new change parts ($${(bestFit.partsUsd / 1000).toFixed(1)}k). Matching the platform footprint reuses existing parts.`, effect: 'Saves change parts and changeover time.', patch: { shape: { ...design.shape, widthMm: undefined, depthMm: undefined } } });
  }

  // --- Compliance ---
  const backShare = design.label.wrap === 'front' ? 0 : design.label.wrap === 'front-back' ? 0.45 : 0.55;
  const available = p.labelAreaCm2 * backShare;
  const need = p.market.mandatoryTextCm2;
  const compl = design.label.wrap === 'front' ? 0.3 : clamp(available / need);
  lenses.push({ id: 'compliance', score: compl, detail: `About ${available.toFixed(0)} cm² for mandatory copy; ${p.market.name} needs about ${need} cm².` });
  if (compl < 1) sug.push({ id: 'compl-area', lens: 'compliance', text: design.label.wrap === 'front' ? 'A front-only label leaves nowhere for ingredients and legal copy. Add a back label.' : `Mandatory copy needs about ${need} cm² but only ${available.toFixed(0)} cm² is free. Enlarge the back label.`, effect: 'Meets labelling rules without tiny type.', patch: design.label.wrap === 'front' ? { label: { ...design.label, wrap: 'front-back' } } : { label: { ...design.label, heightPct: Math.min(0.85, design.label.heightPct + 0.1) } } });

  const total = Math.round(LENSES.reduce((a, l) => a + l.weight * (lenses.find((x) => x.id === l.id)?.score ?? 0), 0));
  return { pack: p, total, lenses, suggestions: opts.lite ? [] : sug, cost, sus, bestFit, fits };
}

export interface Alternative {
  design: PackDesign;
  score: number;
  changes: string[];
}

/** Generates alternative directions that keep locked brand codes, ranked by Pack Score. */
export function generateAlternatives(design: PackDesign, ctx: CoachContext, n = 6, seed = 1): Alternative[] {
  const base = coach(design, ctx);
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const brand = base.pack.brand;
  const closures = ctx.components.filter((x): x is ClosureSpec => x.kind === 'closure' && x.neckFinishes.includes(base.pack.bottle.neckFinish));
  const decos = ctx.components.filter((x): x is DecorationSpec => x.kind === 'decoration' && (x.scope === 'global' || x.markets.includes(design.market)));
  const finishes: Finish[] = base.pack.bottle.resin === 'PET' ? ['clear', 'frosted', 'gloss', 'pearl'] : ['gloss', 'matte', 'pearl', 'soft-touch'];
  const layouts = ['stacked', 'band', 'minimal'] as const;

  const cands: Alternative[] = [];
  const push = (d: PackDesign, changes: string[]) => {
    const r = coach(d, ctx, { lite: true });
    cands.push({ design: d, score: r.total, changes });
  };

  // Each coach fix on its own, then all fixes together.
  const fixes = base.suggestions.filter((x) => x.patch);
  for (const f of fixes) push({ ...design, ...f.patch, label: { ...design.label, ...(f.patch?.label ?? {}) }, shape: { ...design.shape, ...(f.patch?.shape ?? {}) } }, [f.text.split('.')[0]]);
  if (fixes.length > 1) {
    let all = { ...design };
    for (const f of fixes) all = { ...all, ...f.patch, label: { ...all.label, ...(f.patch?.label ?? {}) }, shape: { ...all.shape, ...(f.patch?.shape ?? {}) } };
    push(all, ['All Coach fixes applied together']);
  }
  // Exploratory directions inside brand guardrails.
  for (let i = 0; i < 24; i++) {
    const changes: string[] = [];
    const d: PackDesign = { ...design, label: { ...design.label }, shape: { ...design.shape } };
    if (rnd() < 0.5) { d.finish = finishes[Math.floor(rnd() * finishes.length)]; changes.push(`${d.finish} finish`); }
    if (rnd() < 0.45) {
      const c = brand.palette[Math.floor(rnd() * brand.palette.length)];
      d.bottleColor = rnd() < 0.5 ? c : shade(c, (rnd() - 0.5) * 0.4);
      changes.push(`bottle ${d.bottleColor}`);
    }
    if (rnd() < 0.4) { d.capColor = brand.palette[Math.floor(rnd() * brand.palette.length)]; changes.push(`cap ${d.capColor}`); }
    if (rnd() < 0.4) { d.label.layout = layouts[Math.floor(rnd() * 3)]; changes.push(`${d.label.layout} label`); }
    if (rnd() < 0.35) { d.label.heightPct = +clamp(d.label.heightPct + (rnd() - 0.3) * 0.25, 0.3, 0.85).toFixed(2); changes.push(`label ${(d.label.heightPct * 100).toFixed(0)}% high`); }
    if (rnd() < 0.3 && closures.length > 1) { const c = closures[Math.floor(rnd() * closures.length)]; d.closureId = c.id; changes.push(c.name); }
    if (rnd() < 0.25 && decos.length > 1) { const x = decos[Math.floor(rnd() * decos.length)]; d.decorationId = x.id; changes.push(x.name); }
    if (rnd() < 0.3) { d.shape.ribbed = true; changes.push('ribbed back panel'); }
    if (rnd() < 0.3) { d.shape.waist = +clamp((d.shape.waist ?? base.pack.dims.waist) + 0.03, 0, 0.12).toFixed(2); changes.push('deeper waist'); }
    d.label.ink = contrast('#111111', d.label.bg) > contrast('#FFFFFF', d.label.bg) ? (contrast(d.label.ink, d.label.bg) >= 4.5 ? d.label.ink : '#111111') : d.label.ink;
    if (changes.length) push(d, changes);
  }
  const seen = new Set<string>();
  return cands
    .filter((c) => c.score > base.total - 3)
    .sort((a, b) => b.score - a.score)
    .filter((c) => {
      const k = c.changes.join('|');
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, n);
}
