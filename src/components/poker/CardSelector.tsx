
import React from 'react';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ selectedCards, onChange, maxCards = 10 }) => {
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-red-600' },
    { symbol: 's', display: '♠', color: 'text-black' },
    { symbol: 'c', display: '♣', color: 'text-black' },
  ];
  
  const handleCardClick = (rank: string, suitSymbol: string) => {
    if (selectedCards.length / 2 >= maxCards) return;
    
    const card = rank + suitSymbol;
    
    // Check if card is already selected
    if (selectedCards.includes(card)) {
      // If already selected, remove it (toggle behavior)
      removeCard(selectedCards.indexOf(card) / 2);
      return;
    }
    
    // Add the new card to the selected cards string
    const newCards = selectedCards + card;
    onChange(newCards);
  };
  
  const removeCard = (index: number) => {
    const newCards = 
      selectedCards.substring(0, index * 2) + 
      selectedCards.substring((index + 1) * 2);
      
    onChange(newCards);
  };
  
  const renderSelectedCards = () => {
    const cards = [];
    for (let i = 0; i < selectedCards.length; i += 2) {
      if (i + 1 < selectedCards.length) {
        const rank = selectedCards[i];
        const suit = selectedCards[i + 1];
        
        let suitSymbol = '';
        let colorClass = '';
        
        switch (suit) {
          case 'h':
            suitSymbol = '♥';
            colorClass = 'text-red-600';
            break;
          case 'd':
            suitSymbol = '♦';
            colorClass = 'text-red-600';
            break;
          case 's':
            suitSymbol = '♠';
            colorClass = 'text-black';
            break;
          case 'c':
            suitSymbol = '♣';
            colorClass = 'text-black';
            break;
        }
        
        cards.push(
          <div 
            key={i/2}
            className="flex items-center bg-white border border-gray-300 rounded px-2 py-1 mr-2 mb-2 cursor-pointer hover:bg-gray-100"
            onClick={() => removeCard(i/2)}
            title="Click to remove"
          >
            <span className="font-bold">{rank}</span>
            <span className={`${colorClass} ml-1`}>{suitSymbol}</span>
          </div>
        );
      }
    }
    return cards;
  };
  
  return (
    <div className="space-y-4">
      {/* Selected Cards */}
      <div className="flex flex-wrap gap-2">
        {renderSelectedCards()}
        {selectedCards.length === 0 && (
          <div className="text-gray-400 italic">No cards selected. Click cards from the grid below.</div>
        )}
      </div>
      
      {/* Card Grid */}
      <div className="border rounded-md p-4 bg-gray-50">
        {/* Grid Header - Rank Labels */}
        <div className="grid grid-cols-14 gap-1 mb-1">
          <div className="col-span-1"></div> {/* Empty corner cell */}
          {ranks.map(rank => (
            <div key={rank} className="text-center font-bold text-xs py-1">{rank}</div>
          ))}
        </div>
        
        {/* Card Grid with Suits */}
        {suits.map(suit => (
          <div key={suit.symbol} className="grid grid-cols-14 gap-1 mb-1">
            {/* Suit label on left */}
            <div className={`${suit.color} text-center text-lg flex items-center justify-center`}>
              {suit.display}
            </div>
            
            {/* Cards for this suit */}
            {ranks.map(rank => {
              const cardString = rank + suit.symbol;
              const isSelected = selectedCards.includes(cardString);
              
              return (
                <div 
                  key={`${rank}${suit.symbol}`}
                  onClick={() => handleCardClick(rank, suit.symbol)}
                  className={`
                    flex items-center justify-center border rounded cursor-pointer p-1 h-8
                    ${isSelected ? 'bg-poker-gold text-white border-poker-gold' : 'bg-white hover:bg-gray-100 border-gray-300'}
                    ${selectedCards.length / 2 >= maxCards && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  title={isSelected ? "Click to remove" : "Click to add"}
                >
                  <span className="font-bold mr-0.5">{rank}</span>
                  <span className={isSelected ? 'text-white' : suit.color}>{suit.display}</span>
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Info text */}
        <div className="mt-3 text-xs text-gray-500 flex justify-between items-center">
          <span>Click to add/remove cards</span>
          <span className="font-medium">{selectedCards.length / 2} / {maxCards} cards selected</span>
        </div>
      </div>
    </div>
  );
};

export default CardSelector;
