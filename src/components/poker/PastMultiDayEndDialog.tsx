import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { TableData } from '@/types/poker';

interface PastMultiDayEndDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableData;
  onComplete: (
    isEliminated: boolean,
    cashOut?: number,
    notes?: string,
    bountyInfo?: {
      bountyCount?: number,
      bountyAmount?: number,
      finalPosition?: number
    },
    multiDayInfo?: {
      nextDayStart?: Date,
      chipsCarryover?: number,
      dayEndedWithoutElimination?: boolean
    }
  ) => void;
}

const PastMultiDayEndDialog: React.FC<PastMultiDayEndDialogProps> = ({
  open,
  onOpenChange,
  table,
  onComplete
}) => {
  const [step, setStep] = useState<'choice' | 'elimination' | 'continuation'>('choice');
  const [cashOut, setCashOut] = useState(0);
  const [notes, setNotes] = useState('');
  const [nextDayStart, setNextDayStart] = useState<Date>(new Date());
  const [chipsCarryover, setChipsCarryover] = useState(0);
  const [bountyCount, setBountyCount] = useState(0);
  const [bountyAmount, setBountyAmount] = useState(0);
  const [finalPosition, setFinalPosition] = useState<number | undefined>();

  const handleChoice = (isEliminated: boolean) => {
    if (isEliminated) {
      setStep('elimination');
    } else {
      setStep('continuation');
    }
  };

  const handleElimination = () => {
    onComplete(
      true, 
      cashOut, 
      notes,
      {
        bountyCount,
        bountyAmount,
        finalPosition
      }
    );
    onOpenChange(false);
  };

  const handleContinuation = () => {
    onComplete(
      false, 
      0, 
      notes, 
      undefined,
      {
        nextDayStart,
        chipsCarryover,
        dayEndedWithoutElimination: true
      }
    );
    onOpenChange(false);
  };

  const resetDialog = () => {
    setStep('choice');
    setCashOut(0);
    setNotes('');
    setNextDayStart(new Date());
    setChipsCarryover(0);
    setBountyCount(0);
    setBountyAmount(0);
    setFinalPosition(undefined);
  };

  const handleClose = () => {
    resetDialog();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>End Multi-Day Tournament</DialogTitle>
        </DialogHeader>

        {step === 'choice' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Are you ending because you were eliminated, or the day ended and you're continuing?
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleChoice(true)}
                variant="destructive"
                className="w-full"
              >
                Eliminated (Cash Out)
              </Button>
              
              <Button 
                onClick={() => handleChoice(false)}
                variant="poker"
                className="w-full"
              >
                Day Ended (Continuing)
              </Button>
            </div>

            <Button 
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'elimination' && (
          <div className="space-y-4">
            <h4 className="font-medium">Tournament Elimination</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cashOut">Regular Payout ($)</Label>
                <Input
                  id="cashOut"
                  type="number"
                  step="0.01"
                  value={cashOut}
                  onChange={(e) => setCashOut(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="bountyAmount">Bounty Payout ($)</Label>
                <Input
                  id="bountyAmount"
                  type="number"
                  step="0.01"
                  value={bountyAmount}
                  onChange={(e) => setBountyAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="finalPosition">Final Position</Label>
                <Input
                  id="finalPosition"
                  type="number"
                  value={finalPosition || ''}
                  onChange={(e) => setFinalPosition(e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              <div>
                <Label htmlFor="bountyCount">Players Eliminated</Label>
                <Input
                  id="bountyCount"
                  type="number"
                  value={bountyCount}
                  onChange={(e) => setBountyCount(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tournament notes"
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('choice')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleElimination}
                variant="destructive"
                className="flex-1"
              >
                Confirm Elimination
              </Button>
            </div>
          </div>
        )}

        {step === 'continuation' && (
          <div className="space-y-4">
            <h4 className="font-medium">Day Ended - Continuing Tomorrow</h4>
            
            <div>
              <Label>Next Day Start</Label>
              <DateTimePicker
                date={nextDayStart}
                onDateChange={(date) => {
                  if (date) {
                    setNextDayStart(date);
                  }
                }}
                badgeVariant="success"
              />
            </div>

            <div>
              <Label htmlFor="chipsCarryover">Chips Carryover</Label>
              <Input
                id="chipsCarryover"
                type="number"
                value={chipsCarryover}
                onChange={(e) => setChipsCarryover(Number(e.target.value))}
                placeholder="Chip count at end of day"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Day notes"
                autoComplete="off"
                data-form-type="other"
              />
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('choice')}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleContinuation}
                variant="poker"
                className="flex-1"
              >
                Save & Continue
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PastMultiDayEndDialog;
