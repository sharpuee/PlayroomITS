import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { useCoachContext } from '../hooks';
import { COMPETITORS, RETAIL_FORMATS, type CompetitorPack } from '../data/retail';
import { resolvePack, money } from '../domain/resolve';
import { textHeights, coach } from '../domain/coach';
import { visualFromCompetitor, visualFromPack } from '../three/PackModel';
import { ShelfScene, layoutShelf, saliency, type AnalyzeFn } from '../three/ShelfScene';
import { Field, Seg, Slider, toast } from '../ui/kit';

const SHORT: Record<string, string> = { hyper: 'Hypermarket', mass: 'Mass retail', pharmacy: 'Pharmacy', kirana: 'Kirana', ecom: 'E-commerce' };

interface TestResult {
  id: string;
  design: string;
  format: string;
  attentionShare: number;
  shelfShare: number;
  index: number;
  findS: number;
}

export default function Shelf() {
  const designs = useStore((s) => s.designs);
  const activeId = useStore((s) => s.activeId);
  const design = designs.find((d) => d.id === activeId) ?? designs[0];
  const ctx = useCoachContext();
  const [formatId, setFormatId] = useState('hyper');
  const format = RETAIL_FORMATS.find((f) => f.id === formatId)!;
  const [facings, setFacings] = useState(3);
  const eyeShelf = Math.max(0, Math.min(format.shelves - 1, Math.round((1250 - 120) / Math.max(1, format.shelfGapMm))));
  const [shelfPick, setShelfPick] = useState<number | null>(null);
  const ourShelf = Math.min(format.shelves - 1, shelfPick ?? eyeShelf);
  const [pos, setPos] = useState(0.45);
  const [range, setRange] = useState(true);
  const [view, setView] = useState<'aisle' | 'close' | 'free'>('aisle');
  const [heat, setHeat] = useState<string | null>(null);
  const [mark, setMark] = useState(true);
  const [results, setResults] = useState<TestResult[]>([]);
  const analyze = useRef<AnalyzeFn | null>(null);

  const ourDesigns = useMemo(() => (range ? designs.filter((d) => d.brandId === design.brandId && d.rangeName === design.rangeName) : [design]), [designs, design, range]);
  const ourVisuals = useMemo(() => ourDesigns.map((d) => visualFromPack(resolvePack(d, ctx))), [ourDesigns, ctx]);
  const compVisuals = useMemo(() => COMPETITORS.map(visualFromCompetitor), []);
  const layout = useMemo(() => layoutShelf(format, ourVisuals, compVisuals, facings, ourShelf, pos), [format, ourVisuals, compVisuals, facings, ourShelf, pos]);

  const runTest = () => {
    if (mark && !heat) {
      // Hide the shelf-edge marks so they do not bias the attention model, then measure.
      setHeat('pending');
      window.setTimeout(() => measure(), 120);
      return;
    }
    measure();
  };

  const measure = () => {
    const r = analyze.current?.();
    if (!r) return toast('Could not read the shelf image. Try again after the scene loads.');
    const { map, w, h } = saliency(r.image);
    // Heat overlay
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const cx = c.getContext('2d')!;
    const img = cx.createImageData(w, h);
    for (let i = 0; i < w * h; i++) {
      const v = map[i];
      const a = Math.max(0, (v - 0.25) / 0.75);
      img.data[i * 4] = 255;
      img.data[i * 4 + 1] = Math.round(220 * (1 - v));
      img.data[i * 4 + 2] = Math.round(60 * (1 - v));
      img.data[i * 4 + 3] = Math.round(a * 190);
    }
    cx.putImageData(img, 0, 0);
    setHeat(c.toDataURL());
    // Attention inside our packs vs their share of the visible shelf.
    const mass = (b: [number, number, number, number]) => {
      let m = 0;
      for (let y = Math.floor(b[1] * h); y < Math.ceil(b[3] * h); y++) for (let x = Math.floor(b[0] * w); x < Math.ceil(b[2] * w); x++) m += map[y * w + x] ?? 0;
      return m;
    };
    const area = (b: [number, number, number, number]) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
    const ourMass = r.ours.reduce((a, b) => a + mass(b), 0);
    const allMass = r.all.reduce((a, b) => a + mass(b), 0) || 1;
    const ourArea = r.ours.reduce((a, b) => a + area(b), 0);
    const allArea = r.all.reduce((a, b) => a + area(b), 0) || 1;
    const attentionShare = ourMass / allMass;
    const shelfShare = ourArea / allArea;
    const index = shelfShare > 0 ? attentionShare / shelfShare : 0;
    const findS = Math.max(0.8, Math.min(12, 0.7 + 2.6 / (index + 0.25) + (format.crowding * 1.2)));
    setResults((rs) => [{ id: String(Date.now()), design: range ? `${design.rangeName} range (${ourDesigns.length})` : design.name, format: format.name, attentionShare, shelfShare, index, findS }, ...rs].slice(0, 8));
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Shelf simulator</h1>
          <p>Put {range ? `the ${design.rangeName} range` : design.name} on a shelf next to the category and measure how much attention it earns compared with the space it takes.</p>
        </div>
        <Seg value={formatId} onChange={(v) => { setFormatId(v); setHeat(null); setShelfPick(null); }} label="Retail format" options={RETAIL_FORMATS.map((f) => ({ v: f.id, l: SHORT[f.id] ?? f.name }))} />
      </div>

      {format.kind === 'ecom' ? (
        <Ecom />
      ) : (
        <div className="shelf-wrap">
          <section className="shelf-stage" aria-label="Shelf view">
            <ShelfScene format={format} layout={layout} view={view} highlight={mark && !heat} onAnalyzeReady={(fn) => (analyze.current = fn)} />
            {heat && heat !== 'pending' && <img className="heat" src={heat} alt="Attention heatmap" style={{ mixBlendMode: 'normal', imageRendering: 'auto' }} />}
            <div className="stage-tools">
              <Seg value={view} onChange={(v) => { setView(v); setHeat(null); }} label="Camera" options={[{ v: 'aisle', l: `Aisle at ${format.viewDistanceM} m` }, { v: 'close', l: 'Close-up' }, { v: 'free', l: 'Walk around' }]} />
              <div className="row">
                {heat && <button className="btn small" type="button" onClick={() => setHeat(null)}>Hide heatmap</button>}
                <button className="btn small primary" type="button" onClick={runTest}>Run attention test</button>
              </div>
            </div>
          </section>
          <aside className="stack" style={{ overflowY: 'auto' }}>
            <div className="panel panel-pad stack">
              <h2 style={{ margin: 0 }}>{format.name}</h2>
              <p className="small muted">{format.note}</p>
              <label className="row small"><input type="checkbox" checked={range} onChange={(e) => setRange(e.target.checked)} /> Show the whole range as a brand block</label>
              <label className="row small"><input type="checkbox" checked={mark} onChange={(e) => setMark(e.target.checked)} /> Mark our packs on the shelf edge</label>
              <Slider label="Facings per variant" value={facings} min={1} max={6} onChange={setFacings} />
              <Field label="Shelf">
                <select value={ourShelf} onChange={(e) => setShelfPick(+e.target.value)}>
                  {Array.from({ length: format.shelves }).map((_, i) => (
                    <option key={i} value={i}>{i === eyeShelf ? `Shelf ${i + 1} · eye level` : `Shelf ${i + 1}${i === 0 ? ' · bottom' : i === format.shelves - 1 ? ' · top' : ''}`}</option>
                  ))}
                </select>
              </Field>
              <Slider label="Position in the bay" value={pos} min={0} max={1} step={0.05} onChange={setPos} fmt={(v) => (v < 0.3 ? 'left' : v > 0.7 ? 'right' : 'centre')} />
            </div>
            <div className="panel panel-pad stack">
              <h3 style={{ margin: 0 }}>Attention tests</h3>
              <p className="small muted">Index above 1.0 means the pack earns more attention than its share of shelf. The model is a visual-saliency estimate; calibrate it against eye-tracking before relying on absolute numbers.</p>
              {results.length === 0 && <p className="small">Run a test, change the design or position, and run again to compare.</p>}
              {results.map((r, i) => (
                <div key={r.id} className="sugg" style={{ gap: 2 }}>
                  <b className="small">{r.design}</b>
                  <span className="small muted">{r.format}</span>
                  <div className="row small num" style={{ justifyContent: 'space-between' }}>
                    <span>Attention {(r.attentionShare * 100).toFixed(1)}%</span>
                    <span>Shelf {(r.shelfShare * 100).toFixed(1)}%</span>
                  </div>
                  <div className="row small num" style={{ justifyContent: 'space-between' }}>
                    <b style={{ color: r.index >= 1 ? 'var(--green)' : 'var(--red)' }}>Index {r.index.toFixed(2)}</b>
                    <span>Est. time to find {r.findS.toFixed(1)} s</span>
                  </div>
                  {i === 0 && results[1] && <span className="small muted">vs previous: {(r.index - results[1].index >= 0 ? '+' : '')}{(r.index - results[1].index).toFixed(2)}</span>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CompetitorTile({ c }: { c: CompetitorPack }) {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-label={c.name}>
      <rect width="100" height="100" fill="#f6f7f8" />
      <rect x={50 - c.widthMm * 0.22} y="10" width={c.widthMm * 0.44} height="8" rx="2" fill={c.cap} stroke="#0001" />
      <rect x={50 - c.widthMm * 0.32} y="18" width={c.widthMm * 0.64} height="74" rx="9" fill={c.bottle} stroke="#0002" />
      <rect x={50 - c.widthMm * 0.28} y="40" width={c.widthMm * 0.56} height="30" rx="2" fill={c.label} />
      <text x="50" y="53" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={c.ink} fontFamily="Bricolage Grotesque, Arial">{c.name}</text>
      <text x="50" y="63" textAnchor="middle" fontSize="3.6" fill={c.ink} fontFamily="IBM Plex Sans, Arial">Daily Care</text>
    </svg>
  );
}

function Ecom() {
  const design = useStore((s) => s.designs.find((d) => d.id === s.activeId) ?? s.designs[0]);
  const ctx = useCoachContext();
  const p = resolvePack(design, ctx);
  const r = coach(design, ctx, { lite: true });
  const th = textHeights(p);
  const tilePx = 120;
  const px = (mm: number) => (mm / p.totalHeightMm) * tilePx * 0.85;
  const brandPx = px(th.brandMm);
  const variantPx = px(th.variantMm);
  const price = (r.cost.total * 4.2 + 0.0055 * p.volumeMl);
  const tiles = [
    <div key="ours" className="tile ours">
      <div className="img">{design.thumbnail ? <img src={design.thumbnail} alt={design.name} /> : <span className="small muted">Open the Playroom once to render</span>}</div>
      <b>{design.label.brandText} {design.label.variantText} {p.volumeMl} ml</b>
      <span>{money(price, p.market, 2)} · ★ 4.4</span>
    </div>,
    ...COMPETITORS.slice(0, 5).map((c) => (
      <div key={c.name} className="tile">
        <div className="img"><CompetitorTile c={c} /></div>
        <b>{c.name} Daily Care Shampoo</b>
        <span>{money(0.0055 * 400 + 0.6, p.market, 2)} · ★ 4.2</span>
      </div>
    )),
  ];
  const checks = [
    { ok: brandPx >= 9, t: `Brand mark is about ${brandPx.toFixed(0)} px tall on a ${tilePx} px tile`, fix: 'Aim for 9 px or more; enlarge or simplify the word mark.' },
    { ok: variantPx >= 6, t: `Variant name is about ${variantPx.toFixed(1)} px tall`, fix: 'Below 6 px it blurs. Put the variant in the product title and use a colour code on pack.' },
    { ok: (p.dims.widthMm / p.totalHeightMm) > 0.28, t: `Pack fills ${Math.round((p.dims.widthMm / p.totalHeightMm) * 100)}% of the tile width`, fix: 'Tall, narrow packs look small in square tiles; use a hero image that crops in or adds the key benefit.' },
  ];
  return (
    <div className="grid2" style={{ alignItems: 'start' }}>
      <div className="panel ecom">
        <div className="phone" aria-label="Search results on a phone">
          <p className="small muted" style={{ marginBottom: 8 }}>Results for “anti dandruff shampoo”</p>
          <div className="tiles">{tiles}</div>
        </div>
      </div>
      <div className="panel panel-pad stack">
        <h2 style={{ margin: 0 }}>Thumbnail test</h2>
        <p className="small muted">Shoppers decide from a {tilePx} px tile. Checks follow common mobile-ready hero image practice.</p>
        {checks.map((c, i) => (
          <div key={i} className="sugg">
            <span className={`verdict ${c.ok ? 'green' : 'amber'}`}>{c.ok ? 'Passes' : 'Fix'}</span>
            <span className="small">{c.t}</span>
            {!c.ok && <span className="eff">{c.fix}</span>}
          </div>
        ))}
        <p className="small muted">The price shown is a placeholder derived from unit cost; replace with your RSP.</p>
      </div>
    </div>
  );
}
