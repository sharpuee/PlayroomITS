import { useEffect, useMemo, useState } from 'react';
import { coach, type CoachContext, type CoachReport } from './domain/coach';
import type { PackDesign } from './domain/types';
import { useCatalog } from './store';

export function useHashRoute(): [string, (r: string) => void] {
  const read = () => (window.location.hash.replace(/^#\/?/, '') || 'playroom').split('?')[0];
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return [route, (r: string) => (window.location.hash = `/${r}`)];
}

export function useCoachContext(): CoachContext {
  const { components, brands, markets, designs, lines } = useCatalog();
  return useMemo(() => ({ components, brands, markets, designs, lines }), [components, brands, markets, designs, lines]);
}

export function useReport(design: PackDesign | undefined): CoachReport | undefined {
  const ctx = useCoachContext();
  return useMemo(() => (design ? coach(design, ctx) : undefined), [design, ctx]);
}
