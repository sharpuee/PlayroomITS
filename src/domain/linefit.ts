import type { BottleSpec, CenterlineSetpoint, ClosureSpec, Machine, MachineType, ProductionLine, Verdict } from './types';
import type { ResolvedPack } from './resolve';
import { formatKey } from './resolve';

export interface ChangePart {
  machine: string;
  part: string;
  usd: number;
  weeks: number;
}

export interface MachineFit {
  machine: Machine | { id: string; type: MachineType; name: string };
  verdict: Verdict;
  reasons: string[];
  parts: ChangePart[];
  bpm?: number;
  skipped?: boolean;
}

export interface LineFit {
  line: ProductionLine;
  verdict: Verdict;
  machines: MachineFit[];
  parts: ChangePart[];
  partsUsd: number;
  partsWeeks: number;
  predictedBpm: number;
  bottleneck: string;
  changeoverAddMin: number;
  oeeDeltaPts: number;
  blockers: string[];
}

const PART_TEMPLATES: Partial<Record<MachineType, { part: string; usd: number; weeks: number }[]>> = {
  unscrambler: [{ part: 'Orientation fingers and discharge star wheel', usd: 6500, weeks: 8 }],
  rinser: [{ part: 'Gripper inserts', usd: 3000, weeks: 6 }],
  filler: [
    { part: 'Infeed timing screw', usd: 4500, weeks: 6 },
    { part: 'Infeed and discharge star wheels', usd: 7500, weeks: 8 },
    { part: 'Guide rails', usd: 1500, weeks: 4 },
  ],
  capper: [{ part: 'Capper star wheel set', usd: 6000, weeks: 8 }],
  labeller: [
    { part: 'Star wheels and centring bells', usd: 8000, weeks: 8 },
    { part: 'Label peel plate and guides', usd: 2500, weeks: 5 },
  ],
  'sleeve-tunnel': [{ part: 'Sleeve mandrel for new size', usd: 4500, weeks: 6 }],
  'case-packer': [{ part: 'Dividers and pick-head tooling', usd: 7000, weeks: 8 }],
};

const HANDLES_BOTTLE: MachineType[] = ['unscrambler', 'rinser', 'filler', 'capper', 'labeller', 'sleeve-tunnel', 'coder-vision', 'checkweigher', 'case-packer'];
const AFTER_CAPPING: MachineType[] = ['labeller', 'sleeve-tunnel', 'coder-vision', 'checkweigher', 'case-packer'];

function hasFormat(m: Machine, family: string, w: number, d: number) {
  if (m.formats.includes('any')) return true;
  return m.formats.some((f) => {
    const mm = /^([a-z]+)-(\d+)x(\d+)$/.exec(f);
    if (!mm) return false;
    return mm[1] === family && Math.abs(+mm[2] - w) <= 1.5 && Math.abs(+mm[3] - d) <= 1.5;
  });
}

function capKey(c: ClosureSpec) {
  const pumpLike = c.type === 'pump' || c.type === 'foam-pump';
  return `${pumpLike ? 'pump' : 'cap'}-${Math.round(c.diameterMm)}`;
}

