import type { Component, MarketId } from './types';
import type { MenuMode } from '../store';

const inMarket = (c: Component, market: MarketId) => market === 'global' || c.markets.includes(market);

/** Whether a component is on the menu for a market under the current menu mode. */
export function onMenu(c: Component, market: MarketId, mode: MenuMode): boolean {
  if (!inMarket(c, market)) return false;
  if (mode === 'global') return c.scope === 'global';
  if (mode === 'local') return c.scope === 'local';
  return true;
}

export function menuReason(c: Component, market: MarketId, mode: MenuMode): string | null {
  if (onMenu(c, market, mode)) return null;
  if (!inMarket(c, market)) return `Not approved for this market.`;
  if (mode === 'global') return 'Local part: switch the menu to Mix or Local.';
  return 'Global part: switch the menu to Mix or Global.';
}
