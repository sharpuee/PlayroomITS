import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useCoachContext } from '../hooks';
import { coach, type CoachReport } from '../domain/coach';
import { STAGES, type PackDesign } from '../domain/types';
import { money, moneyBig } from '../domain/resolve';
import { ScoreRing, VerdictBadge, toast } from '../ui/kit';

interface Criterion { t: string; ok: boolean }

function criteria(d: PackDesign, r: CoachReport, openDeviations: number): Criterion[] {
  const lens = (id: string) => r.lenses.find((l) => l.id === id)?.score ?? 0;
  switch (d.stage) {
    case 'Idea':
      return [
        { t: `Pack Score at least 55 (now ${r.total})`, ok: r.total >= 55 },
        { t: 'Brand codes lens at least 60', ok: lens('brand') >= 0.6 },
      ];
    case 'Concept':
      return [
        { t: 'Shelf standout at least 50', ok: lens('standout') >= 0.5 },
        { t: 'Communication at least 60', ok: lens('communication') >= 0.6 },
        { t: 'Mandatory copy fits the label', ok: lens('compliance') >= 0.8 },
      ];
    case 'Feasibility':
      return [
        { t: 'Runs on at least one current line (green or amber)', ok: !!r.bestFit && r.bestFit.verdict !== 'red' },
        { t: 'Cost lens at least 50', ok: lens('cost') >= 0.5 },
        { t: 'No open deviation requests', ok: openDeviations === 0 },
      ];
    case 'Capability': {
      const q = Object.values(d.qualification).filter(Boolean).length;
      return [
        { t: 'Centerline locked by engineering', ok: !!d.centerlineLocked },
        { t: `Qualification tests complete (${q} ticked)`, ok: q >= 8 },
      ];
    }
    default:
      return [];
  }
}

export default function Gates() {
  const designs = useStore((s) => s.designs);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const moveStage = useStore((s) => s.moveStage);
  const deviations = useStore((s) => s.deviations);
  const del = useStore((s) => s.deleteDesign);
  const ctx = useCoachContext();
  const reports = useMemo(() => new Map(designs.map((d) => [d.id, coach(d, ctx, { lite: true })])), [designs, ctx]);
  const [note, setNote] = useState('');
  const sel = designs.find((d) => d.id === activeId) ?? designs[0];
  const r = sel ? reports.get(sel.id)! : undefined;

  const capex = designs.reduce((a, d) => {
    const x = reports.get(d.id)!;
    return a + x.cost.toolingTotal + (x.bestFit?.partsUsd ?? 0);
  }, 0);
  const avg = designs.length ? Math.round(designs.reduce((a, d) => a + reports.get(d.id)!.total, 0) / designs.length) : 0;

  const crit = sel && r ? criteria(sel, r, deviations.filter((x) => x.designId === sel.id && x.status === 'open').length) : [];
  const next = sel ? STAGES[STAGES.indexOf(sel.stage) + 1] : undefined;
  const prev = sel ? STAGES[STAGES.indexOf(sel.stage) - 1] : undefined;
  const allOk = crit.every((c) => c.ok);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Stage gates</h1>
          <p>Every pack moves Idea → Concept → Feasibility → Capability → Launch. Gate criteria are checked from the Coach, Shelf and Production results; the decision and its note are recorded.</p>
        </div>
        <div className="row" style={{ gap: 24 }}>
          <div className="kpi"><small>Designs in pipeline</small><b>{designs.length}</b></div>
          <div className="kpi"><small>Average Pack Score</small><b>{avg}</b></div>
          <div className="kpi"><small>One-off spend in pipeline</small><b>{moneyBig(capex, ctx.markets[0])}</b></div>
        </div>
      </div>

      <div className="board">
        {STAGES.map((st) => {
          const items = designs.filter((d) => d.stage === st);
          return (
            <section key={st} className="col" aria-label={st}>
              <h3>{st} <span className="muted small">{items.length}</span></h3>
              {items.length === 0 && <p className="small muted">Nothing here yet.</p>}
              {items.map((d) => {
                const x = reports.get(d.id)!;
                return (
                  <button key={d.id} type="button" className={`card ${d.id === sel?.id ? 'active' : ''}`} onClick={() => setActive(d.id)}>
                    {d.thumbnail ? <img className="thumb" src={d.thumbnail} alt="" /> : <div className="thumb">Open in the Playroom to render</div>}
                    <b style={{ fontSize: 13 }}>{d.name}</b>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <span className="tag">{d.market}</span>
                      <span className="num small">Score <b>{x.total}</b></span>
                    </div>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      {x.bestFit && <VerdictBadge v={x.bestFit.verdict}>{x.bestFit.line.id}</VerdictBadge>}
                      <span className="num small">{money(x.cost.total, x.pack.market)}</span>
                    </div>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>

      {sel && r && (
        <div className="grid2" style={{ alignItems: 'start' }}>
          <section className="panel panel-pad stack">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0 }}>{sel.name}</h2>
                <p className="small muted">At {sel.stage}{next ? `; next gate: ${next}` : '; launched'}</p>
              </div>
              <ScoreRing score={r.total} size={60} />
            </div>
            {sel.referenceImage && (
              <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                <figure style={{ margin: 0, flex: 1 }}><img src={sel.referenceImage} alt="On market today" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', background: '#fff', borderRadius: 6 }} /><figcaption className="small muted">On market today</figcaption></figure>
                {sel.thumbnail && <figure style={{ margin: 0, flex: 1 }}><img src={sel.thumbnail} alt="Proposed" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 6 }} /><figcaption className="small muted">Proposed</figcaption></figure>}
              </div>
            )}
            {crit.length > 0 && (
              <div className="checklist">
                {crit.map((c) => (
                  <label key={c.t}><span className={`verdict ${c.ok ? 'green' : 'red'}`}>{c.ok ? 'Met' : 'Not met'}</span><span className="small">{c.t}</span></label>
                ))}
              </div>
            )}
            <textarea rows={2} placeholder="Decision note (who, why, conditions)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="row">
              {next && (
                <button className="btn primary" type="button" onClick={() => { moveStage(sel.id, next, note || (allOk ? 'All criteria met' : 'Passed with open criteria')); setNote(''); toast(`Moved to ${next}`); }}>
                  {allOk ? `Pass gate to ${next}` : `Pass to ${next} with open criteria`}
                </button>
              )}
              {prev && <button className="btn" type="button" onClick={() => { moveStage(sel.id, prev, note || 'Sent back'); setNote(''); toast(`Sent back to ${prev}`); }}>Send back to {prev}</button>}
              <a className="btn" href="#/playroom">Open in Playroom</a>
              <button className="btn ghost" type="button" onClick={() => { if (confirm(`Delete ${sel.name}? This cannot be undone.`)) { del(sel.id); toast('Design deleted'); } }}>Delete design</button>
            </div>
          </section>
          <section className="panel panel-pad">
            <h3>Decision log</h3>
            {sel.gateNotes.length === 0 && <p className="small muted">No gate decisions yet.</p>}
            {[...sel.gateNotes].reverse().map((g, i) => (
              <div key={i} style={{ borderTop: '1px solid var(--rule-2)', padding: '8px 0' }}>
                <div className="small"><b>{g.stage}</b> · {new Date(g.at).toLocaleString()} · {g.by}</div>
                <div className="small muted">{g.note}</div>
              </div>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