export function fitLine(p: ResolvedPack, line: ProductionLine): LineFit {
  const { dims, closure, decoration, bottle } = p;
  const family = bottle.family;
  const w = dims.widthMm;
  const d = dims.depthMm;
  const blockers: string[] = [];
  const out: MachineFit[] = [];
  const pumpLike = ['pump', 'foam-pump', 'valve'].includes(closure.type);

  if (family === 'tube') blockers.push('Tubes are filled and sealed on a tube filler; this is a bottle line.');

  for (const m of line.machines) {
    const reasons: string[] = [];
    const parts: ChangePart[] = [];
    let verdict = 'green' as Verdict;
    const bump = (v: Verdict) => {
      if (v === 'red' || (v === 'amber' && verdict === 'green')) verdict = v;
    };

    // Decoration stations only matter for the chosen decoration.
    if (m.type === 'labeller' && !['ps-label', 'hot-foil'].includes(decoration.type)) {
      out.push({ machine: m, verdict: 'green', reasons: [decoration.type === 'shrink-sleeve' ? 'Not used: sleeved pack bypasses the labeller.' : 'Not used: decoration is applied at the bottle supplier.'], parts: [], skipped: true });
      continue;
    }
    if (m.type === 'sleeve-tunnel' && decoration.type !== 'shrink-sleeve') {
      out.push({ machine: m, verdict: 'green', reasons: ['Not used for this decoration.'], parts: [], skipped: true });
      continue;
    }

    if (m.type === 'cap-feeder') {
      if (!m.closureTypes?.includes(closure.type)) {
        bump('red');
        reasons.push(`Cannot feed ${closure.type} closures. Option: add an orienting feeder with pick-and-place (est. $85k, 20 weeks).`);
      } else if (!m.formats.includes(capKey(closure))) {
        bump('amber');
        reasons.push(`New closure size Ø${closure.diameterMm} mm.`);
        parts.push({ machine: m.name, part: `Cap track and escapement for Ø${closure.diameterMm} mm`, usd: 3500, weeks: 6 });
      } else reasons.push('Existing cap tooling fits.');
      if (closure.needsOrientation && !m.closureTypes?.includes('pump') && closure.type !== 'disc-top') reasons.push('Closure needs orientation.');
      out.push({ machine: m, verdict, reasons, parts, bpm: pumpLike ? Math.round(m.maxBpm * 0.85) : m.maxBpm });
      continue;
    }

    if (HANDLES_BOTTLE.includes(m.type)) {
      const h = AFTER_CAPPING.includes(m.type) || m.type === 'capper' ? p.totalHeightMm : dims.heightMm;
      const checks: [string, number, [number, number]][] = [
        ['height', h, m.heightMm],
        ['width', w, m.widthMm],
        ['depth', d, m.depthMm],
      ];
      for (const [name, v, [lo, hi]] of checks) {
        if (v < lo) { bump('red'); reasons.push(`${name} ${v.toFixed(0)} mm is below the ${lo} mm minimum.`); }
        if (v > hi) { bump('red'); reasons.push(`${name} ${v.toFixed(0)} mm is above the ${hi} mm maximum.`); }
      }
      if (m.type === 'filler' && m.fillMl) {
        const [lo, hi] = m.fillMl;
        if (p.volumeMl < lo || p.volumeMl > hi) { bump('red'); reasons.push(`Fill ${p.volumeMl} ml is outside the ${lo} to ${hi} ml range.`); }
      }
      if (m.type === 'capper') {
        if (m.neckFinishes && !m.neckFinishes.includes(bottle.neckFinish)) { bump('red'); reasons.push(`Neck finish ${bottle.neckFinish} not supported.`); }
        if (m.closureTypes && !m.closureTypes.includes(closure.type)) {
          bump('red');
          reasons.push(`Cannot apply ${closure.type} closures. Option: servo spindle capper upgrade (est. $120k, 24 weeks).`);
        } else if (!m.formats.includes(capKey(closure))) {
          bump('amber');
          parts.push({ machine: m.name, part: `Chuck inserts for Ø${closure.diameterMm} mm ${closure.type}`, usd: 2800, weeks: 6 });
          reasons.push('New chuck inserts for the closure.');
        }
      }
      if (m.type === 'labeller' && m.decorationTypes && !m.decorationTypes.includes(decoration.type)) {
        bump('red'); reasons.push(`Labeller cannot apply ${decoration.type}.`);
      }

      if (verdict !== 'red') {
        if (hasFormat(m, family, w, d)) reasons.push('Runs on existing change parts.');
        else {
          bump('amber');
          reasons.push(`New format ${formatKey(family, w, d)} needs change parts.`);
          for (const t of PART_TEMPLATES[m.type] ?? []) parts.push({ machine: m.name, ...t });
        }
        const ratio = p.totalHeightMm / d;
        if (ratio > 5.6 && ['unscrambler', 'filler', 'capper', 'labeller', 'rinser'].includes(m.type)) {
          bump('amber');
          reasons.push(`Tall, narrow pack (height/depth ${ratio.toFixed(1)}); risk of tip-overs.`);
          parts.push({ machine: m.name, part: 'Carrier pucks or tall-bottle guides', usd: 5500, weeks: 6 });
        }
        if (family === 'tottle' && ['filler', 'capper'].includes(m.type)) {
          bump('amber');
          reasons.push('Tottle is filled upside-down from the valve end; needs pucks.');
          parts.push({ machine: m.name, part: 'Inverted-fill pucks', usd: 6000, weeks: 8 });
        }
      }

      let bpm = m.maxBpm;
      if (m.type === 'filler') bpm = Math.round(m.maxBpm * Math.min(1.1, Math.pow(400 / p.volumeMl, 0.55)));
      if (m.type === 'capper' && pumpLike) bpm = Math.round(bpm * 0.72);
      if (m.type === 'labeller' && p.design.label.wrap === 'wrap') bpm = Math.round(bpm * 0.95);
      out.push({ machine: m, verdict, reasons, parts, bpm });
    }
  }

  if (decoration.type === 'shrink-sleeve' && !line.machines.some((m) => m.type === 'sleeve-tunnel')) {
    out.push({
      machine: { id: `${line.id}-SLV-missing`, type: 'sleeve-tunnel', name: 'Sleever + heat tunnel (missing)' },
      verdict: 'red', reasons: ['No sleeving station on this line. Option: buy pre-sleeved bottles or add a sleever (est. $180k, 26 weeks).'], parts: [],
    });
  }

  const worst: Verdict = blockers.length || out.some((m) => m.verdict === 'red') ? 'red' : out.some((m) => m.verdict === 'amber') ? 'amber' : 'green';
  const parts = out.flatMap((m) => m.parts);
  const running = out.filter((m) => !m.skipped && m.bpm);
  let predictedBpm = Math.min(line.targetBpm * 1.1, ...running.map((m) => m.bpm!));
  if (worst === 'red') predictedBpm = 0;
  const neck = running.reduce((a, m) => (m.bpm! < (a?.bpm ?? Infinity) ? m : a), running[0]);
  const amberCount = out.filter((m) => m.verdict === 'amber').length;
  return {
    line, verdict: worst, machines: out, parts,
    partsUsd: parts.reduce((a, x) => a + x.usd, 0),
    partsWeeks: parts.reduce((a, x) => Math.max(a, x.weeks), 0),
    predictedBpm: Math.round(predictedBpm),
    bottleneck: neck ? neck.machine.name : '—',
    changeoverAddMin: amberCount * 6,
    oeeDeltaPts: worst === 'red' ? 0 : -(amberCount * 0.3 + (pumpLike ? 1.2 : 0)),
    blockers,
  };
}

