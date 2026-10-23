import { useMemo, useState } from 'react';
import { useStore } from '../store';

// ---------- Value model ----------
// Illustrative planning assumptions; every number is editable on the page and kept in this browser.

interface Assumptions {
  initiatives: number;
  protoManual: number;
  protoPlatform: number;
  protoCost: number;
  researchManual: number;
  researchPlatform: number;
  researchCost: number;
  trialsManual: number;
  trialsPlatform: number;
  trialCost: number;
  reworkManualPct: number;
  reworkPlatformPct: number;
  reworkCost: number;
  hoursManual: number;
  hoursPlatform: number;
  hourRate: number;
  weeksManual: number;
  weeksPlatform: number;
  weekValue: number;
  unitsM: number;
  gramsSaved: number;
  resinPerKg: number;
  platformCost: number;
}

const DEFAULTS: Assumptions = {
  initiatives: 12,
  protoManual: 4, protoPlatform: 1.5, protoCost: 8000,
  researchManual: 2, researchPlatform: 1, researchCost: 40000,
  trialsManual: 3, trialsPlatform: 1.5, trialCost: 15000,
  reworkManualPct: 25, reworkPlatformPct: 5, reworkCost: 60000,
  hoursManual: 300, hoursPlatform: 120, hourRate: 90,
  weeksManual: 26, weeksPlatform: 14, weekValue: 25000,
  unitsM: 60, gramsSaved: 1.5, resinPerKg: 1.35,
  platformCost: 250000,
};

const KEY = 'pack-playroom-value-v1';
function loadAssumptions(): Assumptions {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

interface Driver { id: string; label: string; manual: number; platform: number; why: string }

function model(a: Assumptions): Driver[] {
  const n = a.initiatives;
  const lead = a.weeksManual - a.weeksPlatform;
  return [
    { id: 'proto', label: 'Physical prototypes', manual: n * a.protoManual * a.protoCost, platform: n * a.protoPlatform * a.protoCost, why: 'Most rounds happen on 3D models in the Playroom.' },
    { id: 'research', label: 'Shelf and consumer research', manual: n * a.researchManual * a.researchCost, platform: n * a.researchPlatform * a.researchCost, why: 'Weak options are screened on the virtual shelf first.' },
    { id: 'trials', label: 'Line trials', manual: n * a.trialsManual * a.trialCost, platform: n * a.trialsPlatform * a.trialCost, why: 'Line fit and draft centerlines arrive before the first trial.' },
    { id: 'rework', label: 'Late tooling and change-part rework', manual: n * (a.reworkManualPct / 100) * a.reworkCost, platform: n * (a.reworkPlatformPct / 100) * a.reworkCost, why: 'Red machines are flagged while the pack is still a sketch.' },
    { id: 'hours', label: 'Design and agency hours', manual: n * a.hoursManual * a.hourRate, platform: n * a.hoursPlatform * a.hourRate, why: 'Coach fixes and branches replace brief-and-wait loops.' },
    { id: 'speed', label: 'Revenue delayed by slower launch', manual: n * lead * a.weekValue, platform: 0, why: `${lead} weeks earlier to shelf per initiative.` },
    { id: 'resin', label: 'Resin not saved', manual: (a.unitsM * 1e6 * a.gramsSaved / 1000) * a.resinPerKg, platform: 0, why: `${a.gramsSaved} g lighter per pack from Coach lightweighting.` },
  ];
}

const usd = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `$${Math.round(v / 1e3)}k`;
  return `$${Math.round(v)}`;
};

const C_MANUAL = '#C2793A';
const C_PLATFORM = '#2F6FD6';

// ---------- Page ----------

