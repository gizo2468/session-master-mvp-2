// Poker hand evaluation utility for 5-card and 7-card hands

type Card = {
  rank: string;
  suit: string;
  value: number;
};

const RANK_VALUES: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const RANK_NAMES: Record<string, string> = {
  '2': 'Twos', '3': 'Threes', '4': 'Fours', '5': 'Fives', '6': 'Sixes',
  '7': 'Sevens', '8': 'Eights', '9': 'Nines', 'T': 'Tens',
  'J': 'Jacks', 'Q': 'Queens', 'K': 'Kings', 'A': 'Aces'
};

const RANK_NAMES_SINGULAR: Record<string, string> = {
  '2': 'Two', '3': 'Three', '4': 'Four', '5': 'Five', '6': 'Six',
  '7': 'Seven', '8': 'Eight', '9': 'Nine', 'T': 'Ten',
  'J': 'Jack', 'Q': 'Queen', 'K': 'King', 'A': 'Ace'
};

// Parse card notation like "Kh" into a Card object
const parseCard = (cardStr: string): Card | null => {
  if (cardStr.length < 2) return null;
  
  const rank = cardStr[0].toUpperCase();
  const suit = cardStr[1].toLowerCase();
  
  if (!RANK_VALUES[rank]) return null;
  if (!['h', 'd', 's', 'c'].includes(suit)) return null;
  
  return {
    rank,
    suit,
    value: RANK_VALUES[rank]
  };
};

// Count ranks in a hand
const getRankCounts = (cards: Card[]): Map<number, number> => {
  const counts = new Map<number, number>();
  cards.forEach(card => {
    counts.set(card.value, (counts.get(card.value) || 0) + 1);
  });
  return counts;
};

// Check if cards form a flush
const isFlush = (cards: Card[]): boolean => {
  if (cards.length < 5) return false;
  const suits = cards.map(c => c.suit);
  const suitCounts = new Map<string, number>();
  suits.forEach(suit => {
    suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1);
  });
  return Math.max(...Array.from(suitCounts.values())) >= 5;
};

// Check if cards form a straight
const isStraight = (cards: Card[]): { isStraight: boolean; highCard: number } => {
  if (cards.length < 5) return { isStraight: false, highCard: 0 };
  
  const uniqueValues = Array.from(new Set(cards.map(c => c.value))).sort((a, b) => b - a);
  
  // Check for regular straights
  for (let i = 0; i <= uniqueValues.length - 5; i++) {
    const slice = uniqueValues.slice(i, i + 5);
    const isConsecutive = slice.every((val, idx) => idx === 0 || slice[idx - 1] - val === 1);
    if (isConsecutive) {
      return { isStraight: true, highCard: slice[0] };
    }
  }
  
  // Check for A-2-3-4-5 (wheel)
  if (uniqueValues.includes(14) && uniqueValues.includes(2) && uniqueValues.includes(3) && 
      uniqueValues.includes(4) && uniqueValues.includes(5)) {
    return { isStraight: true, highCard: 5 }; // 5-high straight
  }
  
  return { isStraight: false, highCard: 0 };
};

