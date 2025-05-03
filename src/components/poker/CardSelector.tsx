
import React, { useState } from 'react';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ selectedCards, onChange, maxCards = 10 }) => {
  const [selectedRank, setSelectedRank] = useState<string>('');
  const [selectedSuit, setSelectedSuit] = useState<string>('');
  
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: 'h', display: '♥', color: 'text-red-600 border-red-400' },
    { symbol: 'd', display: '♦', color: 'text-red-600 border-red-400' },
    { symbol: 's', display: '♠', color: 'text-black border-gray-400' },
    { symbol: 'c', display: '♣', color: 'text-black border-gray-400' },
  ];
  
  const addCard = () => {
    if (!selectedRank || !selectedSuit) return;
    if (selectedCards.length / 2 >= maxCards) return;
    
    const card = selectedRank + selectedSuit;
    
    // Check if card is already selected
    if (selectedCards.includes(card)) return;
    
    // Add the new card to the selected cards string
    const newCards = selectedCards + card;
    onChange(newCards);
    
    // Reset selections after adding a card
    setSelectedRank('');
    setSelectedSuit('');
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
      <div className="flex flex-wrap gap-2">
        {renderSelectedCards()}
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Rank</label>
          <div className="grid grid-cols-7 gap-2">
            {ranks.map(rank => (
              <button
                key={rank}
                type="button"
                onClick={() => setSelectedRank(rank)}
                className={`h-8 w-8 flex items-center justify-center border ${
                  selectedRank === rank 
                    ? 'bg-poker-gold text-white border-poker-gold' 
                    : 'bg-white border-gray-300 hover:bg-gray-100'
                } rounded`}
              >
                {rank}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Suit</label>
          <div className="flex gap-2">
            {suits.map(suit => (
              <button
                key={suit.symbol}
                type="button"
                onClick={() => setSelectedSuit(suit.symbol)}
                className={`h-8 w-8 flex items-center justify-center text-xl border ${
                  selectedSuit === suit.symbol 
                    ? 'bg-poker-gold text-white border-poker-gold' 
                    : `bg-white ${suit.color} hover:bg-gray-100`
                } rounded`}
              >
                {suit.display}
              </button>
            ))}
          </div>
        </div>
        
        <button
          type="button"
          onClick={addCard}
          disabled={!selectedRank || !selectedSuit}
          className={`py-2 px-4 ${!selectedRank || !selectedSuit 
            ? 'bg-gray-300 text-gray-500' 
            : 'bg-poker-feltGreen text-white hover:bg-green-700'} rounded`}
        >
          Add Card
        </button>
      </div>
    </div>
  );
};

export default CardSelector;
