import * as z from 'zod';

// Updated schema to make only Cards required
export const handFormSchema = z.object({
  cards: z.string().min(2, 'Select at least 1 card').max(12, 'Maximum 6 cards'),
  bigBlind: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive().finite().optional()
  ),
  position: z.string().optional(),
  action: z.string().optional(),
  notes: z.string().max(1000, 'Notes are too long').optional(),
  pokercraftLink: z.string().url('Invalid URL format').optional().or(z.literal('')),
  image: z.string().optional().or(z.any().optional()),
  gameType: z.enum(['NLH', 'PLO']).default('NLH'),
  tableId: z.string().optional(),
  // Premium hand detail fields - updated for card slot structure
  flopCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }, { id: 1 }, { id: 2 }]),
  flopAction: z.string().optional(),
  turnCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }]),
  turnAction: z.string().optional(),
  riverCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([{ id: 0 }]),
  riverAction: z.string().optional(),
  villainCards: z.array(z.object({
    id: z.number(),
    rank: z.string().optional(),
    suit: z.string().optional(),
  })).default([]),
  villainBigBlind: z.preprocess(
    (val) => {
      if (val === '' || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().positive().finite().optional()
  ),
  villainPosition: z.string().optional(),
  result: z.string().optional(),
});

export type FormValues = z.infer<typeof handFormSchema>;

// Position options - updated to follow standard poker table order
export const positions = ['UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

export const actionTypes = [
  { label: 'Open / Flat', value: 'Open / Flat' },
  { label: '3Bet', value: '3Bet' },
  { label: '4Bet', value: '4Bet' },
  { label: 'BvB', value: 'BvB' }
];

// Tooltip content definitions
export const tooltipContent = {
  cards: "Select cards by clicking on them in the grid. Click selected cards to remove them. For Hold'em, select exactly 2 cards. For Omaha, select 4-6 cards.",
  image: "Upload an image of your hand from the table. Common formats like JPG, PNG and WEBP are accepted. Maximum file size is 5MB.",
  videoLink: "Paste a link to a video of your hand from YouTube, Twitch, or a hand replay from a poker site like PokerCraft.",
  position: "Your position at the table relative to the dealer button. This affects your strategic options and expected ranges.",
  action: "The type of betting action you took with this hand. Open/Flat means opening the pot or calling. 3Bet means raising a previous raise."
};

// Helper function to get all used cards
export const getAllUsedCards = (
  flopCards: any[],
  turnCards: any[],
  riverCards: any[],
  villainCards: any[]
): string[] => {
  const usedCards: string[] = [];
  
  // Add flop cards
  if (flopCards) {
    const flopCardsArray = flopCards.filter(c => c.rank && c.suit).map(c => c.rank + c.suit);
    usedCards.push(...flopCardsArray);
  }
  
  // Add turn cards
  if (turnCards) {
    const turnCardsArray = turnCards.filter(c => c.rank && c.suit).map(c => c.rank + c.suit);
    usedCards.push(...turnCardsArray);
  }
  
  // Add river cards
  if (riverCards) {
    const riverCardsArray = riverCards.filter(c => c.rank && c.suit).map(c => c.rank + c.suit);
    usedCards.push(...riverCardsArray);
  }
  
  // Add villain cards
  if (villainCards) {
    const villainCardsArray = villainCards.filter(c => c.rank && c.suit).map(c => c.rank + c.suit);
    usedCards.push(...villainCardsArray);
  }
  
  return usedCards;
};

// Helper to get excluded cards for main card selector (excludes all other cards except own)
export const getExcludedCardsForMain = (
  flopCards: any[],
  turnCards: any[],
  riverCards: any[],
  villainCards: any[]
): string[] => {
  return getAllUsedCards(flopCards, turnCards, riverCards, villainCards);
};

// Determine max cards based on game type
export const getMaxCards = (gameType: string): number => {
  if (gameType === 'NLH') return 2;
  if (gameType === 'PLO') return 6;
  return 6;
};