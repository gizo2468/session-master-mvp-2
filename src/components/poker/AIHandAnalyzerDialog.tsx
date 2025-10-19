import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAIHandAnalyzer } from '@/hooks/useAIHandAnalyzer';
import { UseFormSetValue } from 'react-hook-form';
import { FormValues } from '@/utils/handFormHelpers';
import { cn } from '@/lib/utils';
import CardDisplay from './CardDisplay';

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
  setValue: UseFormSetValue<FormValues>;
  currentFormValues: Partial<FormValues>;
}

const AIHandAnalyzerDialog: React.FC<AIHandAnalyzerDialogProps> = ({
  open,
  onOpenChange,
  setValue,
  currentFormValues
}) => {
  const { state, handleImageUpload, analyzeHand, setManualOverride, reset } = useAIHandAnalyzer();
  const [editBeforeApplying, setEditBeforeApplying] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState<string>('');
  const [showFullImage, setShowFullImage] = useState(false);

  const handleClose = () => {
    reset();
    setEditBeforeApplying(false);
    setSelectedDealer('');
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

  const handleApplyToForm = () => {
    if (!state.analysis) return;

    const analysis = state.analysis;
    
    // Helper: only apply if field is truly empty
    const isEmpty = (val: any) => 
      val === undefined || 
      val === null || 
      val === '' || 
      (Array.isArray(val) && val.length === 0);

    // Hero cards
    if (isEmpty(currentFormValues.cards) && analysis.hero.cards !== 'hidden' && Array.isArray(analysis.hero.cards)) {
      const cardsString = analysis.hero.cards
        .map(c => c.rank + c.suit.charAt(0).toLowerCase())
        .join('');
      setValue('cards', cardsString, { shouldValidate: true });
    }

    // Position
    if (isEmpty(currentFormValues.position) && analysis.hero.position !== 'UNKNOWN') {
      setValue('position', analysis.hero.position, { shouldValidate: true });
    }

    // Board cards - Flop
    if (isEmpty(currentFormValues.flopCards) && analysis.board.flop && analysis.board.flop.length === 3) {
      const flopCards = analysis.board.flop.map((c, idx) => ({
        id: idx,
        rank: c.rank,
        suit: c.suit.toLowerCase()
      }));
      setValue('flopCards', flopCards, { shouldValidate: true });
    }

    // Turn
    if (isEmpty(currentFormValues.turnCards) && analysis.board.turn) {
      setValue('turnCards', [{
        id: 0,
        rank: analysis.board.turn.rank,
        suit: analysis.board.turn.suit.toLowerCase()
      }], { shouldValidate: true });
    }

    // River
    if (isEmpty(currentFormValues.riverCards) && analysis.board.river) {
      setValue('riverCards', [{
        id: 0,
        rank: analysis.board.river.rank,
        suit: analysis.board.river.suit.toLowerCase()
      }], { shouldValidate: true });
    }

    // Actions by street
    const flopAction = analysis.actions.find(a => a.street === 'flop');
    if (flopAction && isEmpty(currentFormValues.flopAction)) {
      setValue('flopAction', flopAction.description, { shouldValidate: true });
    }

    const turnAction = analysis.actions.find(a => a.street === 'turn');
    if (turnAction && isEmpty(currentFormValues.turnAction)) {
      setValue('turnAction', turnAction.description, { shouldValidate: true });
    }

    const riverAction = analysis.actions.find(a => a.street === 'river');
    if (riverAction && isEmpty(currentFormValues.riverAction)) {
      setValue('riverAction', riverAction.description, { shouldValidate: true });
    }

    // Villains
    if (isEmpty(currentFormValues.villains) && analysis.villains.length > 0) {
      const villainsData = analysis.villains
        .filter(v => v.cards !== 'hidden' && Array.isArray(v.cards) && v.cards.length > 0)
        .map(v => ({
          hand: Array.isArray(v.cards) ? v.cards.map(c => `${c.rank}${c.suit.charAt(0).toLowerCase()}`).join('') : undefined,
          position: v.position !== 'UNKNOWN' ? v.position : undefined,
          bigBlind: v.stackUnit === 'BB' ? v.stack : undefined
        }));
      
      if (villainsData.length > 0) {
        setValue('villains', villainsData, { shouldValidate: true });
      }
    }

    // Result
    if (isEmpty(currentFormValues.result) && analysis.result.outcome !== 'unknown') {
      setValue('result', analysis.result.outcome, { shouldValidate: true });
    }

    handleClose();
  };

  const positions = ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI Hand Analyzer</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your poker hand for automatic analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Privacy Note */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Images are processed securely and temporarily. No personal data is stored or logged.
            </AlertDescription>
          </Alert>

          {/* Upload State */}
          {state.status === 'idle' && !state.image && (
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
                This may take up to 30 seconds
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
                    {state.analysis.hero.position !== 'UNKNOWN' && (
                      <span className="text-xs font-normal bg-poker-gold/20 text-poker-gold px-2 py-0.5 rounded">
                        {state.analysis.hero.position}
                      </span>
                    )}
                  </h4>
                  
                  <div className="space-y-2">
                    {/* Cards Display */}
                    <div className="flex items-center gap-3">
                      {state.analysis.hero.cards === 'hidden' ? (
                        <div className="flex items-center gap-2">
                          <CardDisplay cards="??" size="md" />
                          <span className="text-sm text-muted-foreground">Cards not visible</span>
                        </div>
                      ) : Array.isArray(state.analysis.hero.cards) && state.analysis.hero.cards.length > 0 ? (
                        <>
                          {(() => {
                            const parsedCards = parseCards(state.analysis.hero.cards);
                            const cardString = parsedCards
                              .map(c => `${c.rank}${normalizeSuit(c.suit)}`)
                              .join('');
                            
                            return (
                              <div className="flex items-center gap-3">
                                <CardDisplay cards={cardString || '??'} size="md" showCardNames={false} />
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-sm font-mono font-semibold">
                                    {parsedCards.map(c => `${c.rank}${c.suit.toUpperCase()}`).join(' ')}
                                  </span>
                                  {state.analysis.hero.confidence < 0.8 && (
                                    <span className="text-xs text-yellow-600">
                                      Confidence: {Math.round(state.analysis.hero.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CardDisplay cards="??" size="md" />
                          <span className="text-sm text-muted-foreground italic">
                            Could not detect cards
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Stack Info */}
                    {state.analysis.hero.stack && (
                      <div className="text-xs text-muted-foreground">
                        Stack: <span className="font-medium">{state.analysis.hero.stack}</span> {state.analysis.hero.stackUnit || 'chips'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Board Cards */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="font-semibold mb-2">Board</h4>
                  {state.analysis.board.flop && Array.isArray(state.analysis.board.flop) && state.analysis.board.flop.length > 0 ? (
                    <div className="space-y-3">
                      {/* Flop */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground min-w-[50px]">Flop:</span>
                        {(() => {
                          const parsedFlop = parseCards(state.analysis.board.flop);
                          const flopString = parsedFlop
                            .map(c => `${c.rank}${normalizeSuit(c.suit)}`)
                            .join('');
                          
                          return (
                            <>
                              <CardDisplay cards={flopString || '??????'} size="sm" showCardNames={false} />
                              {flopString && (
                                <span className="text-xs font-mono text-muted-foreground">
                                  {parsedFlop.map(c => `${c.rank}${c.suit.toUpperCase()}`).join(' ')}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      
                      {/* Turn */}
                      {state.analysis.board.turn?.rank && state.analysis.board.turn?.suit && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground min-w-[50px]">Turn:</span>
                          {(() => {
                            const turnCard = `${state.analysis.board.turn.rank}${normalizeSuit(state.analysis.board.turn.suit)}`;
                            return (
                              <>
                                <CardDisplay cards={turnCard} size="sm" showCardNames={false} />
                                <span className="text-xs font-mono text-muted-foreground">
                                  {state.analysis.board.turn.rank}{state.analysis.board.turn.suit.toUpperCase()}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      
                      {/* River */}
                      {state.analysis.board.river?.rank && state.analysis.board.river?.suit && (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground min-w-[50px]">River:</span>
                          {(() => {
                            const riverCard = `${state.analysis.board.river.rank}${normalizeSuit(state.analysis.board.river.suit)}`;
                            return (
                              <>
                                <CardDisplay cards={riverCard} size="sm" showCardNames={false} />
                                <span className="text-xs font-mono text-muted-foreground">
                                  {state.analysis.board.river.rank}{state.analysis.board.river.suit.toUpperCase()}
                                </span>
                              </>
                            );
                          })()}
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
                                <li key={actionIdx} className="text-muted-foreground">
                                  <span className="font-medium text-foreground">{action.player}:</span>{' '}
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
                Apply to Form
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Full-size Image Modal */}
      <Dialog open={showFullImage} onOpenChange={setShowFullImage}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0">
          <div className="relative w-full h-full">
            <img
              src={state.image || ''}
              alt="Full-size hand screenshot"
              className="w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default AIHandAnalyzerDialog;
