import { useEffect, useMemo, useRef } from 'react';
import { useStore } from '../store';
import { useCoachContext } from '../hooks';
import { resolvePack } from '../domain/resolve';
import { PackModel, packTotalHeight, visualFromPack } from './PackModel';
import { Studio, type SnapshotFn } from './Studio';

/** Renders a thumbnail, off screen, for any design that does not have one yet. */
export function ThumbRenderer() {
  const designs = useStore((s) => s.designs);
  const update = useStore((s) => s.updateDesign);
  const ctx = useCoachContext();
  const next = designs.find((d) => !d.thumbnail);
  const snap = useRef<SnapshotFn | null>(null);
  const visual = useMemo(() => (next ? visualFromPack(resolvePack(next, ctx)) : null), [next, ctx]);

  useEffect(() => {
    if (!next) return;
    const id = next.id;
    const t = window.setTimeout(() => {
      const img = snap.current?.(320);
      if (img) update(id, { thumbnail: img });
    }, 1800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [next?.id]);

  if (!next || !visual) return null;
  const h = packTotalHeight(visual);
  return (
    <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, width: 360, height: 360, pointerEvents: 'none' }}>
      <Studio key={next.id} camera={[0.9, h * 0.007, h * 0.026 + 1.2]} target={[0, h * 0.0048, 0]} onSnapshotReady={(fn) => (snap.current = fn)}>
        <PackModel v={visual} />
      </Studio>
    </div>
  );
}
