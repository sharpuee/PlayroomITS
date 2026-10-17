// Core domain types for the Pack Twin.

export type Scope = 'global' | 'local';
export type MarketId = 'global' | 'IN' | 'US' | 'EU' | 'SEA';

export type BottleFamily = 'oval' | 'cylinder' | 'flask' | 'tottle' | 'tube';
export type Resin = 'HDPE' | 'PET' | 'PP' | 'LDPE';

export interface Supplier {
  name: string;
  region: string;
}

interface ComponentBase {
  id: string;
  name: string;
  scope: Scope;
  /** Markets where the part is approved. 'global' scope parts are available everywhere. */
  markets: MarketId[];
  supplier: Supplier;
  unitCostUsd: number; // at reference volume
  moq: number;
  leadTimeWeeks: number;
  toolingUsd: number; // one-off cost if the part is new to you
  owned: boolean; // tooling already exists
  notes?: string;
}

export interface BottleSpec extends ComponentBase {
  kind: 'bottle';
  family: BottleFamily;
  resin: Resin;
  volumeMl: number;
  heightMm: number; // shoulder-to-base body height incl. neck
  widthMm: number; // front face width
  depthMm: number; // side depth (== width for round)
  shoulder: number; // 0..1 how rounded the shoulder is
  waist: number; // 0..0.25 waist pinch
  neckFinish: string; // e.g. '24/410'
  grams: number;
  process: 'EBM' | 'ISBM' | 'IM' | 'Extruded tube';
}

export type ClosureType = 'flip-top' | 'disc-top' | 'screw' | 'pump' | 'foam-pump' | 'valve' | 'tube-cap';

export interface ClosureSpec extends ComponentBase {
  kind: 'closure';
  type: ClosureType;
  neckFinishes: string[];
  heightMm: number;
  diameterMm: number;
  grams: number;
  /** cc per stroke for pumps */
  outputCc?: number;
  needsOrientation: boolean;
  torqueNm: [number, number];
  mono: boolean; // mono-material, no metal spring
}

export type DecorationType = 'ps-label' | 'shrink-sleeve' | 'iml' | 'screen-print' | 'hot-foil' | 'digital-print';

export interface DecorationSpec extends ComponentBase {
  kind: 'decoration';
  type: DecorationType;
  substrate: string;
  costPer1000Cm2: number;
  /** recyclability penalty: 0 good, 1 bad */
  recyclePenalty: number;
  premium: number; // 0..1
}

export type Finish = 'gloss' | 'matte' | 'soft-touch' | 'pearl' | 'frosted' | 'clear' | 'metallic';

export type Component = BottleSpec | ClosureSpec | DecorationSpec;

export type LabelWrap = 'front' | 'front-back' | 'wrap' | 'sleeve';

export interface LabelArt {
  brandText: string;
  variantText: string;
  claimText: string;
  bg: string;
  ink: string;
  accent: string;
  heightPct: number; // fraction of body height
  offsetPct: number; // vertical centre, fraction of body height
  wrap: LabelWrap;
  layout: 'stacked' | 'band' | 'minimal';
}

export interface ShapeOverrides {
  heightMm?: number;
  widthMm?: number;
  depthMm?: number;
  shoulder?: number;
  waist?: number;
  ribbed?: boolean;
}

export type Stage = 'Idea' | 'Concept' | 'Feasibility' | 'Capability' | 'Launch';
export const STAGES: Stage[] = ['Idea', 'Concept', 'Feasibility', 'Capability', 'Launch'];

export interface PackDesign {
  id: string;
  name: string;
  brandId: string;
  rangeName: string;
  market: MarketId;
  bottleId: string;
  closureId: string;
  decorationId: string;
  bottleColor: string;
  capColor: string;
  liquidColor: string;
  finish: Finish;
  capFinish: Finish;
  shape: ShapeOverrides;
  label: LabelArt;
  pcrPct: number;
  stage: Stage;
  lineId?: string;
  annualVolumeM: number; // millions of units per year
  thumbnail?: string; // data URL
  parentId?: string; // branch origin
  createdAt: number;
  updatedAt: number;
  qualification: Record<string, boolean>;
  gateNotes: { stage: Stage; note: string; at: number; by: string }[];
  centerlineLocked?: boolean;
  centerlineOverrides?: Record<string, number>;
}

export interface Brand {
  id: string;
  name: string;
  tier: 'value' | 'mainstream' | 'premium';
  palette: string[]; // distinctive brand colours, first = primary
  lockedFamilies: BottleFamily[];
  logoText: string;
}

export interface Market {
  id: MarketId;
  name: string;
  currency: string;
  fxPerUsd: number;
  sizeLadderMl: number[];
  minFontMm: number; // minimum x-height-ish for mandatory text
  mandatoryTextCm2: number; // area needed for legal copy
  legalNote: string;
  resinUsdPerKg: Record<Resin, number>;
  pcrAvailable: number; // max PCR % practical locally
}

export interface DeviationRequest {
  id: string;
  designId: string;
  market: MarketId;
  element: string;
  reason: string;
  status: 'open' | 'approved' | 'rejected';
  at: number;
}

// ---------- Production ----------

export type MachineType =
  | 'unscrambler'
  | 'rinser'
  | 'filler'
  | 'cap-feeder'
  | 'capper'
  | 'labeller'
  | 'sleeve-tunnel'
  | 'coder-vision'
  | 'checkweigher'
  | 'case-packer';

export interface Machine {
  id: string;
  type: MachineType;
  name: string;
  maxBpm: number;
  heightMm: [number, number];
  widthMm: [number, number];
  depthMm: [number, number];
  neckFinishes?: string[];
  closureTypes?: ClosureType[];
  decorationTypes?: DecorationType[];
  fillMl?: [number, number];
  /** Formats it already has change parts for: family + footprint key */
  formats: string[];
}

export interface CenterlineSetpoint {
  key: string;
  machine: MachineType;
  label: string;
  unit: string;
  value: number;
  tol: number;
}

export interface LineSku {
  name: string;
  bottleId: string;
  closureId: string;
  bpm: number;
}

export interface ProductionLine {
  id: string;
  plant: string;
  name: string;
  targetBpm: number;
  oeePct: number;
  changeoverMin: number;
  machines: Machine[];
  skus: LineSku[];
}

export type Verdict = 'green' | 'amber' | 'red';
