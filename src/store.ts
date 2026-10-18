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
    bottleId: 'b-oval-400', closureId: 'c-flip-24', decorationId: 'd-ps-pe', bottleColor: '#0B4EA2', capColor: '#FFFFFF', liquidColor: '#BFE3F7',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 25, stage: 'Feasibility', lineId: 'L1', annualVolumeM: 18,
    label: { brandText: 'Head & Shoulders', variantText: 'Classic Clean', claimText: 'Anti-dandruff shampoo', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#0B4EA2', heightPct: 0.55, offsetPct: 0.48, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 20, updatedAt: now - 864e5 * 2, qualification: { proto: true, mould: true }, gateNotes: [],
  },
  {
    id: 'pd-hs-menthol', name: 'Head & Shoulders Cool Menthol 400 ml', brandId: 'hs', rangeName: 'Anti-dandruff core', market: 'IN',
    bottleId: 'b-oval-400', closureId: 'c-flip-24', decorationId: 'd-ps-pe', bottleColor: '#0B4EA2', capColor: '#FFFFFF', liquidColor: '#BFF7E8',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 15, stage: 'Concept', lineId: 'L1', annualVolumeM: 9,
    label: { brandText: 'Head & Shoulders', variantText: 'Cool Menthol', claimText: 'Anti-dandruff, icy fresh scalp', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#1B9E5A', heightPct: 0.55, offsetPct: 0.48, wrap: 'front-back', layout: 'stacked' },
    createdAt: now - 864e5 * 12, updatedAt: now - 864e5 * 3, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-pa-repair', name: 'Pantene Repair & Protect Conditioner 650 ml', brandId: 'pantene', rangeName: 'Repair & Protect', market: 'US',
    bottleId: 'b-oval-650', closureId: 'c-pump-28', decorationId: 'd-ps-bopp-foil', bottleColor: '#FFFFFF', capColor: '#B08D57', liquidColor: '#F1E6D2',
    finish: 'pearl', capFinish: 'metallic', shape: { waist: 0.06 }, pcrPct: 0, stage: 'Concept', lineId: 'L2', annualVolumeM: 4,
    label: { brandText: 'PANTENE', variantText: 'Repair & Protect Conditioner', claimText: 'Strengthens damaged hair, nourishes with pro-vitamins and antioxidants for shine', bg: '#FFFFFF', ink: '#2B2118', accent: '#B08D57', heightPct: 0.42, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 8, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-he-argan', name: 'Herbal Essences Argan Oil Shampoo 300 ml', brandId: 'herbal', rangeName: 'Botanicals', market: 'EU',
    bottleId: 'b-pet-flask-300', closureId: 'c-flip-24', decorationId: 'd-ps-pe', bottleColor: '#FFFFFF', capColor: '#6E3A8E', liquidColor: '#E8B35A',
    finish: 'clear', capFinish: 'gloss', shape: {}, pcrPct: 25, stage: 'Idea', lineId: 'L1', annualVolumeM: 6,
    label: { brandText: 'herbal essences', variantText: 'Argan Oil Repair', claimText: 'Plant-based ingredients', bg: '#FFFFFF', ink: '#3B2350', accent: '#6E3A8E', heightPct: 0.5, offsetPct: 0.5, wrap: 'front-back', layout: 'minimal' },
    createdAt: now - 864e5 * 4, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
  },
  {
    id: 'pd-hs-in180', name: 'Head & Shoulders Smooth & Silky 180 ml', brandId: 'hs', rangeName: 'Anti-dandruff India', market: 'IN',
    bottleId: 'b-oval-180', closureId: 'c-in-flip-24', decorationId: 'd-in-paper', bottleColor: '#0B4EA2', capColor: '#FFFFFF', liquidColor: '#CDE8F5',
    finish: 'gloss', capFinish: 'gloss', shape: {}, pcrPct: 0, stage: 'Idea', lineId: 'L1', annualVolumeM: 30,
    label: { brandText: 'Head & Shoulders', variantText: 'Smooth & Silky', claimText: 'Anti-dandruff', bg: '#FFFFFF', ink: '#0B3D7A', accent: '#C2187A', heightPct: 0.5, offsetPct: 0.48, wrap: 'wrap', layout: 'band' },
    createdAt: now - 864e5 * 4, updatedAt: now - 864e5 * 1, qualification: {}, gateNotes: [],
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
    { name: 'pack-playroom-v1', version: 2, migrate: () => initial() as unknown as State },
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
