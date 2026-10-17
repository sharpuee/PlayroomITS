import { lazy, Suspense } from 'react';
import { useHashRoute } from './hooks';
import { useStore } from './store';
import { Icon, Seg } from './ui/kit';
import type { MarketId } from './domain/types';

const Library = lazy(() => import('./pages/Library'));
const Playroom = lazy(() => import('./pages/Playroom'));
const Coach = lazy(() => import('./pages/Coach'));
const Menus = lazy(() => import('./pages/Menus'));
const Shelf = lazy(() => import('./pages/Shelf'));
const Production = lazy(() => import('./pages/Production'));
const Gates = lazy(() => import('./pages/Gates'));
const Settings = lazy(() => import('./pages/Settings'));
const ThumbRenderer = lazy(() => import('./three/ThumbRenderer').then((m) => ({ default: m.ThumbRenderer })));

const NAV: { group: string; items: { id: string; label: string; icon: keyof typeof Icon }[] }[] = [
  { group: 'Design', items: [
    { id: 'library', label: 'Component library', icon: 'library' },
    { id: 'playroom', label: 'Playroom', icon: 'playroom' },
    { id: 'coach', label: 'Design Coach', icon: 'coach' },
    { id: 'menus', label: 'Global and local', icon: 'menus' },
  ] },
  { group: 'Prove', items: [{ id: 'shelf', label: 'Shelf simulator', icon: 'shelf' }] },
  { group: 'Make', items: [{ id: 'production', label: 'Production backtrack', icon: 'production' }] },
  { group: 'Decide', items: [{ id: 'gates', label: 'Stage gates', icon: 'gates' }] },
];

const PAGES: Record<string, React.ComponentType> = { library: Library, playroom: Playroom, coach: Coach, menus: Menus, shelf: Shelf, production: Production, gates: Gates, settings: Settings };

export function App() {
  const [route] = useHashRoute();
  const Page = PAGES[route] ?? Playroom;
  const designs = useStore((s) => s.designs);
  const activeId = useStore((s) => s.activeId);
  const setActive = useStore((s) => s.setActive);
  const active = designs.find((d) => d.id === activeId) ?? designs[0];
  const updateDesign = useStore((s) => s.updateDesign);
  const markets = useStore((s) => s.markets);
  const menuMode = useStore((s) => s.menuMode);
  const setMenuMode = useStore((s) => s.setMenuMode);

  return (
    <div className="shell">
      <nav className="rail" aria-label="Modules">
        <a className="brandmark" href="#/playroom">
          <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden><rect x="10" y="3" width="12" height="6" rx="2" fill="#fff" /><rect x="7" y="9" width="18" height="21" rx="6" fill="#8b74f0" /></svg>
          <b>Pack Playroom</b>
        </a>
        {NAV.map((g) => (
          <div className="rail-group" key={g.group}>
            <span>{g.group}</span>
            {g.items.map((it) => (
              <a key={it.id} className="nav" href={`#/${it.id}`} aria-current={route === it.id ? 'page' : undefined} title={it.label}>
                {Icon[it.icon]}
                <span className="lbl">{it.label}</span>
              </a>
            ))}
          </div>
        ))}
        <div className="rail-group">
          <a className="nav" href="#/settings" aria-current={route === 'settings' ? 'page' : undefined} title="Settings and data">
            {Icon.settings}
            <span className="lbl">Settings and data</span>
          </a>
        </div>
        <p className="foot">Demo data is fictional. Your work is saved in this browser.</p>
      </nav>
      <div className="main">
        <header className="topbar">
          <label>
            Design
            <select value={activeId} onChange={(e) => setActive(e.target.value)} aria-label="Active design" style={{ maxWidth: 320 }}>
              {designs.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
          <label>
            Market
            <select value={active?.market ?? 'global'} onChange={(e) => active && updateDesign(active.id, { market: e.target.value as MarketId })} aria-label="Market for this design">
              {markets.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <span className="grow" />
          <label>
            Menu
            <Seg
              label="Component menu"
              value={menuMode}
              onChange={setMenuMode}
              options={[{ v: 'global', l: 'Global' }, { v: 'mix', l: 'Mix' }, { v: 'local', l: 'Local' }]}
            />
          </label>
        </header>
        <main className="content">
          <Suspense fallback={<div className="empty">Loading…</div>}>
            <Page />
          </Suspense>
          <Suspense fallback={null}>
            <ThumbRenderer />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
