
import React from 'react';

interface CardDisplayProps {
  cards: string;
  size?: 'sm' | 'md' | 'lg';
}

const CardDisplay: React.FC<CardDisplayProps> = ({ cards, size = 'md' }) => {
  // Convert short card notation (e.g., "AhKs") into visual card components
  const parseCards = () => {
    // Define size classes
    const sizeClasses = {
      sm: 'w-6 h-8 text-xs',
      md: 'w-8 h-10 text-sm',
      lg: 'w-10 h-12 text-base'
    };
    
    // Parse cards in pairs (rank + suit)
    const cardArray = [];
    for (let i = 0; i < cards.length; i += 2) {
      if (i + 1 < cards.length) {
        const rank = cards[i].toUpperCase();
        const suit = cards[i + 1].toLowerCase();
        
        // Determine suit symbol and color
        let suitSymbol = '';
        let suitColor = '';
        
        switch (suit) {
          case 'h':
            suitSymbol = '♥';
            suitColor = 'text-red-600';
            break;
          case 'd':
            suitSymbol = '♦';
            suitColor = 'text-red-600';
            break;
          case 's':
            suitSymbol = '♠';
            suitColor = 'text-black';
            break;
          case 'c':
            suitSymbol = '♣';
            suitColor = 'text-black';
            break;
        }
        
        cardArray.push(
          <div 
            key={`${rank}${suit}-${i}`}
            className={`${sizeClasses[size]} inline-flex mx-1 bg-white border border-gray-300 rounded shadow-sm flex-col items-center justify-between p-1`}
          >
            <div className="font-bold">{rank}</div>
            <div className={`${suitColor} text-lg`}>{suitSymbol}</div>
          </div>
        );
      }
    }
    
    return cardArray;
  };

  return (
    <div className="flex flex-row items-center space-x-2">
      {parseCards()}
    </div>
  );
};

export default CardDisplay;
