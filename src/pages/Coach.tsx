import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { useCoachContext, useReport } from '../hooks';
import { LENSES, generateAlternatives, type Alternative } from '../domain/coach';
import { resolvePack } from '../domain/resolve';
import { PackModel, visualFromPack } from '../three/PackModel';
import { Studio } from '../three/Studio';
import { ScoreRing, scoreColor, toast } from '../ui/kit';

export default function Coach() {
  const design = useStore((s) => s.designs.find((d) => d.id === s.activeId) ?? s.designs[0]);
  const update = useStore((s) => s.updateDesign);
  const branch = useStore((s) => s.branchDesign);
  const ctx = useCoachContext();
  const report = useReport(design);
  const [alts, setAlts] = useState<Alternative[] | null>(null);
  const [seed, setSeed] = useState(1);
  const [busy, setBusy] = useState(false);

  const altVisuals = useMemo(() => (alts ?? []).map((a) => visualFromPack(resolvePack(a.design, ctx))), [alts, ctx]);

  if (!design || !report) return <div className="empty">Pick a design in the top bar.</div>;

  const run = () => {
    setBusy(true);
    // Let the button state paint before the search runs.
    window.setTimeout(() => {
      setAlts(generateAlternatives(design, ctx, 5, seed));
      setSeed((s) => s + 1);
      setBusy(false);
    }, 30);
  };

  const byLens = LENSES.map((l) => ({ lens: l, res: report.lenses.find((x) => x.id === l.id)!, sug: report.suggestions.filter((s) => s.lens === l.id) }));

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Design Coach</h1>
          <p>Scores {design.name} on ten lenses and writes specific fixes. Every fix shows its effect; you decide what to apply.</p>
        </div>
        <ScoreRing score={report.total} size={84} />
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>
        <section className="panel panel-pad">
          <h2>Lens by lens</h2>
          {byLens.map(({ lens, res }) => {
            const pct = Math.round(res.score * 100);
            return (
              <div key={lens.id} style={{ borderTop: '1px solid var(--rule-2)', padding: '10px 0' }}>
                <div className="lens" style={{ padding: 0 }}>
                  <b className="small">{lens.name} <span className="muted" style={{ fontWeight: 400 }}>· {lens.weight} pts</span></b>
                  <span className="bar"><i style={{ width: `${pct}%`, background: scoreColor(pct) }} /></span>
                  <span className="num small" style={{ textAlign: 'right' }}>{pct}</span>
                </div>
                <p className="small muted" style={{ marginTop: 4 }}>{res.detail}</p>
              </div>
            );
          })}
        </section>

        <section className="stack">
          <div className="panel panel-pad stack">
            <h2 style={{ margin: 0 }}>Fixes ({report.suggestions.length})</h2>
            {report.suggestions.length === 0 && <p className="muted">Nothing to fix on the current rules. Generate alternatives to explore new directions.</p>}
            {report.suggestions.map((s) => (
              <div key={s.id} className="sugg">
                <span className="tag" style={{ justifySelf: 'start' }}>{LENSES.find((l) => l.id === s.lens)?.name}</span>
                <span>{s.text}</span>
                <span className="eff">{s.effect}</span>
                {s.patch && (
                  <div className="row">
                    <button className="btn small primary" type="button" onClick={() => { update(design.id, s.patch!); toast('Fix applied'); }}>Apply</button>
                    <button className="btn small" type="button" onClick={() => { branch(design.id, `${design.name} · fix`, s.patch); toast('Applied on a new branch'); }}>Apply on a branch</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel panel-pad stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0 }}>Alternative directions</h2>
            <p className="muted small">Keeps the brand's locked codes, varies finish, colour within the brand palette, label, closure and wall. Ranked by Pack Score.</p>
          </div>
          <button className="btn primary" type="button" onClick={run} disabled={busy}>{busy ? 'Generating…' : alts ? 'Generate another set' : 'Generate alternatives'}</button>
        </div>
        {alts && alts.length === 0 && <p className="muted">No alternative beat the current design. Generate another set or loosen the brand guardrails in Settings.</p>}
        {alts && alts.length > 0 && (
          <>
            <div style={{ height: 380, borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--rule)', background: 'radial-gradient(120% 80% at 50% 25%, #fff 0%, #eef2f6 60%, #d9e0e7 100%)' }}>
              <Studio camera={[0, 1.3, 7]} target={[0, 1, 0]}>
                {altVisuals.map((v, i) => (
                  <group key={i} position={[(i - (altVisuals.length - 1) / 2) * 1.2, 0, 0]}>
                    <PackModel v={v} lite />
                  </group>
                ))}
              </Studio>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${alts.length}, minmax(0, 1fr))`, gap: 10 }}>
              {alts.map((a, i) => (
                <div key={i} className="sugg">
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <b>Option {i + 1}</b>
                    <span className="num" style={{ color: scoreColor(a.score), fontWeight: 600 }}>{a.score} <span className="muted small">({a.score - report.total >= 0 ? '+' : ''}{a.score - report.total})</span></span>
                  </div>
                  <span className="small muted">{a.changes.join(', ')}</span>
                  <button className="btn small" type="button" onClick={() => { const { id: _id, name: _n, ...rest } = a.design; void _id; void _n; branch(design.id, `${design.name} · option ${i + 1}`, rest); toast('Saved as a branch and opened in the Playroom'); window.location.hash = '/playroom'; }}>Open as a branch</button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
