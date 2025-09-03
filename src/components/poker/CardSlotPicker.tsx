import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { X } from 'lucide-react';

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
  const [currentSelection, setCurrentSelection] = useState<{
    rank: string | null;
    suit: string | null;
  }>({
    rank: null,
    suit: null
  });

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
      setCurrentSelection({ rank: null, suit: null }); // Reset selection state
      setIsPickerOpen(true);
    }
  };

  // Clear a specific slot
  const clearSlot = (slotIndex: number) => {
    const newCards = [...selectedCards];
    newCards[slotIndex] = { id: slotIndex };
    onChange(newCards);
  };

  // Handle rank selection
  const handleRankSelect = (rank: string) => {
    if (suits.every(suit => isCardExcluded(rank, suit.symbol))) {
      return; // Don't allow selection if all suits are excluded
    }
    
    setCurrentSelection(prev => ({ ...prev, rank }));
    
    // If a suit is already selected, create the card
    if (currentSelection.suit && !isCardExcluded(rank, currentSelection.suit)) {
      handleCardSelect(rank, currentSelection.suit);
    }
  };

  // Handle suit selection
  const handleSuitSelect = (suit: string) => {
    if (ranks.every(rank => isCardExcluded(rank, suit))) {
      return; // Don't allow selection if all ranks are excluded
    }
    
    setCurrentSelection(prev => ({ ...prev, suit }));
    
    // If a rank is already selected, create the card
    if (currentSelection.rank && !isCardExcluded(currentSelection.rank, suit)) {
      handleCardSelect(currentSelection.rank, suit);
    }
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
    setCurrentSelection({ rank: null, suit: null });
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
              {/* Empty card slot - card back with yellow background and white diamond pattern */}
              <div className="w-full h-full bg-yellow-400 rounded border-2 border-white relative overflow-hidden">
                {/* Diamond pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: `
                      repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 3px,
                        white 3px,
                        white 6px
                      ),
                      repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 3px,
                        white 3px,
                        white 6px
                      )
                    `
                  }}
                >
                </div>
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
                  <TooltipProvider key={rank}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          key={rank}
                          type="button"
                          onClick={() => handleRankSelect(rank)}
                          disabled={suits.every(suit => isCardExcluded(rank, suit.symbol))}
                          className={cn(
                            "py-2 px-2 text-sm font-bold rounded transition-all",
                            currentSelection.rank === rank
                              ? "bg-primary text-white shadow-md"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-800",
                            suits.every(suit => isCardExcluded(rank, suit.symbol)) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {rank}
                        </button>
                      </TooltipTrigger>
                      {suits.every(suit => isCardExcluded(rank, suit.symbol)) && (
                        <TooltipContent>
                          <p>Already used</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1 mt-1">
                {ranks.slice(7).map(rank => (
                  <TooltipProvider key={rank}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          key={rank}
                          type="button"
                          onClick={() => handleRankSelect(rank)}
                          disabled={suits.every(suit => isCardExcluded(rank, suit.symbol))}
                          className={cn(
                            "py-2 px-2 text-sm font-bold rounded transition-all",
                            currentSelection.rank === rank
                              ? "bg-primary text-white shadow-md"
                              : "bg-gray-200 hover:bg-gray-300 text-gray-800",
                            suits.every(suit => isCardExcluded(rank, suit.symbol)) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {rank}
                        </button>
                      </TooltipTrigger>
                      {suits.every(suit => isCardExcluded(rank, suit.symbol)) && (
                        <TooltipContent>
                          <p>Already used</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>

            {/* Suits */}
            <div>
              <h4 className="text-sm font-medium mb-2">Suit</h4>
              <div className="grid grid-cols-4 gap-2">
                {suits.map(suit => (
                  <TooltipProvider key={suit.symbol}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          key={suit.symbol}
                          type="button"
                          onClick={() => handleSuitSelect(suit.symbol)}
                          disabled={ranks.every(rank => isCardExcluded(rank, suit.symbol))}
                          className={cn(
                            "py-3 px-2 text-2xl rounded transition-all flex items-center justify-center",
                            currentSelection.suit === suit.symbol
                              ? "bg-primary text-white shadow-md"
                              : "bg-gray-200 hover:bg-gray-300",
                            suit.color,
                            ranks.every(rank => isCardExcluded(rank, suit.symbol)) && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {suit.display}
                        </button>
                      </TooltipTrigger>
                      {ranks.every(rank => isCardExcluded(rank, suit.symbol)) && (
                        <TooltipContent>
                          <p>Already used</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
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