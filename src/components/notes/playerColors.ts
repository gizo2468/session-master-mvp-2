// Player color tag constants for opponent notes

export interface PlayerColor {
  id: string;
  label: string;
  hex: string;
  border?: string;
}

// All available colors including hidden default (white)
export const PLAYER_COLORS: PlayerColor[] = [
  { id: 'white', label: 'White', hex: '#FFFFFF', border: '#D1D5DB' },
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'yellow', label: 'Yellow', hex: '#FFD700' },
  { id: 'neongreen', label: 'Neon Green', hex: '#39FF14' },
  { id: 'olivegreen', label: 'Olive Green', hex: '#808000' },
  { id: 'lightblue', label: 'Light Blue', hex: '#87CEEB' },
  { id: 'darkblue', label: 'Light Dark-Blue', hex: '#4169E1' },
  { id: 'brown', label: 'Brown', hex: '#8B4513' },
  { id: 'purple', label: 'Purple', hex: '#A855F7' },
  { id: 'lightpink', label: 'Light Pink', hex: '#FFB6C1' },
];

// Selectable colors (excludes white) - arranged in 2 rows of 5
// Row 1: Red, Orange, Yellow, Neon Green, Olive Green
// Row 2: Light Blue, Light Dark-Blue, Brown, Purple, Light Pink
export const SELECTABLE_COLORS: PlayerColor[] = [
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'orange', label: 'Orange', hex: '#F97316' },
  { id: 'yellow', label: 'Yellow', hex: '#FFD700' },
  { id: 'neongreen', label: 'Neon Green', hex: '#39FF14' },
  { id: 'olivegreen', label: 'Olive Green', hex: '#808000' },
  { id: 'lightblue', label: 'Light Blue', hex: '#87CEEB' },
  { id: 'darkblue', label: 'Light Dark-Blue', hex: '#4169E1' },
  { id: 'brown', label: 'Brown', hex: '#8B4513' },
  { id: 'purple', label: 'Purple', hex: '#A855F7' },
  { id: 'lightpink', label: 'Light Pink', hex: '#FFB6C1' },
];

export type PlayerColorId = string;

// White is the hidden default when no color is selected
export const DEFAULT_COLOR: PlayerColorId = 'white';

export function getColorById(id: string | undefined | null): PlayerColor {
  return PLAYER_COLORS.find(c => c.id === id) || PLAYER_COLORS.find(c => c.id === DEFAULT_COLOR)!;
}
