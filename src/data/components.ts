import type { BottleSpec, ClosureSpec, DecorationSpec, Component } from '../domain/types';

// Seed library. Costs and lead times are indicative planning values, editable in the app.

const G = { name: 'Global platform supplier', region: 'Global' };

export const BOTTLES: BottleSpec[] = [
  // Current H&S portfolio (swan oval) — shapes traced from the bottle portfolio line-up.
  {
    id: 'b-oval-180', kind: 'bottle', name: 'H&S swan oval 180 ml', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'hs-swan',
    markets: ['global', 'IN', 'SEA'], supplier: G, volumeMl: 180, heightMm: 150, widthMm: 58, depthMm: 36,
    shoulder: 0.55, waist: 0, neckFinish: '24/410', grams: 16, process: 'EBM', unitCostUsd: 0.045, moq: 300000,
    leadTimeWeeks: 6, toolingUsd: 38000, owned: true,
  },
  {
    id: 'b-oval-400', kind: 'bottle', name: 'H&S swan oval 400 ml', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'hs-swan',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 400, heightMm: 190, widthMm: 72, depthMm: 46,
    shoulder: 0.55, waist: 0, neckFinish: '24/410', grams: 27, process: 'EBM', unitCostUsd: 0.072, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 45000, owned: true,
  },
  {
    id: 'b-oval-650', kind: 'bottle', name: 'H&S swan oval 650 ml', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'hs-swan',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 650, heightMm: 225, widthMm: 84, depthMm: 54,
    shoulder: 0.55, waist: 0, neckFinish: '28/410', grams: 38, process: 'EBM', unitCostUsd: 0.098, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 52000, owned: true,
  },
  {
    id: 'b-hs-swan-1000', kind: 'bottle', name: 'H&S swan oval 1000 ml (pump)', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'hs-swan',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 1000, heightMm: 255, widthMm: 104, depthMm: 64,
    shoulder: 0.55, waist: 0, neckFinish: '28/410', grams: 56, process: 'EBM', unitCostUsd: 0.15, moq: 150000,
    leadTimeWeeks: 6, toolingUsd: 60000, owned: true, notes: 'Family-size pack sold with a pump.',
  },
  // On-menu global shapes
  {
    id: 'b-hs-supreme-300', kind: 'bottle', name: 'H&S swan PET 300 ml', family: 'oval', resin: 'PET', scope: 'global', profileId: 'hs-supreme',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 300, heightMm: 182, widthMm: 66, depthMm: 40,
    shoulder: 0.6, waist: 0, neckFinish: '24/410', grams: 22, process: 'ISBM', unitCostUsd: 0.082, moq: 250000,
    leadTimeWeeks: 8, toolingUsd: 60000, owned: false, notes: 'Swan PET/HDPE family, 150 to 800 ml; usually sleeved.',
  },
  {
    id: 'b-hs-men-300', kind: 'bottle', name: 'H&S men tapered 300 ml', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'hs-men',
    markets: ['global', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 300, heightMm: 178, widthMm: 62, depthMm: 42,
    shoulder: 0.6, waist: 0, neckFinish: '24/410', grams: 23, process: 'EBM', unitCostUsd: 0.07, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 45000, owned: false,
  },
  {
    id: 'b-pa-j-750', kind: 'bottle', name: 'Pantene J-shape 750 ml', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'pantene-j',
    markets: ['global', 'US'], supplier: G, volumeMl: 750, heightMm: 240, widthMm: 84, depthMm: 58,
    shoulder: 0.5, waist: 0, neckFinish: '28/410', grams: 44, process: 'EBM', unitCostUsd: 0.12, moq: 150000,
    leadTimeWeeks: 8, toolingUsd: 55000, owned: false, notes: 'J-shape family: 235, 625, 750 and 1140 ml.',
  },
  {
    id: 'b-pa-column-1000', kind: 'bottle', name: 'Pantene column 1000 ml (pump)', family: 'oval', resin: 'HDPE', scope: 'global', profileId: 'pantene-column',
    markets: ['global', 'IN', 'SEA'], supplier: G, volumeMl: 1000, heightMm: 205, widthMm: 104, depthMm: 72,
    shoulder: 0.5, waist: 0, neckFinish: '28/410', grams: 58, process: 'EBM', unitCostUsd: 0.155, moq: 150000,
    leadTimeWeeks: 8, toolingUsd: 60000, owned: true, notes: 'Column equity: 400, 500 and 1000 ml.',
  },
  {
    id: 'b-pa-cyl-400', kind: 'bottle', name: 'Pantene cylindrical 400 ml', family: 'cylinder', resin: 'PET', scope: 'global', profileId: 'pantene-cyl',
    markets: ['global', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 400, heightMm: 178, widthMm: 64, depthMm: 64,
    shoulder: 0.5, waist: 0, neckFinish: '24/410', grams: 30, process: 'ISBM', unitCostUsd: 0.095, moq: 200000,
    leadTimeWeeks: 8, toolingUsd: 60000, owned: false, notes: 'Cylindrical family, 150 to 800 ml; usually sleeved.',
  },
  {
    id: 'b-he-round-400', kind: 'bottle', name: 'Herbal Essences round-shoulder 400 ml', family: 'cylinder', resin: 'PET', scope: 'global', profileId: 'herbal-round',
    markets: ['global', 'US', 'EU', 'SEA', 'IN'], supplier: G, volumeMl: 400, heightMm: 192, widthMm: 66, depthMm: 66,
    shoulder: 0.6, waist: 0, neckFinish: '24/410', grams: 29, process: 'ISBM', unitCostUsd: 0.09, moq: 200000,
    leadTimeWeeks: 8, toolingUsd: 60000, owned: false,
  },
  {
    id: 'b-tottle-250', kind: 'bottle', name: 'Inverted tottle 250 ml', family: 'tottle', resin: 'PP', scope: 'global',
    markets: ['global', 'US', 'EU'], supplier: G, volumeMl: 250, heightMm: 165, widthMm: 62, depthMm: 40,
    shoulder: 0.8, waist: 0.05, neckFinish: '28mm valve', grams: 21, process: 'EBM', unitCostUsd: 0.076, moq: 200000,
    leadTimeWeeks: 8, toolingUsd: 55000, owned: false, notes: 'Stands on its cap; best for conditioner evacuation.',
  },
  {
    id: 'b-tube-200', kind: 'bottle', name: 'Conditioner tube 200 ml', family: 'tube', resin: 'LDPE', scope: 'global',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 200, heightMm: 175, widthMm: 50, depthMm: 50,
    shoulder: 0.2, waist: 0, neckFinish: 'tube 35mm', grams: 14, process: 'Extruded tube', unitCostUsd: 0.07, moq: 150000,
    leadTimeWeeks: 5, toolingUsd: 12000, owned: true, notes: 'Pantene conditioner tubes (100 and 200 ml). Runs on a tube filler, not a bottle line.',
  },
  // Current India local formats
  {
    id: 'b-in-oval-80', kind: 'bottle', name: 'H&S swan oval 80 ml (India)', family: 'oval', resin: 'HDPE', scope: 'local', profileId: 'hs-swan',
    markets: ['IN'], supplier: { name: 'Local blow moulder', region: 'India' }, volumeMl: 80, heightMm: 118, widthMm: 46,
    depthMm: 28, shoulder: 0.5, waist: 0, neckFinish: '20/410', grams: 9, process: 'EBM', unitCostUsd: 0.026, moq: 500000,
    leadTimeWeeks: 4, toolingUsd: 9000, owned: true, notes: 'Entry price point for general trade.',
  },
  {
    id: 'b-in-oval-340', kind: 'bottle', name: 'Pantene slim oval 340 ml (India)', family: 'oval', resin: 'HDPE', scope: 'local', profileId: 'pantene-slim',
    markets: ['IN'], supplier: { name: 'Local blow moulder', region: 'India' }, volumeMl: 340, heightMm: 200, widthMm: 68,
    depthMm: 43, shoulder: 0.5, waist: 0, neckFinish: '24/410', grams: 25, process: 'EBM', unitCostUsd: 0.058, moq: 300000,
    leadTimeWeeks: 4, toolingUsd: 15000, owned: true,
  },
  {
    id: 'b-pa-slim-650', kind: 'bottle', name: 'Pantene slim oval 650 ml (India)', family: 'oval', resin: 'HDPE', scope: 'local', profileId: 'pantene-slim',
    markets: ['IN'], supplier: { name: 'Local blow moulder', region: 'India' }, volumeMl: 650, heightMm: 238, widthMm: 80,
    depthMm: 50, shoulder: 0.5, waist: 0, neckFinish: '28/410', grams: 38, process: 'EBM', unitCostUsd: 0.092, moq: 200000,
    leadTimeWeeks: 4, toolingUsd: 18000, owned: true,
  },
  // Off-menu stock bottles from incumbent suppliers (pump compatible, no new mould)
  ...([
    ['b-stock-hdpe-oval-250', 'Stock HDPE oval 250 ml', 'oval', 'HDPE', 'off-hdpe-oval', 250, 140, 64, 48, 19],
    ['b-stock-hdpe-rect-200', 'Stock HDPE rectangle 200 ml', 'rectangle', 'HDPE', 'off-hdpe-rect', 200, 150, 60, 38, 17],
    ['b-stock-hdpe-round-200', 'Stock HDPE round 200 ml', 'cylinder', 'HDPE', 'off-hdpe-round', 200, 165, 50, 50, 16],
    ['b-stock-pet-oval-250', 'Stock clear PET oval 250 ml', 'oval', 'PET', 'off-pet-oval', 250, 160, 60, 46, 18],
    ['b-stock-pet-cyl-300', 'Stock clear PET cylinder 300 ml', 'cylinder', 'PET', 'off-pet-cyl', 300, 195, 55, 55, 20],
  ] as const).map(([id, name, family, resin, profileId, volumeMl, heightMm, widthMm, depthMm, grams]): BottleSpec => ({
    id, kind: 'bottle', name, family, resin, profileId, scope: 'local', markets: ['IN'],
    supplier: { name: 'Incumbent bottle supplier (stock mould)', region: 'India' }, volumeMl, heightMm, widthMm, depthMm,
    shoulder: 0.6, waist: 0, neckFinish: '24/410', grams, process: resin === 'PET' ? 'ISBM' : 'EBM',
    unitCostUsd: +(grams / 1000 * 1.35 + 0.03).toFixed(3), moq: 100000, leadTimeWeeks: 4, toolingUsd: 0, owned: false,
    notes: 'Off-menu stock design: no new mould, works with lotion pumps; needs line change parts and qualification.',
  })),
];

export const CLOSURES: ClosureSpec[] = [
  {
    id: 'c-flip-24', kind: 'closure', name: 'Flip-top 24 mm (Pantene style)', type: 'flip-top', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['24/410'], heightMm: 24, diameterMm: 30, grams: 4.2, needsOrientation: false, torqueNm: [1.1, 1.6], mono: true,
    unitCostUsd: 0.021, moq: 500000, leadTimeWeeks: 5, toolingUsd: 70000, owned: true,
  },
  {
    id: 'c-flip-28', kind: 'closure', name: 'Flip-top 28 mm (Pantene style)', type: 'flip-top', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 26, diameterMm: 34, grams: 5.0, needsOrientation: false, torqueNm: [1.4, 2.0], mono: true,
    unitCostUsd: 0.024, moq: 500000, leadTimeWeeks: 5, toolingUsd: 75000, owned: true,
  },
  {
    id: 'c-disc-24', kind: 'closure', name: 'Disc-top 24 mm', type: 'disc-top', scope: 'global', markets: ['global', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['24/410'], heightMm: 20, diameterMm: 31, grams: 4.6, needsOrientation: true, torqueNm: [1.1, 1.6], mono: true,
    unitCostUsd: 0.026, moq: 500000, leadTimeWeeks: 6, toolingUsd: 85000, owned: false,
  },
  {
    id: 'c-screw-24', kind: 'closure', name: 'Ribbed screw cap 24 mm', type: 'screw', scope: 'global', markets: ['global', 'IN', 'SEA'],
    supplier: G, neckFinishes: ['24/410'], heightMm: 16, diameterMm: 28, grams: 2.6, needsOrientation: false, torqueNm: [1.0, 1.5], mono: true,
    unitCostUsd: 0.011, moq: 1000000, leadTimeWeeks: 4, toolingUsd: 40000, owned: true,
  },
  {
    id: 'c-pump-28', kind: 'closure', name: 'Spout pump 28 mm, 2.0 cc (H&S family size)', type: 'pump', style: 'spout-pump', scope: 'global', markets: ['global', 'US', 'EU', 'SEA', 'IN'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 62, diameterMm: 34, grams: 13, outputCc: 2.0, needsOrientation: true, torqueNm: [1.6, 2.3], mono: false,
    unitCostUsd: 0.095, moq: 250000, leadTimeWeeks: 10, toolingUsd: 0, owned: true, notes: 'Steel spring: limits recyclability unless a mono-material pump is chosen.',
  },
  {
    id: 'c-pump-mono-28', kind: 'closure', name: 'Mono-material pump 28 mm, 1.8 cc', type: 'pump', scope: 'global', markets: ['global', 'US', 'EU'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 60, diameterMm: 34, grams: 12, outputCc: 1.8, needsOrientation: true, torqueNm: [1.6, 2.3], mono: true,
    unitCostUsd: 0.13, moq: 250000, leadTimeWeeks: 12, toolingUsd: 0, owned: false, notes: 'All-PP pump with plastic spring.',
  },
  {
    id: 'c-foam-28', kind: 'closure', name: 'Foam pump 28 mm', type: 'foam-pump', scope: 'global', markets: ['global', 'US', 'EU'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 70, diameterMm: 40, grams: 16, outputCc: 0.8, needsOrientation: true, torqueNm: [1.6, 2.3], mono: false,
    unitCostUsd: 0.16, moq: 200000, leadTimeWeeks: 12, toolingUsd: 0, owned: false,
  },
  {
    id: 'c-valve-28', kind: 'closure', name: 'Inverted valve cap 28 mm', type: 'valve', scope: 'global', markets: ['global', 'US', 'EU'],
    supplier: G, neckFinishes: ['28mm valve'], heightMm: 22, diameterMm: 44, grams: 6.5, needsOrientation: true, torqueNm: [1.5, 2.2], mono: false,
    unitCostUsd: 0.052, moq: 300000, leadTimeWeeks: 8, toolingUsd: 0, owned: false, notes: 'Silicone valve; stands as the base of a tottle.',
  },
  {
    id: 'c-tubecap-35', kind: 'closure', name: 'Tube flip cap 35 mm', type: 'tube-cap', scope: 'global', markets: ['global', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['tube 35mm'], heightMm: 22, diameterMm: 38, grams: 4.8, needsOrientation: true, torqueNm: [0.8, 1.2], mono: true,
    unitCostUsd: 0.028, moq: 300000, leadTimeWeeks: 6, toolingUsd: 0, owned: false,
  },
  {
    id: 'c-in-flip-20', kind: 'closure', name: 'Flip-top 20 mm (India local)', type: 'flip-top', scope: 'local', markets: ['IN'],
    supplier: { name: 'Gujarat closure moulder', region: 'India' }, neckFinishes: ['20/410'], heightMm: 20, diameterMm: 25, grams: 2.8,
    needsOrientation: false, torqueNm: [0.8, 1.2], mono: true, unitCostUsd: 0.009, moq: 1000000, leadTimeWeeks: 3, toolingUsd: 12000, owned: true,
  },
  {
    id: 'c-in-flip-24', kind: 'closure', name: 'Flip-top 24 mm (India local)', type: 'flip-top', scope: 'local', markets: ['IN'],
    supplier: { name: 'Gujarat closure moulder', region: 'India' }, neckFinishes: ['24/410'], heightMm: 23, diameterMm: 30, grams: 3.9,
    needsOrientation: false, torqueNm: [1.1, 1.6], mono: true, unitCostUsd: 0.014, moq: 1000000, leadTimeWeeks: 3, toolingUsd: 14000, owned: true,
  },
  {
    id: 'c-hs-dome-24', kind: 'closure', name: 'H&S dome flip-top 24 mm', type: 'flip-top', style: 'dome-flip', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['24/410'], heightMm: 34, diameterMm: 34, grams: 5.2, needsOrientation: false, torqueNm: [1.1, 1.6], mono: true,
    unitCostUsd: 0.024, moq: 500000, leadTimeWeeks: 5, toolingUsd: 80000, owned: true, notes: 'Tall domed lid that continues the swan curve.',
  },
  {
    id: 'c-hs-dome-28', kind: 'closure', name: 'H&S dome flip-top 28 mm', type: 'flip-top', style: 'dome-flip', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 38, diameterMm: 36, grams: 6.1, needsOrientation: false, torqueNm: [1.4, 2.0], mono: true,
    unitCostUsd: 0.027, moq: 500000, leadTimeWeeks: 5, toolingUsd: 85000, owned: true,
  },
  {
    id: 'c-disc-pump-28', kind: 'closure', name: 'Disc-head pump 28 mm (Pantene gold)', type: 'pump', style: 'disc-pump', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['28/410'], heightMm: 66, diameterMm: 46, grams: 15, outputCc: 2.0, needsOrientation: true, torqueNm: [1.6, 2.3], mono: false,
    unitCostUsd: 0.11, moq: 250000, leadTimeWeeks: 10, toolingUsd: 0, owned: true, notes: 'Wide disc actuator with a short nozzle.',
  },
  {
    id: 'c-disc-pump-24', kind: 'closure', name: 'Disc-head pump 24 mm (stock)', type: 'pump', style: 'disc-pump', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: { name: 'Incumbent pump supplier', region: 'Global' }, neckFinishes: ['24/410'], heightMm: 58, diameterMm: 42, grams: 13, outputCc: 1.5, needsOrientation: true, torqueNm: [1.2, 1.8], mono: false,
    unitCostUsd: 0.1, moq: 100000, leadTimeWeeks: 8, toolingUsd: 0, owned: false, notes: 'Supplier stock; fits the off-menu stock bottles.',
  },
  {
    id: 'c-spout-pump-24', kind: 'closure', name: 'Lock-down spout pump 24 mm (stock)', type: 'pump', style: 'spout-pump', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: { name: 'Incumbent pump supplier', region: 'Global' }, neckFinishes: ['24/410'], heightMm: 54, diameterMm: 32, grams: 12, outputCc: 2.0, needsOrientation: true, torqueNm: [1.2, 1.8], mono: false,
    unitCostUsd: 0.085, moq: 100000, leadTimeWeeks: 8, toolingUsd: 0, owned: false, notes: 'Supplier stock; fits the off-menu stock bottles.',
  },
];

export const DECORATIONS: DecorationSpec[] = [
  {
    id: 'd-ps-pe', kind: 'decoration', name: 'PE pressure-sensitive label', type: 'ps-label', substrate: 'PE film, matching HDPE', scope: 'global',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, costPer1000Cm2: 0.11, recyclePenalty: 0, premium: 0.3,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 3, toolingUsd: 1500, owned: true,
  },
  {
    id: 'd-ps-bopp-foil', kind: 'decoration', name: 'BOPP label + hot-foil accents', type: 'hot-foil', substrate: 'BOPP with metallic foil', scope: 'global',
    markets: ['global', 'US', 'EU', 'SEA', 'IN'], supplier: G, costPer1000Cm2: 0.19, recyclePenalty: 0.35, premium: 0.8,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 4, toolingUsd: 3500, owned: true,
  },
  {
    id: 'd-sleeve-petg', kind: 'decoration', name: 'Full-body shrink sleeve (PETG)', type: 'shrink-sleeve', substrate: 'PETG sleeve', scope: 'global',
    markets: ['global', 'IN', 'US', 'SEA'], supplier: G, costPer1000Cm2: 0.09, recyclePenalty: 0.7, premium: 0.6,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 4, toolingUsd: 2500, owned: false, notes: 'Full sleeves can block NIR sorting of the bottle.',
  },
  {
    id: 'd-iml', kind: 'decoration', name: 'In-mould label', type: 'iml', substrate: 'PP/PE film fused in mould', scope: 'global',
    markets: ['global', 'US', 'EU'], supplier: G, costPer1000Cm2: 0.14, recyclePenalty: 0, premium: 0.55,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 8, toolingUsd: 25000, owned: false, notes: 'Done at the bottle maker; no labeller on your line.',
  },
  {
    id: 'd-screen', kind: 'decoration', name: 'Direct screen print', type: 'screen-print', substrate: 'Ink on bottle', scope: 'global',
    markets: ['global', 'US', 'EU', 'SEA'], supplier: G, costPer1000Cm2: 0.16, recyclePenalty: 0.1, premium: 0.65,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 6, toolingUsd: 4000, owned: false, notes: 'No-label look; done at the bottle maker.',
  },
  {
    id: 'd-in-paper', kind: 'decoration', name: 'Paper wrap label (India local)', type: 'ps-label', substrate: 'Coated paper', scope: 'local',
    markets: ['IN'], supplier: { name: 'Mumbai label converter', region: 'India' }, costPer1000Cm2: 0.045, recyclePenalty: 0.2, premium: 0.1,
    unitCostUsd: 0, moq: 0, leadTimeWeeks: 2, toolingUsd: 500, owned: true,
  },
];

export const ALL_COMPONENTS: Component[] = [...BOTTLES, ...CLOSURES, ...DECORATIONS];
