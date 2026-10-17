import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useCoachContext, useReport } from '../hooks';
import { resolvePack, money, moneyBig, type ResolvedPack } from '../domain/resolve';
import { geometryOf, geometryOfSku, nearestSku, setpointsFor, type LineFit } from '../domain/linefit';
import { unitCost } from '../domain/cost';
import type { BottleSpec, ClosureSpec, Machine, PackDesign, ProductionLine } from '../domain/types';
import { Field, VerdictBadge, download, toast } from '../ui/kit';

type Tab = 'fit' | 'route' | 'centerline' | 'qual' | 'case' | 'profile';

const MACHINE_LABEL: Record<string, string> = {
  unscrambler: 'Unscrambler', rinser: 'Rinser', filler: 'Filler', 'cap-feeder': 'Cap feeder', capper: 'Capper', labeller: 'Labeller',
  'sleeve-tunnel': 'Sleever', 'coder-vision': 'Coder + vision', checkweigher: 'Checkweigher', 'case-packer': 'Case packer',
};

export default function Production() {
  const design = useStore((s) => s.designs.find((d) => d.id === s.activeId) ?? s.designs[0]);
  const update = useStore((s) => s.updateDesign);
  const ctx = useCoachContext();
  const report = useReport(design);
  const [tab, setTab] = useState<Tab>('fit');
  const [machineId, setMachineId] = useState<string | null>(null);

  if (!design || !report) return null;
  const pack = report.pack;
  const fits = report.fits;
  const lineId = design.lineId && ctx.lines.some((l) => l.id === design.lineId) ? design.lineId : fits[0]?.line.id;
  const fit = fits.find((f) => f.line.id === lineId) ?? fits[0];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Production backtrack</h1>
          <p>How {design.name} gets made: the technology for each part, whether it runs on your current lines, the change parts and centerlines it needs, and what it costs.</p>
        </div>
      </div>

      <section className="grid3" aria-label="Lines ranked by fit">
        {fits.map((f) => (
          <button key={f.line.id} type="button" className={`card ${f.line.id === fit.line.id ? 'active' : ''}`} onClick={() => update(design.id, { lineId: f.line.id })}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <b>{f.line.name}</b>
              <VerdictBadge v={f.verdict} />
            </div>
            <span className="small muted">{f.line.plant} · target {f.line.targetBpm} bpm · OEE {f.line.oeePct}%</span>
            <span className="small">
              {f.verdict === 'red' ? `${f.machines.filter((m) => m.verdict === 'red').length} machines cannot run it` : `${f.predictedBpm} bpm · ${f.parts.length} change parts · ${money(f.partsUsd, pack.market, 0)}`}
            </span>
          </button>
        ))}
      </section>

      <div className="tabs" role="tablist">
        {([['fit', 'Line fit'], ['route', 'Manufacturing route'], ['centerline', 'Centerline'], ['qual', 'Qualification plan'], ['case', 'Business case'], ['profile', 'Line profile']] as [Tab, string][]).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === 'fit' && <FitTab fit={fit} pack={pack} machineId={machineId} setMachineId={setMachineId} />}
      {tab === 'route' && <RouteTab pack={pack} fit={fit} />}
      {tab === 'centerline' && <CenterlineTab design={design} pack={pack} fit={fit} />}
      {tab === 'qual' && <QualTab design={design} pack={pack} fit={fit} />}
      {tab === 'case' && <CaseTab design={design} pack={pack} fit={fit} />}
      {tab === 'profile' && <ProfileTab key={fit.line.id} line={fit.line} />}
    </div>
  );
}

