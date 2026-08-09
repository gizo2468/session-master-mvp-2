
import React, { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
  excludedCards?: string[];
}

const CardSelector: React.FC<CardSelectorProps> = ({ 
  selectedCards, 
  onChange, 
  maxCards = 6, // Default max
  excludedCards = []
}) => {
  // State to track the current selection process
  const [currentSelection, setCurrentSelection] = useState<{
    rank: string | null;
    suit: string | null;
  }>({
    rank: null,
    suit: null
  });

  // State to track visible slots (for Omaha progressive expansion)
  const [visibleSlots, setVisibleSlots] = useState(() => {
    // For Omaha (maxCards = 6), start with 4 slots
    // For Hold'em (maxCards = 2), show all slots
    return maxCards === 6 ? 4 : maxCards;
  });

  // Reset visible slots when maxCards changes (game type switch)
  React.useEffect(() => {
    setVisibleSlots(maxCards === 6 ? 4 : maxCards);
  }, [maxCards]);

  // Card ranks in descending order (A to 2)
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  // Split ranks into two rows for better layout
  const firstRowRanks = ranks.slice(0, 7); // A, K, Q, J, T, 9, 8
  const secondRowRanks = ranks.slice(7);   // 7, 6, 5, 4, 3, 2
  
  // Card suits with display symbols and colors
  const suits = [
    { symbol: 's', display: '♠', color: 'text-black dark:text-foreground' },
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-red-600' },
    { symbol: 'c', display: '♣', color: 'text-black dark:text-foreground' },
  ];
  
  // Parse selected cards into array of card objects
  const selectedCardObjects = useMemo(() => {
    const cards = [];
    for (let i = 0; i < selectedCards.length; i += 2) {
      if (i + 1 < selectedCards.length) {
        const rank = selectedCards[i];
        const suit = selectedCards[i + 1];
        cards.push({ rank, suit });
      }
    }
    return cards;
  }, [selectedCards]);
  
  // Get set of selected card combinations for easy lookup
  const selectedCardSet = useMemo(() => {
    const cardSet = new Set();
    selectedCardObjects.forEach(card => {
      cardSet.add(card.rank + card.suit);
    });
    return cardSet;
  }, [selectedCardObjects]);
  
  // Get set of excluded cards
  const excludedCardSet = useMemo(() => {
    return new Set(excludedCards);
  }, [excludedCards]);
  
  // Check if a card is unavailable (selected or excluded)
  const isCardUnavailable = (rank: string, suit: string) => {
    const cardString = rank + suit;
    return selectedCardSet.has(cardString) || excludedCardSet.has(cardString);
  };
  
  // Get suit display and color info
  const getSuitInfo = (suitSymbol: string) => {
    const suit = suits.find(s => s.symbol === suitSymbol);
    return suit || { display: '?', color: 'text-gray-500 dark:text-muted-foreground' };
  };
  
  // Handle rank selection
  const handleRankSelect = (rank: string) => {
    // Check if all suits for this rank are unavailable
    const allSuitsUnavailable = suits.every(suit => isCardUnavailable(rank, suit.symbol));
    
    if (allSuitsUnavailable) {
      return; // Don't allow selection at all
    }
    
    if (selectedCards.length / 2 >= visibleSlots) return;
    
    setCurrentSelection(prev => ({ ...prev, rank }));
    
    // If a suit is already selected, add the card if valid
    if (currentSelection.suit && !isCardUnavailable(rank, currentSelection.suit)) {
      const card = rank + currentSelection.suit;
      onChange(selectedCards + card);
      setCurrentSelection({ rank: null, suit: null });
    }
  };
  
  // Handle suit selection
  const handleSuitSelect = (suitSymbol: string) => {
    // Check if all ranks for this suit are unavailable
    const allRanksUnavailable = ranks.every(rank => isCardUnavailable(rank, suitSymbol));
    
    if (allRanksUnavailable) {
      return; // Don't allow selection at all
    }
    
    if (selectedCards.length / 2 >= visibleSlots) return;
    
    setCurrentSelection(prev => ({ ...prev, suit: suitSymbol }));
    
    // If a rank is already selected, add the card if valid  
    if (currentSelection.rank && !isCardUnavailable(currentSelection.rank, suitSymbol)) {
      const card = currentSelection.rank + suitSymbol;
      onChange(selectedCards + card);
      setCurrentSelection({ rank: null, suit: null });
    }
  };
  
  // Remove an individual card by index
  const removeCard = (index: number) => {
    const newSelectedCards = selectedCards.slice(0, index * 2) + selectedCards.slice((index + 1) * 2);
    onChange(newSelectedCards);
  };
  
  // Clear all selected cards
  const clearSelectedCards = () => {
    onChange('');
    setCurrentSelection({ rank: null, suit: null });
  };
  
  // Count of selected cards
  const selectedCardCount = selectedCards.length / 2;
  
  // Check if we've reached the visible slot limit
  const isVisibleSlotsReached = selectedCardCount >= visibleSlots;
  
  // Check if we've reached the maximum number of cards
  const isMaxReached = selectedCardCount >= maxCards;

  // Progressive slot expansion logic for Omaha  
  // Show + button when: it's Omaha (6 max), haven't reached max slots, and all visible slots are filled
  const shouldShowExpandButton = maxCards === 6 && visibleSlots < maxCards && selectedCardCount >= visibleSlots;
  
  // Handle slot expansion
  const handleExpandSlots = () => {
    if (visibleSlots < maxCards) {
      setLastExpandTime(Date.now());
      setVisibleSlots(prev => Math.min(prev + 1, maxCards));
    }
  };

  // Auto-shrink slots if cards are removed - but not immediately after manual expansion
  const [lastExpandTime, setLastExpandTime] = useState(0);
  
  React.useEffect(() => {
    if (maxCards === 6 && selectedCardCount < visibleSlots && visibleSlots > 4) {
      // Don't auto-shrink within 500ms of manual expansion
      const timeSinceExpand = Date.now() - lastExpandTime;
      if (timeSinceExpand > 500) {
        const minNeededSlots = Math.max(4, selectedCardCount);
        if (visibleSlots > minNeededSlots) {
          setVisibleSlots(minNeededSlots);
        }
      }
    }
  }, [selectedCardCount, visibleSlots, maxCards, lastExpandTime]);
  
  return (
    <div className="space-y-3">
      {/* Display selected cards as card placeholders */}
      <div className="mb-4">
        {/* Card slots container with responsive sizing */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center justify-center">
          <div className="flex gap-1.5 sm:gap-2 items-center">
            {Array.from({ length: visibleSlots }, (_, index) => {
              const card = selectedCardObjects[index];
              const { display, color } = card ? getSuitInfo(card.suit) : { display: '', color: '' };
              
              return (
                <button
                  key={index}
                  type="button"
                  className="w-12 h-16 sm:w-14 sm:h-18 border-2 rounded-md flex flex-col items-center justify-center transition-all cursor-default flex-shrink-0"
                >
                  {card ? (
                    /* Filled card slot with white background and border */
                    <div className="relative w-full h-full bg-white dark:bg-card border border-gray-400 rounded-lg flex flex-col items-center justify-center gap-0.5 p-1">
                      <div className="font-bold text-xs leading-tight">{card.rank}</div>
                      <div className={`${color} text-xs leading-tight`}>{display}</div>
                    </div>
                  ) : (
                    /* Empty card slot - yellow card back with white diamond pattern */
                    <div className="w-full h-full bg-yellow-400 rounded border-2 border-white relative overflow-hidden">
                      {/* Diamond pattern overlay */}
                      <div 
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage: `
                            repeating-linear-gradient(
                              45deg,
                              transparent,
                              transparent 3px,
                              white 3px,
                              white 6px
                            ),
                            repeating-linear-gradient(
                              -45deg,
                              transparent,
                              transparent 3px,
                              white 3px,
                              white 6px
                            )
                          `
                        }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
            
            {/* Expand button for Omaha */}
            {shouldShowExpandButton && (
              <button
                onClick={handleExpandSlots}
                type="button"
                className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-dashed border-gray-300 dark:border-border rounded-md flex items-center justify-center hover:border-poker-gold hover:text-poker-gold transition-all bg-white dark:bg-card hover:bg-gray-50 dark:bg-background cursor-pointer flex-shrink-0"
                aria-label="Add another card slot"
              >
                <span className="text-lg sm:text-xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-poker-gold">+</span>
              </button>
            )}
          </div>
          
          {/* Clear button - positioned to prevent overlap */}
          {selectedCardCount > 0 && (
            <button
              onClick={clearSelectedCards}
              type="button"
              className="text-gray-500 dark:text-muted-foreground hover:text-gray-800 dark:text-foreground flex-shrink-0 ml-1 sm:ml-2"
              aria-label="Clear all cards"
            >
              <Trash2 size={18} className="sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
      
      {/* Card selection keyboard layout */}
      <div className="bg-gray-100 dark:bg-black/40 dark:border dark:border-white/10 rounded-lg p-3">
        {/* Card ranks section - two rows for better spacing */}
        <div className="space-y-1.5 mb-3">
          {/* First row of ranks */}
          <div className="grid grid-cols-7 gap-1.5">
            {firstRowRanks.map((rank) => (
              <TooltipProvider key={rank}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleRankSelect(rank)}
                        disabled={isVisibleSlotsReached || suits.every(suit => isCardUnavailable(rank, suit.symbol))}
                       className={cn(
                         "py-2.5 rounded-md font-bold text-lg transition-all",
                         currentSelection.rank === rank 
                           ? "bg-poker-gold text-white shadow-md dark:shadow-black/30" 
                           : suits.every(suit => isCardUnavailable(rank, suit.symbol))
                             ? "bg-gray-100 dark:bg-muted/40 text-gray-400 dark:text-muted-foreground cursor-not-allowed opacity-50"
                             : "bg-gray-300 hover:bg-gray-200 dark:bg-card dark:hover:bg-white/10 dark:border dark:border-white/10 text-gray-800 dark:text-foreground"
                       )}
                    >
                      {rank}
                    </button>
                  </TooltipTrigger>
                   {isVisibleSlotsReached && (
                     <TooltipContent>
                       <p>Maximum cards reached</p>
                     </TooltipContent>
                   )}
                    {!isVisibleSlotsReached && suits.every(suit => isCardUnavailable(rank, suit.symbol)) && (
                      <TooltipContent>
                        <p>Already used</p>
                      </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
          
          {/* Second row of ranks */}
          <div className="grid grid-cols-6 gap-1.5">
            {secondRowRanks.map((rank) => (
              <TooltipProvider key={rank}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleRankSelect(rank)}
                       disabled={isVisibleSlotsReached || suits.every(suit => isCardUnavailable(rank, suit.symbol))}
                       className={cn(
                         "py-2.5 rounded-md font-bold text-lg transition-all",
                         currentSelection.rank === rank 
                           ? "bg-poker-gold text-white shadow-md dark:shadow-black/30" 
                           : suits.every(suit => isCardUnavailable(rank, suit.symbol))
                             ? "bg-gray-100 dark:bg-muted/40 text-gray-400 dark:text-muted-foreground cursor-not-allowed opacity-50"
                             : "bg-gray-300 hover:bg-gray-200 dark:bg-card dark:hover:bg-white/10 dark:border dark:border-white/10 text-gray-800 dark:text-foreground"
                       )}
                    >
                      {rank}
                    </button>
                  </TooltipTrigger>
                   {isVisibleSlotsReached && (
                     <TooltipContent>
                       <p>Maximum cards reached</p>
                     </TooltipContent>
                   )}
                    {!isVisibleSlotsReached && suits.every(suit => isCardUnavailable(rank, suit.symbol)) && (
                      <TooltipContent>
                        <p>Already used</p>
                      </TooltipContent>
                    )}
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        
        {/* Card suits section - single row with smaller icons */}
        <div className="grid grid-cols-4 gap-2">
          {suits.map((suit) => (
            <TooltipProvider key={suit.symbol}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSuitSelect(suit.symbol)}
                     disabled={isVisibleSlotsReached || ranks.every(rank => isCardUnavailable(rank, suit.symbol))}
                     className={cn(
                       "py-1.5 rounded-md text-lg transition-all flex items-center justify-center",
                       currentSelection.suit === suit.symbol
                         ? "bg-poker-gold text-white shadow-md dark:shadow-black/30" 
                         : ranks.every(rank => isCardUnavailable(rank, suit.symbol))
                           ? "bg-gray-100 dark:bg-muted/40 text-gray-400 dark:text-muted-foreground cursor-not-allowed opacity-50"
                           : "bg-gray-300 hover:bg-gray-200 dark:bg-card dark:hover:bg-white/10 dark:border dark:border-white/10",
                       // Only apply suit color if not disabled
                       !ranks.every(rank => isCardUnavailable(rank, suit.symbol)) && 
                       currentSelection.suit !== suit.symbol && suit.color
                     )}
                  >
                    {suit.display}
                  </button>
                </TooltipTrigger>
                 {isVisibleSlotsReached && (
                   <TooltipContent>
                     <p>Maximum cards reached</p>
                   </TooltipContent>
                 )}
                  {!isVisibleSlotsReached && ranks.every(rank => isCardUnavailable(rank, suit.symbol)) && (
                    <TooltipContent>
                      <p>Already used</p>
                    </TooltipContent>
                  )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
