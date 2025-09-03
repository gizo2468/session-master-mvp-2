import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardSlot {
  id?: number;
  rank?: string;
  suit?: string;
}

interface CardSlotPickerProps {
  slots: number;
  selectedCards: CardSlot[];
  onChange: (cards: CardSlot[]) => void;
  excludedCards?: string[]; // Array of card strings like ["Ah", "Ks"]
  disabled?: boolean;
}

const CardSlotPicker: React.FC<CardSlotPickerProps> = ({
  slots,
  selectedCards,
  onChange,
  excludedCards = [],
  disabled = false
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);

  const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
  const suits = [
    { symbol: 's', display: '♠', color: 'text-black' },
    { symbol: 'h', display: '♥', color: 'text-red-600' },
    { symbol: 'd', display: '♦', color: 'text-red-600' },
    { symbol: 'c', display: '♣', color: 'text-black' },
  ];

  // Convert selected cards to string format for exclusion checking
  const getCardString = (rank: string, suit: string) => rank + suit;

  // Check if a card is excluded (already used elsewhere)
  const isCardExcluded = (rank: string, suit: string) => {
    const cardString = getCardString(rank, suit);
    return excludedCards.includes(cardString) || 
           selectedCards.some(card => card.rank === rank && card.suit === suit);
  };

  // Handle slot tap - open picker for empty slots, clear for filled slots
  const handleSlotTap = (slotIndex: number) => {
    if (disabled) return;
    
    const slot = selectedCards[slotIndex];
    if (slot?.rank && slot?.suit) {
      // Clear the slot
      clearSlot(slotIndex);
    } else {
      // Open picker for this slot
      setActiveSlotIndex(slotIndex);
      setIsPickerOpen(true);
    }
  };

  // Clear a specific slot
  const clearSlot = (slotIndex: number) => {
    const newCards = [...selectedCards];
    newCards[slotIndex] = { id: slotIndex };
    onChange(newCards);
  };

  // Handle card selection from picker
  const handleCardSelect = (rank: string, suit: string) => {
    if (activeSlotIndex === null || isCardExcluded(rank, suit)) return;
    
    const newCards = [...selectedCards];
    newCards[activeSlotIndex] = { 
      id: activeSlotIndex, 
      rank, 
      suit 
    };
    onChange(newCards);
    setIsPickerOpen(false);
    setActiveSlotIndex(null);
  };

  // Get suit info for display
  const getSuitInfo = (suitSymbol: string) => {
    return suits.find(s => s.symbol === suitSymbol) || { display: '?', color: 'text-gray-500' };
  };

  // Ensure we have the right number of slots
  const displaySlots = Array.from({ length: slots }, (_, index) => 
    selectedCards[index] || { id: index }
  );

  return (
    <div className="flex flex-wrap gap-2">
      {displaySlots.map((slot, index) => (
        <button
          key={slot.id ?? index}
          type="button"
          onClick={() => handleSlotTap(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-16 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center transition-all",
            "hover:border-primary/50 hover:bg-muted/20",
            disabled && "opacity-50 cursor-not-allowed",
            !disabled && "cursor-pointer"
          )}
        >
          {slot.rank && slot.suit ? (
            <>
              {/* Filled card slot */}
              <div className="relative w-full h-full bg-white border border-gray-200 rounded flex flex-col items-center justify-between p-1">
                <div className="font-bold text-sm">{slot.rank}</div>
                <div className={`${getSuitInfo(slot.suit).color} text-lg`}>
                  {getSuitInfo(slot.suit).display}
                </div>
                {/* Small X overlay for clearing */}
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
                  <X className="w-2 h-2" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Empty card slot - card back */}
              <div className="w-full h-full bg-gradient-to-br from-blue-900 to-blue-700 rounded flex items-center justify-center">
                <div className="text-xs text-white/70 rotate-12">♠♥♦♣</div>
              </div>
            </>
          )}
        </button>
      ))}

      {/* Card Picker Modal */}
      <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Card</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Ranks */}
            <div>
              <h4 className="text-sm font-medium mb-2">Rank</h4>
              <div className="grid grid-cols-7 gap-1">
                {ranks.slice(0, 7).map(rank => (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => {
                      // Find the first available suit for this rank
                      const availableSuit = suits.find(suit => 
                        !isCardExcluded(rank, suit.symbol)
                      );
                      if (availableSuit) {
                        handleCardSelect(rank, availableSuit.symbol);
                      }
                    }}
                    disabled={suits.every(suit => isCardExcluded(rank, suit.symbol))}
                    className={cn(
                      "py-2 px-2 text-sm font-bold rounded transition-all",
                      "bg-gray-200 hover:bg-gray-300 text-gray-800",
                      suits.every(suit => isCardExcluded(rank, suit.symbol)) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {rank}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1 mt-1">
                {ranks.slice(7).map(rank => (
                  <button
                    key={rank}
                    type="button"
                    onClick={() => {
                      // Find the first available suit for this rank
                      const availableSuit = suits.find(suit => 
                        !isCardExcluded(rank, suit.symbol)
                      );
                      if (availableSuit) {
                        handleCardSelect(rank, availableSuit.symbol);
                      }
                    }}
                    disabled={suits.every(suit => isCardExcluded(rank, suit.symbol))}
                    className={cn(
                      "py-2 px-2 text-sm font-bold rounded transition-all",
                      "bg-gray-200 hover:bg-gray-300 text-gray-800",
                      suits.every(suit => isCardExcluded(rank, suit.symbol)) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {rank}
                  </button>
                ))}
              </div>
            </div>

            {/* Suits */}
            <div>
              <h4 className="text-sm font-medium mb-2">Suit</h4>
              <div className="grid grid-cols-4 gap-2">
                {suits.map(suit => (
                  <div key={suit.symbol} className="space-y-1">
                    <div className="text-center text-sm font-medium">
                      <span className={suit.color}>{suit.display}</span>
                    </div>
                    {/* Show available ranks for this suit */}
                    <div className="grid grid-cols-4 gap-0.5">
                      {ranks.map(rank => (
                        <button
                          key={`${rank}${suit.symbol}`}
                          type="button"
                          onClick={() => handleCardSelect(rank, suit.symbol)}
                          disabled={isCardExcluded(rank, suit.symbol)}
                          className={cn(
                            "py-1 px-1 text-xs rounded transition-all",
                            !isCardExcluded(rank, suit.symbol) 
                              ? "bg-gray-100 hover:bg-primary/20 text-gray-800"
                              : "opacity-30 cursor-not-allowed bg-gray-50"
                          )}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CardSlotPicker;