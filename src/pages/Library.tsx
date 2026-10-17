import { useMemo, useState } from 'react';
import { useStore, uid } from '../store';
import type { BottleFamily, BottleSpec, Component, MarketId, Resin } from '../domain/types';
import { Field, Seg, toast } from '../ui/kit';

type Kind = 'all' | 'bottle' | 'closure' | 'decoration';

function spec(c: Component) {
  if (c.kind === 'bottle') return `${c.volumeMl} ml · ${c.family} · ${c.resin} · ${c.neckFinish} · ${c.grams} g · ${c.widthMm}×${c.depthMm}×${c.heightMm} mm`;
  if (c.kind === 'closure') return `${c.type} · fits ${c.neckFinishes.join(', ')} · Ø${c.diameterMm} mm · ${c.grams} g${c.outputCc ? ` · ${c.outputCc} cc` : ''}`;
  return `${c.type} · ${c.substrate}`;
}

export default function Library() {
  const components = useStore((s) => s.components);
  const markets = useStore((s) => s.markets);
  const upsert = useStore((s) => s.upsertComponent);
  const remove = useStore((s) => s.deleteComponent);
  const [kind, setKind] = useState<Kind>('all');
  const [scope, setScope] = useState<'all' | 'global' | 'local'>('all');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const rows = useMemo(
    () =>
      components.filter(
        (c) => (kind === 'all' || c.kind === kind) && (scope === 'all' || c.scope === scope) && `${c.name} ${spec(c)} ${c.supplier.name}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [components, kind, scope, q],
  );
  const selected = components.find((c) => c.id === sel);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Component library</h1>
          <p>Every bottle, closure and decoration is stored once with its geometry, cost, sustainability and line data. The Playroom, Shelf and Production modules all read from here.</p>
        </div>
        <button className="btn primary" type="button" onClick={() => { setCreating(true); setSel(null); }}>New bottle shape</button>
      </div>

      <div className="row">
        <Seg value={kind} onChange={setKind} label="Type" options={[{ v: 'all', l: 'All' }, { v: 'bottle', l: 'Bottles' }, { v: 'closure', l: 'Closures' }, { v: 'decoration', l: 'Decoration' }]} />
        <Seg value={scope} onChange={setScope} label="Menu" options={[{ v: 'all', l: 'Global and local' }, { v: 'global', l: 'Global' }, { v: 'local', l: 'Local' }]} />
        <input type="text" placeholder="Search name, spec or supplier" value={q} onChange={(e) => setQ(e.target.value)} style={{ minWidth: 240 }} aria-label="Search components" />
        <span className="muted small">{rows.length} parts</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected || creating ? '1fr 360px' : '1fr', gap: 16, alignItems: 'start' }}>
        <div className="panel" style={{ overflow: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
          <table className="data">
            <thead>
              <tr>
                <th>Part</th>
                <th>Menu</th>
                <th>Specification</th>
                <th className="r">Unit cost</th>
                <th className="r">Lead time</th>
                <th>Tooling</th>
                <th>Supplier</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className={c.id === sel ? 'sel' : ''} onClick={() => { setSel(c.id); setCreating(false); }} style={{ cursor: 'pointer' }}>
                  <td><b style={{ fontWeight: 500 }}>{c.name}</b></td>
                  <td><span className={`tag ${c.scope}`}>{c.scope}</span> <span className="small muted">{c.markets.filter((m) => m !== 'global').join(' ')}</span></td>
                  <td className="small muted">{spec(c)}</td>
                  <td className="r num">{c.kind === 'decoration' ? `$${c.costPer1000Cm2.toFixed(3)}/1000 cm²` : `$${c.unitCostUsd.toFixed(3)}`}</td>
                  <td className="r num">{c.leadTimeWeeks} wk</td>
                  <td className="small">{c.owned ? 'Owned' : c.toolingUsd ? `New: $${(c.toolingUsd / 1000).toFixed(0)}k` : 'Supplier stock'}</td>
                  <td className="small muted">{c.supplier.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty">No parts match. Clear the search or change the filters.</div>}
        </div>

        {selected && <Editor key={selected.id} c={selected} marketIds={markets.map((m) => m.id)} onSave={(c) => { upsert(c); toast('Part saved'); }} onDelete={() => { remove(selected.id); setSel(null); toast('Part deleted'); }} />}
        {creating && <NewBottle marketIds={markets.map((m) => m.id)} onCreate={(b) => { upsert(b); setCreating(false); setSel(b.id); toast('Bottle added to the library'); }} onCancel={() => setCreating(false)} />}
      </div>
    </div>
  );
}

function Editor({ c, marketIds, onSave, onDelete }: { c: Component; marketIds: MarketId[]; onSave: (c: Component) => void; onDelete: () => void }) {
  const [d, setD] = useState<Component>(c);
  const num = (k: string, label: string, step = 1) => (
    <Field label={label}>
      <input type="number" step={step} value={(d as unknown as Record<string, number>)[k]} onChange={(e) => setD({ ...d, [k]: +e.target.value } as Component)} />
    </Field>
  );
  return (
    <aside className="panel panel-pad stack" aria-label="Edit part">
      <h2 style={{ margin: 0 }}>{c.name}</h2>
      {c.notes && <p className="small muted">{c.notes}</p>}
      <Field label="Name"><input type="text" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
      <div className="grid2" style={{ gap: 8 }}>
        <Field label="Menu">
          <select value={d.scope} onChange={(e) => setD({ ...d, scope: e.target.value as 'global' | 'local' })}>
            <option value="global">Global</option>
            <option value="local">Local</option>
          </select>
        </Field>
        {d.kind === 'decoration' ? num('costPer1000Cm2', 'USD per 1000 cm²', 0.001) : num('unitCostUsd', 'Unit cost (USD)', 0.001)}
        {num('moq', 'MOQ (units)', 1000)}
        {num('leadTimeWeeks', 'Lead time (weeks)')}
        {num('toolingUsd', 'Tooling if new (USD)', 500)}
        {d.kind !== 'decoration' && num('grams', 'Weight (g)', 0.1)}
        {d.kind === 'bottle' && (
          <>
            {num('volumeMl', 'Volume (ml)')}
            {num('heightMm', 'Height (mm)')}
            {num('widthMm', 'Width (mm)')}
            {num('depthMm', 'Depth (mm)')}
          </>
        )}
        {d.kind === 'closure' && (
          <>
            {num('diameterMm', 'Diameter (mm)')}
            {num('heightMm', 'Height (mm)')}
          </>
        )}
      </div>
      <label className="row small"><input type="checkbox" checked={d.owned} onChange={(e) => setD({ ...d, owned: e.target.checked })} /> Tooling already owned</label>
      <Field label="Approved markets">
        <div className="row">
          {marketIds.map((m) => (
            <label key={m} className="row small" style={{ gap: 4 }}>
              <input type="checkbox" checked={d.markets.includes(m)} onChange={(e) => setD({ ...d, markets: e.target.checked ? [...d.markets, m] : d.markets.filter((x) => x !== m) })} />
              {m}
            </label>
          ))}
        </div>
      </Field>
      <Field label="Supplier"><input type="text" value={d.supplier.name} onChange={(e) => setD({ ...d, supplier: { ...d.supplier, name: e.target.value } })} /></Field>
      <Field label="CAD reference (STEP or glTF file name)">
        <input type="file" accept=".step,.stp,.gltf,.glb,.obj" onChange={(e) => { const f = e.target.files?.[0]; if (f) setD({ ...d, notes: `${d.notes ? d.notes + ' ' : ''}CAD: ${f.name}` }); }} />
      </Field>
      <div className="row">
        <button className="btn primary" type="button" onClick={() => onSave(d)}>Save part</button>
        <button className="btn" type="button" onClick={onDelete}>Delete</button>
      </div>
    </aside>
  );
}

function NewBottle({ marketIds, onCreate, onCancel }: { marketIds: MarketId[]; onCreate: (b: BottleSpec) => void; onCancel: () => void }) {
  const [family, setFamily] = useState<BottleFamily>('oval');
  const [resin, setResin] = useState<Resin>('HDPE');
  const [vol, setVol] = useState(300);
  const [neck, setNeck] = useState('24/410');
  const [scope, setScope] = useState<'global' | 'local'>('local');
  const [market, setMarket] = useState<MarketId>('IN');
  const [name, setName] = useState('');

  // Size the envelope from the volume using the platform oval's proportions.
  const k = Math.cbrt(vol / 400);
  const dims = {
    oval: [72, 46, 205], cylinder: [58, 58, 190], flask: [68, 40, 178], tottle: [62, 40, 165], tube: [50, 50, 175],
  }[family].map((x) => Math.round(x * k));
  const grams = +(27 * Math.pow(vol / 400, 2 / 3) * (resin === 'PET' ? 0.85 : 1)).toFixed(1);
  const cost = +(grams / 1000 * 1.35 + 0.025).toFixed(3);

  return (
    <aside className="panel panel-pad stack" aria-label="New bottle">
      <h2 style={{ margin: 0 }}>New bottle shape</h2>
      <p className="small muted">Starts from a family and volume; refine the silhouette in the Playroom. Dimensions are a first estimate for the mould maker.</p>
      <Field label="Name"><input type="text" value={name} placeholder={`${family} ${vol} ml`} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="grid2" style={{ gap: 8 }}>
        <Field label="Family">
          <select value={family} onChange={(e) => setFamily(e.target.value as BottleFamily)}>
            {['oval', 'cylinder', 'flask', 'tottle', 'tube'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Resin">
          <select value={resin} onChange={(e) => setResin(e.target.value as Resin)}>
            {['HDPE', 'PET', 'PP', 'LDPE'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Volume (ml)"><input type="number" value={vol} min={30} max={1500} onChange={(e) => setVol(+e.target.value)} /></Field>
        <Field label="Neck finish">
          <select value={neck} onChange={(e) => setNeck(e.target.value)}>
            {['20/410', '24/410', '28/410', '28mm valve', 'tube 35mm'].map((f) => <option key={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Menu">
          <select value={scope} onChange={(e) => setScope(e.target.value as 'global' | 'local')}>
            <option value="global">Global</option>
            <option value="local">Local</option>
          </select>
        </Field>
        {scope === 'local' && (
          <Field label="Market">
            <select value={market} onChange={(e) => setMarket(e.target.value as MarketId)}>
              {marketIds.filter((m) => m !== 'global').map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
        )}
      </div>
      <p className="small">Estimate: {dims[0]}×{dims[1]}×{dims[2]} mm, {grams} g, about ${cost} per unit, new mould about $45k.</p>
      <div className="row">
        <button
          className="btn primary"
          type="button"
          onClick={() =>
            onCreate({
              id: uid('b'), kind: 'bottle', name: name || `${family[0].toUpperCase()}${family.slice(1)} ${vol} ml`, family, resin, scope,
              markets: scope === 'global' ? ['global', ...marketIds.filter((m) => m !== 'global')] : [market],
              supplier: { name: 'To be sourced', region: '' }, volumeMl: vol, widthMm: dims[0], depthMm: dims[1], heightMm: dims[2],
              shoulder: family === 'flask' ? 0.75 : 0.5, waist: family === 'oval' ? 0.04 : 0, neckFinish: neck, grams,
              process: resin === 'PET' ? 'ISBM' : family === 'tube' ? 'Extruded tube' : 'EBM', unitCostUsd: cost, moq: 200000,
              leadTimeWeeks: 10, toolingUsd: 45000, owned: false, notes: 'Created in Pack Playroom; not yet engineered.',
            })
          }
        >
          Add to library
        </button>
        <button className="btn" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </aside>
  );
}
