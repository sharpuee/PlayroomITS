import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Brand, Component, DeviationRequest, Market, MarketId, PackDesign, ProductionLine, Stage } from './domain/types';
import { ALL_COMPONENTS } from './data/components';
import { BRANDS, MARKETS } from './data/markets';
import { LINES } from './data/lines';

export type MenuMode = 'global' | 'local' | 'mix';

const now = Date.now();
export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

export const SEED_DESIGNS: PackDesign[] = [
  {
    id: 'pd-hs-classic', name: 'Head & Shoulders Classic Clean 400 ml', brandId: 'hs', rangeName: 'Anti-dandruff core', market: 'global',
    bottleId: 'b-oval-400', closureId: 'c-hs-dome-24', decorationId: 'd-ps-pe', bottleColor: '#F4F6F8', capColor: '#0B4EA2', liquidColor: '#BFE3F7',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 25, stage: 'Feasibility', lineId: 'L1', annualVolumeM: 18,
    label: { brandText: 'Head & Shoulders', variantText: 'Classic Clean', claimText: 'Anti-dandruff shampoo', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#0B4EA2', heightPct: 0.62, offsetPct: 0.5, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 20, updatedAt: now - 864e5 * 2, qualification: { proto: true, mould: true }, gateNotes: [],
  },
  {
    id: 'pd-hs-menthol', name: 'Head & Shoulders Cool Menthol 400 ml', brandId: 'hs', rangeName: 'Anti-dandruff core', market: 'IN',
    bottleId: 'b-oval-400', closureId: 'c-hs-dome-24', decorationId: 'd-ps-pe', bottleColor: '#BFE8DA', capColor: '#0B4EA2', liquidColor: '#BFF7E8',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 15, stage: 'Concept', lineId: 'L1', annualVolumeM: 9,
    label: { brandText: 'Head & Shoulders', variantText: 'Cool Menthol', claimText: 'Anti-dandruff, icy fresh scalp', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#1B9E5A', heightPct: 0.62, offsetPct: 0.5, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 12, updatedAt: now - 864e5 * 3, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-hs-family', name: 'Head & Shoulders Classic Clean 1000 ml pump', brandId: 'hs', rangeName: 'Anti-dandruff core', market: 'IN',
    bottleId: 'b-hs-swan-1000', closureId: 'c-pump-28', decorationId: 'd-ps-pe', bottleColor: '#F4F6F8', capColor: '#0B4EA2', liquidColor: '#BFE3F7',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 25, stage: 'Capability', lineId: 'L2', annualVolumeM: 5,
    label: { brandText: 'Head & Shoulders', variantText: 'Classic Clean', claimText: 'Anti-dandruff shampoo', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#0B4EA2', heightPct: 0.62, offsetPct: 0.5, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 30, updatedAt: now - 864e5 * 5, qualification: { proto: true, drop: true, topload: true, squeeze: true, leak: true, transit: true }, gateNotes: [],
  },
  {
    id: 'pd-pa-silky', name: 'Pantene Silky Smooth 650 ml pump', brandId: 'pantene', rangeName: 'Hair Science', market: 'IN',
    bottleId: 'b-pa-slim-650', closureId: 'c-disc-pump-28', decorationId: 'd-ps-bopp-foil', bottleColor: '#FFFFFF', capColor: '#C9A45C', liquidColor: '#F1E6D2',
    finish: 'pearl', capFinish: 'metallic', shape: {}, pcrPct: 0, stage: 'Concept', lineId: 'L2', annualVolumeM: 6,
    label: { brandText: 'PANTENE', variantText: 'Silky Smooth', claimText: 'Pro-vitamin formula for smooth, shiny hair', bg: '#FFFFFF', ink: '#2B2118', accent: '#1E9E53', heightPct: 0.5, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 8, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-pa-hairfall', name: 'Pantene Hairfall Control 340 ml', brandId: 'pantene', rangeName: 'Hair Science', market: 'IN',
    bottleId: 'b-in-oval-340', closureId: 'c-flip-24', decorationId: 'd-ps-pe', bottleColor: '#FFFFFF', capColor: '#C9A45C', liquidColor: '#F1E6D2',
    finish: 'gloss', capFinish: 'metallic', shape: {}, pcrPct: 0, stage: 'Feasibility', lineId: 'L3', annualVolumeM: 22,
    label: { brandText: 'PANTENE', variantText: 'Hairfall Control', claimText: 'Stronger hair', bg: '#FFFFFF', ink: '#2B2118', accent: '#B5175B', heightPct: 0.55, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 10, updatedAt: now - 864e5 * 2, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-he-argan', name: 'Herbal Essences Argan Oil Repair 400 ml', brandId: 'herbal', rangeName: 'bio:renew', market: 'EU',
    bottleId: 'b-he-round-400', closureId: 'c-disc-24', decorationId: 'd-ps-pe', bottleColor: '#1F6FA8', capColor: '#1B1B1B', liquidColor: '#E8B35A',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 25, stage: 'Idea', lineId: 'L2', annualVolumeM: 6,
    label: { brandText: 'herbal essences', variantText: 'Argan Oil Repair', claimText: 'Plant-based ingredients', bg: '#FFFFFF', ink: '#1F3B57', accent: '#1F6FA8', heightPct: 0.6, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 4, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-off-hs-pump', name: 'H&S refresh: stock oval 250 ml + spout pump', brandId: 'hs', rangeName: 'Off-menu refresh', market: 'IN',
    bottleId: 'b-stock-hdpe-oval-250', closureId: 'c-spout-pump-24', decorationId: 'd-ps-pe', bottleColor: '#F4F6F8', capColor: '#1846C8', liquidColor: '#BFE3F7',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 15, stage: 'Idea', lineId: 'L2', annualVolumeM: 4,
    label: { brandText: 'Head & Shoulders', variantText: 'Classic Clean', claimText: 'Anti-dandruff shampoo', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#0B4EA2', heightPct: 0.6, offsetPct: 0.45, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 2, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-off-pa-pet', name: 'Pantene premium: stock PET cylinder 300 ml + gold disc pump', brandId: 'pantene', rangeName: 'Off-menu refresh', market: 'IN',
    bottleId: 'b-stock-pet-cyl-300', closureId: 'c-disc-pump-24', decorationId: 'd-ps-bopp-foil', bottleColor: '#FFFFFF', capColor: '#C9A45C', liquidColor: '#E9C77B',
    finish: 'clear', capFinish: 'metallic', shape: {}, pcrPct: 0, stage: 'Idea', lineId: 'L2', annualVolumeM: 3,
    label: { brandText: 'PANTENE', variantText: 'Gold Series', claimText: 'Repair for damaged hair', bg: '#FFFFFF', ink: '#2B2118', accent: '#C9A45C', heightPct: 0.5, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 2, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
];

interface State {
  userName: string;
  components: Component[];
  brands: Brand[];
  markets: Market[];
  lines: ProductionLine[];
  designs: PackDesign[];
  activeId: string;
  market: MarketId;
  menuMode: MenuMode;
  deviations: DeviationRequest[];

  setActive: (id: string) => void;
  setMarket: (m: MarketId) => void;
  setMenuMode: (m: MenuMode) => void;
  updateDesign: (id: string, patch: Partial<PackDesign>) => void;
  addDesign: (d: PackDesign) => void;
  branchDesign: (id: string, name?: string, patch?: Partial<PackDesign>) => string;
  deleteDesign: (id: string) => void;
  moveStage: (id: string, stage: Stage, note: string) => void;
  upsertComponent: (c: Component) => void;
  deleteComponent: (id: string) => void;
  updateLine: (l: ProductionLine) => void;
  updateBrand: (b: Brand) => void;
  updateMarket: (m: Market) => void;
  addDeviation: (d: Omit<DeviationRequest, 'id' | 'at' | 'status'>) => void;
  decideDeviation: (id: string, status: 'approved' | 'rejected') => void;
  setUserName: (n: string) => void;
  importState: (json: string) => void;
  reset: () => void;
}

const initial = () => ({
  userName: 'You',
  components: ALL_COMPONENTS,
  brands: BRANDS,
  markets: MARKETS,
  lines: LINES,
  designs: SEED_DESIGNS,
  activeId: SEED_DESIGNS[0].id,
  market: 'global' as MarketId,
  menuMode: 'mix' as MenuMode,
  deviations: [] as DeviationRequest[],
});

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      setActive: (id) => set({ activeId: id }),
      setMarket: (m) => set({ market: m }),
      setMenuMode: (m) => set({ menuMode: m }),
      updateDesign: (id, patch) =>
        set((s) => ({ designs: s.designs.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d)) })),
      addDesign: (d) => set((s) => ({ designs: [...s.designs, d], activeId: d.id })),
      branchDesign: (id, name, patch) => {
        const src = get().designs.find((d) => d.id === id);
        if (!src) return id;
        const nid = uid('pd');
        const copy: PackDesign = {
          ...src, ...patch, id: nid, name: name ?? `${src.name} (branch)`, parentId: src.id, stage: 'Idea',
          createdAt: Date.now(), updatedAt: Date.now(), gateNotes: [], qualification: {}, centerlineLocked: false,
        };
        set((s) => ({ designs: [...s.designs, copy], activeId: nid }));
        return nid;
      },
      deleteDesign: (id) =>
        set((s) => {
          const designs = s.designs.filter((d) => d.id !== id);
          return { designs, activeId: s.activeId === id ? designs[0]?.id ?? '' : s.activeId };
        }),
      moveStage: (id, stage, note) =>
        set((s) => ({
          designs: s.designs.map((d) =>
            d.id === id ? { ...d, stage, updatedAt: Date.now(), gateNotes: [...d.gateNotes, { stage, note, at: Date.now(), by: s.userName }] } : d,
          ),
        })),
      upsertComponent: (c) =>
        set((s) => ({
          components: s.components.some((x) => x.id === c.id) ? s.components.map((x) => (x.id === c.id ? c : x)) : [...s.components, c],
        })),
      deleteComponent: (id) => set((s) => ({ components: s.components.filter((c) => c.id !== id) })),
      updateLine: (l) => set((s) => ({ lines: s.lines.map((x) => (x.id === l.id ? l : x)) })),
      updateBrand: (b) => set((s) => ({ brands: s.brands.map((x) => (x.id === b.id ? b : x)) })),
      updateMarket: (m) => set((s) => ({ markets: s.markets.map((x) => (x.id === m.id ? m : x)) })),
      addDeviation: (d) => set((s) => ({ deviations: [{ ...d, id: uid('dev'), at: Date.now(), status: 'open' }, ...s.deviations] })),
      decideDeviation: (id, status) => set((s) => ({ deviations: s.deviations.map((d) => (d.id === id ? { ...d, status } : d)) })),
      setUserName: (n) => set({ userName: n }),
      importState: (json) => {
        const data = JSON.parse(json);
        if (!data || !Array.isArray(data.designs) || !Array.isArray(data.components)) throw new Error('This file is not a Pack Playroom export.');
        set({ ...initial(), ...data });
      },
      reset: () => set(initial()),
    }),
    { name: 'pack-playroom-v1', version: 3, migrate: () => initial() as unknown as State },
  ),
);

export function useCatalog() {
  const components = useStore((s) => s.components);
  const brands = useStore((s) => s.brands);
  const markets = useStore((s) => s.markets);
  const designs = useStore((s) => s.designs);
  const lines = useStore((s) => s.lines);
  return { components, brands, markets, designs, lines };
}

export function useActiveDesign(): PackDesign | undefined {
  return useStore((s) => s.designs.find((d) => d.id === s.activeId) ?? s.designs[0]);
}