export default function Home() {
  const designs = useStore((s) => s.designs);
  const [a, setA] = useState<Assumptions>(loadAssumptions);
  const [showTable, setShowTable] = useState(false);
  const [editing, setEditing] = useState(false);
  const set = (patch: Partial<Assumptions>) => {
    const next = { ...a, ...patch };
    setA(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
  };

  const drivers = useMemo(() => model(a), [a]);
  const manual = drivers.reduce((s, d) => s + d.manual, 0);
  const platform = drivers.reduce((s, d) => s + d.platform, 0);
  const gross = manual - platform;
  const net = gross - a.platformCost;
  const roi = a.platformCost > 0 ? net / a.platformCost : 0;
  const paybackMonths = gross > 0 ? (a.platformCost / gross) * 12 : null;
  const thumbs = designs.filter((d) => d.thumbnail).slice(0, 5);
  const speed = drivers.find((d) => d.id === 'speed')!;
  const direct = gross - (speed.manual - speed.platform);

  return (
    <div className="home">
      <div className="home-main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-copy">
            <h1>One pack, from first idea to the filling line.</h1>
            <p>
              Pack Playroom puts Head &amp; Shoulders, Pantene and Herbal Essences packaging in one place. Build a bottle in 3D, let the Coach
              improve it, prove it on a virtual shelf, then see exactly how your plants would make it, before a single mould is cut.
            </p>
            <div className="row">
              <a className="btn primary" href="#/playroom">Open the Playroom</a>
              <a className="btn" href="#/gates">See the pipeline</a>
            </div>
          </div>
          <div className="hero-shelf" aria-label="Designs in your pipeline">
            {thumbs.length === 0 && <p className="small muted">Designs render here once the Playroom has loaded them.</p>}
            {thumbs.map((d) => (
              <a key={d.id} href="#/playroom" onClick={() => useStore.getState().setActive(d.id)} title={d.name}>
                <img src={d.thumbnail} alt={d.name} />
              </a>
            ))}
            <div className="hero-shelf-edge" />
          </div>
        </section>

        {/* Flow */}
        <section className="panel panel-pad">
          <h2>How a pack moves through the platform</h2>
          <p className="muted small" style={{ marginBottom: 12 }}>
            Ideate, design, score, prove on shelf, backtrack to the line, decide. Two checks send a design back to the Playroom before money is spent. Click any step to open it.
          </p>
          <div className="flow-wrap"><Flow /></div>
        </section>

        {/* Capabilities */}
        <section>
          <h2 style={{ margin: '4px 0 12px' }}>What each module brings</h2>
          <div className="caps">
            {CAPS.map((c) => (
              <a key={c.href} className="cap" href={c.href} style={{ ['--cap' as string]: c.color }}>
                <span className="cap-icon" aria-hidden>{c.icon}</span>
                <span>
                  <b>{c.title}</b>
                  <span className="cap-what">{c.what}</span>
                  <span className="cap-gain">{c.gain}</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* Value panel */}
      <aside className="value panel" aria-label="Value versus the manual process">
        <div className="value-head">
          <span className="small muted">Estimated annual benefit vs the manual process</span>
          <div className="hero-num">{usd(gross)}</div>
          <p className="small" style={{ margin: '-4px 0 10px' }}>{usd(direct)} direct cost savings + {usd(speed.manual)} revenue from launching sooner</p>
          <div className="value-kpis">
            <div><small>Manual process</small><b style={{ color: C_MANUAL }}>{usd(manual)}</b></div>
            <div><small>With the platform</small><b style={{ color: C_PLATFORM }}>{usd(platform)}</b></div>
            <div><small>Net of platform cost</small><b>{usd(net)}</b></div>
            <div><small>Payback</small><b>{paybackMonths === null ? 'n/a' : `${paybackMonths.toFixed(1)} mo`}</b></div>
          </div>
          <p className="small muted">For {a.initiatives} pack initiatives a year. ROI {(roi * 100).toFixed(0)}% on {usd(a.platformCost)} a year to run the platform.</p>
        </div>

        <div className="legend" aria-hidden>
          <span><i style={{ background: C_MANUAL }} /> Manual process</span>
          <span><i style={{ background: C_PLATFORM }} /> With the platform</span>
        </div>
        <Bars drivers={drivers} />

        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn small" type="button" onClick={() => setEditing((e) => !e)} aria-expanded={editing}>{editing ? 'Hide assumptions' : 'Edit assumptions'}</button>
          <button className="btn small" type="button" onClick={() => setShowTable((t) => !t)} aria-expanded={showTable}>{showTable ? 'Hide table' : 'Show as table'}</button>
          {editing && <button className="btn small ghost" type="button" onClick={() => set(DEFAULTS)}>Reset</button>}
        </div>

        {showTable && (
          <table className="data" style={{ marginTop: 10 }}>
            <thead><tr><th>Cost driver</th><th className="r">Manual</th><th className="r">Platform</th><th className="r">Saved</th></tr></thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}><td className="small">{d.label}</td><td className="r num small">{usd(d.manual)}</td><td className="r num small">{usd(d.platform)}</td><td className="r num small">{usd(d.manual - d.platform)}</td></tr>
              ))}
              <tr><td><b>Total</b></td><td className="r num"><b>{usd(manual)}</b></td><td className="r num"><b>{usd(platform)}</b></td><td className="r num"><b>{usd(gross)}</b></td></tr>
            </tbody>
          </table>
        )}

        {editing && <AssumptionForm a={a} set={set} />}

        <p className="small muted" style={{ marginTop: 10 }}>
          Illustrative planning assumptions, not measured results. Replace them with your own costs from finance, R&amp;D and the plant; the chart and totals update instantly and are kept in this browser.
        </p>
      </aside>
    </div>
  );
}