// Find the best 5-card hand from 5-7 cards
const evaluateBestHand = (cards: Card[]): string => {
  if (cards.length < 5) {
    // Incomplete hand
    if (cards.length === 0) return 'No board - hand incomplete';
    
    const sortedCards = [...cards].sort((a, b) => b.value - a.value);
    const highCard = sortedCards[0];
    return `${RANK_NAMES_SINGULAR[highCard.rank]} high (incomplete hand)`;
  }
  
  // For 7-card hands, we need to check all 21 combinations of 5 cards
  // For simplicity and performance, we'll evaluate the hand as if it's best 5 from 7
  const rankCounts = getRankCounts(cards);
  const sortedCounts = Array.from(rankCounts.entries())
    .sort((a, b) => {
      // Sort by count first, then by rank value
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0] - a[0];
    });
  
  const flush = isFlush(cards);
  const straight = isStraight(cards);
  
  // Check for Royal Flush (A-K-Q-J-T all same suit)
  if (flush && straight.isStraight && straight.highCard === 14) {
    const straightCards = findStraightCards(cards, 14);
    const allSameSuit = straightCards.length === 5 && new Set(straightCards.map(c => c.suit)).size === 1;
    if (allSameSuit) return 'a royal flush';
  }
  
  // Check for Straight Flush
  if (flush && straight.isStraight) {
    const straightCards = findStraightCards(cards, straight.highCard);
    const flushSuit = findFlushSuit(cards);
    const straightFlushCards = straightCards.filter(c => c.suit === flushSuit);
    if (straightFlushCards.length >= 5) {
      return `a straight flush, ${RANK_NAMES_SINGULAR[getRankByValue(straight.highCard)]} high`;
    }
  }
  
  // Four of a Kind
  if (sortedCounts[0] && sortedCounts[0][1] === 4) {
    const rank = getRankByValue(sortedCounts[0][0]);
    return `four of a kind, ${RANK_NAMES[rank]}`;
  }
  
  // Full House
  if (sortedCounts[0] && sortedCounts[0][1] === 3 && sortedCounts[1] && sortedCounts[1][1] >= 2) {
    const tripsRank = getRankByValue(sortedCounts[0][0]);
    const pairRank = getRankByValue(sortedCounts[1][0]);
    return `a full house, ${RANK_NAMES[tripsRank]} full of ${RANK_NAMES[pairRank]}`;
  }
  
  // Flush
  if (flush) {
    const flushSuit = findFlushSuit(cards);
    const flushCards = cards.filter(c => c.suit === flushSuit).sort((a, b) => b.value - a.value);
    return `a flush, ${RANK_NAMES_SINGULAR[flushCards[0].rank]} high`;
  }
  
  // Straight
  if (straight.isStraight) {
    return `a straight, ${RANK_NAMES_SINGULAR[getRankByValue(straight.highCard)]} high`;
  }
  
  // Three of a Kind
  if (sortedCounts[0] && sortedCounts[0][1] === 3) {
    const rank = getRankByValue(sortedCounts[0][0]);
    return `three of a kind, ${RANK_NAMES[rank]}`;
  }
  
  // Two Pair
  if (sortedCounts[0] && sortedCounts[0][1] === 2 && sortedCounts[1] && sortedCounts[1][1] === 2) {
    const highPair = getRankByValue(sortedCounts[0][0]);
    const lowPair = getRankByValue(sortedCounts[1][0]);
    return `two pair, ${RANK_NAMES[highPair]} and ${RANK_NAMES[lowPair]}`;
  }
  
  // One Pair
  if (sortedCounts[0] && sortedCounts[0][1] === 2) {
    const rank = getRankByValue(sortedCounts[0][0]);
    return `a pair of ${RANK_NAMES[rank]}`;
  }
  
  // High Card
  const highCard = sortedCounts[0];
  if (highCard) {
    const rank = getRankByValue(highCard[0]);
    return `${RANK_NAMES_SINGULAR[rank]} high`;
  }
  
  return 'No valid hand';
};

// Helper function to find cards that form a straight
const findStraightCards = (cards: Card[], highCard: number): Card[] => {
  if (highCard === 5) {
    // Wheel (A-2-3-4-5)
    return cards.filter(c => [14, 2, 3, 4, 5].includes(c.value));
  }
  
  const straightValues = [highCard, highCard - 1, highCard - 2, highCard - 3, highCard - 4];
  return cards.filter(c => straightValues.includes(c.value));
};

// Helper function to find the flush suit
const findFlushSuit = (cards: Card[]): string => {
  const suitCounts = new Map<string, number>();
  cards.forEach(card => {
    suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1);
  });
  
  for (const [suit, count] of suitCounts.entries()) {
    if (count >= 5) return suit;
  }
  
  return '';
};

// Helper function to get rank character by value
const getRankByValue = (value: number): string => {
  return Object.keys(RANK_VALUES).find(k => RANK_VALUES[k] === value) || '';
};

/**
 * Evaluate a poker hand given hole cards and board cards
 * @param holeCards Array of 2 hole cards in format ["Kh", "Kd"]
 * @param boardCards Array of 0-5 board cards in format ["6h", "5h", "5s"]
 * @returns Human-readable description of the best hand
 */
export const evaluatePokerHand = (holeCards: string[], boardCards: string[]): string => {
  // Parse all cards
  const holeParsed = holeCards.map(parseCard).filter((c): c is Card => c !== null);
  const boardParsed = boardCards.map(parseCard).filter((c): c is Card => c !== null);
  
  if (holeParsed.length !== 2) {
    return 'Invalid hole cards';
  }
  
  if (boardParsed.length === 0) {
    return 'No board - hand incomplete';
  }
  
  // Combine all cards
  const allCards = [...holeParsed, ...boardParsed];
  
  // Evaluate the best hand
  return evaluateBestHand(allCards);
};