export function rankLines(p: ResolvedPack, lines: ProductionLine[]): LineFit[] {
  const order = { green: 0, amber: 1, red: 2 } as const;
  return lines
    .map((l) => fitLine(p, l))
    .sort((a, b) => order[a.verdict] - order[b.verdict] || a.partsUsd - b.partsUsd || b.predictedBpm - a.predictedBpm);
}

// ---------- Centerlines ----------

interface Geometry {
  heightMm: number;
  widthMm: number;
  depthMm: number;
  totalHeightMm: number;
  volumeMl: number;
  closure: ClosureSpec;
  grams: number;
  labelAreaCm2: number;
  labelHeightMm: number;
  labelBottomMm: number;
  labelLengthMm: number;
  sleeve: boolean;
  family: string;
}

function headsOf(m?: Machine) {
  const n = m ? /(\d+)-head/.exec(m.name) : null;
  return n ? +n[1] : 12;
}

export function setpointsFor(g: Geometry, line: ProductionLine, bpm: number): CenterlineSetpoint[] {
  const filler = line.machines.find((m) => m.type === 'filler');
  const heads = headsOf(filler);
  const pitch = g.widthMm + 6;
  const torque = (g.closure.torqueNm[0] + g.closure.torqueNm[1]) / 2;
  const fillG = g.volumeMl * 1.02;
  const sp: CenterlineSetpoint[] = [
    { key: 'conv_speed', machine: 'unscrambler', label: 'Infeed conveyor speed', unit: 'm/min', value: +((bpm * pitch * 1.15) / 1000).toFixed(1), tol: 2 },
    { key: 'guide_width', machine: 'filler', label: 'Guide rail width', unit: 'mm', value: +(g.depthMm + 3).toFixed(1), tol: 0.5 },
    { key: 'screw_pitch', machine: 'filler', label: 'Timing screw pitch', unit: 'mm', value: +pitch.toFixed(1), tol: 0.5 },
    { key: 'fill_volume', machine: 'filler', label: 'Fill volume', unit: 'ml', value: g.volumeMl, tol: +(g.volumeMl * 0.01).toFixed(1) },
    { key: 'fill_time', machine: 'filler', label: 'Fill time per head', unit: 's', value: +((heads * 60 / Math.max(bpm, 1)) * 0.55).toFixed(2), tol: 0.15 },
    { key: 'nozzle_height', machine: 'filler', label: 'Nozzle height above conveyor', unit: 'mm', value: Math.round(g.heightMm + 8), tol: 2 },
    { key: 'cap_torque', machine: 'capper', label: 'Application torque', unit: 'N·m', value: +torque.toFixed(2), tol: +((g.closure.torqueNm[1] - g.closure.torqueNm[0]) / 2).toFixed(2) },
    { key: 'chuck_height', machine: 'capper', label: 'Chuck / spindle height', unit: 'mm', value: Math.round(g.totalHeightMm - g.closure.heightMm * 0.5), tol: 1 },
  ];
  if (g.sleeve) {
    sp.push({ key: 'sleeve_len', machine: 'sleeve-tunnel', label: 'Sleeve cut length', unit: 'mm', value: Math.round(g.heightMm * 0.92), tol: 0.5 });
    sp.push({ key: 'tunnel_temp', machine: 'sleeve-tunnel', label: 'Steam tunnel temperature', unit: '°C', value: 92, tol: 3 });
  } else {
    sp.push({ key: 'label_reg', machine: 'labeller', label: 'Label bottom edge from base', unit: 'mm', value: +g.labelBottomMm.toFixed(1), tol: 0.5 });
    sp.push({ key: 'label_len', machine: 'labeller', label: 'Label length (front)', unit: 'mm', value: Math.round(g.labelLengthMm), tol: 0.5 });
    sp.push({ key: 'applicator', machine: 'labeller', label: 'Wipe-down pressure', unit: 'bar', value: g.family === 'cylinder' ? 1.8 : 2.4, tol: 0.2 });
  }
  const tare = g.grams + g.closure.grams + g.labelAreaCm2 * 0.008;
  sp.push({ key: 'cw_target', machine: 'checkweigher', label: 'Checkweigher target (gross)', unit: 'g', value: +(fillG + tare).toFixed(1), tol: +((fillG + tare) * 0.015).toFixed(1) });
  return sp;
}