// ---------- Bars ----------

function Bars({ drivers }: { drivers: Driver[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const max = Math.max(...drivers.map((d) => Math.max(d.manual, d.platform)), 1);
  const W = 340;
  const labelW = 0;
  const barMax = W - 64;
  const rowH = 46;
  const H = drivers.length * rowH + 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Annual cost by driver, manual versus platform">
      {drivers.map((d, i) => {
        const y = i * rowH;
        const wm = Math.max(2, (d.manual / max) * barMax);
        const wp = d.platform > 0 ? Math.max(2, (d.platform / max) * barMax) : 0;
        const on = hover === d.id;
        return (
          <g key={d.id} onMouseEnter={() => setHover(d.id)} onMouseLeave={() => setHover(null)} style={{ cursor: 'default' }}>
            <rect x="0" y={y} width={W} height={rowH - 2} fill={on ? 'var(--surface-2)' : 'transparent'} rx="4" />
            <text x={labelW} y={y + 12} fontSize="11.5" fill="var(--ink)">{d.label}</text>
            <rect x={labelW} y={y + 17} width={wm} height="9" rx="3" fill={C_MANUAL} />
            <text x={labelW + wm + 6} y={y + 25} fontSize="10.5" fill="var(--ink-2)">{usd(d.manual)}</text>
            {wp > 0 ? (
              <>
                <rect x={labelW} y={y + 28} width={wp} height="9" rx="3" fill={C_PLATFORM} />
                <text x={labelW + wp + 6} y={y + 36} fontSize="10.5" fill="var(--ink-2)">{usd(d.platform)}</text>
              </>
            ) : (
              <text x={labelW} y={y + 37} fontSize="10.5" fill="var(--ink-2)">$0 with the platform</text>
            )}
            <title>{`${d.label}: manual ${usd(d.manual)}, platform ${usd(d.platform)}, saved ${usd(d.manual - d.platform)}. ${d.why}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

function AssumptionForm({ a, set }: { a: Assumptions; set: (p: Partial<Assumptions>) => void }) {
  const num = (k: keyof Assumptions, label: string, step = 1) => (
    <label className="field" key={k}>
      <span>{label}</span>
      <input type="number" step={step} value={a[k]} onChange={(e) => set({ [k]: +e.target.value } as Partial<Assumptions>)} />
    </label>
  );
  const pair = (title: string, km: keyof Assumptions, kp: keyof Assumptions, kc: keyof Assumptions, cLabel: string, step = 0.5) => (
    <fieldset className="assume" key={title}>
      <legend>{title}</legend>
      <div className="grid3" style={{ gap: 6 }}>
        {num(km, 'Manual', step)}
        {num(kp, 'Platform', step)}
        {num(kc, cLabel, 500)}
      </div>
    </fieldset>
  );
  return (
    <div className="stack" style={{ marginTop: 10, gap: 8 }}>
      <div className="grid2" style={{ gap: 6 }}>
        {num('initiatives', 'Pack initiatives a year')}
        {num('platformCost', 'Platform cost a year ($)', 5000)}
      </div>
      {pair('Prototype rounds per initiative', 'protoManual', 'protoPlatform', 'protoCost', '$ per round')}
      {pair('Research rounds per initiative', 'researchManual', 'researchPlatform', 'researchCost', '$ per round')}
      {pair('Line trials per initiative', 'trialsManual', 'trialsPlatform', 'trialCost', '$ per trial')}
      {pair('Chance of late tooling rework (%)', 'reworkManualPct', 'reworkPlatformPct', 'reworkCost', '$ per rework', 1)}
      {pair('Design hours per initiative', 'hoursManual', 'hoursPlatform', 'hourRate', '$ per hour', 10)}
      {pair('Weeks from idea to decision', 'weeksManual', 'weeksPlatform', 'weekValue', '$ per week earlier', 1)}
      <fieldset className="assume">
        <legend>Lightweighting</legend>
        <div className="grid3" style={{ gap: 6 }}>
          {num('unitsM', 'Units a year (M)', 1)}
          {num('gramsSaved', 'Grams saved / unit', 0.1)}
          {num('resinPerKg', 'Resin $ / kg', 0.05)}
        </div>
      </fieldset>
    </div>
  );
}

// ---------- Flowchart ----------

interface Node { id: string; x: number; y: number; title: string; sub: string; href: string; tone?: 'accent' }

function Flow() {
  const BW = 150, BH = 62;
  const nodes: Node[] = [
    { id: 'ideate', x: 10, y: 40, title: 'Ideate', sub: 'Library · menus', href: '#/library' },
    { id: 'design', x: 190, y: 40, title: 'Design in 3D', sub: 'Playroom', href: '#/playroom' },
    { id: 'coach', x: 370, y: 40, title: 'Score & improve', sub: 'Design Coach', href: '#/coach' },
    { id: 'shelf', x: 550, y: 40, title: 'Prove on shelf', sub: 'Shelf simulator', href: '#/shelf' },
    { id: 'make', x: 550, y: 200, title: 'Backtrack to line', sub: 'Line fit · centerlines', href: '#/production' },
    { id: 'qual', x: 330, y: 200, title: 'Qualify & cost', sub: 'Tests · business case', href: '#/production' },
    { id: 'gate', x: 110, y: 200, title: 'Gate & launch', sub: 'Stage gates', href: '#/gates', tone: 'accent' },
  ];
  const n = Object.fromEntries(nodes.map((x) => [x.id, x]));
  const mid = (k: string) => ({ cx: n[k].x + BW / 2, cy: n[k].y + BH / 2 });
  const edge = 'var(--ink-3)';
  return (
    <svg viewBox="0 0 720 300" width="100%" role="img" aria-label="Flow from ideation to launch with two loops back to design">
      <defs>
        <marker id="fl-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill={edge} />
        </marker>
        <marker id="fl-back" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="var(--amber)" />
        </marker>
      </defs>
      {/* forward path */}
      <g fill="none" stroke={edge} strokeWidth="1.5">
        <path d={`M${n.ideate.x + BW} ${mid('ideate').cy}H${n.design.x - 2}`} markerEnd="url(#fl-arrow)" />
        <path d={`M${n.design.x + BW} ${mid('design').cy}H${n.coach.x - 2}`} markerEnd="url(#fl-arrow)" />
        <path d={`M${n.coach.x + BW} ${mid('coach').cy}H${n.shelf.x - 2}`} markerEnd="url(#fl-arrow)" />
        <path d={`M${mid('shelf').cx} ${n.shelf.y + BH}V${n.make.y - 2}`} markerEnd="url(#fl-arrow)" />
        <path d={`M${n.make.x} ${mid('make').cy}H${n.qual.x + BW + 2}`} markerEnd="url(#fl-arrow)" />
        <path d={`M${n.qual.x} ${mid('qual').cy}H${n.gate.x + BW + 2}`} markerEnd="url(#fl-arrow)" />
      </g>
      {/* loops back to design */}
      <g fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeDasharray="5 4">
        <path d={`M${mid('coach').cx} ${n.coach.y}V14H${mid('design').cx + 20}V${n.design.y - 2}`} markerEnd="url(#fl-back)" />
        <path d={`M${mid('shelf').cx} ${n.shelf.y}V6H${mid('design').cx - 10}V${n.design.y - 2}`} markerEnd="url(#fl-back)" />
        <path d={`M${n.make.x + 30} ${n.make.y}V150H${mid('design').cx}V${n.design.y + BH + 2}`} markerEnd="url(#fl-back)" />
      </g>
      <text x={mid('coach').cx + 6} y="30" fontSize="11" fill="var(--amber)">fix and retry</text>
      <text x={n.coach.x + BW + 30} y="20" fontSize="11" fill="var(--amber)">loses on shelf</text>
      <text x={mid('design').cx + 8} y="144" fontSize="11" fill="var(--amber)">red machine: change the pack, not the line</text>
      {nodes.map((x) => (
        <a key={x.id} href={x.href} className="flow-node">
          <rect x={x.x} y={x.y} width={BW} height={BH} rx="10" fill={x.tone ? 'var(--accent)' : 'var(--surface)'} stroke={x.tone ? 'var(--accent)' : 'var(--rule)'} strokeWidth="1.5" />
          <text x={x.x + 14} y={x.y + 26} fontSize="14" fontWeight="600" fill={x.tone ? '#fff' : 'var(--ink)'} fontFamily="var(--head)">{x.title}</text>
          <text x={x.x + 14} y={x.y + 46} fontSize="11.5" fill={x.tone ? '#dbe5f7' : 'var(--ink-2)'}>{x.sub}</text>
        </a>
      ))}
      <text x="10" y="292" fontSize="11" fill="var(--ink-2)">Solid arrows: the path forward. Dashed: early exits that save prototypes, research and trials.</text>
    </svg>
  );
}

// ---------- Capabilities ----------

const ico = (d: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d={d} /></svg>;

const CAPS = [
  { title: 'Component library', href: '#/library', color: '#2F6FD6', icon: ico('M4 4h5v16H4zM10 4h5v16h-5zM17 5l3 14'),
    what: 'Every bottle, cap and label in one record: traced shapes, cost, MOQ, lead time, grams, PCR and line data.',
    gain: 'One source of truth for brand, R&D, procurement and plant.' },
  { title: '3D Playroom', href: '#/playroom', color: '#003DA5', icon: ico('M9 3h6v4H9zM8 7h8l1.5 3V20H6.5V10z'),
    what: 'Snap bottle, closure and decoration together, reshape it, recolour it, write the label and branch versions.',
    gain: 'Replaces most physical prototype rounds.' },
  { title: 'Design Coach', href: '#/coach', color: '#7A4FC8', icon: ico('M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z'),
    what: 'Pack Score across ten lenses, specific fixes with their effect, and generated alternatives inside brand guardrails.',
    gain: 'Catches weak packs before research money is spent.' },
  { title: 'Global and local menus', href: '#/menus', color: '#1F8A5B', icon: ico('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18'),
    what: 'What is locked globally and what flexes by market, local suppliers, size ladders and deviation requests.',
    gain: 'Fewer tail SKUs and change parts.' },
  { title: 'Shelf simulator', href: '#/shelf', color: '#C2793A', icon: ico('M3 8h18M3 15h18M3 21h18M4 3v18M20 3v18'),
    what: 'Hypermarket, mass, pharmacy, kirana and e-commerce shelves with an attention heatmap and thumbnail test.',
    gain: 'Screens options before consumer research.' },
  { title: 'Production backtrack', href: '#/production', color: '#B5175B', icon: ico('M3 21V10l5 3V10l5 3V6l8 4v11z'),
    what: 'Machine-by-machine line fit, change parts, predicted speed, draft centerlines, qualification plan and payback.',
    gain: 'No late surprises at the line trial.' },
];
