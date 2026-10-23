import type { Brand, Market } from '../domain/types';

// Planning assumptions; edit in Settings. FX and resin prices are illustrative, not live.
export const MARKETS: Market[] = [
  {
    id: 'global', name: 'Global platform', currency: 'USD', fxPerUsd: 1, sizeLadderMl: [180, 300, 400, 650],
    minFontMm: 1.2, mandatoryTextCm2: 14, legalNote: 'Global baseline: INCI list, net content, warnings, recycling mark.',
    resinUsdPerKg: { HDPE: 1.35, PET: 1.25, PP: 1.3, LDPE: 1.4 }, pcrAvailable: 50,
  },
  {
    id: 'IN', name: 'India', currency: 'INR', fxPerUsd: 84, sizeLadderMl: [80, 180, 340, 650],
    minFontMm: 1.0, mandatoryTextCm2: 18, legalNote: 'Legal Metrology declarations (MRP, net qty, manufacturer, consumer care) plus BIS/cosmetics rules; bilingual where needed.',
    resinUsdPerKg: { HDPE: 1.2, PET: 1.15, PP: 1.15, LDPE: 1.25 }, pcrAvailable: 30,
  },
  {
    id: 'US', name: 'United States', currency: 'USD', fxPerUsd: 1, sizeLadderMl: [250, 370, 750],
    minFontMm: 1.6, mandatoryTextCm2: 16, legalNote: 'FDA cosmetic labelling: identity, net quantity in oz and ml, ingredients, distributor.',
    resinUsdPerKg: { HDPE: 1.45, PET: 1.35, PP: 1.4, LDPE: 1.5 }, pcrAvailable: 50,
  },
  {
    id: 'EU', name: 'Europe', currency: 'EUR', fxPerUsd: 0.92, sizeLadderMl: [200, 300, 400],
    minFontMm: 1.2, mandatoryTextCm2: 20, legalNote: 'EU Cosmetics Regulation 1223/2009 labelling; multi-language panels; packaging recyclability rules tightening.',
    resinUsdPerKg: { HDPE: 1.55, PET: 1.45, PP: 1.5, LDPE: 1.6 }, pcrAvailable: 50,
  },
  {
    id: 'SEA', name: 'Southeast Asia', currency: 'USD', fxPerUsd: 1, sizeLadderMl: [70, 170, 320, 600],
    minFontMm: 1.0, mandatoryTextCm2: 16, legalNote: 'ASEAN Cosmetic Directive labelling; local language stickers common.',
    resinUsdPerKg: { HDPE: 1.25, PET: 1.2, PP: 1.2, LDPE: 1.3 }, pcrAvailable: 25,
  },
];

// Starting brands. Colours are approximate planning values: replace them with the official brand tokens in Settings.
export const BRANDS: Brand[] = [
  { id: 'hs', name: 'Head & Shoulders', tier: 'mainstream', palette: ['#0B4EA2', '#FFFFFF', '#00A3E0', '#1B9E5A'], lockedFamilies: ['oval', 'cylinder'], logoText: 'Head & Shoulders' },
  { id: 'pantene', name: 'Pantene', tier: 'mainstream', palette: ['#B08D57', '#FFFFFF', '#2B2118', '#E9DCC6'], lockedFamilies: ['oval', 'cylinder', 'flask', 'tottle', 'tube'], logoText: 'PANTENE' },
  { id: 'herbal', name: 'Herbal Essences', tier: 'mainstream', palette: ['#6E3A8E', '#FFFFFF', '#2E9C8F', '#E8C547'], lockedFamilies: ['cylinder', 'flask', 'oval'], logoText: 'herbal essences' },
];

export function marketById(id: string): Market {
  return MARKETS.find((m) => m.id === id) ?? MARKETS[0];
}