export function geometryOf(p: ResolvedPack): Geometry {
  const bodyH = p.dims.heightMm * 0.78;
  const lh = bodyH * p.design.label.heightPct;
  const center = bodyH * p.design.label.offsetPct + p.dims.heightMm * 0.03;
  const perimFront = p.dims.widthMm * 1.15;
  return {
    heightMm: p.dims.heightMm, widthMm: p.dims.widthMm, depthMm: p.dims.depthMm, totalHeightMm: p.totalHeightMm,
    volumeMl: p.volumeMl, closure: p.closure, grams: p.grams, labelAreaCm2: p.labelAreaCm2, labelHeightMm: lh,
    labelBottomMm: Math.max(2, center - lh / 2), labelLengthMm: p.design.label.wrap === 'wrap' ? perimFront * 2.6 : perimFront,
    sleeve: p.decoration.type === 'shrink-sleeve', family: p.bottle.family,
  };
}

export function geometryOfSku(b: BottleSpec, c: ClosureSpec): Geometry {
  const bodyH = b.heightMm * 0.78;
  const lh = bodyH * 0.55;
  return {
    heightMm: b.heightMm, widthMm: b.widthMm, depthMm: b.depthMm, totalHeightMm: b.heightMm + c.heightMm * 0.85,
    volumeMl: b.volumeMl, closure: c, grams: b.grams, labelAreaCm2: 90, labelHeightMm: lh,
    labelBottomMm: bodyH * 0.48 + b.heightMm * 0.03 - lh / 2, labelLengthMm: b.widthMm * 1.15, sleeve: false, family: b.family,
  };
}

/** Nearest existing SKU on the line by footprint and volume — the baseline the new centerline starts from. */
export function nearestSku(p: ResolvedPack, line: ProductionLine, bottles: BottleSpec[]) {
  let best = line.skus[0];
  let bestD = Infinity;
  for (const s of line.skus) {
    const b = bottles.find((x) => x.id === s.bottleId);
    if (!b) continue;
    const dist = Math.abs(b.widthMm - p.dims.widthMm) + Math.abs(b.depthMm - p.dims.depthMm) + Math.abs(b.heightMm - p.dims.heightMm) * 0.5 + Math.abs(b.volumeMl - p.volumeMl) * 0.05;
    if (dist < bestD) { bestD = dist; best = s; }
  }
  return best;
}
