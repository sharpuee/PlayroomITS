import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useStore, uid } from '../store';
import { useCoachContext, useReport } from '../hooks';
import { resolvePack, money } from '../domain/resolve';
import { onMenu, menuReason } from '../domain/menus';
import type { BottleSpec, ClosureSpec, DecorationSpec, Finish, LabelArt, PackDesign } from '../domain/types';
import { PackModel, visualFromPack, packTotalHeight } from '../three/PackModel';
import { Studio, type SnapshotFn } from '../three/Studio';
import { ColorField, Field, PhotoField, ScoreRing, Seg, Slider, VerdictBadge, toast } from '../ui/kit';
import { LENSES } from '../domain/coach';

const FINISHES_OPAQUE: Finish[] = ['gloss', 'matte', 'soft-touch', 'pearl', 'metallic'];
const FINISHES_PET: Finish[] = ['clear', 'frosted', 'gloss', 'pearl'];

export default function Playroom() {
  const designs = useStore((s) => s.designs);
  const activeId = useStore((s) => s.activeId);
  const design = designs.find((d) => d.id === activeId) ?? designs[0];
  const update = useStore((s) => s.updateDesign);
  const branch = useStore((s) => s.branchDesign);
  const addDesign = useStore((s) => s.addDesign);
  const setActive = useStore((s) => s.setActive);
  const menuMode = useStore((s) => s.menuMode);
  const ctx = useCoachContext();
  const report = useReport(design);

  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [spin, setSpin] = useState(false);
  const [compare, setCompare] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showRef, setShowRef] = useState(true);
  const snap = useRef<SnapshotFn | null>(null);
  const exportGroup = useRef<THREE.Group>(null);

  const pack = useMemo(() => (design ? resolvePack(design, ctx) : undefined), [design, ctx]);
  const visual = useMemo(() => (pack ? visualFromPack(pack) : undefined), [pack]);

  // Keep a fresh thumbnail on the design for boards and the shelf.
  const vKey = JSON.stringify(visual);
  useEffect(() => {
    if (!design || compare) return;
    const t = window.setTimeout(() => {
      const img = snap.current?.(320);
      if (img) update(design.id, { thumbnail: img });
    }, 1200);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vKey, compare]);

  const set = useCallback((patch: Partial<PackDesign>) => design && update(design.id, patch), [design, update]);
  const setLabel = (patch: Partial<LabelArt>) => design && update(design.id, { label: { ...design.label, ...patch } });

  if (!design || !pack || !visual || !report) return <div className="empty">Create a design to start.</div>;

  const bottles = ctx.components.filter((c): c is BottleSpec => c.kind === 'bottle');
  const closures = ctx.components.filter((c): c is ClosureSpec => c.kind === 'closure');
  const decos = ctx.components.filter((c): c is DecorationSpec => c.kind === 'decoration');
  const brand = pack.brand;

  const pickBottle = (b: BottleSpec) => {
    const patch: Partial<PackDesign> = { bottleId: b.id, shape: { ribbed: design.shape.ribbed } };
    if (!pack.closure.neckFinishes.includes(b.neckFinish)) {
      const c = closures.find((x) => x.neckFinishes.includes(b.neckFinish) && onMenu(x, design.market, menuMode)) ?? closures.find((x) => x.neckFinishes.includes(b.neckFinish));
      if (c) {
        patch.closureId = c.id;
        toast(`Closure switched to ${c.name} to fit the ${b.neckFinish} neck`);
      }
    }
    if (b.resin === 'PET' && !FINISHES_PET.includes(design.finish)) patch.finish = 'clear';
    if (b.resin !== 'PET' && (design.finish === 'clear' || design.finish === 'frosted')) patch.finish = 'gloss';
    set(patch);
  };

  const finishes = pack.bottle.resin === 'PET' ? FINISHES_PET : FINISHES_OPAQUE;
  const fmtMm = (v: number) => `${v.toFixed(0)} mm`;
  const fit = report.bestFit;

  const compareSet = compare
    ? designs.filter((d) => (compareIds.length ? compareIds.includes(d.id) : d.brandId === design.brandId && d.rangeName === design.rangeName))
    : [design];

  const exportGlb = () => {
    const g = exportGroup.current;
    if (!g) return;
    new GLTFExporter().parse(
      g,
      (res) => {
        const blob = new Blob([res as ArrayBuffer], { type: 'model/gltf-binary' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${design.name.replace(/\W+/g, '-')}.glb`;
        a.click();
        toast('3D model downloaded. Open it on a phone to view in AR.');
      },
      () => toast('Export failed: the model could not be converted.'),
      { binary: true },
    );
  };

  return (
    <div className="playroom">
      {/* ---------- Build panel ---------- */}
      <aside className="side panel panel-pad" aria-label="Build">
        <Field label="Design name">
          <input type="text" value={design.name} onChange={(e) => set({ name: e.target.value })} />
        </Field>
        <div className="grid2" style={{ gap: 8 }}>
          <Field label="Brand">
            <select value={design.brandId} onChange={(e) => set({ brandId: e.target.value })}>
              {ctx.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Field label="Range">
            <input type="text" value={design.rangeName} onChange={(e) => set({ rangeName: e.target.value })} />
          </Field>
        </div>

        <details className="sect" open={!design.referenceImage}>
          <summary>Reference photo</summary>
          <div>
            <PhotoField label="Photo of the pack on market today" value={design.referenceImage} onChange={(v) => set({ referenceImage: v })} hint="Use your own approved pack shots. The photo is kept in this browser only and shown next to the 3D model." />
          </div>
        </details>

        <details className="sect" open>
          <summary>Bottle</summary>
          <div className="part-pick">
            {bottles.map((b) => {
              const reason = menuReason(b, design.market, menuMode);
              return (
                <button key={b.id} type="button" className="part-opt" aria-pressed={b.id === design.bottleId} disabled={!!reason && b.id !== design.bottleId} title={reason ?? ''} onClick={() => pickBottle(b)}>
                  <span>
                    {b.name}
                    <small>{b.resin} · {b.neckFinish} · {b.grams} g {b.scope === 'local' ? '· local' : ''}</small>
                  </span>
                  <small>{money(b.unitCostUsd, pack.market)}</small>
                </button>
              );
            })}
          </div>
        </details>

        <details className="sect" open>
          <summary>Closure</summary>
          <div className="part-pick">
            {closures.map((c) => {
              const fits = c.neckFinishes.includes(pack.bottle.neckFinish);
              const reason = !fits ? `Needs a ${c.neckFinishes.join('/')} neck` : menuReason(c, design.market, menuMode);
              if (!fits && c.id !== design.closureId) return null;
              return (
                <button key={c.id} type="button" className="part-opt" aria-pressed={c.id === design.closureId} disabled={!!reason && c.id !== design.closureId} title={reason ?? ''} onClick={() => set({ closureId: c.id })}>
                  <span>
                    {c.name}
                    <small>{c.grams} g · {c.mono ? 'mono-material' : 'mixed material'}{c.scope === 'local' ? ' · local' : ''}</small>
                  </span>
                  <small>{money(c.unitCostUsd, pack.market)}</small>
                </button>
              );
            })}
          </div>
        </details>

        <details className="sect">
          <summary>Decoration</summary>
          <div className="part-pick">
            {decos.map((d) => {
              const reason = menuReason(d, design.market, menuMode);
              return (
                <button key={d.id} type="button" className="part-opt" aria-pressed={d.id === design.decorationId} disabled={!!reason && d.id !== design.decorationId} title={reason ?? ''} onClick={() => set({ decorationId: d.id, label: d.type === 'shrink-sleeve' ? { ...design.label, wrap: 'sleeve' } : design.label.wrap === 'sleeve' ? { ...design.label, wrap: 'front-back' } : design.label })}>
                  <span>{d.name}<small>{d.substrate}</small></span>
                </button>
              );
            })}
          </div>
        </details>

        <details className="sect" open>
          <summary>Shape</summary>
          <div>
            <Slider label="Height" value={pack.dims.heightMm} min={Math.round(pack.bottle.heightMm * 0.75)} max={Math.round(pack.bottle.heightMm * 1.25)} onChange={(v) => set({ shape: { ...design.shape, heightMm: v } })} fmt={fmtMm} />
            <Slider label="Width" value={pack.dims.widthMm} min={Math.round(pack.bottle.widthMm * 0.75)} max={Math.round(pack.bottle.widthMm * 1.3)} onChange={(v) => set({ shape: { ...design.shape, widthMm: v } })} fmt={fmtMm} />
            {pack.bottle.family !== 'cylinder' && pack.bottle.family !== 'tube' && (
              <Slider label="Depth" value={pack.dims.depthMm} min={Math.round(pack.bottle.depthMm * 0.75)} max={Math.round(pack.bottle.depthMm * 1.35)} onChange={(v) => set({ shape: { ...design.shape, depthMm: v } })} fmt={fmtMm} />
            )}
            <Slider label="Shoulder" value={pack.dims.shoulder} min={0} max={1} step={0.05} onChange={(v) => set({ shape: { ...design.shape, shoulder: v } })} fmt={(v) => (v < 0.35 ? 'conical' : v > 0.7 ? 'rounded' : 'soft')} />
            <Slider label="Waist" value={pack.dims.waist} min={0} max={0.14} step={0.01} onChange={(v) => set({ shape: { ...design.shape, waist: v } })} fmt={(v) => `${(v * 100).toFixed(0)}%`} />
            <label className="row small">
              <input type="checkbox" checked={!!design.shape.ribbed} onChange={(e) => set({ shape: { ...design.shape, ribbed: e.target.checked } })} />
              Back-panel ribs (lighter wall)
            </label>
            {pack.customShape && (
              <div className="row small" style={{ justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--amber)' }}>Custom shape: needs a new mould</span>
                <button className="btn small" type="button" onClick={() => set({ shape: { ribbed: design.shape.ribbed } })}>Reset to platform</button>
              </div>
            )}
          </div>
        </details>

        <details className="sect" open>
          <summary>Colour and finish</summary>
          <div>
            <ColorField label="Bottle" value={design.bottleColor} onChange={(v) => set({ bottleColor: v })} swatches={brand.palette} />
            <Field label="Bottle finish">
              <select value={design.finish} onChange={(e) => set({ finish: e.target.value as Finish })}>
                {finishes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <ColorField label="Closure" value={design.capColor} onChange={(v) => set({ capColor: v })} swatches={brand.palette} />
            <Field label="Closure finish">
              <select value={design.capFinish} onChange={(e) => set({ capFinish: e.target.value as Finish })}>
                {FINISHES_OPAQUE.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            {(design.finish === 'clear' || design.finish === 'frosted') && (
              <ColorField label="Product colour" value={design.liquidColor} onChange={(v) => set({ liquidColor: v })} />
            )}
            <Slider label="Recycled content (PCR)" value={design.pcrPct} min={0} max={100} step={5} onChange={(v) => set({ pcrPct: v })} fmt={(v) => `${v}%${v > pack.market.pcrAvailable ? ' · above local supply' : ''}`} />
          </div>
        </details>

        <details className="sect" open>
          <summary>Label artwork</summary>
          <div>
            <Field label="Brand word mark"><input type="text" value={design.label.brandText} onChange={(e) => setLabel({ brandText: e.target.value })} /></Field>
            <Field label="Variant"><input type="text" value={design.label.variantText} onChange={(e) => setLabel({ variantText: e.target.value })} /></Field>
            <Field label="Benefit claim" value={`${design.label.claimText.length} chars`}><input type="text" value={design.label.claimText} onChange={(e) => setLabel({ claimText: e.target.value })} /></Field>
            <ColorField label="Label background" value={design.label.bg} onChange={(v) => setLabel({ bg: v })} swatches={brand.palette} />
            <ColorField label="Text" value={design.label.ink} onChange={(v) => setLabel({ ink: v })} swatches={brand.palette} />
            <ColorField label="Variant accent" value={design.label.accent} onChange={(v) => setLabel({ accent: v })} swatches={brand.palette} />
            <Field label="Layout">
              <Seg value={design.label.layout} onChange={(v) => setLabel({ layout: v })} options={[{ v: 'stacked', l: 'Stacked' }, { v: 'band', l: 'Band' }, { v: 'minimal', l: 'Minimal' }]} />
            </Field>
            <Field label="Coverage">
              <select value={design.label.wrap} onChange={(e) => setLabel({ wrap: e.target.value as LabelArt['wrap'] })} disabled={pack.decoration.type === 'shrink-sleeve'}>
                <option value="front">Front only</option>
                <option value="front-back">Front and back</option>
                <option value="wrap">Wrap-around</option>
                <option value="sleeve">Full sleeve</option>
              </select>
            </Field>
            {design.label.wrap !== 'sleeve' && (
              <>
                <Slider label="Label height" value={design.label.heightPct} min={0.25} max={0.9} step={0.01} onChange={(v) => setLabel({ heightPct: v })} fmt={(v) => `${Math.round(v * 100)}% of body`} />
                <Slider label="Label position" value={design.label.offsetPct} min={0.3} max={0.7} step={0.01} onChange={(v) => setLabel({ offsetPct: v })} fmt={(v) => (v < 0.45 ? 'low' : v > 0.55 ? 'high' : 'centred')} />
              </>
            )}
          </div>
        </details>
      </aside>

      {/* ---------- Stage ---------- */}
      <section className="stage" aria-label="3D preview">
        <Studio camera={compare ? [0, 1.6, 4 + compareSet.length * 1.6] : [0.9, packTotalHeight(visual) * 0.007, packTotalHeight(visual) * 0.026 + 1.2]} target={[0, compare ? 1.1 : packTotalHeight(visual) * 0.0048, 0]} onSnapshotReady={(fn) => (snap.current = fn)} autoRotate={spin}>
          <group ref={exportGroup}>
            {compareSet.map((d, i) => {
              const rp = d.id === design.id ? pack : resolvePack(d, ctx);
              const vv = d.id === design.id ? visual : visualFromPack(rp);
              const n = compareSet.length;
              const x = (i - (n - 1) / 2) * 1.15;
              return (
                <group key={d.id} position={[x, 0, 0]}>
                  <PackModel v={vv} open={open} pressed={pressed} />
                </group>
              );
            })}
          </group>
        </Studio>
        <div className="stage-tools">
          <div className="row">
            {['flip-top', 'disc-top', 'tube-cap'].includes(pack.closure.type) && (
              <button className="btn small" type="button" onClick={() => setOpen((o) => !o)}>{open ? 'Close cap' : 'Open cap'}</button>
            )}
            {['pump', 'foam-pump'].includes(pack.closure.type) && (
              <button className="btn small" type="button" onPointerDown={() => setPressed(true)} onPointerUp={() => setPressed(false)} onPointerLeave={() => setPressed(false)}>Press pump</button>
            )}
            <button className="btn small" type="button" aria-pressed={spin} onClick={() => setSpin((s) => !s)}>{spin ? 'Stop turntable' : 'Turntable'}</button>
            <button className="btn small" type="button" aria-pressed={compare} onClick={() => setCompare((c) => !c)}>{compare ? 'Single view' : 'Range view'}</button>
            {design.referenceImage && !compare && (
              <button className="btn small" type="button" aria-pressed={showRef} onClick={() => setShowRef((s) => !s)}>{showRef ? 'Hide reference' : 'Show reference'}</button>
            )}
          </div>
          <div className="row">
            <button className="btn small" type="button" onClick={() => { const img = snap.current?.(1200); if (img) { const a = document.createElement('a'); a.href = img; a.download = `${design.name}.jpg`; a.click(); } }}>Save image</button>
            <button className="btn small" type="button" onClick={exportGlb}>Download 3D (.glb)</button>
          </div>
        </div>
        {design.referenceImage && showRef && !compare && (
          <figure className="panel" style={{ position: 'absolute', right: 12, top: 52, width: '30%', maxWidth: 220, margin: 0, padding: 8 }}>
            <img src={design.referenceImage} alt="Pack on market today" style={{ width: '100%', display: 'block', borderRadius: 6 }} />
            <figcaption className="small muted" style={{ marginTop: 4 }}>On market today</figcaption>
          </figure>
        )}
        {compare && (
          <div className="panel panel-pad small" style={{ position: 'absolute', left: 12, top: 52, width: 230, maxHeight: '60%', overflow: 'auto' }}>
            <b>Show in range view</b>
            {designs.map((d) => (
              <label key={d.id} style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={compareSet.some((x) => x.id === d.id)}
                  onChange={(e) => {
                    const base = compareSet.map((x) => x.id);
                    setCompareIds(e.target.checked ? [...base, d.id] : base.filter((x) => x !== d.id));
                  }}
                />
                {d.name}
              </label>
            ))}
          </div>
        )}
        <div className="stage-foot">
          <div className="stat-strip" aria-label="Pack facts">
            <div><small>Volume</small><b>{pack.volumeMl} ml</b></div>
            <div><small>Plastic</small><b>{report.sus.totalGrams} g</b></div>
            <div><small>Cost / unit</small><b>{money(report.cost.total, pack.market)}</b></div>
            <div><small>Recycling</small><b>Class {report.sus.recyclClass}</b></div>
          </div>
          {fit && (
            <a className="panel panel-pad small" href="#/production" style={{ textDecoration: 'none', color: 'inherit', padding: '8px 12px' }}>
              <div className="muted">Best line: {fit.line.name}</div>
              <VerdictBadge v={fit.verdict} />
            </a>
          )}
        </div>
      </section>

      {/* ---------- Coach panel ---------- */}
      <aside className="side" aria-label="Coach summary">
        <div className="panel panel-pad">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <h2>Pack Score</h2>
              <p className="muted small">10 lenses, weighted to 100</p>
            </div>
            <ScoreRing score={report.total} />
          </div>
          <div style={{ marginTop: 8 }}>
            {LENSES.map((l) => {
              const s = report.lenses.find((x) => x.id === l.id)!;
              const pct = Math.round(s.score * 100);
              return (
                <div key={l.id} className="lens" style={{ gridTemplateColumns: '112px 1fr 28px', padding: '3px 0' }} title={s.detail}>
                  <span className="small">{l.name}</span>
                  <span className="bar"><i style={{ width: `${pct}%`, background: pct >= 75 ? 'var(--green)' : pct >= 55 ? 'var(--amber)' : 'var(--red)' }} /></span>
                  <span className="small num" style={{ textAlign: 'right' }}>{pct}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel panel-pad stack">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Top suggestions</h3>
            <a href="#/coach" className="small">All {report.suggestions.length}</a>
          </div>
          {report.suggestions.length === 0 && <p className="muted small">No open issues. Try the Coach for alternative directions.</p>}
          {report.suggestions.slice(0, 3).map((s) => (
            <div key={s.id} className="sugg">
              <span className="small">{s.text}</span>
              <span className="eff">{s.effect}</span>
              {s.patch && (
                <div className="row">
                  <button className="btn small primary" type="button" onClick={() => { set(s.patch!); toast('Suggestion applied'); }}>Apply</button>
                  <button className="btn small" type="button" onClick={() => { branch(design.id, `${design.name} · ${LENSES.find((l) => l.id === s.lens)?.name}`, s.patch); toast('Applied on a new branch'); }}>Try on a branch</button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="panel panel-pad stack">
          <h3 style={{ margin: 0 }}>Versions</h3>
          <div className="row">
            <button className="btn small" type="button" onClick={() => { branch(design.id); toast('Branch created'); }}>Branch this design</button>
            <button className="btn small" type="button" onClick={() => {
              const d: PackDesign = { ...design, id: uid('pd'), name: 'Untitled pack', parentId: undefined, stage: 'Idea', createdAt: Date.now(), updatedAt: Date.now(), gateNotes: [], qualification: {}, thumbnail: undefined };
              addDesign(d);
              toast('New design created from the current one');
            }}>New design</button>
          </div>
          <VersionTree designId={design.id} designs={designs} onPick={setActive} />
        </div>
      </aside>
    </div>
  );
}

function VersionTree({ designId, designs, onPick }: { designId: string; designs: PackDesign[]; onPick: (id: string) => void }) {
  let root = designs.find((d) => d.id === designId);
  while (root?.parentId && designs.some((d) => d.id === root!.parentId)) root = designs.find((d) => d.id === root!.parentId);
  if (!root) return null;
  const render = (d: PackDesign, depth: number): React.ReactNode => (
    <div key={d.id}>
      <button type="button" className="btn ghost small" style={{ paddingLeft: 4 + depth * 14, fontWeight: d.id === designId ? 600 : 400, justifyContent: 'flex-start', width: '100%' }} onClick={() => onPick(d.id)}>
        {depth > 0 ? '↳ ' : ''}{d.name}
      </button>
      {designs.filter((c) => c.parentId === d.id).map((c) => render(c, depth + 1))}
    </div>
  );
  return <div>{render(root, 0)}</div>;
}
