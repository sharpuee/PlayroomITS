import { useRef } from 'react';
import { useStore } from '../store';
import type { BottleFamily, Brand, Market } from '../domain/types';
import { ColorField, Field, download, toast } from '../ui/kit';

const FAMILIES: BottleFamily[] = ['oval', 'cylinder', 'flask', 'tottle', 'tube'];

export default function Settings() {
  const s = useStore();
  const file = useRef<HTMLInputElement>(null);

  const exportAll = () => {
    const { userName, components, brands, markets, lines, designs, activeId, deviations } = useStore.getState();
    download(`pack-playroom-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ userName, components, brands, markets, lines, designs, activeId, deviations }, null, 2), 'application/json');
  };

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Settings and data</h1>
          <p>Brands, market assumptions and your saved work. Everything is stored in this browser; export a file to share it or move it to another machine.</p>
        </div>
      </div>

      <section className="panel panel-pad stack">
        <h2 style={{ margin: 0 }}>Your work</h2>
        <div className="row">
          <Field label="Your name (shown on gate decisions)"><input type="text" value={s.userName} onChange={(e) => s.setUserName(e.target.value)} /></Field>
        </div>
        <div className="row">
          <button className="btn primary" type="button" onClick={exportAll}>Export all data</button>
          <button className="btn" type="button" onClick={() => file.current?.click()}>Import data file</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { s.importState(await f.text()); toast('Data imported'); } catch (err) { toast((err as Error).message || 'Import failed: the file is not valid JSON.'); }
            e.target.value = '';
          }} />
          <button className="btn" type="button" onClick={() => { if (confirm('Replace all your work with the demo data? Export first if you want to keep it.')) { s.reset(); toast('Demo data restored'); } }}>Reset to demo data</button>
        </div>
      </section>

      <section className="panel panel-pad stack">
        <h2 style={{ margin: 0 }}>Brands and locked codes</h2>
        <p className="small muted">The Coach checks every design against these. Demo brands are fictional; rename them to yours.</p>
        <div className="grid3">
          {s.brands.map((b) => <BrandEditor key={b.id} b={b} onChange={s.updateBrand} />)}
        </div>
      </section>

      <section className="panel panel-pad">
        <h2>Market assumptions</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>Planning values, not live prices. Update them from procurement and regulatory.</p>
        <div style={{ overflow: 'auto' }}>
          <table className="data">
            <thead><tr><th>Market</th><th className="r">FX per USD</th><th className="r">HDPE $/kg</th><th className="r">PET $/kg</th><th className="r">PP $/kg</th><th className="r">PCR supply %</th><th className="r">Legal copy cm²</th><th>Size ladder (ml)</th></tr></thead>
            <tbody>
              {s.markets.map((m) => <MarketRow key={m.id} m={m} onChange={s.updateMarket} />)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function BrandEditor({ b, onChange }: { b: Brand; onChange: (b: Brand) => void }) {
  return (
    <div className="stack" style={{ border: '1px solid var(--rule-2)', borderRadius: 'var(--r-md)', padding: 12 }}>
      <Field label="Brand name"><input type="text" value={b.name} onChange={(e) => onChange({ ...b, name: e.target.value })} /></Field>
      <Field label="Word mark on pack"><input type="text" value={b.logoText} onChange={(e) => onChange({ ...b, logoText: e.target.value })} /></Field>
      <Field label="Price tier">
        <select value={b.tier} onChange={(e) => onChange({ ...b, tier: e.target.value as Brand['tier'] })}>
          <option value="value">Value</option><option value="mainstream">Mainstream</option><option value="premium">Premium</option>
        </select>
      </Field>
      {b.palette.map((c, i) => (
        <ColorField key={i} label={i === 0 ? 'Primary brand colour' : `Brand colour ${i + 1}`} value={c} onChange={(v) => onChange({ ...b, palette: b.palette.map((x, j) => (j === i ? v : x)) })} />
      ))}
      <Field label="Locked bottle families">
        <div className="row">
          {FAMILIES.map((f) => (
            <label key={f} className="row small" style={{ gap: 4 }}>
              <input type="checkbox" checked={b.lockedFamilies.includes(f)} onChange={(e) => onChange({ ...b, lockedFamilies: e.target.checked ? [...b.lockedFamilies, f] : b.lockedFamilies.filter((x) => x !== f) })} />
              {f}
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}

function MarketRow({ m, onChange }: { m: Market; onChange: (m: Market) => void }) {
  const n = (v: number, set: (v: number) => void, label: string) => <input className="cl-input" type="number" step="any" value={v} onChange={(e) => set(+e.target.value)} aria-label={label} />;
  return (
    <tr>
      <td>{m.name} <span className="muted small">{m.currency}</span></td>
      <td className="r">{n(m.fxPerUsd, (v) => onChange({ ...m, fxPerUsd: v }), `${m.name} FX`)}</td>
      <td className="r">{n(m.resinUsdPerKg.HDPE, (v) => onChange({ ...m, resinUsdPerKg: { ...m.resinUsdPerKg, HDPE: v } }), `${m.name} HDPE`)}</td>
      <td className="r">{n(m.resinUsdPerKg.PET, (v) => onChange({ ...m, resinUsdPerKg: { ...m.resinUsdPerKg, PET: v } }), `${m.name} PET`)}</td>
      <td className="r">{n(m.resinUsdPerKg.PP, (v) => onChange({ ...m, resinUsdPerKg: { ...m.resinUsdPerKg, PP: v } }), `${m.name} PP`)}</td>
      <td className="r">{n(m.pcrAvailable, (v) => onChange({ ...m, pcrAvailable: v }), `${m.name} PCR`)}</td>
      <td className="r">{n(m.mandatoryTextCm2, (v) => onChange({ ...m, mandatoryTextCm2: v }), `${m.name} legal copy`)}</td>
      <td><input type="text" value={m.sizeLadderMl.join(', ')} onChange={(e) => onChange({ ...m, sizeLadderMl: e.target.value.split(',').map((x) => +x.trim()).filter((x) => x > 0) })} aria-label={`${m.name} size ladder`} /></td>
    </tr>
  );
}
