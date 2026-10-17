import type { BottleSpec, ClosureSpec, DecorationSpec, Component } from '../domain/types';

// Seed library. Costs and lead times are indicative planning values, editable in the app.

const G = { name: 'Global platform supplier', region: 'Global' };

export const BOTTLES: BottleSpec[] = [
  {
    id: 'b-oval-400', kind: 'bottle', name: 'Platform oval 400 ml', family: 'oval', resin: 'HDPE', scope: 'global',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 400, heightMm: 205, widthMm: 72, depthMm: 46,
    shoulder: 0.55, waist: 0.04, neckFinish: '24/410', grams: 27, process: 'EBM', unitCostUsd: 0.072, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 45000, owned: true,
  },
  {
    id: 'b-oval-650', kind: 'bottle', name: 'Platform oval 650 ml', family: 'oval', resin: 'HDPE', scope: 'global',
    markets: ['global', 'IN', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 650, heightMm: 238, widthMm: 84, depthMm: 54,
    shoulder: 0.55, waist: 0.04, neckFinish: '28/410', grams: 38, process: 'EBM', unitCostUsd: 0.098, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 52000, owned: true,
  },
  {
    id: 'b-oval-180', kind: 'bottle', name: 'Platform oval 180 ml', family: 'oval', resin: 'HDPE', scope: 'global',
    markets: ['global', 'IN', 'SEA'], supplier: G, volumeMl: 180, heightMm: 158, widthMm: 58, depthMm: 36,
    shoulder: 0.55, waist: 0.03, neckFinish: '24/410', grams: 16, process: 'EBM', unitCostUsd: 0.045, moq: 300000,
    leadTimeWeeks: 6, toolingUsd: 38000, owned: true,
  },
  {
    id: 'b-cyl-340', kind: 'bottle', name: 'Cylinder 340 ml', family: 'cylinder', resin: 'HDPE', scope: 'global',
    markets: ['global', 'US', 'EU'], supplier: G, volumeMl: 340, heightMm: 190, widthMm: 58, depthMm: 58,
    shoulder: 0.35, waist: 0, neckFinish: '24/410', grams: 24, process: 'EBM', unitCostUsd: 0.064, moq: 200000,
    leadTimeWeeks: 6, toolingUsd: 40000, owned: true,
  },
  {
    id: 'b-pet-flask-300', kind: 'bottle', name: 'Clear PET flask 300 ml', family: 'flask', resin: 'PET', scope: 'global',
    markets: ['global', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 300, heightMm: 178, widthMm: 68, depthMm: 40,
    shoulder: 0.75, waist: 0.0, neckFinish: '24/410', grams: 22, process: 'ISBM', unitCostUsd: 0.081, moq: 250000,
    leadTimeWeeks: 8, toolingUsd: 60000, owned: false, notes: 'Shows product colour and pearl; clarity drops above 25% PCR.',
  },
  {
    id: 'b-tottle-250', kind: 'bottle', name: 'Inverted tottle 250 ml', family: 'tottle', resin: 'PP', scope: 'global',
    markets: ['global', 'US', 'EU'], supplier: G, volumeMl: 250, heightMm: 165, widthMm: 62, depthMm: 40,
    shoulder: 0.8, waist: 0.05, neckFinish: '28mm valve', grams: 21, process: 'EBM', unitCostUsd: 0.076, moq: 200000,
    leadTimeWeeks: 8, toolingUsd: 55000, owned: false, notes: 'Stands on its cap; best for conditioner evacuation.',
  },
  {
    id: 'b-tube-200', kind: 'bottle', name: 'Squeeze tube 200 ml', family: 'tube', resin: 'LDPE', scope: 'global',
    markets: ['global', 'US', 'EU', 'SEA'], supplier: G, volumeMl: 200, heightMm: 175, widthMm: 50, depthMm: 50,
    shoulder: 0.2, waist: 0, neckFinish: 'tube 35mm', grams: 14, process: 'Extruded tube', unitCostUsd: 0.07, moq: 150000,
    leadTimeWeeks: 5, toolingUsd: 12000, owned: false, notes: 'Masks and treatments. Runs on a tube filler, not a bottle line.',
  },
  // Local menu examples
  {
    id: 'b-in-oval-80', kind: 'bottle', name: 'India value oval 80 ml', family: 'oval', resin: 'HDPE', scope: 'local',
    markets: ['IN'], supplier: { name: 'Western India blow moulder', region: 'India' }, volumeMl: 80, heightMm: 118, widthMm: 46,
    depthMm: 28, shoulder: 0.5, waist: 0.02, neckFinish: '20/410', grams: 9, process: 'EBM', unitCostUsd: 0.026, moq: 500000,
    leadTimeWeeks: 4, toolingUsd: 9000, owned: true, notes: 'Entry price point for general trade.',
  },
  {
    id: 'b-in-oval-340', kind: 'bottle', name: 'India oval 340 ml (local)', family: 'oval', resin: 'HDPE', scope: 'local',
    markets: ['IN'], supplier: { name: 'Northern India blow moulder', region: 'India' }, volumeMl: 340, heightMm: 192, widthMm: 68,
    depthMm: 43, shoulder: 0.5, waist: 0.04, neckFinish: '24/410', grams: 25, process: 'EBM', unitCostUsd: 0.058, moq: 300000,
    leadTimeWeeks: 4, toolingUsd: 15000, owned: true,
  },
  {
    id: 'b-us-oval-750', kind: 'bottle', name: 'US club-size oval 750 ml', family: 'oval', resin: 'HDPE', scope: 'local',
    markets: ['US'], supplier: { name: 'Midwest blow moulder', region: 'USA' }, volumeMl: 750, heightMm: 252, widthMm: 90,
    depthMm: 58, shoulder: 0.55, waist: 0.05, neckFinish: '28/410', grams: 44, process: 'EBM', unitCostUsd: 0.12, moq: 150000,
    leadTimeWeeks: 6, toolingUsd: 30000, owned: true,
  },
];

export const CLOSURES: ClosureSpec[] = [
  {
    id: 'c-flip-24', kind: 'closure', name: 'Flip-top 24 mm', type: 'flip-top', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
    supplier: G, neckFinishes: ['24/410'], heightMm: 24, diameterMm: 30, grams: 4.2, needsOrientation: false, torqueNm: [1.1, 1.6], mono: true,
    unitCostUsd: 0.021, moq: 500000, leadTimeWeeks: 5, toolingUsd: 70000, owned: true,
  },
  {
    id: 'c-flip-28', kind: 'closure', name: 'Flip-top 28 mm', type: 'flip-top', scope: 'global', markets: ['global', 'IN', 'US', 'EU', 'SEA'],
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
    id: 'c-pump-28', kind: 'closure', name: 'Lotion pump 28 mm, 2.0 cc', type: 'pump', scope: 'global', markets: ['global', 'US', 'EU', 'SEA', 'IN'],
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
