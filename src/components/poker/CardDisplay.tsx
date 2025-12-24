
import React from 'react';

interface CardDisplayProps {
  cards: string;
  size?: 'sm' | 'md' | 'lg';
  showCardNames?: boolean;
}

const CardDisplay: React.FC<CardDisplayProps> = ({ 
  cards, 
  size = 'md',
  showCardNames = false 
}) => {
  const sizeClasses = {
    sm: { card: 'w-7 h-10 text-xs', suit: 'text-sm sm:text-base', gap: 'gap-0.5' },
    md: { card: 'w-9 h-12 text-sm', suit: 'text-lg', gap: 'gap-1' },
    lg: { card: 'w-11 h-14 text-base', suit: 'text-xl', gap: 'gap-1.5' }
  };
  
  const parseCards = () => {
    const styles = sizeClasses[size];
    const cardArray = [];
    const cardNames = [];
    
    for (let i = 0; i < cards.length; i += 2) {
      if (i + 1 < cards.length) {
        const rank = cards[i].toUpperCase();
        const suit = cards[i + 1].toLowerCase();
        
        let suitSymbol = '?';
        let suitColor = 'text-muted-foreground';
        
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
            suitColor = 'text-gray-900 dark:text-gray-100';
            break;
          case 'c':
            suitSymbol = '♣';
            suitColor = 'text-gray-900 dark:text-gray-100';
            break;
        }
        
        cardNames.push(`${rank}${suit.toUpperCase()}`);
        
        cardArray.push(
          <div 
            key={`${rank}${suit}-${i}`}
            className={`${styles.card} inline-flex bg-white dark:bg-gray-50 border-2 border-gray-300 rounded-md shadow-md flex-col items-center justify-between py-0.5 px-0.5 transition-transform hover:scale-105`}
          >
            <div className="font-bold leading-none">{rank}</div>
            <div className={`${suitColor} ${styles.suit} leading-none`}>{suitSymbol}</div>
          </div>
        );
      }
    }
    
    return { cards: cardArray, names: cardNames };
  };

  const { cards: cardElements, names: cardNames } = parseCards();

  return (
    <div className="flex items-center gap-2">
      <div className={`flex ${cardElements.length > 0 ? sizeClasses[size].gap : ''}`}>
        {cardElements}
      </div>
      {showCardNames && cardNames.length > 0 && (
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          {cardNames.join(' ')}
        </span>
      )}
    </div>
  );
};

export default CardDisplay;
