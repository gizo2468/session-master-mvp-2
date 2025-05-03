
import React from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ selectedCards, onChange, maxCards = 10 }) => {
  // Updated ranks to display in descending order (A to 2)
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: 's', display: '♠', color: 'text-black' },
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-red-600' },
    { symbol: 'c', display: '♣', color: 'text-black' },
  ];
  
  // Function to toggle a card's selection
  const toggleCard = (rank: string, suitSymbol: string) => {
    const card = rank + suitSymbol;
    
    // Check if card is already selected
    if (selectedCards.includes(card)) {
      // Remove the card
      const cardIndex = selectedCards.indexOf(card);
      const newCards = selectedCards.slice(0, cardIndex) + selectedCards.slice(cardIndex + 2);
      onChange(newCards);
    } else {
      // Check if maximum number of cards is reached
      if (selectedCards.length / 2 >= maxCards) return;
      
      // Add the card
      const newCards = selectedCards + card;
      onChange(newCards);
    }
  };
  
  // Function to clear all selected cards
  const clearSelectedCards = () => {
    onChange('');
  };
  
  // Convert the selected cards string into an array of card objects for display
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
  
  // Get suit display and color for a given suit symbol
  const getSuitInfo = (suitSymbol: string) => {
    const suit = suits.find(s => s.symbol === suitSymbol);
    return suit || { display: '?', color: 'text-gray-500' };
  };
  
  // Check if a card is selected
  const isCardSelected = (rank: string, suitSymbol: string) => {
    return selectedCards.includes(rank + suitSymbol);
  };
  
  // Count of selected cards
  const selectedCardCount = selectedCards.length / 2;
  
  return (
    <div className="space-y-4">
      {/* Display selected cards */}
      <div className="flex flex-wrap gap-2 min-h-12 mb-2">
        {parseSelectedCards().map((card, index) => {
          const { display, color } = getSuitInfo(card.suit);
          return (
            <div
              key={index}
              className="flex items-center justify-center bg-white border border-gray-300 rounded-md px-2 py-1 shadow-sm hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleCard(card.rank, card.suit)}
            >
              <span className="font-bold">{card.rank}</span>
              <span className={`ml-1 ${color}`}>{display}</span>
            </div>
          );
        })}
        
        {selectedCardCount > 0 && (
          <button
            onClick={clearSelectedCards}
            className="flex items-center justify-center bg-white border border-gray-300 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100"
            aria-label="Clear all cards"
          >
            <Trash size={16} />
          </button>
        )}
      </div>
      
      {/* Card selection counter */}
      <div className="text-sm text-gray-500">
        {selectedCardCount} / {maxCards} cards selected
      </div>
      
      {/* New unified grid-based card selector */}
      <div className="bg-gray-100 rounded-lg p-4">
        {/* Grid layout with ranks as rows and suits as columns */}
        <div className="grid grid-cols-4 gap-2">
          {/* Header row with suit symbols */}
          {suits.map(suit => (
            <div key={suit.symbol} className={`flex justify-center ${suit.color} text-xl pb-1`}>
              {suit.display}
            </div>
          ))}
          
          {/* Card grid */}
          {ranks.map(rank => (
            <React.Fragment key={rank}>
              {suits.map(suit => {
                const isSelected = isCardSelected(rank, suit.symbol);
                return (
                  <button
                    key={`${rank}${suit.symbol}`}
                    onClick={() => toggleCard(rank, suit.symbol)}
                    className={cn(
                      "flex flex-col items-center justify-center h-12 rounded-md transition-all",
                      isSelected 
                        ? "bg-poker-gold text-white border-2 border-poker-darkGold shadow-md" 
                        : "bg-white hover:bg-gray-50 border border-gray-300"
                    )}
                    disabled={selectedCardCount >= maxCards && !isSelected}
                  >
                    <span className="font-bold">{rank}</span>
                    <span className={isSelected ? "text-white" : suit.color}>
                      {suit.display}
                    </span>
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
