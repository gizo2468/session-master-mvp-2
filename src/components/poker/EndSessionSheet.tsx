
import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PokerSession } from '@/types/poker';
import { AlertTriangle, DollarSign, ChevronDown, Pencil, Clock } from 'lucide-react';
import { getCurrencySymbol } from '@/hooks/useDefaultCurrency';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface EndSessionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: PokerSession;
  autoCashOutAmount: number;
  sessionNotes: string;
  onSessionNotesChange: (notes: string) => void;
  onEndSession: () => void;
  currency?: string;
  onCustomDurationChange?: (durationSeconds: number) => void;
}

const EndSessionSheet: React.FC<EndSessionSheetProps> = ({
  open,
  onOpenChange,
  session,
  autoCashOutAmount,
  sessionNotes,
  onSessionNotesChange,
  onEndSession,
  currency,
  onCustomDurationChange,
}) => {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [customDuration, setCustomDuration] = useState({ hours: 0, minutes: 0 });
  const [displayDuration, setDisplayDuration] = useState(0);

  const currencySymbol = getCurrencySymbol(currency);
  const activeTables = session.tables?.filter(table => table.isActive) || [];
  const hasActiveTables = activeTables.length > 0;
  
  // Check if any tables are missing results
  const tablesWithoutResults = session.tables?.filter(table => 
    table.isActive && (table.cashOut === undefined || table.cashOut === null)
  ) || [];

  const profit = autoCashOutAmount - session.buyIn;

  // Calculate additional session statistics
  const tablesPlayed = session.tables?.length || 0;
  
  const handsEntered = (session.hands?.length || 0) + 
    (session.tables?.reduce((total, table) => total + (table.hands?.length || 0), 0) || 0);
  
  const cashoutsRecorded = session.tables?.filter(table => 
    !table.isActive && typeof table.cashOut === 'number' && table.cashOut > 0
  ).length || 0;
  
  const roi = session.buyIn > 0 ? ((profit / session.buyIn) * 100) : 0;

  // Calculate session duration in seconds
  const calculateDuration = () => {
    if (session.sessionDuration && session.sessionDuration > 0) {
      return session.sessionDuration;
    }
    
    const startTime = session.startTimeUTC || (session.startTime ? new Date(session.startTime).getTime() : null);
    if (!startTime) return 0;
    
    return Math.floor((Date.now() - startTime) / 1000);
  };

  // Initialize duration on open
  useEffect(() => {
    if (open) {
      const duration = calculateDuration();
      setDisplayDuration(duration);
      
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      setCustomDuration({ hours, minutes });
    }
  }, [open, session]);

  // Format duration as human readable
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleSaveDuration = () => {
    const totalSeconds = (customDuration.hours * 3600) + (customDuration.minutes * 60);
    setDisplayDuration(totalSeconds);
    
    if (onCustomDurationChange) {
      onCustomDurationChange(totalSeconds);
    }
    setShowDurationModal(false);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[80vh] flex flex-col">
          <SheetHeader className="text-center flex-shrink-0">
            <SheetTitle>End Session</SheetTitle>
            <SheetDescription>
              Review your session details before ending
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-6 space-y-6">
            {hasActiveTables && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertTriangle size={20} />
                  <span className="font-medium">Active Tables Detected</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  You have {activeTables.length} active table(s) that need to be ended before you can close this session.
                </p>
                <ul className="mt-2 text-sm text-yellow-700">
                  {activeTables.map((table, index) => (
                    <li key={table.id} className="ml-4">
                      • {table.name || table.location || `Table ${index + 1}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-background rounded-lg p-4">
              {/* Gold centered title */}
              <div data-tour="end-session-summary" className="flex items-center justify-center gap-2 mb-3">
                <DollarSign size={20} className="text-poker-gold" />
                <span className="font-medium text-poker-gold">Session Summary</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Total Buy-in</div>
                  <div className="font-medium">{currencySymbol}{session.buyIn.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Total Cash-out</div>
                  <div className="font-medium">{currencySymbol}{autoCashOutAmount.toFixed(2)}</div>
                </div>
                
                {/* Session Duration with Edit */}
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Session Duration</div>
                  <div className="font-medium flex items-center gap-2">
                    <Clock size={14} className="text-muted-foreground" />
                    {formatDuration(displayDuration)}
                    <button
                      onClick={() => setShowDurationModal(true)}
                      className="text-poker-gold hover:text-poker-gold/80 transition-colors"
                      aria-label="Edit session duration"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Tables Played</div>
                  <div className="font-medium">{tablesPlayed}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Hands Entered</div>
                  <div className="font-medium">{handsEntered}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">Cashouts Made</div>
                  <div className="font-medium">{cashoutsRecorded}</div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-muted-foreground">ROI %</div>
                  <div className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {roi.toFixed(1)}%
                  </div>
                </div>
                <div className="col-span-2 pt-2 border-t border-gray-200 dark:border-border">
                  <div className="text-gray-500 dark:text-muted-foreground">Net Result</div>
                  <div className={`font-bold text-lg ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}{currencySymbol}{profit.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Collapsible Session Notes */}
            <Collapsible open={notesExpanded} onOpenChange={setNotesExpanded}>
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center justify-center gap-2 py-2 hover:bg-muted/50 rounded-md transition-colors">
                  <span className="font-medium text-poker-gold">Session Notes</span>
                  <ChevronDown 
                    size={20} 
                    className={cn(
                      "text-poker-gold transition-transform duration-200",
                      notesExpanded && "rotate-180"
                    )} 
                  />
                </button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-2">
                <Textarea
                  id="sessionNotes"
                  placeholder="Add notes about this session..."
                  value={sessionNotes}
                  onChange={(e) => onSessionNotesChange(e.target.value)}
                  className="min-h-[100px]"
                  autoComplete="off"
                  data-form-type="other"
                />
              </CollapsibleContent>
            </Collapsible>
          </div>
          
          <div className="flex gap-3 flex-shrink-0 pt-4 border-t border-gray-200 dark:border-border">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              data-tour="end-session-confirm"
              onClick={onEndSession}
              disabled={hasActiveTables || tablesWithoutResults.length > 0}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              End Session
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Duration Modal */}
      <Dialog open={showDurationModal} onOpenChange={setShowDurationModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center text-poker-gold">Edit Session Duration</DialogTitle>
            <DialogDescription className="text-center">
              Manually adjust the session length
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 items-center justify-center py-4">
            <div className="flex flex-col items-center">
              <Label className="text-xs text-muted-foreground mb-1">Hours</Label>
              <Input
                type="number"
                min="0"
                max="24"
                value={customDuration.hours}
                onChange={(e) => setCustomDuration({...customDuration, hours: parseInt(e.target.value) || 0})}
                className="w-20 text-center"
              />
            </div>
            <span className="text-2xl font-bold mt-4">:</span>
            <div className="flex flex-col items-center">
              <Label className="text-xs text-muted-foreground mb-1">Minutes</Label>
              <Input
                type="number"
                min="0"
                max="59"
                value={customDuration.minutes}
                onChange={(e) => setCustomDuration({...customDuration, minutes: parseInt(e.target.value) || 0})}
                className="w-20 text-center"
              />
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDurationModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveDuration} className="flex-1 bg-poker-gold hover:bg-poker-gold/90 text-black dark:text-foreground">
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EndSessionSheet;
