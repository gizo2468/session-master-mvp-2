
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
      {/* Display selected cards */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 overflow-x-auto py-1 pb-2 flex-grow">
          {selectedCardObjects.map((card, index) => {
            const { display, color } = getSuitInfo(card.suit);
            return (
              <button
                key={index}
                type="button"
                onClick={() => removeCard(index)}
                className="flex items-center justify-center bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <span className="font-bold">{card.rank}</span>
                <span className={`ml-1 ${color}`}>{display}</span>
              </button>
            );
          })}
          
          {selectedCardCount === 0 && (
            <div className="text-gray-400 italic text-sm py-2">
              Select cards below
            </div>
          )}
        </div>
        
        {selectedCardCount > 0 && (
          <button
            onClick={clearSelectedCards}
            type="button"
            className="ml-2 text-gray-500 hover:text-gray-800"
            aria-label="Clear all cards"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      
      {/* Card selection counter */}
      <div className="text-sm text-gray-500">
        {selectedCardCount} / {maxCards} cards selected
      </div>
      
      {/* Card selection keyboard layout */}
      <div className="bg-gray-100 rounded-lg p-3">
        {/* Card ranks section - single row */}
        <div className="grid grid-cols-13 gap-1.5 mb-5">
          {ranks.map((rank) => (
            <TooltipProvider key={rank}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleRankSelect(rank)}
                    disabled={isMaxReached || suits.every(suit => isCardSelected(rank, suit.symbol))}
                    className={cn(
                      "py-3.5 rounded-md font-bold text-lg transition-all",
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
        
        {/* Card suits section - single row */}
        <div className="grid grid-cols-4 gap-4">
          {suits.map((suit) => (
            <TooltipProvider key={suit.symbol}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSuitSelect(suit.symbol)}
                    disabled={isMaxReached || ranks.every(rank => isCardSelected(rank, suit.symbol))}
                    className={cn(
                      "py-2.5 rounded-md text-xl transition-all flex items-center justify-center",
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
