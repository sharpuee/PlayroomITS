import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useCoachContext, useReport } from '../hooks';
import type { Component, MarketId } from '../domain/types';
import { resolvePack, money } from '../domain/resolve';
import { Field, toast } from '../ui/kit';

const ELEMENTS = ['Bottle silhouette', 'Logo and brand colours', 'Closure type', 'Label language and claims', 'Pack sizes', 'Materials and PCR', 'Decoration process'];

export default function Menus() {
  const design = useStore((s) => s.designs.find((d) => d.id === s.activeId) ?? s.designs[0]);
  const designs = useStore((s) => s.designs);
  const deviations = useStore((s) => s.deviations);
  const addDeviation = useStore((s) => s.addDeviation);
  const decide = useStore((s) => s.decideDeviation);
  const ctx = useCoachContext();
  const report = useReport(design);
  const [market, setMarket] = useState<MarketId>(design?.market === 'global' ? 'IN' : design?.market ?? 'IN');
  const [element, setElement] = useState(ELEMENTS[0]);
  const [reason, setReason] = useState('');

  const m = ctx.markets.find((x) => x.id === market)!;
  const inMarket = (c: Component) => c.markets.includes(market);
  const globalMenu = ctx.components.filter((c) => c.scope === 'global' && inMarket(c));
  const localMenu = ctx.components.filter((c) => c.scope === 'local' && inMarket(c));

  const marketDesigns = designs.filter((d) => d.market === market);
  const harmon = useMemo(
    () =>
      designs.map((d) => {
        const p = resolvePack(d, ctx);
        const parts = [p.bottle, p.closure, p.decoration];
        return { d, p, pct: Math.round((parts.filter((x) => x.scope === 'global').length / parts.length) * 100), parts };
      }),
    [designs, ctx],
  );
  const complexity = useMemo(() => {
    const used = new Map<string, { c: Component; n: number; vol: number }>();
    for (const h of harmon.filter((h) => h.d.market === market)) {
      for (const c of h.parts) {
        const e = used.get(c.id) ?? { c, n: 0, vol: 0 };
        e.n += 1;
        e.vol += h.d.annualVolumeM;
        used.set(c.id, e);
      }
    }
    return [...used.values()].sort((a, b) => a.vol - b.vol);
  }, [harmon, market]);

  // Local part vs closest global equivalent.
  const localVsGlobal = localMenu.map((lp) => {
    const peers = ctx.components.filter((g) => g.scope === 'global' && g.kind === lp.kind);
    let best: Component | undefined;
    let bestD = Infinity;
    for (const g of peers) {
      let dist = 0;
      if (lp.kind === 'bottle' && g.kind === 'bottle') dist = Math.abs(lp.volumeMl - g.volumeMl) + (lp.neckFinish === g.neckFinish ? 0 : 50) + (lp.family === g.family ? 0 : 80);
      else if (lp.kind === 'closure' && g.kind === 'closure') dist = (lp.type === g.type ? 0 : 50) + (g.neckFinishes.some((n) => lp.neckFinishes.includes(n)) ? 0 : 20);
      else if (lp.kind === 'decoration' && g.kind === 'decoration') dist = lp.type === g.type ? 0 : 10;
      if (dist < bestD) { bestD = dist; best = g; }
    }
    return { lp, g: best };
  });
  const cost = (c: Component) => (c.kind === 'decoration' ? c.costPer1000Cm2 * 0.12 : c.unitCostUsd);

  if (!design || !report) return null;
  const myH = harmon.find((h) => h.d.id === design.id)!;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Global and local menus</h1>
          <p>Every market designs from two menus: approved global platform parts, and local parts, sizes and suppliers. Brand codes stay locked; the rest can flex with a recorded reason.</p>
        </div>
        <Field label="Market">
          <select value={market} onChange={(e) => setMarket(e.target.value as MarketId)}>
            {ctx.markets.filter((x) => x.id !== 'global').map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <section className="panel panel-pad">
          <h2>What is locked and what flexes</h2>
          <table className="data">
            <thead><tr><th>Element</th><th>Global (locked)</th><th>{m.name} (flexible)</th></tr></thead>
            <tbody>
              <tr><td>Bottle silhouette</td><td>{ctx.brands.map((b) => <div key={b.id} className="small">{b.name}: {b.lockedFamilies.join(', ')}</div>)}</td><td className="small">Size ladder {m.sizeLadderMl.join(' / ')} ml</td></tr>
              <tr><td>Logo, brand colours</td><td>{ctx.brands.map((b) => (
                <div key={b.id} className="row small" style={{ gap: 4 }}>{b.name} {b.palette.map((c) => <i key={c} style={{ width: 12, height: 12, borderRadius: 3, background: c, border: '1px solid var(--rule)', display: 'inline-block' }} />)}</div>
              ))}</td><td className="small muted">Not flexible</td></tr>
              <tr><td>Closure</td><td className="small">Platform closure type per brand</td><td className="small">Local supplier and colour within spec</td></tr>
              <tr><td>Label copy</td><td className="small">Hierarchy template</td><td className="small">Language, claims and legal copy. {m.legalNote}</td></tr>
              <tr><td>Formats</td><td className="small">Bottle, refill</td><td className="small">{market === 'IN' || market === 'SEA' ? 'Sachets, mini packs for general trade and quick commerce' : 'Club sizes, bundles'}</td></tr>
              <tr><td>Materials</td><td className="small">Minimum PCR and recyclability targets</td><td className="small">Local resin grades; PCR supply up to {m.pcrAvailable}%</td></tr>
            </tbody>
          </table>
        </section>

        <section className="panel panel-pad stack">
          <h2 style={{ margin: 0 }}>Harmonisation</h2>
          <p className="small muted">Share of each design's parts taken from the global platform. Higher means scale savings and fewer change parts.</p>
          <table className="data">
            <thead><tr><th>Design</th><th>Market</th><th className="r">Global parts</th></tr></thead>
            <tbody>
              {harmon.map((h) => (
                <tr key={h.d.id} className={h.d.id === design.id ? 'sel' : ''}>
                  <td>{h.d.name}</td>
                  <td className="small">{h.d.market}</td>
                  <td className="r num">{h.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small">{design.name}: {myH.parts.map((p) => `${p.name} (${p.scope})`).join(', ')}.</p>
        </section>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <section className="panel panel-pad">
          <h2>{m.name} menu</h2>
          <div className="grid2" style={{ gap: 12 }}>
            <div>
              <h3>Global parts approved here ({globalMenu.length})</h3>
              {globalMenu.map((c) => <div key={c.id} className="small" style={{ padding: '3px 0', borderBottom: '1px solid var(--rule-2)' }}>{c.name}</div>)}
            </div>
            <div>
              <h3>Local parts ({localMenu.length})</h3>
              {localMenu.length === 0 && <p className="small muted">No local parts yet. Add them in the Component library with menu set to Local.</p>}
              {localMenu.map((c) => <div key={c.id} className="small" style={{ padding: '3px 0', borderBottom: '1px solid var(--rule-2)' }}>{c.name} <span className="muted">· {c.supplier.name}</span></div>)}
            </div>
          </div>
        </section>

        <section className="panel panel-pad">
          <h2>Local versus global sourcing</h2>
          {localVsGlobal.length === 0 ? <p className="muted small">No local parts to compare in this market.</p> : (
            <table className="data">
              <thead><tr><th>Local part</th><th>Closest global part</th><th className="r">Unit cost</th><th className="r">Lead time</th></tr></thead>
              <tbody>
                {localVsGlobal.map(({ lp, g }) => (
                  <tr key={lp.id}>
                    <td className="small">{lp.name}</td>
                    <td className="small muted">{g?.name ?? '—'}</td>
                    <td className="r num small">{money(cost(lp), m)} vs {g ? money(cost(g), m) : '—'}</td>
                    <td className="r num small">{lp.leadTimeWeeks} vs {g?.leadTimeWeeks ?? '—'} wk</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <section className="panel panel-pad">
          <h2>Complexity in {m.name}</h2>
          {complexity.length === 0 ? <p className="small muted">No designs are assigned to {m.name}. Set a design's market in the top bar.</p> : (
            <>
              <p className="small muted">{marketDesigns.length} designs use {complexity.length} distinct parts. Parts under 5M units a year add changeovers without scale.</p>
              <table className="data">
                <thead><tr><th>Part</th><th className="r">Designs</th><th className="r">Volume (M/yr)</th><th /></tr></thead>
                <tbody>
                  {complexity.map((x) => (
                    <tr key={x.c.id}>
                      <td className="small">{x.c.name}</td>
                      <td className="r num">{x.n}</td>
                      <td className="r num">{x.vol.toFixed(1)}</td>
                      <td>{x.vol < 5 && <span className="tag local">tail part</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          <h3 style={{ marginTop: 14 }}>Size ladder</h3>
          <div className="row">
            {m.sizeLadderMl.map((s) => <span key={s} className="tag">{s} ml</span>)}
          </div>
          {marketDesigns.filter((d) => !m.sizeLadderMl.includes(resolvePack(d, ctx).volumeMl)).map((d) => (
            <p key={d.id} className="small" style={{ color: 'var(--amber)', marginTop: 6 }}>{d.name} is {resolvePack(d, ctx).volumeMl} ml, off the {m.name} ladder.</p>
          ))}
        </section>

        <section className="panel panel-pad stack">
          <h2 style={{ margin: 0 }}>Deviation requests</h2>
          <p className="small muted">Ask the global owner to unlock an element for {design.name}. The current Pack Score ({report.total}) travels with the request.</p>
          <div className="grid2" style={{ gap: 8 }}>
            <Field label="Element"><select value={element} onChange={(e) => setElement(e.target.value)}>{ELEMENTS.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Market"><input type="text" value={m.name} readOnly /></Field>
          </div>
          <Field label="Why the local market needs it"><textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Local supplier cuts lead time from 6 to 3 weeks for the 180 ml" /></Field>
          <button className="btn primary" type="button" disabled={!reason.trim()} onClick={() => { addDeviation({ designId: design.id, market, element, reason: `${reason} (Pack Score ${report.total})` }); setReason(''); toast('Request sent to the global owner'); }} style={{ justifySelf: 'start' }}>Send request</button>
          {deviations.length === 0 && <p className="small muted">No requests yet.</p>}
          {deviations.map((d) => (
            <div key={d.id} className="sugg">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <b className="small">{d.element} · {d.market}</b>
                <span className={`verdict ${d.status === 'approved' ? 'green' : d.status === 'rejected' ? 'red' : 'amber'}`}>{d.status}</span>
              </div>
              <span className="small">{designs.find((x) => x.id === d.designId)?.name}: {d.reason}</span>
              {d.status === 'open' && (
                <div className="row">
                  <button className="btn small" type="button" onClick={() => decide(d.id, 'approved')}>Approve</button>
                  <button className="btn small" type="button" onClick={() => decide(d.id, 'rejected')}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}

