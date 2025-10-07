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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>AI Hand Analyzer</DialogTitle>
          <DialogDescription>
            Upload a screenshot of your poker hand for automatic analysis
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
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
                    disabled={!selectedDealer}
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

                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-semibold mb-1">Hero ({state.analysis.hero.position})</h4>
                    <p className="text-muted-foreground">
                      {state.analysis.hero.cards === 'hidden' ? 
                        'Cards not visible' : 
                        Array.isArray(state.analysis.hero.cards) ?
                          state.analysis.hero.cards.map(c => `${c.rank}${c.suit}`).join(' ') :
                          'Unknown'
                      }
                      {state.analysis.hero.confidence < 0.8 && (
                        <span className="text-xs text-yellow-600 ml-2">
                          (Confidence: {Math.round(state.analysis.hero.confidence * 100)}%)
                        </span>
                      )}
                    </p>
                  </div>

                  {state.analysis.board.flop && (
                    <div>
                      <h4 className="font-semibold mb-1">Board</h4>
                      <p className="text-muted-foreground">
                        Flop: {state.analysis.board.flop.map(c => `${c.rank}${c.suit}`).join(' ')}
                        {state.analysis.board.turn && ` | Turn: ${state.analysis.board.turn.rank}${state.analysis.board.turn.suit}`}
                        {state.analysis.board.river && ` | River: ${state.analysis.board.river.rank}${state.analysis.board.river.suit}`}
                      </p>
                    </div>
                  )}

                  {state.analysis.result.summary && (
                    <div>
                      <h4 className="font-semibold mb-1">Result</h4>
                      <p className="text-muted-foreground">
                        {state.analysis.result.summary}
                      </p>
                    </div>
                  )}

                  {state.analysis.metadata.warnings.length > 0 && (
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
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

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
    </Dialog>
  );
};

export default AIHandAnalyzerDialog;
