
import React, { useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ 
  selectedCards, 
  onChange, 
  maxCards = 6 // Default max
}) => {
  // State to track the current selection process
  const [currentSelection, setCurrentSelection] = useState<{
    rank: string | null;
    suit: string | null;
  }>({
    rank: null,
    suit: null
  });

  // Card ranks in descending order (A to 2)
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  // Split ranks into two rows for better layout
  const firstRowRanks = ranks.slice(0, 7); // A, K, Q, J, T, 9, 8
  const secondRowRanks = ranks.slice(7);   // 7, 6, 5, 4, 3, 2
  
  // Card suits with display symbols and colors
  const suits = [
    { symbol: 's', display: '♠', color: 'text-black' },
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-red-600' },
    { symbol: 'c', display: '♣', color: 'text-black' },
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
  
  // Get suit display and color info
  const getSuitInfo = (suitSymbol: string) => {
    const suit = suits.find(s => s.symbol === suitSymbol);
    return suit || { display: '?', color: 'text-gray-500' };
  };
  
  // Handle rank selection
  const handleRankSelect = (rank: string) => {
    if (selectedCards.length / 2 >= maxCards) return;
    
    setCurrentSelection(prev => ({ ...prev, rank }));
    
    // If a suit is already selected, add the card and reset
    if (currentSelection.suit) {
      const card = rank + currentSelection.suit;
      
      // Check if this card is already selected
      if (!selectedCardSet.has(card)) {
        onChange(selectedCards + card);
      }
      
      setCurrentSelection({ rank: null, suit: null });
    }
  };
  
  // Handle suit selection
  const handleSuitSelect = (suitSymbol: string) => {
    if (selectedCards.length / 2 >= maxCards) return;
    
    setCurrentSelection(prev => ({ ...prev, suit: suitSymbol }));
    
    // If a rank is already selected, add the card and reset
    if (currentSelection.rank) {
      const card = currentSelection.rank + suitSymbol;
      
      // Check if this card is already selected
      if (!selectedCardSet.has(card)) {
        onChange(selectedCards + card);
      }
      
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
  
  // Check if we've reached the maximum number of cards
  const isMaxReached = selectedCardCount >= maxCards;
  
  // Check if a specific card is already selected
  const isCardSelected = (rank: string, suit: string) => {
    return selectedCardSet.has(rank + suit);
  };
  
  return (
    <div className="space-y-3">
      {/* Display selected cards as card placeholders */}
      <div className="flex gap-2 mb-4">
        {Array.from({ length: maxCards }, (_, index) => {
          const card = selectedCardObjects[index];
          const { display, color } = card ? getSuitInfo(card.suit) : { display: '', color: '' };
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => card ? removeCard(index) : undefined}
              className={cn(
                "w-12 h-16 border-2 rounded-md flex flex-col items-center justify-center transition-all",
                card ? "cursor-pointer hover:opacity-80" : "cursor-default"
              )}
            >
              {card ? (
                <>
                  {/* Filled card slot with white background and border */}
                  <div className="relative w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                    <div className="font-bold text-sm">{card.rank}</div>
                    <div className={`${color} text-lg`}>{display}</div>
                    {/* Small X overlay for clearing */}
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                      <Trash2 className="w-2 h-2" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Empty card slot - yellow card back with white diamond pattern */}
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
                </>
              )}
            </button>
          );
        })}
        
        {selectedCardCount > 0 && (
          <button
            onClick={clearSelectedCards}
            type="button"
            className="ml-2 text-gray-500 hover:text-gray-800 self-center"
            aria-label="Clear all cards"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      
      {/* Card selection keyboard layout */}
      <div className="bg-gray-100 rounded-lg p-3">
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
                      disabled={isMaxReached || suits.every(suit => isCardSelected(rank, suit.symbol))}
                      className={cn(
                        "py-2.5 rounded-md font-bold text-lg transition-all",
                        currentSelection.rank === rank 
                          ? "bg-poker-gold text-white shadow-md" 
                          : "bg-gray-300 hover:bg-gray-200 text-gray-800",
                        (isMaxReached || suits.every(suit => isCardSelected(rank, suit.symbol))) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {rank}
                    </button>
                  </TooltipTrigger>
                  {isMaxReached && (
                    <TooltipContent>
                      <p>Maximum cards reached</p>
                    </TooltipContent>
                  )}
                  {!isMaxReached && suits.every(suit => isCardSelected(rank, suit.symbol)) && (
                    <TooltipContent>
                      <p>All {rank} cards are already selected</p>
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
                      disabled={isMaxReached || suits.every(suit => isCardSelected(rank, suit.symbol))}
                      className={cn(
                        "py-2.5 rounded-md font-bold text-lg transition-all",
                        currentSelection.rank === rank 
                          ? "bg-poker-gold text-white shadow-md" 
                          : "bg-gray-300 hover:bg-gray-200 text-gray-800",
                        (isMaxReached || suits.every(suit => isCardSelected(rank, suit.symbol))) && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      {rank}
                    </button>
                  </TooltipTrigger>
                  {isMaxReached && (
                    <TooltipContent>
                      <p>Maximum cards reached</p>
                    </TooltipContent>
                  )}
                  {!isMaxReached && suits.every(suit => isCardSelected(rank, suit.symbol)) && (
                    <TooltipContent>
                      <p>All {rank} cards are already selected</p>
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
                    disabled={isMaxReached || ranks.every(rank => isCardSelected(rank, suit.symbol))}
                    className={cn(
                      "py-1.5 rounded-md text-lg transition-all flex items-center justify-center",
                      currentSelection.suit === suit.symbol
                        ? "bg-poker-gold text-white shadow-md" 
                        : "bg-gray-300 hover:bg-gray-200",
                      suit.color,
                      (isMaxReached || ranks.every(rank => isCardSelected(rank, suit.symbol))) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {suit.display}
                  </button>
                </TooltipTrigger>
                {isMaxReached && (
                  <TooltipContent>
                    <p>Maximum cards reached</p>
                  </TooltipContent>
                )}
                {!isMaxReached && ranks.every(rank => isCardSelected(rank, suit.symbol)) && (
                  <TooltipContent>
                    <p>All {suit.display} cards are already selected</p>
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
