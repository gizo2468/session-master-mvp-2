import React, { useState, useRef, useEffect } from 'react';
import FloatingCardSelector from '@/components/ui/FloatingCardSelector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
// Using a custom persistent floating panel instead of Radix Popover to prevent auto-closures
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAIHandAnalyzer } from '@/hooks/useAIHandAnalyzer';
import { useSessionContext } from '@/context/SessionContext';
import { HandData } from '@/types/poker';
import { cn } from '@/lib/utils';
import CardDisplay from './CardDisplay';
import { toast } from 'sonner';


const normalizeSuit = (suit: string): string => {
  // Convert Unicode symbols or full names to letter codes
  const suitMap: Record<string, string> = {
    '♥': 'h', '♡': 'h', 'hearts': 'h', 'heart': 'h', 'H': 'h',
    '♦': 'd', '♢': 'd', 'diamonds': 'd', 'diamond': 'd', 'D': 'd',
    '♠': 's', '♤': 's', 'spades': 's', 'spade': 's', 'S': 's',
    '♣': 'c', '♧': 'c', 'clubs': 'c', 'club': 'c', 'C': 'c',
  };
  
  return suitMap[suit] || suit.toLowerCase();
};

const parseCards = (cards: any): Array<{rank: string, suit: string}> => {
  // If it's already an array of objects with rank and suit, return as-is
  if (Array.isArray(cards) && cards.length > 0 && cards[0]?.rank && cards[0]?.suit) {
    return cards;
  }
  
  // If it's a string, try to parse it
  if (typeof cards === 'string') {
    // Remove brackets, spaces, and commas
    const cleaned = cards.replace(/[\[\]\s,]/g, '');
    
    // Parse pairs of characters (rank + suit)
    const result = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i + 1 < cleaned.length) {
        result.push({
          rank: cleaned[i].toUpperCase(),
          suit: normalizeSuit(cleaned[i + 1])
        });
      }
    }
    return result;
  }
  
  return [];
};

interface AIHandAnalyzerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  tableId?: string;
  tableFormat?: 'Cash' | 'Tournament';
  onHandAdded?: () => void;
}

