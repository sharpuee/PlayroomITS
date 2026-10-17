import type { BottleFamily } from '../domain/types';

export interface RetailFormat {
  id: string;
  name: string;
  kind: 'shelf' | 'ecom';
  shelves: number;
  bayWidthMm: number;
  shelfDepthMm: number;
  shelfGapMm: number;
  crowding: number; // 0..1 how tightly packed
  light: { warmth: number; intensity: number };
  viewDistanceM: number;
  note: string;
  stripColor: string;
  fixtureColor: string;
  floorColor: string;
}

export const RETAIL_FORMATS: RetailFormat[] = [
  {
    id: 'hyper', name: 'Hypermarket gondola', kind: 'shelf', shelves: 5, bayWidthMm: 1250, shelfDepthMm: 420, shelfGapMm: 330,
    crowding: 0.85, light: { warmth: 0.45, intensity: 1.0 }, viewDistanceM: 2.5,
    note: 'Long bays, strong brand blocks, shopper scans at 2 to 3 m.', stripColor: '#F2D23A', fixtureColor: '#D9DDE0', floorColor: '#CFC8BC',
  },
  {
    id: 'mass', name: 'US mass retail aisle', kind: 'shelf', shelves: 6, bayWidthMm: 1220, shelfDepthMm: 460, shelfGapMm: 310,
    crowding: 0.95, light: { warmth: 0.3, intensity: 1.1 }, viewDistanceM: 1.8,
    note: 'Many facings and price tags; findability of the variant matters most.', stripColor: '#FFFFFF', fixtureColor: '#E6E8EA', floorColor: '#D8D4CC',
  },
  {
    id: 'pharmacy', name: 'Pharmacy and beauty', kind: 'shelf', shelves: 4, bayWidthMm: 1000, shelfDepthMm: 330, shelfGapMm: 330,
    crowding: 0.6, light: { warmth: 0.7, intensity: 0.95 }, viewDistanceM: 1.2,
    note: 'Premium neighbours, closer viewing, warmer light.', stripColor: '#EDE7DD', fixtureColor: '#F4F1EC', floorColor: '#BFB4A6',
  },
  {
    id: 'kirana', name: 'General trade / kirana', kind: 'shelf', shelves: 3, bayWidthMm: 900, shelfDepthMm: 300, shelfGapMm: 300,
    crowding: 1.0, light: { warmth: 0.8, intensity: 0.75 }, viewDistanceM: 1.5,
    note: 'Crowded wooden shelves, dim light, shopkeeper hands it over; recognition at a glance.', stripColor: '#B5835A', fixtureColor: '#9C6B45', floorColor: '#8E8478',
  },
  {
    id: 'ecom', name: 'E-commerce / quick commerce', kind: 'ecom', shelves: 0, bayWidthMm: 0, shelfDepthMm: 0, shelfGapMm: 0,
    crowding: 0, light: { warmth: 0.5, intensity: 1 }, viewDistanceM: 0.35,
    note: 'Search results on a phone; the pack is a 120 px thumbnail.', stripColor: '#FFFFFF', fixtureColor: '#FFFFFF', floorColor: '#FFFFFF',
  },
];

export interface CompetitorPack {
  name: string;
  family: BottleFamily;
  bottle: string;
  cap: string;
  label: string;
  ink: string;
  heightMm: number;
  widthMm: number;
  depthMm: number;
  pump?: boolean;
}

// Fictional competitor set used as the shelf context; replace with scans of real category packs.
export const COMPETITORS: CompetitorPack[] = [
  { name: 'Nuvelle', family: 'oval', bottle: '#E9E4F2', cap: '#7A5DB5', label: '#E9E4F2', ink: '#3E2B6F', heightMm: 210, widthMm: 74, depthMm: 46 },
  { name: 'Aquaroot', family: 'oval', bottle: '#1F9D8B', cap: '#FFFFFF', label: '#FFFFFF', ink: '#0F5C52', heightMm: 205, widthMm: 72, depthMm: 46 },
  { name: 'Velaire', family: 'cylinder', bottle: '#111111', cap: '#B89B5E', label: '#111111', ink: '#B89B5E', heightMm: 195, widthMm: 58, depthMm: 58, pump: false },
  { name: 'Hairology', family: 'oval', bottle: '#F7F7F2', cap: '#E2462F', label: '#F7F7F2', ink: '#E2462F', heightMm: 215, widthMm: 76, depthMm: 48 },
  { name: 'Silkora', family: 'flask', bottle: '#F2C6D0', cap: '#FFFFFF', label: '#F2C6D0', ink: '#7A2E45', heightMm: 180, widthMm: 68, depthMm: 40 },
  { name: 'Clarix', family: 'oval', bottle: '#2F5DA8', cap: '#2F5DA8', label: '#FFFFFF', ink: '#2F5DA8', heightMm: 205, widthMm: 72, depthMm: 46 },
  { name: 'Botanee', family: 'cylinder', bottle: '#8DB36B', cap: '#4C6B33', label: '#F0F2E6', ink: '#4C6B33', heightMm: 190, widthMm: 58, depthMm: 58, pump: true },
  { name: 'Orvé', family: 'oval', bottle: '#F4E3B8', cap: '#C08A2B', label: '#F4E3B8', ink: '#6A4A12', heightMm: 238, widthMm: 84, depthMm: 54, pump: true },
];
