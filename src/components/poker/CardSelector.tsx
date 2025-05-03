
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ 
  selectedCards, 
  onChange, 
  maxCards = 6 // Changed default max to 6 as requested
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
  const parseSelectedCards = () => {
    const cards = [];
    for (let i = 0; i < selectedCards.length; i += 2) {
      if (i + 1 < selectedCards.length) {
        const rank = selectedCards[i];
        const suit = selectedCards[i + 1];
        cards.push({ rank, suit });
      }
    }
    return cards;
  };
  
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
      onChange(selectedCards + card);
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
      onChange(selectedCards + card);
      setCurrentSelection({ rank: null, suit: null });
    }
  };
  
  // Remove last card from selection
  const removeLastCard = () => {
    if (selectedCards.length >= 2) {
      onChange(selectedCards.slice(0, -2));
    }
  };
  
  // Clear all selected cards
  const clearSelectedCards = () => {
    onChange('');
    setCurrentSelection({ rank: null, suit: null });
  };
  
  // Count of selected cards
  const selectedCardCount = selectedCards.length / 2;
  
  return (
    <div className="space-y-3">
      {/* Display selected cards */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 overflow-x-auto py-1 pb-2 flex-grow">
          {parseSelectedCards().map((card, index) => {
            const { display, color } = getSuitInfo(card.suit);
            return (
              <div
                key={index}
                className="flex items-center justify-center bg-white border border-gray-300 rounded-md px-3 py-2 shadow-sm"
              >
                <span className="font-bold">{card.rank}</span>
                <span className={`ml-1 ${color}`}>{display}</span>
              </div>
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
            onClick={removeLastCard}
            className="ml-2 text-gray-500 hover:text-gray-800"
            aria-label="Remove last card"
          >
            <Trash2 size={20} />
          </button>
        )}
      </div>
      
      {/* Card selection counter */}
      <div className="text-sm text-gray-500">
        {selectedCardCount} / {maxCards} cards selected
      </div>
      
      {/* New keyboard-style card input layout */}
      <div className="bg-gray-100 rounded-lg p-3">
        {/* Card ranks section - 2 rows of buttons */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {ranks.map((rank) => (
            <button
              key={rank}
              onClick={() => handleRankSelect(rank)}
              disabled={selectedCardCount >= maxCards}
              className={cn(
                "py-3 rounded-md font-bold text-lg transition-all",
                currentSelection.rank === rank 
                  ? "bg-poker-gold text-white shadow-md" 
                  : "bg-gray-300 hover:bg-gray-200 text-gray-800",
                selectedCardCount >= maxCards && "opacity-50 cursor-not-allowed"
              )}
            >
              {rank}
            </button>
          ))}
        </div>
        
        {/* Card suits section */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {suits.map((suit) => (
            <button
              key={suit.symbol}
              onClick={() => handleSuitSelect(suit.symbol)}
              disabled={selectedCardCount >= maxCards}
              className={cn(
                "py-3 rounded-md text-2xl transition-all flex items-center justify-center",
                currentSelection.suit === suit.symbol
                  ? "bg-poker-gold text-white shadow-md" 
                  : "bg-gray-300 hover:bg-gray-200",
                suit.color,
                selectedCardCount >= maxCards && "opacity-50 cursor-not-allowed"
              )}
            >
              {suit.display}
            </button>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline"
            onClick={clearSelectedCards}
            className="flex items-center justify-center gap-2"
            disabled={selectedCardCount === 0}
          >
            <Trash2 size={16} /> Clear All
          </Button>
          
          <Button
            onClick={() => {}} // Form submission handled by parent component
            disabled={selectedCardCount === 0}
            className="bg-poker-gold hover:bg-poker-darkGold text-white font-medium"
          >
            DONE
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
