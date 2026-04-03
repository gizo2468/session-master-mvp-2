
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
    sm: { card: 'w-8 h-11', rank: 'text-xs font-bold', suit: 'text-xs', gap: 'gap-0.5' },
    md: { card: 'w-10 h-14', rank: 'text-sm font-bold', suit: 'text-sm', gap: 'gap-1' },
    lg: { card: 'w-12 h-16', rank: 'text-base font-bold', suit: 'text-base', gap: 'gap-1.5' }
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
            suitColor = 'text-red-600 dark:text-red-500';
            break;
          case 'd':
            suitSymbol = '♦';
            suitColor = 'text-red-600 dark:text-red-500';
            break;
          case 's':
            suitSymbol = '♠';
            suitColor = 'text-gray-900 dark:text-gray-900';
            break;
          case 'c':
            suitSymbol = '♣';
            suitColor = 'text-gray-900 dark:text-gray-900';
            break;
        }
        
        cardNames.push(`${rank}${suit.toUpperCase()}`);
        
        cardArray.push(
          <div 
            key={`${rank}${suit}-${i}`}
            className={`${styles.card} inline-flex bg-white dark:bg-gray-100 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm dark:shadow-md dark:shadow-black/30 flex-col items-center justify-center gap-0.5 p-1 transition-transform hover:scale-105`}
          >
            <div className={`${styles.rank} leading-tight text-gray-900`}>{rank}</div>
            <div className={`${suitColor} ${styles.suit} leading-tight`}>{suitSymbol}</div>
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