function FitTab({ fit, pack, machineId, setMachineId }: { fit: LineFit; pack: ResolvedPack; machineId: string | null; setMachineId: (id: string | null) => void }) {
  const sel = fit.machines.find((m) => m.machine.id === machineId) ?? fit.machines.find((m) => m.verdict !== 'green' && !m.skipped) ?? fit.machines[0];
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="panel panel-pad">
        <div className="row" style={{ gap: 28 }}>
          <div className="kpi"><small>Verdict</small><VerdictBadge v={fit.verdict} /></div>
          <div className="kpi"><small>Predicted speed</small><b>{fit.predictedBpm} bpm</b></div>
          <div className="kpi"><small>Line target</small><b>{fit.line.targetBpm} bpm</b></div>
          <div className="kpi"><small>Bottleneck</small><b style={{ fontSize: 15 }}>{fit.bottleneck}</b></div>
          <div className="kpi"><small>Change parts</small><b>{money(fit.partsUsd, pack.market, 0)}</b></div>
          <div className="kpi"><small>Longest part lead time</small><b>{fit.partsWeeks} wk</b></div>
          <div className="kpi"><small>Changeover added</small><b>+{fit.changeoverAddMin} min</b></div>
          <div className="kpi"><small>OEE effect</small><b>{fit.oeeDeltaPts.toFixed(1)} pts</b></div>
        </div>
        {fit.blockers.map((b) => <p key={b} style={{ color: 'var(--red)', marginTop: 10 }}>{b}</p>)}
      </div>

      <div className="machine-flow" role="list" aria-label="Machines in line order">
        {fit.machines.map((m) => (
          <button key={m.machine.id} type="button" role="listitem" className={`machine ${m.skipped ? 'skipped' : m.verdict}`} aria-pressed={sel?.machine.id === m.machine.id} onClick={() => setMachineId(m.machine.id)}>
            <small>{MACHINE_LABEL[m.machine.type]}</small>
            <b style={{ fontSize: 13 }}>{m.machine.name}</b>
            {m.skipped ? <small>Not used</small> : <small className="num">{m.bpm ? `${m.bpm} bpm` : ''}{m.parts.length ? ` · ${m.parts.length} parts` : ''}</small>}
          </button>
        ))}
      </div>

      {sel && (
        <div className="grid2" style={{ alignItems: 'start' }}>
          <section className="panel panel-pad stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{sel.machine.name}</h2>
              {!sel.skipped && <VerdictBadge v={sel.verdict} />}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {sel.reasons.map((r) => <li key={r} className="small">{r}</li>)}
            </ul>
            {'heightMm' in sel.machine && (
              <p className="small muted">
                Envelope: height {sel.machine.heightMm[0]}–{sel.machine.heightMm[1]} mm, width {sel.machine.widthMm[0]}–{sel.machine.widthMm[1]} mm, depth {sel.machine.depthMm[0]}–{sel.machine.depthMm[1]} mm.
                {' '}This pack: {pack.dims.widthMm.toFixed(0)}×{pack.dims.depthMm.toFixed(0)} mm, {pack.totalHeightMm.toFixed(0)} mm tall capped.
              </p>
            )}
          </section>
          <section className="panel panel-pad">
            <h2>Change parts for this line</h2>
            {fit.parts.length === 0 ? <p className="muted small">None: the pack runs on existing change parts.</p> : (
              <table className="data">
                <thead><tr><th>Machine</th><th>Part</th><th className="r">Cost</th><th className="r">Lead</th></tr></thead>
                <tbody>
                  {fit.parts.map((p, i) => (
                    <tr key={i}><td className="small">{p.machine}</td><td className="small">{p.part}</td><td className="r num">{money(p.usd, pack.market, 0)}</td><td className="r num">{p.weeks} wk</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function RouteTab({ pack, fit }: { pack: ResolvedPack; fit: LineFit }) {
  const cost = unitCost(pack);
  const b = pack.bottle;
  const processNote: Record<string, string> = {
    EBM: 'Extrusion blow moulding: a parison is extruded and blown in a split mould. Best for HDPE/PP ovals with handles or offset necks.',
    ISBM: 'Injection stretch blow moulding: a preform is injected then stretched and blown. Gives PET clarity and tight neck tolerances.',
    IM: 'Injection moulding.',
    'Extruded tube': 'Extruded sleeve with an injection-moulded shoulder; filled from the open end and sealed on a tube filler.',
  };
  const rows = [
    { part: 'Bottle', tech: `${b.process} · ${b.resin}${pack.design.pcrPct ? ` with ${pack.design.pcrPct}% PCR` : ''}`, where: b.supplier.name, tooling: pack.customShape ? 'New mould (custom shape)' : b.owned ? 'Existing mould' : 'New mould', lead: pack.customShape || !b.owned ? Math.max(b.leadTimeWeeks, 12) : b.leadTimeWeeks, note: processNote[b.process] },
    { part: 'Closure', tech: `Injection moulding${pack.closure.type.includes('pump') ? ' + pump assembly' : ''}`, where: pack.closure.supplier.name, tooling: pack.closure.owned ? 'Existing tool' : 'New tool or supplier stock', lead: pack.closure.leadTimeWeeks, note: pack.closure.needsOrientation ? 'Needs orientation on the line before capping.' : 'Non-oriented; feeds by gravity.' },
    { part: 'Decoration', tech: pack.decoration.name, where: ['iml', 'screen-print'].includes(pack.decoration.type) ? `${b.supplier.name} (applied at the bottle maker)` : pack.decoration.supplier.name, tooling: pack.decoration.owned ? 'Existing plates/dies' : 'New plates/dies', lead: pack.decoration.leadTimeWeeks, note: pack.decoration.notes ?? '' },
    { part: 'Fill, cap, decorate, pack', tech: fit.line.machines.map((m) => MACHINE_LABEL[m.type]).join(' → '), where: `${fit.line.plant}, ${fit.line.name}`, tooling: fit.parts.length ? `${fit.parts.length} change parts` : 'Existing change parts', lead: fit.partsWeeks, note: '' },
  ];
  const critical = rows.reduce((a, r) => (r.lead > a.lead ? r : a));
  return (
    <div className="stack">
      <div className="panel" style={{ overflow: 'auto' }}>
        <table className="data">
          <thead><tr><th>Part</th><th>Technology</th><th>Made by</th><th>Tooling</th><th className="r">Lead time</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.part}>
                <td><b style={{ fontWeight: 500 }}>{r.part}</b></td>
                <td className="small">{r.tech}{r.note && <div className="muted">{r.note}</div>}</td>
                <td className="small">{r.where}</td>
                <td className="small">{r.tooling}</td>
                <td className="r num">{r.lead} wk</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid2">
        <div className="panel panel-pad">
          <h3>Critical path</h3>
          <p className="small">{critical.part} sets the pace at {critical.lead} weeks. Add about 2 weeks for the line trial and 12 weeks of stability testing that can overlap with tooling; first production is roughly {critical.lead + 4} to {Math.max(critical.lead + 4, 14)} weeks out.</p>
        </div>
        <div className="panel panel-pad">
          <h3>Unit cost build-up</h3>
          <table className="data">
            <tbody>
              <tr><td>Bottle ({pack.grams} g {pack.bottle.resin})</td><td className="r num">{money(cost.bottle, pack.market)}</td></tr>
              <tr><td>Closure</td><td className="r num">{money(cost.closure, pack.market)}</td></tr>
              <tr><td>Decoration ({pack.labelAreaCm2} cm²)</td><td className="r num">{money(cost.decoration, pack.market)}</td></tr>
              <tr><td>Finish and colour</td><td className="r num">{money(cost.finish, pack.market)}</td></tr>
              <tr><td>Filling and packing</td><td className="r num">{money(cost.filling, pack.market)}</td></tr>
              <tr><td><b>Total packaging + conversion</b></td><td className="r num"><b>{money(cost.total, pack.market)}</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CenterlineTab({ design, pack, fit }: { design: PackDesign; pack: ResolvedPack; fit: LineFit }) {
  const update = useStore((s) => s.updateDesign);
  const components = useStore((s) => s.components);
  const bottles = components.filter((c): c is BottleSpec => c.kind === 'bottle');
  const closures = components.filter((c): c is ClosureSpec => c.kind === 'closure');
  const sku = nearestSku(pack, fit.line, bottles);
  const skuB = bottles.find((b) => b.id === sku?.bottleId);
  const skuC = closures.find((c) => c.id === sku?.closureId);
  const bpm = fit.predictedBpm || fit.line.targetBpm;
  const sp = useMemo(() => setpointsFor(geometryOf(pack), fit.line, bpm), [pack, fit.line, bpm]);
  const base = useMemo(() => (skuB && skuC ? setpointsFor(geometryOfSku(skuB, skuC), fit.line, sku.bpm) : []), [skuB, skuC, fit.line, sku]);
  const ov = design.centerlineOverrides ?? {};
  const locked = !!design.centerlineLocked;

  const csv = () => {
    const lines = [['Machine', 'Setpoint', 'Unit', 'Value', 'Tolerance (±)', `Baseline (${sku?.name ?? ''})`].join(',')];
    for (const s of sp) {
      const b = base.find((x) => x.key === s.key);
      lines.push([MACHINE_LABEL[s.machine], s.label, s.unit, ov[s.key] ?? s.value, s.tol, b?.value ?? ''].map((x) => `"${x}"`).join(','));
    }
    download(`centerline-${design.name.replace(/\W+/g, '-')}-${fit.line.id}.csv`, lines.join('\n'), 'text/csv');
  };

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ maxWidth: '72ch' }}>
          Draft centerline for {fit.line.name} at {bpm} bpm, built from the closest running SKU ({sku?.name ?? 'none'}) and adjusted for the new geometry. Engineers review, edit and lock it before the line trial.
        </p>
        <div className="row">
          <button className="btn" type="button" onClick={csv}>Export CSV</button>
          <button className={`btn ${locked ? '' : 'primary'}`} type="button" onClick={() => { update(design.id, { centerlineLocked: !locked }); toast(locked ? 'Centerline unlocked for editing' : 'Centerline locked and approved'); }}>{locked ? 'Unlock' : 'Lock and approve'}</button>
        </div>
      </div>
      {fit.verdict === 'red' && <p style={{ color: 'var(--red)' }}>This line cannot run the pack yet. The setpoints show what it would need after the upgrades listed in Line fit.</p>}
      <div className="panel" style={{ overflow: 'auto' }}>
        <table className="data">
          <thead><tr><th>Machine</th><th>Setpoint</th><th className="r">New SKU</th><th className="r">Tolerance</th><th className="r">Baseline SKU</th><th className="r">Change</th></tr></thead>
          <tbody>
            {sp.map((s) => {
              const b = base.find((x) => x.key === s.key);
              const val = ov[s.key] ?? s.value;
              const delta = b ? val - b.value : 0;
              return (
                <tr key={s.key}>
                  <td className="small">{MACHINE_LABEL[s.machine]}</td>
                  <td>{s.label} <span className="muted small">({s.unit})</span></td>
                  <td className="r">
                    <input className="cl-input num" type="number" step="any" value={val} disabled={locked} aria-label={`${s.label} value`}
                      onChange={(e) => update(design.id, { centerlineOverrides: { ...ov, [s.key]: +e.target.value } })} />
                  </td>
                  <td className="r num small">± {s.tol}</td>
                  <td className="r num small muted">{b ? b.value : '—'}</td>
                  <td className={`r num small ${Math.abs(delta) > s.tol ? 'delta-up' : 'muted'}`}>{b ? `${delta > 0 ? '+' : ''}${+delta.toFixed(2)}` : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="small muted">Changes larger than the tolerance band are highlighted; they go on the changeover checklist and the CIL for this SKU.</p>
    </div>
  );
}

function QualTab({ design, pack, fit }: { design: PackDesign; pack: ResolvedPack; fit: LineFit }) {
  const update = useStore((s) => s.updateDesign);
  const items = [
    { k: 'proto', t: '3D-printed prototypes', why: 'Hand-feel, consumer and retailer reviews before any steel is cut.', on: true },
    { k: 'mould', t: 'Single-cavity prototype mould', why: pack.customShape || !pack.bottle.owned ? 'New bottle geometry: wall distribution and grams check.' : 'Not needed: existing mould.', on: pack.customShape || !pack.bottle.owned },
    { k: 'drop', t: 'Drop test (filled)', why: 'Confirms the base and closure survive a shelf-height drop.', on: true },
    { k: 'topload', t: 'Topload test', why: design.shape.ribbed || pack.grams < pack.bottle.grams ? 'Wall was thinned; confirm stacking strength.' : 'Standard stacking check.', on: true },
    { k: 'squeeze', t: 'Squeeze and dispensing', why: pack.closure.type.includes('pump') ? `Pump output ${pack.closure.outputCc ?? '?'} cc per stroke with the real viscosity.` : 'Squeeze force and flow through the orifice.', on: true },
    { k: 'leak', t: 'Leak and torque retention', why: `Application torque ${pack.closure.torqueNm[0]}–${pack.closure.torqueNm[1]} N·m; removal torque after 72 h.`, on: true },
    { k: 'transit', t: 'Transit test (ISTA)', why: 'Vibration and drop in the shipper.', on: true },
    { k: 'compat', t: 'Product compatibility and stability (12 weeks)', why: design.pcrPct > 0 ? 'PCR resin and new colourants against the formula.' : 'Formula against new materials.', on: true },
    { k: 'trial', t: `Line trial on ${fit.line.name}`, why: fit.parts.length ? `Run with the ${fit.parts.length} new change parts and the draft centerline.` : 'Confirm speed and centerline.', on: fit.verdict !== 'red' },
    { k: 'label', t: 'Artwork and legal copy approval', why: pack.market.legalNote, on: true },
  ].filter((i) => i.on);
  const done = items.filter((i) => design.qualification[i.k]).length;
  return (
    <div className="grid2" style={{ alignItems: 'start' }}>
      <div className="panel panel-pad stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Qualification plan</h2>
          <span className="num">{done} of {items.length} done</span>
        </div>
        <div className="checklist">
          {items.map((i) => (
            <label key={i.k}>
              <input type="checkbox" checked={!!design.qualification[i.k]} onChange={(e) => update(design.id, { qualification: { ...design.qualification, [i.k]: e.target.checked } })} />
              <span>{i.t}<small>{i.why}</small></span>
            </label>
          ))}
        </div>
      </div>
      <div className="panel panel-pad">
        <h3>Why these tests</h3>
        <p className="small muted">The plan is built from what changed: new geometry adds a prototype mould, thinner walls add topload, pumps add dispensing, PCR adds compatibility. Results attach to this design and are checked at the Capability gate.</p>
      </div>
    </div>
  );
}

function CaseTab({ design, pack, fit }: { design: PackDesign; pack: ResolvedPack; fit: LineFit }) {
  const update = useStore((s) => s.updateDesign);
  const designs = useStore((s) => s.designs);
  const ctx = useCoachContext();
  const others = designs.filter((d) => d.id !== design.id);
  const components = useStore((s) => s.components);
  const bottles = components.filter((c): c is BottleSpec => c.kind === 'bottle');
  const sku = nearestSku(pack, fit.line, bottles);
  const [baseId, setBaseId] = useState('sku');
  const [contrib, setContrib] = useState(0.6);
  // Default baseline: the closest pack already running on the chosen line.
  const skuDesign: PackDesign | undefined = sku ? { ...design, bottleId: sku.bottleId, closureId: sku.closureId, shape: {}, finish: pack.bottle.resin === 'PET' ? 'clear' : 'gloss', capFinish: 'gloss' } : undefined;
  const base = baseId === 'sku' ? skuDesign : others.find((d) => d.id === baseId);
  const speed = fit.predictedBpm > 0 ? fit.predictedBpm / fit.line.targetBpm : 0.8;
  const cost = unitCost(pack, speed);
  const basePack = base ? resolvePack(base, ctx) : undefined;
  const baseCost = basePack ? unitCost(basePack) : undefined;
  const vol = design.annualVolumeM * 1e6;
  const capex = cost.toolingTotal + fit.partsUsd;
  const deltaUnit = baseCost ? cost.total - baseCost.total : 0;
  const annualDelta = deltaUnit * vol;
  const payback = annualDelta < 0 ? (capex / -annualDelta) * 12 : null;
  return (
    <div className="stack">
      <div className="grid3">
        <Field label="Annual volume (million units)">
          <input type="number" step="0.5" value={design.annualVolumeM} onChange={(e) => update(design.id, { annualVolumeM: +e.target.value })} />
        </Field>
        <Field label="Contribution per extra unit sold (USD)">
          <input type="number" step="0.05" value={contrib} onChange={(e) => setContrib(+e.target.value)} />
        </Field>
        <Field label="Compare against">
          <select value={baseId} onChange={(e) => setBaseId(e.target.value)}>
            {sku && <option value="sku">Running today: {sku.name}</option>}
            {others.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
      </div>
      <div className="panel panel-pad">
        <div className="row" style={{ gap: 28 }}>
          <div className="kpi"><small>Unit cost</small><b>{money(cost.total, pack.market)}</b></div>
          <div className="kpi"><small>vs comparison</small><b style={{ color: deltaUnit > 0 ? 'var(--red)' : 'var(--green)' }}>{deltaUnit >= 0 ? '+' : ''}{money(deltaUnit, pack.market)}</b></div>
          <div className="kpi"><small>Annual cost effect</small><b>{annualDelta >= 0 ? '+' : '−'}{moneyBig(Math.abs(annualDelta), pack.market)}</b></div>
          <div className="kpi"><small>One-off capex</small><b>{moneyBig(capex, pack.market)}</b></div>
          <div className="kpi"><small>Payback</small><b>{payback !== null ? `${payback.toFixed(1)} months` : 'From sales uplift'}</b></div>
        </div>
      </div>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div className="panel panel-pad">
          <h3>One-off spend</h3>
          <table className="data">
            <tbody>
              {cost.tooling.map((t) => <tr key={t.item}><td className="small">{t.item}</td><td className="r num">{moneyBig(t.usd, pack.market)}</td></tr>)}
              {fit.parts.length > 0 && <tr><td className="small">Change parts on {fit.line.name} ({fit.parts.length})</td><td className="r num">{moneyBig(fit.partsUsd, pack.market)}</td></tr>}
              {capex === 0 && <tr><td className="small muted" colSpan={2}>No tooling or change parts needed.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="panel panel-pad">
          <h3>Reading the case</h3>
          <p className="small muted">
            {payback !== null
              ? `The new pack is cheaper per unit, so savings repay the one-off spend in about ${payback.toFixed(1)} months at ${design.annualVolumeM}M units a year.`
              : `The pack costs ${money(Math.max(0, deltaUnit), pack.market)} more per unit. To pay back the one-off spend and the extra cost in year one, it needs about ${((Math.max(0, annualDelta) + capex) / Math.max(0.01, contrib) / 1e6).toFixed(2)}M extra units sold, at ${money(contrib, pack.market, 2)} contribution each. Use the Shelf attention index to judge whether that uplift is credible.`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileTab({ line }: { line: ProductionLine }) {
  const updateLine = useStore((s) => s.updateLine);
  const [draft, setDraft] = useState<ProductionLine>(line);
  const setM = (i: number, patch: Partial<Machine>) => setDraft({ ...draft, machines: draft.machines.map((m, j) => (j === i ? { ...m, ...patch } : m)) });
  const range = (i: number, k: 'heightMm' | 'widthMm' | 'depthMm', idx: 0 | 1, v: number) => {
    const r = [...draft.machines[i][k]] as [number, number];
    r[idx] = v;
    setM(i, { [k]: r } as Partial<Machine>);
  };
  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <p className="muted" style={{ maxWidth: '72ch' }}>The digital profile of {line.name}. Plant engineering owns these envelopes and change-part formats; every line-fit verdict is computed from them.</p>
        <div className="row">
          <Field label="Target bpm"><input type="number" value={draft.targetBpm} onChange={(e) => setDraft({ ...draft, targetBpm: +e.target.value })} style={{ width: 90 }} /></Field>
          <Field label="OEE %"><input type="number" value={draft.oeePct} onChange={(e) => setDraft({ ...draft, oeePct: +e.target.value })} style={{ width: 80 }} /></Field>
          <button className="btn primary" type="button" onClick={() => { updateLine(draft); toast('Line profile saved'); }}>Save profile</button>
        </div>
      </div>
      <div className="panel" style={{ overflow: 'auto' }}>
        <table className="data">
          <thead><tr><th>Machine</th><th className="r">Max bpm</th><th>Height mm</th><th>Width mm</th><th>Depth mm</th><th>Formats with change parts</th></tr></thead>
          <tbody>
            {draft.machines.map((m, i) => (
              <tr key={m.id}>
                <td><b style={{ fontWeight: 500 }}>{m.name}</b><div className="small muted">{MACHINE_LABEL[m.type]}</div></td>
                <td className="r"><input className="cl-input" type="number" value={m.maxBpm} onChange={(e) => setM(i, { maxBpm: +e.target.value })} aria-label={`${m.name} max bpm`} /></td>
                {(['heightMm', 'widthMm', 'depthMm'] as const).map((k) => (
                  <td key={k}>
                    {m.type === 'cap-feeder' ? <span className="muted small">n/a</span> : (
                      <span className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                        <input className="cl-input" style={{ width: 64 }} type="number" value={m[k][0]} onChange={(e) => range(i, k, 0, +e.target.value)} aria-label={`${m.name} ${k} min`} />
                        <input className="cl-input" style={{ width: 64 }} type="number" value={m[k][1]} onChange={(e) => range(i, k, 1, +e.target.value)} aria-label={`${m.name} ${k} max`} />
                      </span>
                    )}
                  </td>
                ))}
                <td><input type="text" value={m.formats.join(', ')} onChange={(e) => setM(i, { formats: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} style={{ width: '100%', minWidth: 200 }} aria-label={`${m.name} formats`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted">Format codes: family-widthxdepth in mm (e.g. oval-72x46), cap-diameter, pump-diameter, or "any".</p>
      <div className="panel panel-pad">
        <h3>SKUs running today</h3>
        {line.skus.map((s) => <div key={s.name} className="small">{s.name} · {s.bpm} bpm</div>)}
      </div>
    </div>
  );
}

