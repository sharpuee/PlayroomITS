import { useEffect, useState, type ReactNode } from 'react';
import type { Verdict } from '../domain/types';

export function Field({ label, value, children }: { label: string; value?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span>
        {label}
        {value !== undefined && <b>{value}</b>}
      </span>
      {children}
    </label>
  );
}

export function Slider({ label, value, min, max, step = 1, onChange, fmt }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; fmt?: (v: number) => string }) {
  return (
    <Field label={label} value={fmt ? fmt(value) : value}>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
    </Field>
  );
}

export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: { v: T; l: string }[]; onChange: (v: T) => void; label?: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.v} type="button" aria-pressed={o.v === value} onClick={() => onChange(o.v)}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function ColorField({ label, value, onChange, swatches = [] }: { label: string; value: string; onChange: (v: string) => void; swatches?: string[] }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="field">
      <span>{label}</span>
      <div className="colorfield">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          aria-label={`${label} hex`}
        />
        {swatches.length > 0 && (
          <div className="swatches">
            {swatches.map((s) => (
              <button key={s} type="button" style={{ background: s }} title={s} aria-label={`Use ${s}`} onClick={() => onChange(s)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function VerdictBadge({ v, children }: { v: Verdict; children?: ReactNode }) {
  const t = { green: 'Runs as is', amber: 'Needs change parts', red: 'Cannot run' }[v];
  return <span className={`verdict ${v}`}>{children ?? t}</span>;
}

export function scoreColor(s: number) {
  return s >= 75 ? 'var(--green)' : s >= 55 ? 'var(--amber)' : 'var(--red)';
}

export function ScoreRing({ score, size = 72, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="score-ring" style={{ width: size, height: size }} title={label ?? `Pack Score ${score}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rule-2)" strokeWidth="6" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor(score)} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${(c * score) / 100} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <b style={{ fontSize: size * 0.32 }}>{score}</b>
    </div>
  );
}

let toastTimer: number | undefined;
export function toast(msg: string) {
  let el = document.querySelector('.toast') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.display = 'block';
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    if (el) el.style.display = 'none';
  }, 2400);
}

export function download(name: string, text: string, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const Icon = {
  library: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="5" height="16" rx="1.5" /><rect x="10" y="4" width="5" height="16" rx="1.5" /><path d="M17.5 5.5l3 14" /></svg>,
  playroom: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="2.5" width="6" height="4" rx="1" /><path d="M8 6.5h8l1.5 3V20a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 20V9.5z" /><path d="M6.5 12h11" /></svg>,
  coach: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 18.5 12 15.6 7 18.5l1.4-5.7L4 9l5.8-.7z" /></svg>,
  menus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z" /></svg>,
  shelf: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 8h18M3 15h18M3 21h18M4 3v18M20 3v18" /><rect x="7" y="10" width="3" height="5" /><rect x="12" y="4" width="3" height="4" /></svg>,
  production: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 21V10l5 3V10l5 3V6l8 4v11z" /><path d="M7 17h2M12 17h2M17 17h2" /></svg>,
  gates: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="1.8" fill="currentColor" /><circle cx="14" cy="12" r="1.8" fill="currentColor" /><circle cx="18" cy="18" r="1.8" fill="currentColor" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" /></svg>,
};

/** Reads an image file, scales it down and returns a JPEG data URL small enough for browser storage. */
export function readImage(file: File, maxPx = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file (JPG, PNG or WebP).'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxPx / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      const ctx = c.getContext('2d');
      if (!ctx) return reject(new Error('Could not read the image.'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => reject(new Error('Could not read the image.'));
    img.src = url;
  });
}

export function PhotoField({ label, value, onChange, hint }: { label: string; value?: string; onChange: (v: string | undefined) => void; hint?: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      {value && <img src={value} alt={label} style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain', borderRadius: 6, border: '1px solid var(--rule)', background: '#fff' }} />}
      <div className="row">
        <label className="btn small" style={{ cursor: 'pointer' }}>
          {value ? 'Replace photo' : 'Upload photo'}
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            try { onChange(await readImage(f)); toast('Photo added'); } catch (err) { toast((err as Error).message); }
          }} />
        </label>
        {value && <button className="btn small ghost" type="button" onClick={() => onChange(undefined)}>Remove</button>}
      </div>
      {hint && !value && <small className="muted" style={{ fontSize: 11 }}>{hint}</small>}
    </div>
  );
}