const AIHandAnalyzerDialog: React.FC<AIHandAnalyzerDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  tableId,
  tableFormat,
  onHandAdded
}) => {
  const { addTableHand, addHand } = useSessionContext();
  const { state, handleImageUpload, analyzeHand, setManualOverride, reset } = useAIHandAnalyzer();
  const [editBeforeApplying, setEditBeforeApplying] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [showFullImage, setShowFullImage] = useState(false);
  const [openEditor, setOpenEditor] = useState<{ type: 'hero' | 'flop' | 'turn' | 'river'; index: number } | null>(null);
  
  // Editable card states
  const [editedHeroCards, setEditedHeroCards] = useState<Array<{rank: string, suit: string} | null>>([null, null]);
  const [editedBoardFlop, setEditedBoardFlop] = useState<Array<{rank: string, suit: string} | null>>([null, null, null]);
  const [editedBoardTurn, setEditedBoardTurn] = useState<{rank: string, suit: string} | null>(null);
  const [editedBoardRiver, setEditedBoardRiver] = useState<{rank: string, suit: string} | null>(null);

  const handleClose = () => {
    reset();
    setEditBeforeApplying(false);
    setSelectedDealer('');
    setEditedHeroCards([null, null]);
    setEditedBoardFlop([null, null, null]);
    setEditedBoardTurn(null);
    setEditedBoardRiver(null);
    onOpenChange(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDealerConfirm = () => {
    if (selectedDealer) {
      setManualOverride('dealerPosition', selectedDealer);
      analyzeHand();
      setSelectedDealer('');
    }
  };

  // Get all currently selected cards to prevent duplicates
  const getAllSelectedCards = (): string[] => {
    if (!state.analysis) return [];
    
    const cards: string[] = [];
    
    // Hero cards
    const heroCards = state.analysis.hero.cards;
    if (Array.isArray(heroCards)) {
      heroCards.forEach((card, idx) => {
        const edited = editedHeroCards[idx];
        if (edited) {
          cards.push(`${edited.rank}${edited.suit}`);
        } else if (card.rank && card.suit) {
          cards.push(`${card.rank}${normalizeSuit(card.suit)}`);
        }
      });
    }
    
    // Board cards - Flop
    const flop = state.analysis.board.flop;
    if (Array.isArray(flop)) {
      flop.forEach((card, idx) => {
        const edited = editedBoardFlop[idx];
        if (edited) {
          cards.push(`${edited.rank}${edited.suit}`);
        } else if (card.rank && card.suit) {
          cards.push(`${card.rank}${normalizeSuit(card.suit)}`);
        }
      });
    }
    
    // Turn
    const turn = state.analysis.board.turn;
    if (editedBoardTurn) {
      cards.push(`${editedBoardTurn.rank}${editedBoardTurn.suit}`);
    } else if (turn?.rank && turn?.suit) {
      cards.push(`${turn.rank}${normalizeSuit(turn.suit)}`);
    }
    
    // River
    const river = state.analysis.board.river;
    if (editedBoardRiver) {
      cards.push(`${editedBoardRiver.rank}${editedBoardRiver.suit}`);
    } else if (river?.rank && river?.suit) {
      cards.push(`${river.rank}${normalizeSuit(river.suit)}`);
    }
    
    return cards;
  };

  // Get effective card (edited or original)
  const getEffectiveCard = (type: 'hero' | 'flop' | 'turn' | 'river', index: number) => {
    if (type === 'hero') {
      return editedHeroCards[index] || (Array.isArray(state.analysis?.hero.cards) ? state.analysis.hero.cards[index] : null);
    } else if (type === 'flop') {
      return editedBoardFlop[index] || (Array.isArray(state.analysis?.board.flop) ? state.analysis.board.flop[index] : null);
    } else if (type === 'turn') {
      return editedBoardTurn || state.analysis?.board.turn || null;
    } else if (type === 'river') {
      return editedBoardRiver || state.analysis?.board.river || null;
    }
    return null;
  };

  // Inline Card Grid Component for direct card selection
  const InlineCardGrid: React.FC<{
    currentCard: { rank: string; suit: string } | null;
    excludedCards: string[];
    onSelect: (rank: string, suit: string) => void;
    onClear: () => void;
  }> = ({ currentCard, excludedCards, onSelect, onClear }) => {
    const [selectedRank, setSelectedRank] = useState<string | null>(currentCard?.rank || null);
    const [selectedSuit, setSelectedSuit] = useState<string | null>(currentCard?.suit || null);

    const ranks = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const suits = [
      { symbol: 's', display: '♠', color: 'text-gray-900 dark:text-gray-100' },
      { symbol: 'h', display: '♥', color: 'text-red-600' },
      { symbol: 'd', display: '♦', color: 'text-red-600' },
      { symbol: 'c', display: '♣', color: 'text-gray-900 dark:text-gray-100' },
    ];

    const isCardExcluded = (rank: string, suit: string) => {
      return excludedCards.includes(`${rank}${suit}`);
    };

    const isRankDisabled = (rank: string) => {
      return suits.every(suit => isCardExcluded(rank, suit.symbol));
    };

    const isSuitDisabled = (suit: string) => {
      return ranks.every(rank => isCardExcluded(rank, suit));
    };

    const handleRankClick = (rank: string) => {
      if (isRankDisabled(rank)) return;
      setSelectedRank(rank);
      
      // If suit is already selected, complete the selection
      if (selectedSuit && !isCardExcluded(rank, selectedSuit)) {
        onSelect(rank, selectedSuit);
      }
    };

    const handleSuitClick = (suit: string) => {
      if (isSuitDisabled(suit)) return;
      setSelectedSuit(suit);
      
      // If rank is already selected, complete the selection
      if (selectedRank && !isCardExcluded(selectedRank, suit)) {
        onSelect(selectedRank, suit);
      }
    };

    return (
      <div className="space-y-3">
        {/* Header with clear button */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">Select Card</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Ranks Grid */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Select Rank</p>
          {/* First row: A K Q J T 9 8 */}
          <div className="grid grid-cols-7 gap-1">
            {ranks.slice(0, 7).map(rank => {
              const disabled = isRankDisabled(rank);
              const selected = selectedRank === rank;
              return (
                <button
                  key={rank}
                  type="button"
                  onClick={() => handleRankClick(rank)}
                  disabled={disabled}
                  className={cn(
                    "h-10 text-sm font-bold rounded transition-all",
                    selected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : disabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {rank}
                </button>
              );
            })}
          </div>
          {/* Second row: 7 6 5 4 3 2 */}
          <div className="grid grid-cols-6 gap-1">
            {ranks.slice(7).map(rank => {
              const disabled = isRankDisabled(rank);
              const selected = selectedRank === rank;
              return (
                <button
                  key={rank}
                  type="button"
                  onClick={() => handleRankClick(rank)}
                  disabled={disabled}
                  className={cn(
                    "h-10 text-sm font-bold rounded transition-all",
                    selected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : disabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  )}
                >
                  {rank}
                </button>
              );
            })}
          </div>
        </div>

        {/* Suits Grid */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Select Suit</p>
          <div className="grid grid-cols-4 gap-2">
            {suits.map(suit => {
              const disabled = isSuitDisabled(suit.symbol);
              const selected = selectedSuit === suit.symbol;
              return (
                <button
                  key={suit.symbol}
                  type="button"
                  onClick={() => handleSuitClick(suit.symbol)}
                  disabled={disabled}
                  className={cn(
                    "h-12 text-2xl rounded transition-all flex items-center justify-center",
                    selected
                      ? "bg-primary text-primary-foreground shadow-md"
                      : disabled
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : cn("bg-muted hover:bg-muted/80", suit.color)
                  )}
                >
                  {suit.display}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selection hint */}
        {selectedRank && selectedSuit && (
          <div className="text-xs text-center space-y-1">
            <p className="text-muted-foreground">
              Selected: {selectedRank}{suits.find(s => s.symbol === selectedSuit)?.display}
            </p>
            {isCardExcluded(selectedRank, selectedSuit) && (
              <p className="text-red-600 dark:text-red-500 font-medium">
                * This card is already selected.
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Editable Card Component with Popover
  const EditableCardWithPopover: React.FC<{
    card: {rank: string, suit: string} | null;
    type: 'hero' | 'flop' | 'turn' | 'river';
    index: number;
    isEdited: boolean;
    size?: 'sm' | 'md';
  }> = ({ card, type, index, isEdited, size = 'md' }) => {
    const btnRef = useRef<HTMLButtonElement>(null);
    const sizeClasses = {
      sm: { card: 'w-7 h-10 text-xs', suit: 'text-base' },
      md: { card: 'w-9 h-12 text-sm', suit: 'text-lg' }
    };
    
    const styles = sizeClasses[size];
    
    const handleCardSelection = (rank: string, suit: string) => {
      if (type === 'hero') {
        const newHeroCards = [...editedHeroCards];
        newHeroCards[index] = { rank, suit };
        setEditedHeroCards(newHeroCards);
      } else if (type === 'flop') {
        const newFlopCards = [...editedBoardFlop];
        newFlopCards[index] = { rank, suit };
        setEditedBoardFlop(newFlopCards);
      } else if (type === 'turn') {
        setEditedBoardTurn({ rank, suit });
      } else if (type === 'river') {
        setEditedBoardRiver({ rank, suit });
      }
      
      setOpenEditor(null);
    };

    const handleClear = () => {
      if (type === 'hero') {
        const newHeroCards = [...editedHeroCards];
        newHeroCards[index] = null;
        setEditedHeroCards(newHeroCards);
      } else if (type === 'flop') {
        const newFlopCards = [...editedBoardFlop];
        newFlopCards[index] = null;
        setEditedBoardFlop(newFlopCards);
      } else if (type === 'turn') {
        setEditedBoardTurn(null);
      } else if (type === 'river') {
        setEditedBoardRiver(null);
      }
      
      setOpenEditor(null);
    };
    
    let suitSymbol = '?';
    let suitColor = 'text-muted-foreground';
    
    if (card?.suit) {
      const suit = card.suit.toLowerCase();
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
          suitColor = 'text-foreground';
          break;
        case 'c':
          suitSymbol = '♣';
          suitColor = 'text-foreground';
          break;
      }
    }
    
    const cardButton = (
      <button
        ref={btnRef}
        type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpenEditor({ type, index });
          }}
        className={cn(
          styles.card,
          "relative inline-flex rounded-md shadow-md flex-col items-center justify-between py-1 px-0.5",
          "hover:scale-105 transition-all cursor-pointer group",
          !card || !card.rank || !card.suit
            ? "bg-muted border-2 border-dashed border-muted-foreground/30 hover:border-poker-gold hover:bg-poker-gold/5"
            : cn(
                "bg-card",
                isEdited 
                  ? "border-2 border-green-500" 
                  : "border-2 border-border hover:border-poker-gold"
              )
        )}
      >
        {!card || !card.rank || !card.suit ? (
          <span className="text-muted-foreground group-hover:text-poker-gold">?</span>
        ) : (
          <>
            <div className="font-bold leading-none">{card.rank}</div>
            <div className={cn(suitColor, styles.suit, "leading-none")}>{suitSymbol}</div>
            {/* Edited badge */}
            {isEdited && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8px] px-1 rounded">
                Edited
              </div>
            )}
          </>
        )}
      </button>
    );
    
    return (
      <>
        {cardButton}
        <FloatingCardSelector
          open={openEditor?.type === type && openEditor?.index === index}
          onClose={() => setOpenEditor(null)}
          anchorRef={btnRef}
          offset={8}
          width={320}
          placement="bottom"
          zIndex={1000}
        >
          <InlineCardGrid
            currentCard={card}
            excludedCards={getAllSelectedCards().filter(c => {
              const currentCardStr = card ? `${card.rank}${card.suit}` : null;
              return c !== currentCardStr;
            })}
            onSelect={handleCardSelection}
            onClear={handleClear}
          />
        </FloatingCardSelector>
      </>
    );
  };

  const handleApplyToForm = async () => {
    if (!state.analysis) {
      toast.error('No analysis data available');
      return;
    }

    try {
      const analysis = state.analysis;

      // Build hero cards - prioritize edited cards
      const heroCards = [0, 1].map(idx => getEffectiveCard('hero', idx)).filter(c => c);
      const heroCardsString = heroCards.length === 2
        ? heroCards.map(c => c!.rank + normalizeSuit(c!.suit)).join('')
        : '';

      // Build flop cards - prioritize edited
      const flopCards = [0, 1, 2]
        .map(idx => getEffectiveCard('flop', idx))
        .filter(c => c)
        .map(c => `${c!.rank}${normalizeSuit(c!.suit)}`);

      // Build turn card - prioritize edited
      const turnCard = getEffectiveCard('turn', 0);
      const turnCardString = turnCard ? `${turnCard.rank}${normalizeSuit(turnCard.suit)}` : '';

      // Build river card - prioritize edited
      const riverCard = getEffectiveCard('river', 0);
      const riverCardString = riverCard ? `${riverCard.rank}${normalizeSuit(riverCard.suit)}` : '';

      // Build villains data
      const villainsData = analysis.villains && analysis.villains.length > 0
        ? analysis.villains
            .filter(v => v.cards !== 'hidden' && Array.isArray(v.cards) && v.cards.length > 0)
            .map(v => ({
              position: v.position !== 'UNKNOWN' ? v.position : '',
              hand: Array.isArray(v.cards) ? v.cards.map(c => `${c.rank}${normalizeSuit(c.suit)}`).join('') : undefined,
              bigBlind: v.stackUnit === 'BB' ? v.stack : undefined
            }))
        : [];

      // Extract actions
      const flopAction = analysis.actions.find(a => a.street === 'flop');
      const turnAction = analysis.actions.find(a => a.street === 'turn');
      const riverAction = analysis.actions.find(a => a.street === 'river');

      // Create hand data object
      const handData: Omit<HandData, 'id' | 'createdAt' | 'tableId'> = {
        cards: heroCardsString,
        position: analysis.hero?.position !== 'UNKNOWN' ? analysis.hero.position : '',
        action: '', // Preflop action not tracked in current AI response
        flopCards,
        flopAction: flopAction?.description || '',
        turnCard: turnCardString,
        turnAction: turnAction?.description || '',
        riverCard: riverCardString,
        riverAction: riverAction?.description || '',
        result: analysis.result?.outcome !== 'unknown' ? analysis.result.outcome : '',
        villains: villainsData,
        notes: '',
        image: state.image || undefined
      };

      // Add hand to table or session
      if (tableId) {
        addTableHand(sessionId, tableId, handData);
      } else {
        addHand(sessionId, handData);
      }

      toast.success('Hand added successfully');
      
      // Close both dialogs
      handleClose();
      onHandAdded?.();
    } catch (error) {
      console.error('Error adding hand:', error);
      toast.error('Failed to add hand. Please try again.');
    }
  };

  const positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Hand Analyzer</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your poker hand for automatic analysis
            <br />
            Make sure your screenshot is clear and not blurry.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload State */}
          {state.status === 'idle' && !state.image && (
            <>
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:bg-poker-gold/5 transition-colors">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drop poker hand screenshot here
                </p>
                <label htmlFor="hand-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
                <input
                  id="hand-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: JPG, PNG, WebP (max 10MB)
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                We apologize for any temporary issues. Our AI is improving every day to provide better accuracy.
              </p>
            </>
          )}

          {/* Uploading State */}
          {state.status === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-poker-gold mb-4" />
              <p className="text-sm font-medium">Processing image...</p>
              <p className="text-xs text-muted-foreground mt-1">
                Optimizing for analysis
              </p>
            </div>
          )}

          {/* Image Preview */}
          {state.image && state.status === 'idle' && (
            <div className="space-y-3">
              <img
                src={state.image}
                alt="Poker hand screenshot"
                className="w-full rounded-lg border"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={analyzeHand}
                  className="flex-1 bg-poker-gold hover:bg-poker-darkGold text-white"
                >
                  Analyze Hand
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                >
                  Change Image
                </Button>
              </div>
            </div>
          )}

          {/* Analyzing State */}
          {state.status === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-poker-gold mb-4" />
              <p className="text-sm font-medium">Analyzing hand...</p>
              <p className="text-xs text-muted-foreground mt-1">
                This may take up to 60 seconds
              </p>
            </div>
          )}

          {/* Unsupported Format */}
          {state.status === 'unsupportedFormat' && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="w-full"
              >
                Try Another Hand
              </Button>
            </div>
          )}

          {/* Dealer Selection Needed */}
          {state.status === 'needsDealerSelection' && (
            <div className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Could not confidently detect dealer button position. Please select manually:
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="relative w-48 h-48">
                  {positions.map((pos, idx) => {
                    const angle = (idx * 60) - 90;
                    const radian = (angle * Math.PI) / 180;
                    const x = 96 + 80 * Math.cos(radian);
                    const y = 96 + 80 * Math.sin(radian);
                    
                    return (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setSelectedDealer(pos)}
                        className={cn(
                          "absolute w-12 h-12 rounded-full border-2 text-sm font-semibold transition-all",
                          selectedDealer === pos
                            ? "bg-poker-gold border-poker-gold text-white"
                            : "bg-background border-muted-foreground/30 hover:border-poker-gold"
                        )}
                        style={{
                          left: `${x - 24}px`,
                          top: `${y - 24}px`,
                        }}
                      >
                        {pos}
                      </button>
                    );
                  })}
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold">
                    D
                  </div>
                </div>
                
                <Button
                  type="button"
                  onClick={handleDealerConfirm}
                  className="bg-poker-gold hover:bg-poker-darkGold text-white"
                >
                  Confirm Dealer Position
                </Button>
              </div>
            </div>
          )}

          {/* Success - Analysis Results */}
          {state.status === 'success' && state.analysis && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  Hand analyzed successfully in {(state.analysis.metadata.processingTimeMs / 1000).toFixed(1)}s
                </AlertDescription>
              </Alert>

              <div className="space-y-4 text-sm">
                {/* Game Overview */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <h4 className="font-semibold text-base">Game Overview</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Players in Hand:</span>
                      <span className="ml-2 font-medium">
                        {state.analysis.metadata.playerCount || (1 + (state.analysis.villains?.length || 0))}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Game Type:</span>
                      <span className="ml-2 font-medium">{state.analysis.gameContext.gameType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <span className="ml-2 font-medium capitalize">{state.analysis.gameContext.format}</span>
                    </div>
                    {state.analysis.gameContext.blindLevel && (
                      <div>
                        <span className="text-muted-foreground">Blinds:</span>
                        <span className="ml-2 font-medium">
                          {state.analysis.gameContext.blindLevel.sb}/{state.analysis.gameContext.blindLevel.bb}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Screenshot Thumbnail */}
                  {state.image && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                      <button
                        type="button"
                        onClick={() => setShowFullImage(true)}
                        className="group relative w-20 h-14 rounded border border-muted-foreground/20 overflow-hidden hover:border-poker-gold transition-colors"
                      >
                        <img
                          src={state.image}
                          alt="Hand screenshot thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 px-1.5 py-0.5 rounded">
                            View
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Hero */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    Hero 
                    <span className="hidden text-xs font-normal bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded">
                      Bottom-Center Player
                    </span>
                    {state.analysis.hero.position !== 'UNKNOWN' && (
                      <span className={`text-xs font-normal px-2 py-0.5 rounded ${
                        state.analysis.dealerButton?.confidence < 0.5 || state.analysis.hero.confidence < 0.6
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-poker-gold/20 text-poker-gold'
                      }`}>
                        {state.analysis.hero.position}
                        {(state.analysis.dealerButton?.confidence < 0.5 || state.analysis.hero.confidence < 0.6) && (
                          <span className="ml-1" title="Low confidence position detection">⚠</span>
                        )}
                      </span>
                    )}
                  </h4>

                  <div className="space-y-2">
                    {/* Hero Cards - Now Editable */}
                    <div className="flex items-center gap-3">
                      {state.analysis.hero.cards === 'hidden' ? (
                        <div className="flex items-center gap-2">
                          <CardDisplay cards="??" size="md" />
                          <span className="text-sm text-muted-foreground">Cards not visible</span>
                        </div>
                      ) : Array.isArray(state.analysis.hero.cards) ? (
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[0, 1].map(idx => {
                              const effectiveCard = getEffectiveCard('hero', idx);
                              const isEdited = editedHeroCards[idx] !== null;
                              return (
                                <EditableCardWithPopover
                                  key={idx}
                                  card={effectiveCard}
                                  type="hero"
                                  index={idx}
                                  isEdited={isEdited}
                                  size="md"
                                />
                              );
                            })}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-mono font-semibold">
                              {[0, 1].map(idx => {
                                const card = getEffectiveCard('hero', idx);
                                return card ? `${card.rank}${card.suit.toUpperCase()}` : '?';
                              }).join(' ')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Click cards to edit
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-red-600">Detection failed</span>
                      )}
                    </div>
                    
                    {/* Dealer Button Info */}
                    {state.analysis.dealerButton && (
                      <div className="hidden text-xs text-muted-foreground flex items-center gap-2">
                        <span>Dealer Button:</span>
                        <span className="font-medium">
                          {state.analysis.dealerButton.position || 'Not detected'}
                        </span>
                        {state.analysis.dealerButton.confidence < 0.7 && (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            (Low confidence: {Math.round(state.analysis.dealerButton.confidence * 100)}%)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stack Info */}
                    {state.analysis.hero.stack && (
                      <div className="text-xs text-muted-foreground">
                        Stack: <span className="font-medium">{state.analysis.hero.stack}</span> {state.analysis.hero.stackUnit || 'chips'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Board Cards - Now Editable */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Board</h4>
                  {state.analysis.board.flop && Array.isArray(state.analysis.board.flop) && state.analysis.board.flop.length > 0 ? (
                    <div className="flex items-start gap-6">
                      {/* Flop - Editable */}
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">Flop</span>
                        <div className="flex gap-1">
                          {[0, 1, 2].map(idx => {
                            const effectiveCard = getEffectiveCard('flop', idx);
                            const isEdited = editedBoardFlop[idx] !== null;
                            return (
                              <EditableCardWithPopover
                                key={idx}
                                card={effectiveCard}
                                type="flop"
                                index={idx}
                                isEdited={isEdited}
                                size="sm"
                              />
                            );
                          })}
                        </div>
                        <span className="text-xs font-mono text-muted-foreground text-center">
                          {[0, 1, 2].map(idx => {
                            const card = getEffectiveCard('flop', idx);
                            return card ? `${card.rank}${card.suit.toUpperCase()}` : '?';
                          }).join(' ')}
                        </span>
                      </div>
                      
                      {/* Turn - Editable */}
                      {(state.analysis.board.turn || editedBoardTurn) && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground">Turn</span>
                          <EditableCardWithPopover
                            card={getEffectiveCard('turn', 0)}
                            type="turn"
                            index={0}
                            isEdited={editedBoardTurn !== null}
                            size="sm"
                          />
                          <span className="text-xs font-mono text-muted-foreground text-center">
                            {(() => {
                              const card = getEffectiveCard('turn', 0);
                              return card ? `${card.rank}${card.suit.toUpperCase()}` : '?';
                            })()}
                          </span>
                        </div>
                      )}
                      
                      {/* River - Editable */}
                      {(state.analysis.board.river || editedBoardRiver) && (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground">River</span>
                          <EditableCardWithPopover
                            card={getEffectiveCard('river', 0)}
                            type="river"
                            index={0}
                            isEdited={editedBoardRiver !== null}
                            size="sm"
                          />
                          <span className="text-xs font-mono text-muted-foreground text-center">
                            {(() => {
                              const card = getEffectiveCard('river', 0);
                              return card ? `${card.rank}${card.suit.toUpperCase()}` : '?';
                            })()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No board cards (hand ended preflop)</p>
                  )}
                </div>

                {/* Action Sequences */}
                {state.analysis.actions && state.analysis.actions.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Action Sequence</h4>
                    <div className="space-y-3">
                      {state.analysis.actions.map((streetAction, idx) => (
                        <div key={idx} className="border-l-2 border-poker-gold/30 pl-3">
                          <h5 className="font-medium text-xs uppercase text-poker-gold mb-1">
                            {streetAction.street}
                          </h5>
                {streetAction.sequence && Array.isArray(streetAction.sequence) && streetAction.sequence.length > 0 ? (
                            <ul className="space-y-1 text-xs">
                              {streetAction.sequence.map((action, actionIdx) => (
                                <li 
                                  key={actionIdx} 
                                  className={cn(
                                    "text-muted-foreground",
                                    action.player === "Hero" && "bg-yellow-400/20 -ml-1 pl-1 -mr-1 pr-1 rounded"
                                  )}
                                >
                                  <span className={cn(
                                    "font-medium",
                                    action.player === "Hero" ? "text-yellow-600 dark:text-yellow-500" : "text-foreground"
                                  )}>
                                    {action.player === "Hero" && state.analysis.hero.name 
                                      ? `Hero (${state.analysis.hero.name})`
                                      : action.player}:
                                  </span>{' '}
                                  <span className="capitalize">{action.action}</span>
                                  {action.amount && ` (${action.amount})`}
                                  {action.confidence < 0.7 && (
                                    <span className="text-yellow-600 ml-1">(?)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-muted-foreground italic">
                              {streetAction.description || 'No detailed actions detected'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result */}
                {state.analysis.result.summary && (
                  <div>
                    <h4 className="font-semibold mb-1">Result</h4>
                    <p className="text-muted-foreground">
                      {state.analysis.result.summary}
                      {state.analysis.result.amount && state.analysis.result.outcome !== 'unknown' && (
                        <span className={cn(
                          "ml-2 font-medium",
                          state.analysis.result.outcome === 'win' ? "text-green-600" : "text-red-600"
                        )}>
                          ({state.analysis.result.outcome === 'win' ? '+' : '-'}{state.analysis.result.amount})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Warnings */}
                {state.analysis.metadata.warnings && state.analysis.metadata.warnings.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside text-xs">
                        {state.analysis.metadata.warnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-before-apply"
                  checked={editBeforeApplying}
                  onCheckedChange={(checked) => setEditBeforeApplying(checked as boolean)}
                />
                <Label htmlFor="edit-before-apply" className="text-sm cursor-pointer">
                  Review and edit before applying to form
                </Label>
              </div>
            </div>
          )}

          {/* Error State */}
          {state.status === 'error' && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
                className="w-full bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          
          {state.status === 'success' && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={reset}
              >
                Analyze Another
              </Button>
              <Button
                type="button"
                onClick={handleApplyToForm}
                className="bg-poker-gold hover:bg-poker-darkGold text-white"
              >
                {tableId ? 'Add to Table' : 'Add Hand'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>


      {/* Full-size Image Modal */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 [&>button]:hidden">
          <div className="relative w-full h-full">
            <img
              src={state.image || ''}
              alt="Full-size hand screenshot"
              className="w-full h-auto"
            />
            {/* Custom close button with high visibility */}
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute right-4 top-4 z-50 w-10 h-10 rounded-full bg-black flex items-center justify-center hover:bg-black/90 active:bg-black/80 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
              aria-label="Close full-size image"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AIHandAnalyzerDialog;
