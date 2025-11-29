// Player color tag constants for opponent notes

export interface PlayerColor {
  id: string;
  label: string;
  hex: string;
  border?: string;
}

export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'white', label: 'White', hex: '#FFFFFF', border: '#D1D5DB' },
  { id: 'brown', label: 'Brown', hex: '#8B4513' },
  { id: 'lightblue', label: 'Light Blue', hex: '#87CEEB' },
  { id: 'yellow', label: 'Yellow', hex: '#FFD700' },
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'purple', label: 'Purple', hex: '#A855F7' },
  { id: 'neongreen', label: 'Neon Green', hex: '#39FF14' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'lightpink', label: 'Light Pink', hex: '#FFB6C1' },
];

export type PlayerColorId = string;

export const DEFAULT_COLOR: PlayerColorId = 'yellow';

export function getColorById(id: string | undefined | null): PlayerColor {
  return PLAYER_COLORS.find(c => c.id === id) || PLAYER_COLORS.find(c => c.id === DEFAULT_COLOR)!;
}
