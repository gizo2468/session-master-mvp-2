
import React, { useState } from 'react';
import { trash } from 'lucide-react';
import Icon from '@/components/ui/Lucide';

interface CardSelectorProps {
  selectedCards: string;
  onChange: (cards: string) => void;
  maxCards?: number;
}

const CardSelector: React.FC<CardSelectorProps> = ({ selectedCards, onChange, maxCards = 10 }) => {
  // Ranks and suits for our grid
  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: 's', display: '♠', color: 'text-black' },
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-blue-500' },
    { symbol: 'c', display: '♣', color: 'text-green-600' },
  ];
  
  // Create a grid of cards (rank + suit combinations)
  const generateCardGrid = () => {
    const grid = [];
    
    // First add the suits as header row
    const headerRow = (
      <div key="header-row" className="grid grid-cols-4 gap-2 mb-3">
        {suits.map(suit => (
          <div 
            key={`suit-${suit.symbol}`}
            className={`h-12 w-full flex items-center justify-center text-3xl ${suit.color} bg-gray-100 rounded-md shadow-sm`}
          >
            {suit.display}
          </div>
        ))}
      </div>
    );
    grid.push(headerRow);
    
    // Then add all rank+suit combinations
    for (const rank of ranks) {
      const row = (
        <div key={`rank-${rank}`} className="grid grid-cols-4 gap-2 mb-2">
          {suits.map(suit => {
            const cardValue = rank + suit.symbol;
            const isSelected = selectedCards.includes(cardValue);
            
            return (
              <button
                key={cardValue}
                type="button"
                disabled={selectedCards.length / 2 >= maxCards && !isSelected}
                onClick={() => toggleCard(cardValue)}
                className={`h-12 flex flex-col items-center justify-center rounded-md transition-all ${
                  isSelected 
                    ? 'bg-poker-gold text-white shadow-lg scale-[1.05] border-2 border-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-white shadow-sm'
                } ${selectedCards.length / 2 >= maxCards && !isSelected ? 'opacity-30' : 'opacity-100'}`}
              >
                <div className="flex items-center">
                  <span className="font-bold text-lg">{rank}</span>
                  <span className={`ml-1 ${suit.color}`}>{suit.display}</span>
                </div>
              </button>
            );
          })}
        </div>
      );
      grid.push(row);
    }
    
    return grid;
  };
  
  // Toggle a card selection (add or remove)
  const toggleCard = (card: string) => {
    if (selectedCards.includes(card)) {
      // Card is already selected, remove it
      const newCards = selectedCards.replace(card, '');
      onChange(newCards);
    } else {
      // Add the card if we haven't reached maximum
      if (selectedCards.length / 2 < maxCards) {
        onChange(selectedCards + card);
      }
    }
  };
  
  // Clear all selected cards
  const clearSelectedCards = () => {
    onChange('');
  };
  
  // Render the selected cards display
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
            colorClass = 'text-blue-500';
            break;
          case 's':
            suitSymbol = '♠';
            colorClass = 'text-black';
            break;
          case 'c':
            suitSymbol = '♣';
            colorClass = 'text-green-600';
            break;
        }
        
        cards.push(
          <div 
            key={i/2}
            className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2 mr-2 mb-2 group hover:bg-gray-100"
          >
            <span className="font-bold text-lg">{rank}</span>
            <span className={`${colorClass} ml-1`}>{suitSymbol}</span>
            <button
              type="button"
              onClick={() => toggleCard(rank + suit)}
              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove card"
            >
              <Icon name="trash" size={16} className="text-gray-500 hover:text-red-500" />
            </button>
          </div>
        );
      }
    }
    return cards;
  };
  
  return (
    <div className="space-y-4">
      {/* Selected cards display */}
      <div className="bg-gray-100 rounded-lg p-3 min-h-[60px]">
        <div className="flex flex-wrap items-center">
          {selectedCards.length > 0 ? (
            <>
              {renderSelectedCards()}
              
              {/* Clear all button when cards are selected */}
              <button
                type="button"
                onClick={clearSelectedCards}
                className="flex items-center text-sm text-red-500 hover:text-red-700"
              >
                <Icon name="trash" size={14} className="mr-1" />
                Clear All
              </button>
            </>
          ) : (
            <div className="text-gray-400 italic">No cards selected</div>
          )}
        </div>
      </div>
      
      {/* Cards selection count */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          {selectedCards.length / 2} of {maxCards} cards selected
        </span>
      </div>
      
      {/* Card grid for quick selection */}
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        {generateCardGrid()}
      </div>
    </div>
  );
};

export default CardSelector;
